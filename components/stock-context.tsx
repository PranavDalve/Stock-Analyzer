"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

// API key is now stored in .env as GROQ_API_KEY — never sent to the client.
// All Groq calls go through /api/stock (app/api/stock/route.ts).

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
  searchStock: (query: string) => Promise<void>
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

async function fetchStockData(symbol: string): Promise<StockData> {
  const res = await fetch("/api/stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: symbol.toUpperCase() }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`)
  }

  return data as StockData
}

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchStock = useCallback(async (query: string) => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStockData(query.trim())
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