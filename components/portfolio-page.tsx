"use client"

import * as React from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  PlusIcon,
  Trash2Icon,
  RefreshCwIcon,
  Loader2Icon,
  BriefcaseIcon,
  IndianRupeeIcon,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Holding = {
  id: string
  symbol: string
  name: string
  quantity: number
  buyPrice: number
  currentPrice: number
  lastUpdated: string
}

const STORAGE_KEY = "swing_portfolio_holdings"

const CHART_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function load(): Holding[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function save(holdings: Holding[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
}

function pnl(h: Holding) {
  const invested = h.buyPrice * h.quantity
  const current = h.currentPrice * h.quantity
  return { invested, current, gain: current - invested, pct: ((current - invested) / invested) * 100 }
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Add Holding Form ─────────────────────────────────────────────────────────

function AddHoldingForm({ onAdd }: { onAdd: (h: Holding) => void }) {
  const [symbol, setSymbol] = React.useState("")
  const [qty, setQty] = React.useState("")
  const [buyPrice, setBuyPrice] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleAdd = async () => {
    const q = parseFloat(qty)
    const bp = parseFloat(buyPrice)
    if (!symbol.trim() || isNaN(q) || isNaN(bp) || q <= 0 || bp <= 0) {
      setError("Please fill all fields with valid values.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      // Fetch current price via /api/stock
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch stock data")

      const holding: Holding = {
        id: `${symbol.toUpperCase()}-${Date.now()}`,
        symbol: data.symbol,
        name: data.name,
        quantity: q,
        buyPrice: bp,
        currentPrice: data.price,
        lastUpdated: new Date().toISOString(),
      }
      onAdd(holding)
      setSymbol("")
      setQty("")
      setBuyPrice("")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add holding")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PlusIcon className="size-4" /> Add Holding
        </CardTitle>
        <CardDescription>Enter stock symbol, quantity, and your buy price to track it</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <Label className="text-xs">Symbol</Label>
            <Input
              placeholder="e.g. RELIANCE"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="h-9 uppercase"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="flex flex-col gap-1.5 w-24">
            <Label className="text-xs">Quantity</Label>
            <Input
              type="number"
              placeholder="100"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="h-9"
              min={1}
            />
          </div>
          <div className="flex flex-col gap-1.5 w-32">
            <Label className="text-xs">Buy Price (₹)</Label>
            <Input
              type="number"
              placeholder="1420.50"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="h-9"
              min={0.01}
              step={0.01}
            />
          </div>
          <Button onClick={handleAdd} disabled={loading} className="h-9">
            {loading ? <Loader2Icon className="size-4 animate-spin" /> : <><PlusIcon className="size-4" /> Add</>}
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Portfolio Summary Cards ───────────────────────────────────────────────────

function SummaryCards({ holdings }: { holdings: Holding[] }) {
  const totalInvested = holdings.reduce((s, h) => s + pnl(h).invested, 0)
  const totalCurrent = holdings.reduce((s, h) => s + pnl(h).current, 0)
  const totalGain = totalCurrent - totalInvested
  const totalPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0
  const winners = holdings.filter((h) => pnl(h).gain >= 0).length
  const losers = holdings.length - winners

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[
        {
          label: "Total Invested",
          value: `₹${fmt(totalInvested)}`,
          sub: `${holdings.length} holding${holdings.length !== 1 ? "s" : ""}`,
          icon: <IndianRupeeIcon className="size-4 text-muted-foreground" />,
          color: "",
        },
        {
          label: "Current Value",
          value: `₹${fmt(totalCurrent)}`,
          sub: totalPct >= 0 ? `+${fmt(totalPct)}% overall` : `${fmt(totalPct)}% overall`,
          icon: <BriefcaseIcon className="size-4 text-muted-foreground" />,
          color: "",
        },
        {
          label: "Total P&L",
          value: `${totalGain >= 0 ? "+" : ""}₹${fmt(totalGain)}`,
          sub: `${totalGain >= 0 ? "+" : ""}${fmt(totalPct)}%`,
          icon: totalGain >= 0
            ? <TrendingUpIcon className="size-4 text-emerald-500" />
            : <TrendingDownIcon className="size-4 text-red-500" />,
          color: totalGain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500",
        },
        {
          label: "Win Rate",
          value: holdings.length > 0 ? `${Math.round((winners / holdings.length) * 100)}%` : "—",
          sub: `${winners}W / ${losers}L`,
          icon: <TrendingUpIcon className="size-4 text-muted-foreground" />,
          color: "",
        },
      ].map((card) => (
        <Card key={card.label} className="bg-linear-to-t from-primary/5 to-card shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              {card.label} {card.icon}
            </CardDescription>
            <CardTitle className={`text-2xl font-semibold tabular-nums ${card.color}`}>
              {card.value}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${card.color || "text-muted-foreground"}`}>{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Allocation Pie Chart ─────────────────────────────────────────────────────

function AllocationChart({ holdings }: { holdings: Holding[] }) {
  const data = holdings.map((h) => ({
    name: h.symbol,
    value: parseFloat((pnl(h).current).toFixed(2)),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Allocation</CardTitle>
        <CardDescription>Current value breakdown by holding</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => {
                if (!percent || percent <= 0.05) return ""
                return `${name} ${(percent * 100).toFixed(0)}%`
              }}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
                formatter={(value, name) => {
                    if (value == null) return ["-", name]
                    return [`₹${fmt(Number(value))}`, name]
                }}
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
            />
            <Legend iconSize={10} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ─── Holdings Table ───────────────────────────────────────────────────────────

function HoldingsTable({
  holdings,
  onRemove,
  onRefresh,
  refreshingId,
}: {
  holdings: Holding[]
  onRemove: (id: string) => void
  onRefresh: (h: Holding) => void
  refreshingId: string | null
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Holdings</CardTitle>
        <CardDescription>Click refresh on any row to update the current price</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Buy Price</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Invested</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">Return</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-sm">
                    No holdings yet. Add your first stock above.
                  </TableCell>
                </TableRow>
              ) : (
                holdings.map((h) => {
                  const { invested, current, gain, pct } = pnl(h)
                  const isPos = gain >= 0
                  const isRefreshing = refreshingId === h.id
                  return (
                    <TableRow key={h.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{h.symbol}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                            {h.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{h.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">₹{fmt(h.buyPrice)}</TableCell>
                      <TableCell className="text-right tabular-nums">₹{fmt(h.currentPrice)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        ₹{fmt(invested)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        ₹{fmt(current)}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums font-medium ${isPos ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {isPos ? "+" : ""}₹{fmt(gain)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`text-xs ${isPos ? "border-emerald-300 text-emerald-600 dark:text-emerald-400" : "border-red-300 text-red-500"}`}
                        >
                          {isPos ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
                          {isPos ? "+" : ""}{fmt(pct)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            disabled={isRefreshing}
                            onClick={() => onRefresh(h)}
                            title="Refresh price"
                          >
                            {isRefreshing
                              ? <Loader2Icon className="size-3.5 animate-spin" />
                              : <RefreshCwIcon className="size-3.5" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-red-500"
                            onClick={() => onRemove(h.id)}
                            title="Remove holding"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [holdings, setHoldings] = React.useState<Holding[]>([])
  const [refreshingId, setRefreshingId] = React.useState<string | null>(null)

  // Load from localStorage on mount
  React.useEffect(() => {
    setHoldings(load())
  }, [])

  const persist = (updated: Holding[]) => {
    setHoldings(updated)
    save(updated)
  }

  const handleAdd = (h: Holding) => {
    // If symbol already exists, replace it
    const existing = holdings.findIndex((x) => x.symbol === h.symbol)
    if (existing >= 0) {
      const updated = [...holdings]
      updated[existing] = h
      persist(updated)
    } else {
      persist([...holdings, h])
    }
  }

  const handleRemove = (id: string) => {
    persist(holdings.filter((h) => h.id !== id))
  }

  const handleRefresh = async (holding: Holding) => {
    setRefreshingId(holding.id)
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: holding.symbol }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      persist(
        holdings.map((h) =>
          h.id === holding.id
            ? { ...h, currentPrice: data.price, lastUpdated: new Date().toISOString() }
            : h
        )
      )
    } catch {
      // silently fail — old price stays
    } finally {
      setRefreshingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BriefcaseIcon className="size-6" /> Portfolio Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your swing trade holdings, monitor P&L, and view allocation at a glance.
          Data is saved locally in your browser.
        </p>
      </div>

      <div className="px-4 lg:px-6">
        <AddHoldingForm onAdd={handleAdd} />
      </div>

      {holdings.length > 0 && (
        <>
          <div className="px-4 lg:px-6">
            <SummaryCards holdings={holdings} />
          </div>

          <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 xl:grid-cols-[1fr_320px]">
            <HoldingsTable
              holdings={holdings}
              onRemove={handleRemove}
              onRefresh={handleRefresh}
              refreshingId={refreshingId}
            />
            <AllocationChart holdings={holdings} />
          </div>
        </>
      )}

      {holdings.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <BriefcaseIcon className="size-10 opacity-20" />
          <p className="text-sm">Your portfolio is empty. Add your first holding above.</p>
        </div>
      )}
    </div>
  )
}