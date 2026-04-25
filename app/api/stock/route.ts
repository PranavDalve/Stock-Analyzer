import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const apiKey = process.env.API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: "API_KEY is not set in environment variables." },
      { status: 500 }
    )
  }

  const { symbol } = await req.json()

  if (!symbol || typeof symbol !== "string") {
    return NextResponse.json({ error: "Missing stock symbol." }, { status: 400 })
  }

  const systemPrompt = `You are a financial data API. When given a stock symbol, return ONLY a valid JSON object with realistic, current-looking stock market data. Do not include any text outside the JSON. The JSON must match this exact structure with realistic numbers for the given stock.`

  const userPrompt = `Return realistic stock market data for ${symbol.toUpperCase()} as a JSON object with these exact fields:
{
  "symbol": "string - the ticker",
  "name": "string - company full name",
  "price": number - current price in INR if Indian stock (NSE/BSE) or USD if US stock,
  "change": number - today's price change,
  "changePercent": number - percent change today,
  "rsi": number between 0-100,
  "macd": number,
  "macdSignal": number,
  "macdHistogram": number,
  "sma20": number,
  "sma50": number,
  "ema20": number,
  "adx": number between 0-60,
  "stochK": number between 0-100,
  "stochD": number between 0-100,
  "support": number,
  "resistance": number,
  "pivot": number,
  "fib382": number,
  "fib500": number,
  "fib618": number,
  "volume": number,
  "avgVolume": number,
  "high52w": number,
  "low52w": number,
  "priceHistory": array of 30 objects each with { "date": "YYYY-MM-DD", "open": number, "high": number, "low": number, "close": number, "volume": number } for the last 30 trading days ending today,
  "balanceSheet": array of 4 objects for last 4 quarters each with { "quarter": "Q1 FY25", "totalAssets": number, "totalLiabilities": number, "equity": number, "revenue": number, "netIncome": number, "eps": number },
  "decision": "BUY" or "SELL" or "HOLD" based on technical indicators,
  "decisionScore": number 0-100 where 0=strong sell 50=neutral 100=strong buy,
  "decisionReasons": array of 3-5 strings explaining the decision based on RSI, MA Crossover, Support/Resistance, Fibonacci, Oscillators (MACD/Stochastic), ADX
}
Return ONLY the JSON, no markdown, no explanation.`

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  })

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}))
    return NextResponse.json(
      { error: err?.error?.message || `Groq API error: ${groqRes.status}` },
      { status: groqRes.status }
    )
  }

  const groqData = await groqRes.json()
  const content = groqData.choices?.[0]?.message?.content || ""
  const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

  try {
    const stockData = JSON.parse(clean)
    return NextResponse.json(stockData)
  } catch {
    return NextResponse.json(
      { error: "Failed to parse response from Groq. Try again." },
      { status: 500 }
    )
  }
}