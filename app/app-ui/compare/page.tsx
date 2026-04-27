"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  XIcon,
  PlusIcon,
  LoaderIcon,
  ExternalLinkIcon,
  BarChart3Icon,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type StockSnapshot = {
  symbol: string
  name: string
  exchange: string
  price: number
  change: number
  changePercent: number
  high52w: number
  low52w: number
  volume: number
  avgVolume: number
  rsi: number
  macd: number
  macdSignal: number
  sma20: number
  sma50: number
  adx: number
  stochK: number
  stochD: number
  support: number
  resistance: number
  pivot: number
  fib382: number
  fib500: number
  fib618: number
  bbUpper: number
  bbMid: number
  bbLower: number
  decision: "BUY" | "SELL" | "HOLD"
  decisionScore: number
  decisionReasons: string[]
  balanceSheet: {
    quarter: string
    revenue: number
    netIncome: number
    eps: number
    totalAssets: number
    totalLiabilities: number
    equity: number
  }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: number) {
  if (!isFinite(val)) return "—"
  if (Math.abs(val) >= 1_00_00_00_000) return `₹${(val / 1_00_00_00_000).toFixed(2)}T`
  if (Math.abs(val) >= 1_00_00_000) return `₹${(val / 1_00_00_000).toFixed(2)}Cr`
  if (Math.abs(val) >= 1_00_000) return `₹${(val / 1_00_000).toFixed(2)}L`
  return `₹${val.toLocaleString("en-IN")}`
}

function fmtVol(val: number) {
  if (!isFinite(val)) return "—"
  if (val >= 1_00_00_000) return `${(val / 1_00_00_000).toFixed(2)}Cr`
  if (val >= 1_00_000) return `${(val / 1_00_000).toFixed(2)}L`
  return val.toLocaleString("en-IN")
}

const COLORS = [
  "text-blue-500",
  "text-violet-500",
  "text-amber-500",
  "text-emerald-500",
  "text-rose-500",
]

const BG_COLORS = [
  "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
  "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
]

function decisionColor(d: string) {
  if (d === "BUY") return "text-emerald-600 dark:text-emerald-400"
  if (d === "SELL") return "text-red-500"
  return "text-amber-500"
}

function screenerUrl(symbol: string) {
  const clean = symbol.replace(/\.(NS|BO)$/, "")
  return `https://www.screener.in/company/${clean}/consolidated/`
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            score >= 62 ? "bg-emerald-500" : score <= 38 ? "bg-red-500" : "bg-amber-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${color}`}>{score}</span>
    </div>
  )
}

// ─── Compare row ──────────────────────────────────────────────────────────────

type CompareRowProps = {
  label: string
  values: (string | React.ReactNode)[]
  highlight?: "best" | "worst" | "none"
  rawValues?: number[]
  higherIsBetter?: boolean
}

