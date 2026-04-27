import { NextRequest, NextResponse } from "next/server"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const YahooFinanceClient = require("yahoo-finance2").default
const yahooFinance = new YahooFinanceClient({ suppressNotices: ["ripHistorical"] })

import { RSI, MACD, SMA, EMA, ADX, Stochastic, BollingerBands } from "technicalindicators"

const GROQ_API_KEY = process.env.API_KEY

type HistoricalQuote = {
  date: Date
  open?: number | null
  high?: number | null
  low?: number | null
  close?: number | null
  adjclose?: number | null
  volume?: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function last<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error("Empty array")
  return arr[arr.length - 1]
}

function safeNum(val: unknown, fallback = 0): number {
  const n = Number(val)
  return isFinite(n) ? n : fallback
}

// ─── Indicators ───────────────────────────────────────────────────────────────

function calcRSI(close: number[]): number {
  const result = RSI.calculate({ values: close, period: 14 })
  return parseFloat(last(result).toFixed(2))
}

function calcMACD(close: number[]) {
  const result = MACD.calculate({
    values: close,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  })
  for (let i = result.length - 1; i >= 0; i--) {
    const r = result[i]
    if (r.MACD !== undefined && r.signal !== undefined && r.histogram !== undefined) {
      return {
        macd: parseFloat(r.MACD.toFixed(4)),
        macdSignal: parseFloat(r.signal.toFixed(4)),
        macdHistogram: parseFloat(r.histogram.toFixed(4)),
      }
    }
  }
  return { macd: 0, macdSignal: 0, macdHistogram: 0 }
}

function calcSMA(close: number[], period: number): number {
  if (close.length < period) return parseFloat(close[close.length - 1].toFixed(2))
  const result = SMA.calculate({ values: close, period })
  return parseFloat(last(result).toFixed(2))
}

function calcEMA(close: number[], period: number): number {
  const result = EMA.calculate({ values: close, period })
  return parseFloat(last(result).toFixed(2))
}

function calcADX(high: number[], low: number[], close: number[]): number {
  const result = ADX.calculate({ high, low, close, period: 14 })
  return parseFloat(last(result).adx.toFixed(2))
}

function calcStochastic(high: number[], low: number[], close: number[]) {
  const result = Stochastic.calculate({ high, low, close, period: 14, signalPeriod: 3 })
  const r = last(result)
  return { stochK: parseFloat(r.k.toFixed(2)), stochD: parseFloat(r.d.toFixed(2)) }
}

function calcBollinger(close: number[]) {
  const result = BollingerBands.calculate({ values: close, period: 20, stdDev: 2 })
  const r = last(result)
  return {
    bbUpper: parseFloat(r.upper.toFixed(2)),
    bbMid: parseFloat(r.middle.toFixed(2)),
    bbLower: parseFloat(r.lower.toFixed(2)),
  }
}

function calcPivotSR(highs: number[], lows: number[], closes: number[]) {
  const pH = highs[highs.length - 2]
  const pL = lows[lows.length - 2]
  const pC = closes[closes.length - 2]
  const pivot = parseFloat(((pH + pL + pC) / 3).toFixed(2))
  return {
    pivot,
    r1: parseFloat((2 * pivot - pL).toFixed(2)),
    r2: parseFloat((pivot + (pH - pL)).toFixed(2)),
    s1: parseFloat((2 * pivot - pH).toFixed(2)),
    s2: parseFloat((pivot - (pH - pL)).toFixed(2)),
    swingHigh: parseFloat(Math.max(...highs.slice(-20)).toFixed(2)),
    swingLow: parseFloat(Math.min(...lows.slice(-20)).toFixed(2)),
  }
}

function calcFibonacci(highs: number[], lows: number[]) {
  const h = Math.max(...highs.slice(-252))
  const l = Math.min(...lows.slice(-252))
  const diff = h - l
  return {
    fib236: parseFloat((h - 0.236 * diff).toFixed(2)),
    fib382: parseFloat((h - 0.382 * diff).toFixed(2)),
    fib500: parseFloat((h - 0.5 * diff).toFixed(2)),
    fib618: parseFloat((h - 0.618 * diff).toFixed(2)),
  }
}

