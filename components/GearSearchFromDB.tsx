'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface CatalogItem {
  id: string
  name: string
  brand: string
  weight_g: number
  category: string
  price_krw: number
}

interface Props {
  onSuccess: () => void
  onManual: (name: string) => void
}

export default function GearSearchFromDB({ onSuccess, onManual }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogItem[]>([])
  const [searching, setSearching] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('gear_catalog')
        .select('*')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
        .order('name')
        .limit(20)
      if (data) setResults(data as CatalogItem[])
      setSearching(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const handleAdd = async (item: CatalogItem) => {
    const { error } = await supabase.from('gears').insert({
      name: item.name,
      brand: item.brand,
      weight_g: item.weight_g,
      category: item.category,
    })
    if (!error) {
      setAdded((prev) => new Set(prev).add(item.id))
      onSuccess()
    }
  }

  return (
    <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
      <input
        type="text"
        placeholder="Search by gear name or brand..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink"
      />

      <div className="mt-3">
        {searching && <p className="text-ink-3 text-xs">Searching...</p>}

        {!searching && query.trim() && results.length === 0 && (
          <button
            onClick={() => onManual(query.trim())}
            className="w-full py-2.5 border-2 border-dashed border-line rounded-lg text-xs text-ink-3 hover:border-ink hover:text-ink hover:bg-fill transition-colors"
          >
            No results — add &quot;{query}&quot; manually →
          </button>
        )}

        {results.length > 0 && (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {results.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-fill hover:bg-fill-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                  <p className="text-xs text-ink-3">
                    {item.brand}{item.brand && ' · '}{item.weight_g}g · {item.category}
                  </p>
                </div>
                <button
                  onClick={() => handleAdd(item)}
                  disabled={added.has(item.id)}
                  className={`shrink-0 px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    added.has(item.id)
                      ? 'bg-fill text-ink-3 cursor-default'
                      : 'bg-ink text-white hover:bg-ink-2'
                  }`}
                >
                  {added.has(item.id) ? 'Added' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onManual(query.trim())}
          className="mt-3 text-xs text-ink-3 hover:text-ink-2 transition-colors"
        >
          + Add manually
        </button>
      </div>
    </div>
  )
}
