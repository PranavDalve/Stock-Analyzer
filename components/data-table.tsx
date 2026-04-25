"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"
import { useStock } from "./stock-context"

type BalanceSheetRow = {
  quarter: string
  totalAssets: number
  totalLiabilities: number
  equity: number
  revenue: number
  netIncome: number
  eps: number
}

function fmt(val: number | undefined | null) {
  if (val === undefined || val === null || isNaN(val)) return "—"

  if (Math.abs(val) >= 1_00_00_00_000) return `₹${(val / 1_00_00_00_000).toFixed(2)}T`
  if (Math.abs(val) >= 1_00_00_000) return `₹${(val / 1_00_00_000).toFixed(2)}Cr`
  if (Math.abs(val) >= 1_00_000) return `₹${(val / 1_00_000).toFixed(2)}L`

  return `₹${val.toLocaleString("en-IN")}`
}

const columns: ColumnDef<BalanceSheetRow>[] = [
  {
    accessorKey: "quarter",
    header: "Quarter",
    cell: ({ row }) => (
      <span className="font-semibold text-foreground">{row.original.quarter}</span>
    ),
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    cell: ({ row }) => (
      <span className="tabular-nums">{fmt(row.original.revenue)}</span>
    ),
  },
  {
    accessorKey: "netIncome",
    header: "Net Income",
    cell: ({ row }) => {
      const val = row.original.netIncome
      return (
        <span className={`tabular-nums font-medium ${val >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
          {fmt(val)}
        </span>
      )
    },
  },
  {
    accessorKey: "eps",
    header: "EPS",
    cell: ({ row }) => {
      const val = row.original.eps
    
      if (val === undefined || val === null) {
        return <span className="text-muted-foreground">—</span>
      }
    
      return (
        <span className={`tabular-nums ${val >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
          ₹{val.toFixed(2)}
        </span>
      )
    }
  },
  {
    accessorKey: "totalAssets",
    header: "Total Assets",
    cell: ({ row }) => <span className="tabular-nums">{fmt(row.original.totalAssets)}</span>,
  },
  {
    accessorKey: "totalLiabilities",
    header: "Total Liabilities",
    cell: ({ row }) => <span className="tabular-nums">{fmt(row.original.totalLiabilities)}</span>,
  },
  {
    accessorKey: "equity",
    header: "Equity",
    cell: ({ row }) => (
      <span className={`tabular-nums font-medium ${row.original.equity >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}`}>
        {fmt(row.original.equity)}
      </span>
    ),
  },
]

// Placeholder rows when no data
const placeholderRows: BalanceSheetRow[] = [
  { quarter: "—", totalAssets: 0, totalLiabilities: 0, equity: 0, revenue: 0, netIncome: 0, eps: 0 },
  { quarter: "—", totalAssets: 0, totalLiabilities: 0, equity: 0, revenue: 0, netIncome: 0, eps: 0 },
  { quarter: "—", totalAssets: 0, totalLiabilities: 0, equity: 0, revenue: 0, netIncome: 0, eps: 0 },
  { quarter: "—", totalAssets: 0, totalLiabilities: 0, equity: 0, revenue: 0, netIncome: 0, eps: 0 },
]

export function DataTable({ data: _ignored }: { data: unknown[] }) {
  const { stockData, loading } = useStock()
  const [sorting, setSorting] = React.useState<SortingState>([])

  const tableData = stockData?.balanceSheet ?? placeholderRows

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Compute YoY revenue growth for badge
  let revGrowthBadge = null
  if (stockData && stockData.balanceSheet.length >= 2) {
    const latest = stockData.balanceSheet[stockData.balanceSheet.length - 1]
    const prev = stockData.balanceSheet[stockData.balanceSheet.length - 2]
    if (prev.revenue > 0) {
      const growth = ((latest.revenue - prev.revenue) / prev.revenue) * 100
      revGrowthBadge = (
        <Badge variant="outline">
          {growth >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
          {growth >= 0 ? "+" : ""}{growth.toFixed(1)}% QoQ Revenue
        </Badge>
      )
    }
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>
              {stockData ? `${stockData.symbol} — Quarterly Financials` : "Balance Sheet"}
            </CardTitle>
            <CardDescription>
              {stockData
                ? "Revenue, Net Income, EPS & Balance Sheet — Last 4 Quarters"
                : "Search a stock to view quarterly financials"}
            </CardDescription>
          </div>
          {revGrowthBadge}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
              Loading financial data...
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="font-semibold">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className={!stockData ? "opacity-30" : ""}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Technical Indicators Summary Table */}
          {stockData && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Technical Indicators Summary</h3>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="font-semibold">Indicator</TableHead>
                      <TableHead className="font-semibold">Value</TableHead>
                      <TableHead className="font-semibold">Buy Range</TableHead>
                      <TableHead className="font-semibold">Sell Range</TableHead>
                      <TableHead className="font-semibold">Signal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        name: "RSI",
                        value: stockData.rsi.toFixed(1),
                        buy: "<30 (buy), 30–45 (hold)",
                        sell: ">70 (sell)",
                        signal: stockData.rsi < 30 ? "BUY" : stockData.rsi > 70 ? "SELL" : stockData.rsi < 45 ? "HOLD" : "NEUTRAL",
                      },
                      {
                        name: "MA Crossover",
                        value: `SMA20: ${stockData.sma20.toFixed(0)} / SMA50: ${stockData.sma50.toFixed(0)}`,
                        buy: "Golden Cross → Buy",
                        sell: "Death Cross → Sell",
                        signal: stockData.sma20 > stockData.sma50 ? "BUY" : "SELL",
                      },
                      {
                        name: "MACD",
                        value: `${stockData.macd.toFixed(2)} / Signal: ${stockData.macdSignal.toFixed(2)}`,
                        buy: "MACD cross-up",
                        sell: "MACD cross-down",
                        signal: stockData.macd > stockData.macdSignal ? "BUY" : "SELL",
                      },
                      {
                        name: "Stochastic",
                        value: `%K: ${stockData.stochK.toFixed(0)} / %D: ${stockData.stochD.toFixed(0)}`,
                        buy: "Stoch. <20",
                        sell: "Stoch. >80",
                        signal: stockData.stochK < 20 ? "BUY" : stockData.stochK > 80 ? "SELL" : "NEUTRAL",
                      },
                      {
                        name: "ADX",
                        value: stockData.adx.toFixed(1),
                        buy: "ADX >20 rising",
                        sell: "ADX >40 + sell signs",
                        signal: stockData.adx > 20 && stockData.adx < 40 ? "TREND" : stockData.adx >= 40 ? "CAUTION" : "WEAK",
                      },
                      {
                        name: "Support / Resistance",
                        value: `₹${stockData.support.toFixed(0)} / ₹${stockData.resistance.toFixed(0)}`,
                        buy: `₹${stockData.support.toFixed(0)}–${(stockData.support * 1.02).toFixed(0)} buy zone`,
                        sell: `₹${stockData.resistance.toFixed(0)}+ sell zone`,
                        signal: stockData.price <= stockData.support * 1.02 ? "BUY" : stockData.price >= stockData.resistance * 0.98 ? "SELL" : "NEUTRAL",
                      },
                      {
                        name: "Fibonacci",
                        value: `₹${stockData.fib382.toFixed(0)} – ₹${stockData.fib618.toFixed(0)}`,
                        buy: `₹${stockData.fib382.toFixed(0)}–${stockData.fib500.toFixed(0)} buy`,
                        sell: `₹${stockData.fib618.toFixed(0)}+ sell`,
                        signal: stockData.price <= stockData.fib500 ? "BUY" : "NEUTRAL",
                      },
                      {
                        name: "Pivot (Daily)",
                        value: `₹${stockData.pivot.toFixed(0)}`,
                        buy: `>${stockData.pivot.toFixed(0)} bullish`,
                        sell: `<${stockData.pivot.toFixed(0)} cautious`,
                        signal: stockData.price > stockData.pivot ? "BUY" : "CAUTION",
                      },
                    ].map((row) => {
                      const signalColor =
                        row.signal === "BUY" || row.signal === "TREND"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : row.signal === "SELL" || row.signal === "CAUTION"
                          ? "text-red-500"
                          : "text-amber-500"
                      return (
                        <TableRow key={row.name}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="tabular-nums text-xs">{row.value}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.buy}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.sell}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${signalColor}`}>
                              {row.signal}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}