"use client"

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
import { SearchIcon } from "lucide-react"
import { useStock } from "./stock-context"

export function DataTable({ data: _ignored }: { data: unknown[] }) {
  const { stockData, loading } = useStock()

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {stockData ? `${stockData.symbol} — Technical Indicators` : "Technical Indicators"}
          </CardTitle>
          <CardDescription>
            {stockData
              ? "Signal summary across key technical indicators"
              : "Search a stock above to view technical indicators"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
              Loading indicators...
            </div>
          )}

          {!loading && !stockData && (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <SearchIcon className="h-8 w-8 opacity-30" />
              <p className="text-sm">Search for a stock to see technical indicators</p>
            </div>
          )}

          {!loading && stockData && (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}