function makeDecision(p: {
  price: number; rsi: number; macd: number; macdSignal: number
  stochK: number; adx: number; sma20: number; sma50: number
  support: number; resistance: number; pivot: number
  fib382: number; fib618: number
}) {
  let score = 50
  const reasons: string[] = []

  if (p.rsi < 30) { score += 15; reasons.push(`RSI ${p.rsi} — oversold, strong buy zone`) }
  else if (p.rsi < 45) { score += 8; reasons.push(`RSI ${p.rsi} — approaching buy zone`) }
  else if (p.rsi > 70) { score -= 15; reasons.push(`RSI ${p.rsi} — overbought, caution`) }
  else if (p.rsi > 60) { score -= 5; reasons.push(`RSI ${p.rsi} — elevated, watch for reversal`) }
  else { reasons.push(`RSI ${p.rsi} — neutral zone`) }

  if (p.sma20 > p.sma50) { score += 12; reasons.push(`Golden Cross — SMA20 ₹${p.sma20} above SMA50 ₹${p.sma50}`) }
  else { score -= 12; reasons.push(`Death Cross — SMA20 ₹${p.sma20} below SMA50 ₹${p.sma50}`) }

  if (p.macd > p.macdSignal) { score += 10; reasons.push(`MACD bullish crossover`) }
  else { score -= 10; reasons.push(`MACD bearish crossover`) }

  if (p.stochK < 20) { score += 10; reasons.push(`Stochastic %K ${p.stochK} — oversold`) }
  else if (p.stochK > 80) { score -= 10; reasons.push(`Stochastic %K ${p.stochK} — overbought`) }

  if (p.adx > 25) { score += 5; reasons.push(`ADX ${p.adx} — strong trend confirmed`) }
  else { reasons.push(`ADX ${p.adx} — weak/ranging market`) }

  if (p.price <= p.support * 1.02) { score += 8; reasons.push(`Price near support ₹${p.support}`) }
  else if (p.price >= p.resistance * 0.98) { score -= 8; reasons.push(`Price near resistance ₹${p.resistance}`) }

  if (p.price > p.pivot) { score += 5; reasons.push(`Above daily pivot ₹${p.pivot} — bullish bias`) }
  else { score -= 5; reasons.push(`Below daily pivot ₹${p.pivot} — bearish bias`) }

  if (p.price >= p.fib382 && p.price <= p.fib618) {
    score += 5; reasons.push(`In Fibonacci buy zone ₹${p.fib382}–₹${p.fib618}`)
  }

  score = Math.max(0, Math.min(100, score))
  return {
    decision: score >= 62 ? "BUY" : score <= 38 ? "SELL" : "HOLD",
    decisionScore: score,
    decisionReasons: reasons.slice(0, 5),
  }
}

async function enrichReasonsWithGroq(stockData: Record<string, unknown>): Promise<string[]> {
  if (!GROQ_API_KEY) return stockData.decisionReasons as string[]
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: `You are a concise swing trading analyst for NSE/BSE stocks. Based on these REAL values for ${stockData.symbol} (${stockData.name}), rewrite the ${stockData.decision} decision as 4 short bullet points (max 12 words each), using actual numbers.

Price: ₹${stockData.price} | RSI: ${stockData.rsi} | Stoch %K: ${stockData.stochK}
MACD: ${stockData.macd} vs Signal: ${stockData.macdSignal}
SMA20: ₹${stockData.sma20} | SMA50: ₹${stockData.sma50} | ADX: ${stockData.adx}
Support: ₹${stockData.support} | Resistance: ₹${stockData.resistance} | Pivot: ₹${stockData.pivot}
Score: ${stockData.decisionScore}/100

Return ONLY a JSON array of 4 strings. No markdown.`,
        }],
        temperature: 0.2,
        max_tokens: 300,
      }),
    })
    const data = await res.json()
    const content: string = data.choices?.[0]?.message?.content || ""
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch { /* fall through */ }
  return stockData.decisionReasons as string[]
}

// ─── Quarterly Financials via quoteSummary ────────────────────────────────────

