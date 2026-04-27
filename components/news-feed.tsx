"use client"

import * as React from "react"
import { useStock } from "./stock-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  NewspaperIcon,
  RefreshCwIcon,
  Loader2Icon,
  CalendarIcon,
  TagIcon,
} from "lucide-react"

type NewsItem = {
  id: string
  headline: string
  summary: string
  source: string
  publishedAt: string
  sentiment: "Bullish" | "Bearish" | "Neutral"
  sentimentReason: string
  category: "Earnings" | "Management" | "Regulatory" | "Product" | "Market" | "Analyst" | "Macro"
}

const categoryColors: Record<string, string> = {
  Earnings: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Management: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Regulatory: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Product: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  Market: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Analyst: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  Macro: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
}

function SentimentBadge({ sentiment }: { sentiment: NewsItem["sentiment"] }) {
  if (sentiment === "Bullish")
    return (
      <Badge variant="outline" className="border-emerald-300 text-emerald-600 dark:text-emerald-400 gap-1">
        <TrendingUpIcon className="size-3" /> Bullish
      </Badge>
    )
  if (sentiment === "Bearish")
    return (
      <Badge variant="outline" className="border-red-300 text-red-600 dark:text-red-400 gap-1">
        <TrendingDownIcon className="size-3" /> Bearish
      </Badge>
    )
  return (
    <Badge variant="outline" className="border-amber-300 text-amber-600 dark:text-amber-400 gap-1">
      <MinusIcon className="size-3" /> Neutral
    </Badge>
  )
}

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const [expanded, setExpanded] = React.useState(false)
  const daysAgo = Math.floor(
    (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const timeLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`

  return (
    <div
      className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <SentimentBadge sentiment={item.sentiment} />
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[item.category] ?? categoryColors.Market}`}
          >
            <TagIcon className="size-2.5" />
            {item.category}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <CalendarIcon className="size-3" />
          {timeLabel}
        </span>
      </div>

      {/* Headline */}
      <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
        {item.headline}
      </h3>

      {/* Summary toggle */}
      {expanded && (
        <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>
      )}

      {/* Sentiment reason */}
      <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2 line-clamp-1">
        {item.sentimentReason}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-medium text-muted-foreground">{item.source}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Less" : "Read more"}
        </Button>
      </div>
    </div>
  )
}

function SentimentSummary({ news }: { news: NewsItem[] }) {
  const bullish = news.filter((n) => n.sentiment === "Bullish").length
  const bearish = news.filter((n) => n.sentiment === "Bearish").length
  const neutral = news.filter((n) => n.sentiment === "Neutral").length
  const total = news.length

  const overallSentiment =
    bullish > bearish + neutral ? "Bullish" : bearish > bullish + neutral ? "Bearish" : "Mixed"

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        News Sentiment
      </span>
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <TrendingUpIcon className="size-3" /> {bullish} Bullish
        </span>
        <span className="flex items-center gap-1 text-red-500 font-medium">
          <TrendingDownIcon className="size-3" /> {bearish} Bearish
        </span>
        <span className="flex items-center gap-1 text-amber-500 font-medium">
          <MinusIcon className="size-3" /> {neutral} Neutral
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Overall:</span>
        <span
          className={`text-xs font-bold ${
            overallSentiment === "Bullish"
              ? "text-emerald-600 dark:text-emerald-400"
              : overallSentiment === "Bearish"
              ? "text-red-500"
              : "text-amber-500"
          }`}
        >
          {overallSentiment}
        </span>
      </div>
      {/* Sentiment bar */}
      <div className="w-full flex rounded-full overflow-hidden h-1.5 bg-muted">
        <div
          className="bg-emerald-500 transition-all duration-500"
          style={{ width: `${(bullish / total) * 100}%` }}
        />
        <div
          className="bg-amber-400 transition-all duration-500"
          style={{ width: `${(neutral / total) * 100}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-500"
          style={{ width: `${(bearish / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

export function NewsFeed() {
  const { stockData } = useStock()
  const [news, setNews] = React.useState<NewsItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const lastSymbol = React.useRef<string | null>(null)

  const fetchNews = React.useCallback(async (symbol: string, name: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, companyName: name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch news")
      setNews(data.news ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load news")
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch when stock changes
  React.useEffect(() => {
    if (!stockData) return
    if (lastSymbol.current === stockData.symbol) return
    lastSymbol.current = stockData.symbol
    fetchNews(stockData.symbol, stockData.name)
  }, [stockData, fetchNews])

  if (!stockData) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NewspaperIcon className="size-4" /> Latest News
            </CardTitle>
            <CardDescription>Search a stock to load news and sentiment analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
              No stock selected
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <NewspaperIcon className="size-4" />
              {stockData.symbol} — Latest News
            </CardTitle>
            <CardDescription>
              AI-generated news digest · sentiment analysis for swing trading
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => fetchNews(stockData.symbol, stockData.name)}
          >
            {loading ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <RefreshCwIcon className="size-3.5" />
            )}
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground text-sm">
              <Loader2Icon className="size-4 animate-spin" /> Fetching latest news...
            </div>
          ) : error ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-red-500">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => fetchNews(stockData.symbol, stockData.name)}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              {news.length > 0 && <SentimentSummary news={news} />}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {news.map((item, i) => (
                  <NewsCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}