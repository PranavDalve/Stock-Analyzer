"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon, MinusIcon, ActivityIcon } from "lucide-react"
import { useStock } from "./stock-context"

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-muted-foreground">
          —
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="text-muted-foreground text-xs">{description}</div>
      </CardFooter>
    </Card>
  )
}

export function SectionCards() {
  const { stockData, loading } = useStock()

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {["RSI & Momentum", "MA Crossover", "Support & Resistance", "Decision"].map((t) => (
          <PlaceholderCard key={t} title={t} description="Fetching data..." />
        ))}
      </div>
    )
  }

  if (!stockData) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <PlaceholderCard title="RSI & Momentum" description="Search a stock to see RSI, Stochastic" />
        <PlaceholderCard title="MA Crossover & MACD" description="Search a stock to see MA crossover signals" />
        <PlaceholderCard title="Support & Resistance" description="Search a stock to see key price levels" />
        <PlaceholderCard title="Decision" description="Search a stock to get a buy/sell decision" />
      </div>
    )
  }

  const { rsi, stochK, stochD, macd, macdSignal, adx, sma20, sma50, support, resistance, pivot, decision, decisionScore, decisionReasons, price } = stockData

  // RSI signal
  const rsiSignal = rsi < 30 ? "Oversold – Buy Zone" : rsi > 70 ? "Overbought – Sell Zone" : rsi < 45 ? "Hold Zone" : "Neutral"
  const rsiTrend = rsi < 45 ? "up" : rsi > 70 ? "down" : "neutral"

  // MA Crossover signal
  const goldenCross = sma20 > sma50
  const macdBullish = macd > macdSignal
  const maSignal = goldenCross ? "Golden Cross" : "Death Cross"
  const maTrend = goldenCross && macdBullish ? "up" : "down"

  // Support/Resistance proximity
  const nearSupport = Math.abs(price - support) / price < 0.03
  const nearResistance = Math.abs(price - resistance) / price < 0.03
  const srSignal = nearSupport ? "Near Support" : nearResistance ? "Near Resistance" : price > pivot ? "Above Pivot" : "Below Pivot"
  const adxStrong = adx > 20

  // Decision card color
  const decisionColor = decision === "BUY" ? "text-emerald-600 dark:text-emerald-400" : decision === "SELL" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
  const DecisionIcon = decision === "BUY" ? TrendingUpIcon : decision === "SELL" ? TrendingDownIcon : MinusIcon

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {/* Card 1: RSI & Stochastic */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>RSI & Stochastic</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            RSI {rsi.toFixed(1)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {rsiTrend === "up" ? <TrendingUpIcon /> : rsiTrend === "down" ? <TrendingDownIcon /> : <MinusIcon />}
              Stoch {stochK.toFixed(0)}/{stochD.toFixed(0)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {rsiSignal}
            {rsiTrend === "up" ? <TrendingUpIcon className="size-4" /> : rsiTrend === "down" ? <TrendingDownIcon className="size-4" /> : null}
          </div>
          <div className="text-muted-foreground">
            {stochK < 20 ? "Stochastic oversold — strong buy signal" : stochK > 80 ? "Stochastic overbought — caution" : "Stochastic in neutral zone"}
          </div>
        </CardFooter>
      </Card>

      {/* Card 2: MA Crossover & MACD */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>MA Crossover & MACD</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {maSignal}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {maTrend === "up" ? <TrendingUpIcon /> : <TrendingDownIcon />}
              ADX {adx.toFixed(1)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            MACD {macdBullish ? "Bullish Cross" : "Bearish Cross"}
            {maTrend === "up" ? <TrendingUpIcon className="size-4" /> : <TrendingDownIcon className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {adxStrong ? `ADX ${adx.toFixed(1)} — strong trend confirmed` : `ADX ${adx.toFixed(1)} — weak/no trend`} · SMA20 {sma20.toFixed(0)} vs SMA50 {sma50.toFixed(0)}
          </div>
        </CardFooter>
      </Card>

      {/* Card 3: Support & Resistance */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Support & Resistance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ₹{support.toFixed(0)}–{resistance.toFixed(0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {nearSupport ? <TrendingUpIcon /> : nearResistance ? <TrendingDownIcon /> : <MinusIcon />}
              {srSignal}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Pivot ₹{pivot.toFixed(0)} · Price ₹{price.toFixed(0)}
          </div>
          <div className="text-muted-foreground">
            Fibonacci zone: ₹{stockData.fib382.toFixed(0)} – ₹{stockData.fib618.toFixed(0)}
          </div>
        </CardFooter>
      </Card>

      {/* Card 4: Decision */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Swing Trade Decision</CardDescription>
          <CardTitle className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${decisionColor}`}>
            {decision}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ActivityIcon />
              Score {decisionScore}/100
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className={`line-clamp-1 flex gap-2 font-medium ${decisionColor}`}>
            {decisionReasons[0]}
            <DecisionIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {decisionReasons.slice(1, 3).join(" · ")}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}