async function fetchQuarterlyFinancials(yfSymbol: string) {
  try {
    // validateResult:false — prevents throwing when some fields are missing/null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary: any = await yahooFinance.quoteSummary(yfSymbol, {
      modules: [
        "incomeStatementHistoryQuarterly",
        "balanceSheetHistoryQuarterly",
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any, { validateResult: false })

    // Debug: log raw keys so you can see exactly what Yahoo returns
    console.log("[quarterly] incomeStatementHistoryQuarterly keys:",
      JSON.stringify(Object.keys(summary?.incomeStatementHistoryQuarterly ?? {})))
    console.log("[quarterly] balanceSheetHistoryQuarterly keys:",
      JSON.stringify(Object.keys(summary?.balanceSheetHistoryQuarterly ?? {})))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incomeStatements: any[] =
      summary?.incomeStatementHistoryQuarterly?.incomeStatementHistory ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const balanceStatements: any[] =
      summary?.balanceSheetHistoryQuarterly?.balanceSheetStatements ?? []

    console.log(`[quarterly] income rows: ${incomeStatements.length}, balance rows: ${balanceStatements.length}`)

    // Log first income row keys to see actual field names Yahoo uses
    if (incomeStatements.length > 0) {
      console.log("[quarterly] first income row keys:", JSON.stringify(Object.keys(incomeStatements[0])))
      console.log("[quarterly] first income row sample:", JSON.stringify(incomeStatements[0]))
    }
    if (balanceStatements.length > 0) {
      console.log("[quarterly] first balance row keys:", JSON.stringify(Object.keys(balanceStatements[0])))
      console.log("[quarterly] first balance row sample:", JSON.stringify(balanceStatements[0]))
    }

    if (incomeStatements.length === 0) return []

    // Take up to 4 quarters, oldest → newest
    const recentIncome  = incomeStatements.slice(0, 4).reverse()
    const recentBalance = balanceStatements.slice(0, 4).reverse()

    return recentIncome.map((inc, i) => {
      const bal = recentBalance[i] ?? {}

      // endDate can be a Date object or ISO string or epoch number
      const rawDate = inc.endDate
      const endDate: Date =
        rawDate instanceof Date ? rawDate :
        typeof rawDate === "number" ? new Date(rawDate * 1000) :
        new Date(rawDate)
      const quarter = `Q${Math.ceil((endDate.getMonth() + 1) / 3)} FY${endDate.getFullYear()}`

      const totalRevenue = safeNum(
        inc.totalRevenue ?? inc.revenues ?? inc.revenue
      )
      const netIncome = safeNum(
        inc.netIncome ?? inc.netIncomeApplicableToCommonShares
      )

      // Balance sheet — yahoo-finance2 uses these exact camelCase names
      const totalAssets = safeNum(bal.totalAssets)
      const totalLiab   = safeNum(
        bal.totalLiabilities ??
        bal.totalLiabilitiesNetMinorityInterest ??
        bal.totalLiab
      )
      const equity = safeNum(
        bal.totalStockholderEquity ??
        bal.stockholdersEquity ??
        bal.totalEquity ??
        (totalAssets > 0 && totalLiab > 0 ? totalAssets - totalLiab : 0)
      )

      // EPS — prefer reported EPS, fall back to calculated
      const dilutedShares = safeNum(
        inc.dilutedAverageShares ??
        inc.weightedAverageShares ??
        inc.basicAverageShares
      )
      const eps =
        safeNum(inc.dilutedEPS ?? inc.basicEPS) ||
        (dilutedShares > 0 ? parseFloat((netIncome / dilutedShares).toFixed(2)) : 0)

      return {
        quarter,
        revenue:          totalRevenue,
        netIncome,
        eps:              parseFloat(eps.toFixed(2)),
        totalAssets,
        totalLiabilities: totalLiab,
        equity,
      }
    })
  } catch (err) {
    console.error("[stock/route] quoteSummary failed:", err)
    return []
  }
}

// ─── News via Yahoo Finance search ───────────────────────────────────────────

