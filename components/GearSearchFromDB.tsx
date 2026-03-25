'use client'

import { useState, useEffect } from 'react'
import { Link, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ScrapeResult } from '@/app/api/scrape-gear/route'

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

  // URL scraping
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null)
  const [scrapeError, setScrapeError] = useState('')

  // catalog検索
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
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
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('gears').insert({
      name: item.name, brand: item.brand,
      weight_g: item.weight_g, category: item.category,
      user_id: user?.id,
    })
    if (!error) { setAdded(prev => new Set(prev).add(item.id)); onSuccess() }
  }

  // URLスクレイピング
  const handleScrape = async () => {
    if (!urlInput.trim()) return
    setScraping(true)
    setScrapeResult(null)
    setScrapeError('')
    try {
      const res = await fetch('/api/scrape-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      })
      const data: ScrapeResult = await res.json()
      if (data.error && !data.weight_g && !data.name) {
        setScrapeError(data.error)
      } else {
        setScrapeResult(data)
      }
    } catch {
      setScrapeError('Failed to fetch. Please enter manually.')
    } finally {
      setScraping(false)
    }
  }

  // スクレイピング結果から直接ギアを追加
  const handleAddScraped = async () => {
    if (!scrapeResult) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('gears').insert({
      name: scrapeResult.name || 'Unknown',
      brand: scrapeResult.brand || '',
      weight_g: scrapeResult.weight_g || 0,
      category: scrapeResult.category || 'Others',
      user_id: user?.id,
    })
    if (!error) {
      setScrapeResult(null)
      setUrlInput('')
      setShowUrlInput(false)
      onSuccess()
    }
  }

  return (
    <div className="bg-white border border-line rounded-xl p-5 shadow-sm">

      {/* 通常検索 */}
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
              <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-fill hover:bg-fill-2 transition-colors">
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
                    added.has(item.id) ? 'bg-fill text-ink-3 cursor-default' : 'bg-ink text-white hover:bg-ink-2'
                  }`}
                >
                  {added.has(item.id) ? 'Added' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 下部アクション */}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => onManual(query.trim())}
            className="text-xs text-ink-3 hover:text-ink transition-colors"
          >
            + Add manually
          </button>
          <button
            onClick={() => { setShowUrlInput(p => !p); setScrapeResult(null); setScrapeError('') }}
            className="flex items-center gap-1 text-xs text-ink-3 hover:text-ink transition-colors"
          >
            <Link size={11} strokeWidth={2} />
            Paste product URL
          </button>
        </div>

        {/* URLスクレイピング入力 */}
        {showUrlInput && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://www.montbell.jp/products/..."
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setScrapeResult(null); setScrapeError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                className="flex-1 border border-line rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ink"
              />
              <button
                onClick={handleScrape}
                disabled={scraping || !urlInput.trim()}
                className="px-3 py-2 bg-ink text-surface text-xs rounded-lg hover:bg-ink-2 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                {scraping
                  ? <><Loader size={11} className="animate-spin" /> Fetching…</>
                  : 'Fetch'}
              </button>
            </div>

            {/* 対応ブランド表示 */}
            <p className="text-[10px] text-ink-3">
              Supported: Montbell · Gossamer Gear · Sea to Summit · (generic)
            </p>

            {/* エラー */}
            {scrapeError && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{scrapeError}</p>
            )}

            {/* スクレイピング結果プレビュー */}
            {scrapeResult && (
              <div className="border border-line rounded-xl p-3 bg-fill space-y-2">
                <p className="text-[10px] text-ink-3 uppercase tracking-wider font-semibold">Fetched data</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Name',   value: scrapeResult.name,   missing: !scrapeResult.name },
                    { label: 'Brand',  value: scrapeResult.brand,  missing: !scrapeResult.brand },
                    { label: 'Weight', value: scrapeResult.weight_g ? `${scrapeResult.weight_g}g` : undefined, missing: !scrapeResult.weight_g },
                  ].map(({ label, value, missing }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[10px] text-ink-3 w-12 shrink-0">{label}</span>
                      {missing
                        ? <span className="text-[10px] text-amber-500">Not found — please fill in manually</span>
                        : <span className="text-xs text-ink font-medium">{value}</span>
                      }
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAddScraped}
                    className="flex-1 py-2 bg-ink text-surface text-xs font-medium rounded-lg hover:bg-ink-2 transition-colors"
                  >
                    Add this gear
                  </button>
                  <button
                    onClick={() => onManual(scrapeResult.name || '')}
                    className="flex-1 py-2 border border-line text-xs text-ink-2 rounded-lg hover:bg-fill transition-colors"
                  >
                    Edit before adding
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
