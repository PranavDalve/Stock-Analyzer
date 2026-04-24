"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStock } from "./stock-context"
import { SearchIcon, Loader2Icon, KeyRoundIcon } from "lucide-react"

export function InputInline() {
  const [query, setQuery] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const { searchStock, loading } = useStock()

  const handleSearch = () => {
    if (!query.trim() || !apiKey.trim()) return
    searchStock(query, apiKey)
  }

  return (
    <div className="flex flex-col gap-2 px-4 lg:px-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search stock symbol or name (e.g. RELIANCE, TCS, AAPL)..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || !query.trim() || !apiKey.trim()}>
          {loading ? <Loader2Icon className="size-4 animate-spin" /> : "Analyze"}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <KeyRoundIcon className="size-3.5 text-muted-foreground shrink-0" />
        <Input
          type={showKey ? "text" : "password"}
          placeholder="Enter your Groq API key..."
          className="h-8 text-xs"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs px-2 shrink-0"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? "Hide" : "Show"}
        </Button>
      </div>
    </div>
  )
}