async function fetchYahooNews(yfSymbol: string, companyName: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.search(companyName, {
      newsCount: 8,
      quotesCount: 0,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = result?.news ?? []

    return items
      .filter((n) => n.title && n.link)
      .slice(0, 6)
      .map((n, i) => ({
        id: String(i),
        headline: n.title as string,
        summary: n.summary ?? n.title ?? "",
        source: (n.publisher as string) ?? "Yahoo Finance",
        url: n.link as string,
        publishedAt: n.providerPublishTime
          ? new Date((n.providerPublishTime as number) * 1000).toISOString()
          : new Date().toISOString(),
        sentiment: "Neutral" as const,
        sentimentReason: "Live news from Yahoo Finance.",
        category: "Market" as const,
      }))
  } catch (err) {
    console.warn("[stock/route] Yahoo news fetch failed:", err)
    return []
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { symbol } = await req.json()
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 })

  const sym = symbol.trim().toUpperCase()
  let yfSymbol = sym.includes(".") ? sym : `${sym}.NS`
  let exchange = "NSE"

  try {
    const period1 = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    // ── Fetch OHLCV ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let chartResult: any = await yahooFinance.chart(yfSymbol, { period1, interval: "1d" })
    let rawQuotes: HistoricalQuote[] = chartResult?.quotes ?? []

    // Fallback to BSE
    if (rawQuotes.length < 30) {
      yfSymbol = `${sym}.BO`
      exchange = "BSE"
      chartResult = await yahooFinance.chart(yfSymbol, { period1, interval: "1d" })
      rawQuotes = chartResult?.quotes ?? []
    }

    if (rawQuotes.length < 30) {
      return NextResponse.json(
        { error: `No data found for "${sym}". Check the NSE/BSE symbol (e.g. RELIANCE, TCS, HDFCBANK).` },
        { status: 404 }
      )
    }

    rawQuotes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const validQuotes = rawQuotes.filter(
      (q): q is HistoricalQuote & { high: number; low: number; close: number } =>
        typeof (q.close ?? q.adjclose) === "number" &&
        typeof q.high === "number" &&
        typeof q.low === "number"
    )

    if (validQuotes.length < 30) {
      return NextResponse.json({ error: "Not enough valid OHLCV data." }, { status: 400 })
    }

    const closes  = validQuotes.map(q => q.close ?? (q.adjclose as number))
    const highs   = validQuotes.map(q => q.high as number)
    const lows    = validQuotes.map(q => q.low as number)
    const volumes = validQuotes.map(q => (typeof q.volume === "number" ? q.volume : 0))

    const currentPrice  = parseFloat(closes[closes.length - 1].toFixed(2))
    const prevClose     = parseFloat(closes[closes.length - 2].toFixed(2))
    const change        = parseFloat((currentPrice - prevClose).toFixed(2))
    const changePercent = parseFloat(((change / prevClose) * 100).toFixed(2))

    // ── Indicators ──
    const rsi  = calcRSI(closes)
    const { macd, macdSignal, macdHistogram } = calcMACD(closes)
    const sma20  = calcSMA(closes, 20)
    const sma50  = calcSMA(closes, 50)
    const sma200 = calcSMA(closes, 200)
    const ema20  = calcEMA(closes, 20)
    const ema50  = calcEMA(closes, 50)
    const adx    = calcADX(highs, lows, closes)
    const { stochK, stochD }     = calcStochastic(highs, lows, closes)
    const { bbUpper, bbMid, bbLower } = calcBollinger(closes)
    const sr  = calcPivotSR(highs, lows, closes)
    const fib = calcFibonacci(highs, lows)

    const high52w  = parseFloat(Math.max(...highs.slice(-252)).toFixed(2))
    const low52w   = parseFloat(Math.min(...lows.slice(-252)).toFixed(2))
    const avgVolume = Math.round(volumes.slice(-20).reduce((a, b) => a + b, 0) / 20)

    let companyName = sym
    try {
      companyName = chartResult?.meta?.longName || chartResult?.meta?.shortName || sym
    } catch { /* non-fatal */ }

    const decisionData = makeDecision({
      price: currentPrice, rsi, macd, macdSignal, stochK, adx,
      sma20, sma50,
      support: sr.s1, resistance: sr.r1,
      pivot: sr.pivot,
      fib382: fib.fib382, fib618: fib.fib618,
    })

    const priceHistory = validQuotes.slice(-90).map(q => ({
      date:   new Date(q.date).toISOString().split("T")[0],
      open:   parseFloat(((q.open ?? q.close) as number).toFixed(2)),
      high:   parseFloat((q.high as number).toFixed(2)),
      low:    parseFloat((q.low as number).toFixed(2)),
      close:  parseFloat((q.close as number).toFixed(2)),
      volume: typeof q.volume === "number" ? q.volume : 0,
    }))

    // ── Fetch quarterly financials + news in parallel ──
    const [balanceSheet, news] = await Promise.all([
      fetchQuarterlyFinancials(yfSymbol),
      fetchYahooNews(yfSymbol, companyName),
    ])

    const result: Record<string, unknown> = {
      symbol: sym,
      name: companyName,
      exchange,
      price: currentPrice,
      prevClose,
      change,
      changePercent,
      high52w,
      low52w,
      volume: volumes[volumes.length - 1],
      avgVolume,
      // Indicators
      rsi, macd, macdSignal, macdHistogram,
      sma20, sma50, sma200, ema20, ema50,
      adx, stochK, stochD,
      bbUpper, bbMid, bbLower,
      // Support / Resistance / Pivot
      support: sr.s1, support2: sr.s2,
      resistance: sr.r1, resistance2: sr.r2,
      pivot: sr.pivot,
      swingHigh: sr.swingHigh, swingLow: sr.swingLow,
      // Fibonacci
      fib236: fib.fib236, fib382: fib.fib382,
      fib500: fib.fib500, fib618: fib.fib618,
      // Chart data
      priceHistory,
      // ✅ Real quarterly financials
      balanceSheet,
      // ✅ Real news from Yahoo Finance (no API key needed)
      news,
      // Decision
      ...decisionData,
    }

    result.decisionReasons = await enrichReasonsWithGroq(result)

    return NextResponse.json(result)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error(`[stock/route] Error for ${sym}:`, message)

    if (
      message.toLowerCase().includes("no fundamentals") ||
      message.toLowerCase().includes("not found") ||
      message.toLowerCase().includes("no data")
    ) {
      return NextResponse.json(
        { error: `Symbol "${sym}" not found. Try the exact NSE ticker e.g. RELIANCE, HDFCBANK, TCS, INFY.` },
        { status: 404 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}