function CompareRow({ label, values, rawValues, higherIsBetter = true }: CompareRowProps) {
  const bestIdx =
    rawValues && rawValues.length > 0
      ? rawValues.indexOf(higherIsBetter ? Math.max(...rawValues) : Math.min(...rawValues))
      : -1

  return (
    <TableRow>
      <TableCell className="font-medium text-muted-foreground text-sm">{label}</TableCell>
      {values.map((v, i) => (
        <TableCell
          key={i}
          className={`text-sm tabular-nums text-center ${
            bestIdx === i ? "font-bold text-emerald-600 dark:text-emerald-400" : ""
          }`}
        >
          {v}
        </TableCell>
      ))}
    </TableRow>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const [inputs, setInputs] = React.useState<string[]>(["", ""])
  const [stocks, setStocks] = React.useState<(StockSnapshot | null)[]>([null, null])
  const [loading, setLoading] = React.useState<boolean[]>([false, false])
  const [errors, setErrors] = React.useState<(string | null)[]>([null, null])

  const MAX_STOCKS = 4

  function addSlot() {
    if (inputs.length >= MAX_STOCKS) return
    setInputs(p => [...p, ""])
    setStocks(p => [...p, null])
    setLoading(p => [...p, false])
    setErrors(p => [...p, null])
  }

  function removeSlot(i: number) {
    setInputs(p => p.filter((_, idx) => idx !== i))
    setStocks(p => p.filter((_, idx) => idx !== i))
    setLoading(p => p.filter((_, idx) => idx !== i))
    setErrors(p => p.filter((_, idx) => idx !== i))
  }

  function updateInput(i: number, val: string) {
    setInputs(p => p.map((v, idx) => (idx === i ? val.toUpperCase() : v)))
  }

  async function fetchStock(i: number) {
    const sym = inputs[i]?.trim()
    if (!sym) return

    setLoading(p => p.map((v, idx) => (idx === i ? true : v)))
    setErrors(p => p.map((v, idx) => (idx === i ? null : v)))
    setStocks(p => p.map((v, idx) => (idx === i ? null : v)))

    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
      setStocks(p => p.map((v, idx) => (idx === i ? (data as StockSnapshot) : v)))
    } catch (e: unknown) {
      setErrors(p =>
        p.map((v, idx) =>
          idx === i ? (e instanceof Error ? e.message : "Failed to fetch") : v
        )
      )
    } finally {
      setLoading(p => p.map((v, idx) => (idx === i ? false : v)))
    }
  }

  const loaded = stocks.filter(Boolean) as StockSnapshot[]
  const hasData = loaded.length >= 2

  // Latest quarter financials
  function latestQ(s: StockSnapshot) {
    return s.balanceSheet?.[s.balanceSheet.length - 1] ?? null
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">

          {/* Page title */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3Icon className="h-6 w-6 text-muted-foreground" />
              Compare Stocks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add up to 4 NSE/BSE stocks to compare side-by-side
            </p>
          </div>

          {/* Search slots */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Stocks</CardTitle>
              <CardDescription>Enter NSE/BSE ticker symbols e.g. RELIANCE, TCS, HDFCBANK</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {inputs.map((val, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${BG_COLORS[i]}`}>
                      <span className={`text-xs font-bold w-5 text-center ${COLORS[i]}`}>
                        {i + 1}
                      </span>
                      <Input
                        value={val}
                        onChange={e => updateInput(i, e.target.value)}
                        onKeyDown={e => e.key === "Enter" && fetchStock(i)}
                        placeholder="e.g. RELIANCE"
                        className="h-8 w-36 border-0 bg-transparent p-0 text-sm font-semibold focus-visible:ring-0 uppercase"
                      />
                      {loading[i] ? (
                        <LoaderIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => fetchStock(i)}
                        >
                          Go
                        </Button>
                      )}
                      {inputs.length > 2 && (
                        <button onClick={() => removeSlot(i)} className="text-muted-foreground hover:text-foreground">
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {errors[i] && (
                      <span className="text-xs text-red-500">{errors[i]}</span>
                    )}
                    {stocks[i] && (
                      <Badge variant="outline" className={`text-xs ${COLORS[i]}`}>
                        ✓ {stocks[i]!.symbol}
                      </Badge>
                    )}
                  </div>
                ))}

                {inputs.length < MAX_STOCKS && (
                  <Button variant="outline" size="sm" onClick={addSlot} className="h-10 gap-1.5">
                    <PlusIcon className="h-4 w-4" />
                    Add Stock
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stock header cards */}
          {hasData && (
            <div className={`grid gap-4 grid-cols-${loaded.length} md:grid-cols-${loaded.length}`}
              style={{ gridTemplateColumns: `repeat(${loaded.length}, minmax(0, 1fr))` }}
            >
              {loaded.map((s, i) => (
                <Card key={s.symbol} className={`border ${BG_COLORS[i]}`}>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-widest ${COLORS[i]}`}>
                          {s.exchange}
                        </p>
                        <p className="text-lg font-bold">{s.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{s.name}</p>
                      </div>
                      <a
                        href={screenerUrl(s.symbol)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="View on Screener.in"
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold tabular-nums">₹{s.price.toLocaleString("en-IN")}</p>
                      <p className={`text-sm font-medium flex items-center gap-1 ${s.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {s.change >= 0 ? <TrendingUpIcon className="h-3.5 w-3.5" /> : <TrendingDownIcon className="h-3.5 w-3.5" />}
                        {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)} ({s.changePercent.toFixed(2)}%)
                      </p>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Decision Score</p>
                      <ScoreBar score={s.decisionScore} color={COLORS[i]} />
                      <Badge
                        variant="outline"
                        className={`mt-1.5 text-xs font-bold ${decisionColor(s.decision)}`}
                      >
                        {s.decision}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Comparison tables */}
          {hasData && (
            <div className="grid gap-6 lg:grid-cols-1">

              {/* Price & Market */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Price & Market Data</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead className="w-44">Metric</TableHead>
                          {loaded.map((s, i) => (
                            <TableHead key={s.symbol} className={`text-center font-bold ${COLORS[i]}`}>
                              {s.symbol}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <CompareRow
                          label="Price"
                          values={loaded.map(s => `₹${s.price.toLocaleString("en-IN")}`)}
                        />
                        <CompareRow
                          label="Change %"
                          values={loaded.map(s => (
                            <span className={s.changePercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
                              {s.changePercent >= 0 ? "+" : ""}{s.changePercent.toFixed(2)}%
                            </span>
                          ))}
                          rawValues={loaded.map(s => s.changePercent)}
                        />
                        <CompareRow
                          label="52W High"
                          values={loaded.map(s => `₹${s.high52w.toLocaleString("en-IN")}`)}
                          rawValues={loaded.map(s => s.high52w)}
                        />
                        <CompareRow
                          label="52W Low"
                          values={loaded.map(s => `₹${s.low52w.toLocaleString("en-IN")}`)}
                          rawValues={loaded.map(s => s.low52w)}
                          higherIsBetter={false}
                        />
                        <CompareRow
                          label="Volume"
                          values={loaded.map(s => fmtVol(s.volume))}
                          rawValues={loaded.map(s => s.volume)}
                        />
                        <CompareRow
                          label="Avg Volume (20D)"
                          values={loaded.map(s => fmtVol(s.avgVolume))}
                          rawValues={loaded.map(s => s.avgVolume)}
                        />
                        <CompareRow
                          label="Support"
                          values={loaded.map(s => `₹${s.support.toFixed(0)}`)}
                        />
                        <CompareRow
                          label="Resistance"
                          values={loaded.map(s => `₹${s.resistance.toFixed(0)}`)}
                        />
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Indicators */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Technical Indicators</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead className="w-44">Indicator</TableHead>
                          {loaded.map((s, i) => (
                            <TableHead key={s.symbol} className={`text-center font-bold ${COLORS[i]}`}>
                              {s.symbol}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <CompareRow
                          label="RSI (14)"
                          values={loaded.map(s => (
                            <span className={s.rsi < 30 ? "text-emerald-600 dark:text-emerald-400" : s.rsi > 70 ? "text-red-500" : ""}>
                              {s.rsi.toFixed(1)}
                            </span>
                          ))}
                          rawValues={loaded.map(s => s.rsi)}
                          higherIsBetter={false}
                        />
                        <CompareRow
                          label="MACD"
                          values={loaded.map(s => s.macd.toFixed(2))}
                          rawValues={loaded.map(s => s.macd)}
                        />
                        <CompareRow
                          label="MACD Signal"
                          values={loaded.map(s => s.macdSignal.toFixed(2))}
                        />
                        <CompareRow
                          label="SMA 20"
                          values={loaded.map(s => `₹${s.sma20.toFixed(0)}`)}
                        />
                        <CompareRow
                          label="SMA 50"
                          values={loaded.map(s => `₹${s.sma50.toFixed(0)}`)}
                        />
                        <CompareRow
                          label="MA Signal"
                          values={loaded.map(s => (
                            <span className={s.sma20 > s.sma50 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
                              {s.sma20 > s.sma50 ? "Golden ✓" : "Death ✗"}
                            </span>
                          ))}
                          rawValues={loaded.map(s => (s.sma20 > s.sma50 ? 1 : 0))}
                        />
                        <CompareRow
                          label="ADX"
                          values={loaded.map(s => s.adx.toFixed(1))}
                          rawValues={loaded.map(s => s.adx)}
                        />
                        <CompareRow
                          label="Stoch %K"
                          values={loaded.map(s => (
                            <span className={s.stochK < 20 ? "text-emerald-600 dark:text-emerald-400" : s.stochK > 80 ? "text-red-500" : ""}>
                              {s.stochK.toFixed(0)}
                            </span>
                          ))}
                          rawValues={loaded.map(s => s.stochK)}
                          higherIsBetter={false}
                        />
                        <CompareRow
                          label="BB Upper"
                          values={loaded.map(s => `₹${s.bbUpper?.toFixed(0) ?? "—"}`)}
                        />
                        <CompareRow
                          label="BB Lower"
                          values={loaded.map(s => `₹${s.bbLower?.toFixed(0) ?? "—"}`)}
                        />
                        <CompareRow
                          label="Decision Score"
                          values={loaded.map((s, i) => (
                            <div className="flex justify-center">
                              <ScoreBar score={s.decisionScore} color={COLORS[i]} />
                            </div>
                          ))}
                          rawValues={loaded.map(s => s.decisionScore)}
                        />
                        <CompareRow
                          label="Signal"
                          values={loaded.map(s => (
                            <Badge variant="outline" className={`text-xs font-bold ${decisionColor(s.decision)}`}>
                              {s.decision}
                            </Badge>
                          ))}
                          rawValues={loaded.map(s => s.decisionScore)}
                        />
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Latest Quarter Financials */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Latest Quarter Financials</CardTitle>
                  <CardDescription>Most recent quarter from Yahoo Finance</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead className="w-44">Metric</TableHead>
                          {loaded.map((s, i) => (
                            <TableHead key={s.symbol} className={`text-center font-bold ${COLORS[i]}`}>
                              {s.symbol}
                              {latestQ(s) && (
                                <span className="block text-xs font-normal text-muted-foreground">
                                  {latestQ(s)!.quarter}
                                </span>
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <CompareRow
                          label="Revenue"
                          values={loaded.map(s => fmt(latestQ(s)?.revenue ?? 0))}
                          rawValues={loaded.map(s => latestQ(s)?.revenue ?? 0)}
                        />
                        <CompareRow
                          label="Net Income"
                          values={loaded.map(s => (
                            <span className={(latestQ(s)?.netIncome ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
                              {fmt(latestQ(s)?.netIncome ?? 0)}
                            </span>
                          ))}
                          rawValues={loaded.map(s => latestQ(s)?.netIncome ?? 0)}
                        />
                        <CompareRow
                          label="EPS"
                          values={loaded.map(s => {
                            const v = latestQ(s)?.eps ?? 0
                            return (
                              <span className={v >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
                                ₹{v.toFixed(2)}
                              </span>
                            )
                          })}
                          rawValues={loaded.map(s => latestQ(s)?.eps ?? 0)}
                        />
                        <CompareRow
                          label="Total Assets"
                          values={loaded.map(s => fmt(latestQ(s)?.totalAssets ?? 0))}
                          rawValues={loaded.map(s => latestQ(s)?.totalAssets ?? 0)}
                        />
                        <CompareRow
                          label="Total Liabilities"
                          values={loaded.map(s => fmt(latestQ(s)?.totalLiabilities ?? 0))}
                          rawValues={loaded.map(s => latestQ(s)?.totalLiabilities ?? 0)}
                          higherIsBetter={false}
                        />
                        <CompareRow
                          label="Equity"
                          values={loaded.map(s => (
                            <span className={(latestQ(s)?.equity ?? 0) >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}>
                              {fmt(latestQ(s)?.equity ?? 0)}
                            </span>
                          ))}
                          rawValues={loaded.map(s => latestQ(s)?.equity ?? 0)}
                        />
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Screener links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">External Research</CardTitle>
                  <CardDescription>View full quarterly reports on Screener.in</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {loaded.map((s, i) => (
                      <a
                        key={s.symbol}
                        href={screenerUrl(s.symbol)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted ${COLORS[i]} ${BG_COLORS[i]}`}
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                        {s.symbol} on Screener.in
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* Empty state */}
          {!hasData && !loading.some(Boolean) && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <BarChart3Icon className="h-12 w-12 opacity-20" />
              <p className="text-sm">Enter at least 2 stock symbols above and press Go to compare</p>
            </div>
          )}

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}