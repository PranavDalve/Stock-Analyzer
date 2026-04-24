"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Bar, ComposedChart, Tooltip, ResponsiveContainer } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useStock } from "./stock-context"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

const chartConfig = {
  close: {
    label: "Price",
    color: "var(--primary)",
  },
  volume: {
    label: "Volume",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig

// Default placeholder chart data
const placeholderData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  close: 0,
  volume: 0,
}))

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const { stockData, loading } = useStock()

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  const rawData = stockData?.priceHistory ?? placeholderData

  const filteredData = rawData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date(rawData[rawData.length - 1]?.date || new Date())
    let daysToSubtract = 30
    if (timeRange === "14d") daysToSubtract = 14
    else if (timeRange === "7d") daysToSubtract = 7
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  const firstPrice = filteredData[0]?.close ?? 0
  const lastPrice = filteredData[filteredData.length - 1]?.close ?? 0
  const priceChange = lastPrice - firstPrice
  const priceChangePct = firstPrice > 0 ? ((priceChange / firstPrice) * 100).toFixed(2) : "0.00"
  const isPositive = priceChange >= 0

  const chartColor = isPositive ? "var(--chart-positive, #10b981)" : "var(--chart-negative, #ef4444)"

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>
          {stockData ? `${stockData.symbol} — ${stockData.name}` : "Price Chart"}
        </CardTitle>
        <CardDescription>
          {stockData ? (
            <span className={`flex items-center gap-1 font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {isPositive ? <TrendingUpIcon className="size-3.5" /> : <TrendingDownIcon className="size-3.5" />}
              {isPositive ? "+" : ""}{priceChangePct}% over selected period
            </span>
          ) : (
            <span>Search for a stock to view the price chart</span>
          )}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => { setTimeRange(value[0] ?? "30d") }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">30 Days</ToggleGroupItem>
            {/* <ToggleGroupItem value="14d">14 Days</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 Days</ToggleGroupItem> */}
          </ToggleGroup>
          <Select value={timeRange} onValueChange={(v) => { if (v) setTimeRange(v) }}>
            <SelectTrigger
              className="flex w-36 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select range"
            >
              <SelectValue placeholder="30 Days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">30 Days</SelectItem>
              <SelectItem value="14d" className="rounded-lg">14 Days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">7 Days</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {!stockData && !loading ? (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
            Enter a stock symbol above to load chart data
          </div>
        ) : loading ? (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm animate-pulse">
            Loading chart data...
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
            <ComposedChart data={filteredData} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                }}
              />
              <YAxis
                yAxisId="price"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                width={70}
              />
              <YAxis
                yAxisId="volume"
                orientation="left"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
                  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
                  return v
                }}
                width={45}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })
                    }
                    formatter={(value, name) => {
                      if (name === "close") return [`₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, "Price"]
                      if (name === "volume") return [Number(value).toLocaleString("en-IN"), "Volume"]
                      return [value, name]
                    }}
                    indicator="dot"
                  />
                }
              />
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="var(--muted-foreground)"
                fillOpacity={0.15}
                radius={[2, 2, 0, 0]}
              />
              <Area
                yAxisId="price"
                dataKey="close"
                type="monotone"
                fill="url(#fillPrice)"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}