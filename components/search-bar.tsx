"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStock } from "./stock-context"
import { SearchIcon, Loader2Icon } from "lucide-react"

export function InputInline() {
  const [query, setQuery] = useState("")
  const { searchStock, loading } = useStock()

  const handleSearch = () => {
    if (!query.trim()) return
    searchStock(query.trim())
  }

  return (
    <div className="flex gap-2 px-4 lg:px-6">
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
      <Button onClick={handleSearch} disabled={loading || !query.trim()}>
        {loading ? <Loader2Icon className="size-4 animate-spin" /> : "Analyze"}
      </Button>
    </div>
  )
}