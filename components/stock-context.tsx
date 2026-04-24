"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

export type StockData = {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  // Technical indicators
  rsi: number
  macd: number
  macdSignal: number
  macdHistogram: number
  sma20: number
  sma50: number
  ema20: number
  adx: number
  stochK: number
  stochD: number
  support: number
  resistance: number
  pivot: number
  fib382: number
  fib500: number
  fib618: number
  volume: number
  avgVolume: number
  high52w: number
  low52w: number
  // Chart data (30 days OHLCV)
  priceHistory: { date: string; open: number; high: number; low: number; close: number; volume: number }[]
  // Balance sheet
  balanceSheet: {
    quarter: string
    totalAssets: number
    totalLiabilities: number
    equity: number
    revenue: number
    netIncome: number
    eps: number
  }[]
  // Decision
  decision: "BUY" | "SELL" | "HOLD"
  decisionScore: number // 0-100
  decisionReasons: string[]
}

type StockContextType = {
  stockData: StockData | null
  loading: boolean
  error: string | null
  searchStock: (query: string, apiKey: string) => Promise<void>
}

const StockContext = createContext<StockContextType>({
  stockData: null,
  loading: false,
  error: null,
  searchStock: async () => {},
})

export function useStock() {
  return useContext(StockContext)
}

async function fetchStockDataFromGroq(symbol: string, apiKey: string): Promise<StockData> {
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

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
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

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Groq API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ""
  
  // Strip any markdown fences
  const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  return JSON.parse(clean) as StockData
}

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchStock = useCallback(async (query: string, apiKey: string) => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStockDataFromGroq(query.trim().toUpperCase(), apiKey)
      setStockData(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch stock data")
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <StockContext.Provider value={{ stockData, loading, error, searchStock }}>
      {children}
    </StockContext.Provider>
  )
}