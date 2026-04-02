'use client'

import { useState, useEffect } from 'react'
import { Link, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ScrapeResult } from '@/app/api/scrape-gear/route'

interface GearSeedItem {
  brand: string
  name: string
  category: string
  subcategory: string
  weight_g: number
  source: string
  url: string
}

interface Props {
  onSuccess: () => void
  onManual: (name: string) => void
  initialQuery?: string
}

function searchGear(query: string, items: GearSeedItem[]): GearSeedItem[] {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []
  const filtered = items.filter((item) => {
    const target = (item.brand + ' ' + item.name).toLowerCase()
    return tokens.every((token) => target.includes(token))
  })
  const t0 = tokens[0]
  filtered.sort((a, b) => {
    const aB = a.brand.toLowerCase(); const bB = b.brand.toLowerCase()
    const rank = (s: string) => s === t0 ? 0 : s.startsWith(t0) ? 1 : s.includes(t0) ? 2 : 3
    return rank(aB) - rank(bB)
  })
  return filtered.slice(0, 20)
}

export default function GearSearchFromDB({ onSuccess, onManual, initialQuery = '' }: Props) {
  const [query, setQuery]       = useState(initialQuery)
  const [results, setResults]   = useState<GearSeedItem[]>([])
  const [seedData, setSeedData] = useState<GearSeedItem[]>([])
  const [added, setAdded]       = useState<Set<string>>(new Set())

  const [showUrlInput,  setShowUrlInput]  = useState(false)
  const [urlInput,      setUrlInput]      = useState('')
  const [scraping,      setScraping]      = useState(false)
  const [scrapeResult,  setScrapeResult]  = useState<ScrapeResult | null>(null)
  const [scrapeError,   setScrapeError]   = useState('')

  useEffect(() => {
    fetch('/gear-seed.json').then(r => r.json()).then((data: GearSeedItem[]) => setSeedData(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    setResults(searchGear(query, seedData))
  }, [query, seedData])

  const handleAdd = async (item: GearSeedItem) => {
    const key = `${item.brand}|${item.name}`
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('gears').insert({
      name: item.name, brand: item.brand, weight_g: item.weight_g,
      category: item.subcategory || item.category, user_id: user?.id,
    })
    if (!error) { setAdded(prev => new Set(prev).add(key)); onSuccess() }
  }

  const handleScrape = async () => {
    if (!urlInput.trim()) return
    setScraping(true); setScrapeResult(null); setScrapeError('')
    try {
      const res = await fetch('/api/scrape-gear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlInput.trim() }) })
      const data: ScrapeResult = await res.json()
      if (data.error && !data.weight_g && !data.name) setScrapeError(data.error)
      else setScrapeResult(data)
    } catch { setScrapeError('Failed to fetch. Please enter manually.') }
    finally { setScraping(false) }
  }

  const handleAddScraped = async () => {
    if (!scrapeResult) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('gears').insert({ name: scrapeResult.name || 'Unknown', brand: scrapeResult.brand || '', weight_g: scrapeResult.weight_g || 0, category: scrapeResult.category || 'Others', user_id: user?.id })
    if (!error) { setScrapeResult(null); setUrlInput(''); setShowUrlInput(false); onSuccess() }
  }

  const hasQuery = query.trim().length >= 2

  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-panel)',
    padding: '16px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-card)',
    padding: '0 12px',
    fontSize: 'var(--text-gear)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color var(--transition)',
  }

  return (
    <div style={panelStyle}>
      <input
        type="text"
        placeholder="Search by gear name or brand…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        style={inputStyle}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
      />

      <div style={{ marginTop: '12px' }}>
        {/* Results */}
        {hasQuery && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '280px', overflowY: 'auto', marginBottom: '12px' }}>
            {results.map((item) => {
              const key = `${item.brand}|${item.name}`
              const isAdded = added.has(key)
              return (
                <div
                  key={key}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: 'var(--radius-card)', background: 'var(--bg-tertiary)', transition: 'background var(--transition)', cursor: 'default' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 'var(--text-gear)', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                    <p style={{ fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)' }}>
                      {item.brand}{item.brand && ' · '}{item.weight_g}g{item.subcategory && ` · ${item.subcategory}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd(item)}
                    disabled={isAdded}
                    style={{ flexShrink: 0, padding: '4px 12px', fontSize: 'var(--text-sub)', fontWeight: 500, borderRadius: 'var(--radius-card)', border: 'none', background: isAdded ? 'var(--bg-elevated)' : 'var(--color-accent)', color: isAdded ? 'var(--text-tertiary)' : 'var(--bg-primary)', cursor: isAdded ? 'default' : 'pointer', transition: 'opacity var(--transition)' }}
                    onMouseEnter={e => { if (!isAdded) e.currentTarget.style.opacity = '0.85' }}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {isAdded ? 'Added' : 'Add'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* No results */}
        {hasQuery && results.length === 0 && (
          <button
            onClick={() => onManual(query.trim())}
            style={{ width: '100%', padding: '10px', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-card)', fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)', background: 'transparent', cursor: 'pointer', marginBottom: '12px', transition: 'border-color var(--transition), color var(--transition)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            No results — add &quot;{query}&quot; manually →
          </button>
        )}

        {/* Bottom actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => onManual(query.trim())}
            style={{ fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color var(--transition)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            + Add manually
          </button>
          <button
            onClick={() => { setShowUrlInput(p => !p); setScrapeResult(null); setScrapeError('') }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color var(--transition)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            <Link size={11} strokeWidth={2} />
            Paste product URL
          </button>
        </div>

        {/* URL scraping */}
        {showUrlInput && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="url"
                placeholder="https://www.montbell.jp/products/…"
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setScrapeResult(null); setScrapeError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                style={{ ...inputStyle, flex: 1, width: 'auto', fontSize: 'var(--text-sub)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
              />
              <button
                onClick={handleScrape}
                disabled={scraping || !urlInput.trim()}
                style={{ padding: '0 12px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', fontSize: 'var(--text-sub)', cursor: scraping || !urlInput.trim() ? 'default' : 'pointer', opacity: scraping || !urlInput.trim() ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', transition: 'opacity var(--transition)' }}
              >
                {scraping ? <><Loader size={11} className="animate-spin" /> Fetching…</> : 'Fetch'}
              </button>
            </div>
            <p style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)' }}>
              Supported: Montbell · Gossamer Gear · Sea to Summit · (generic)
            </p>
            {scrapeError && (
              <p style={{ fontSize: 'var(--text-sub)', color: '#D4915E', background: 'rgba(212,145,94,0.08)', borderRadius: 'var(--radius-card)', padding: '8px 12px' }}>{scrapeError}</p>
            )}
            {scrapeResult && (
              <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', padding: '12px', background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Fetched data</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    { label: 'Name',   value: scrapeResult.name,   missing: !scrapeResult.name },
                    { label: 'Brand',  value: scrapeResult.brand,  missing: !scrapeResult.brand },
                    { label: 'Weight', value: scrapeResult.weight_g ? `${scrapeResult.weight_g}g` : undefined, missing: !scrapeResult.weight_g },
                  ].map(({ label, value, missing }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', width: '48px', flexShrink: 0 }}>{label}</span>
                      {missing
                        ? <span style={{ fontSize: 'var(--text-cat)', color: '#D4915E' }}>Not found — please fill in manually</span>
                        : <span style={{ fontSize: 'var(--text-sub)', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                      }
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                  <button
                    onClick={handleAddScraped}
                    style={{ flex: 1, padding: '8px', background: 'var(--color-accent)', color: 'var(--bg-primary)', fontSize: 'var(--text-sub)', fontWeight: 500, border: 'none', borderRadius: 'var(--radius-card)', cursor: 'pointer', transition: 'opacity var(--transition)' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    Add this gear
                  </button>
                  <button
                    onClick={() => onManual(scrapeResult.name || '')}
                    style={{ flex: 1, padding: '8px', border: '1px solid var(--border-default)', fontSize: 'var(--text-sub)', color: 'var(--text-secondary)', background: 'transparent', borderRadius: 'var(--radius-card)', cursor: 'pointer', transition: 'border-color var(--transition)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
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
