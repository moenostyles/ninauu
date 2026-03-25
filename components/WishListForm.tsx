'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import CategorySelect from '@/components/CategorySelect'

interface Props {
  onSuccess: () => void
  initialName?: string
}

export default function WishListForm({ onSuccess, initialName = '' }: Props) {
  const [form, setForm] = useState({
    name: initialName,
    brand: '',
    weight_g: '',
    category: 'Others',
    memo: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Brand autocomplete
  const [allBrands, setAllBrands] = useState<string[]>([])
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const brandRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('gear_catalog')
      .select('brand')
      .then(({ data }) => {
        if (data) {
          const unique = [
            ...new Set(data.map((d) => d.brand).filter(Boolean)),
          ].sort() as string[]
          setAllBrands(unique)
        }
      })
  }, [])

  useEffect(() => {
    const q = form.brand.trim().toLowerCase()
    if (q) {
      const filtered = allBrands.filter((b) => b.toLowerCase().includes(q))
      setBrandSuggestions(filtered.slice(0, 8))
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [form.brand, allBrands])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    setSaving(true)

    // 1. Add to gear_catalog as unverified
    const { data: catalogData, error: catalogError } = await supabase
      .from('gear_catalog')
      .insert({
        name: form.name.trim(),
        brand: form.brand.trim(),
        weight_g: form.weight_g ? Number(form.weight_g) : 0,
        category: form.category,
        is_verified: false,
      })
      .select('id')
      .single()

    if (catalogError) {
      setError(catalogError.message)
      setSaving(false)
      return
    }

    // 2. Add to wishlist with catalog reference
    const { data: { user } } = await supabase.auth.getUser()
    const { error: wishError } = await supabase.from('wishlist').insert({
      name: form.name.trim(),
      brand: form.brand.trim(),
      weight_g: form.weight_g ? Number(form.weight_g) : 0,
      category: form.category,
      memo: form.memo.trim(),
      catalog_id: catalogData.id,
      user_id: user?.id,
    })

    setSaving(false)

    if (wishError) {
      setError(wishError.message)
      return
    }

    onSuccess()
  }

  const field = (label: string, node: React.ReactNode, span?: boolean) => (
    <div className={span ? 'col-span-2 sm:col-span-3' : ''}>
      <label className="block text-xs font-medium text-ink-3 mb-1">{label}</label>
      {node}
    </div>
  )

  const input = (key: keyof typeof form, placeholder: string, type = 'text') => (
    <input
      type={type}
      placeholder={placeholder}
      value={form[key]}
      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
      className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink"
    />
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-line rounded-xl p-5 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-ink-2 mb-4">Add Manually</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {field('Name *', input('name', 'e.g. Tarptent Notch'))}

        {/* Brand autocomplete */}
        {field(
          'Brand',
          <div ref={brandRef} className="relative">
            <input
              type="text"
              placeholder="e.g. Tarptent"
              value={form.brand}
              onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
              onFocus={() => { if (brandSuggestions.length > 0) setShowSuggestions(true) }}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink"
            />
            {showSuggestions && (
              <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-line rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {brandSuggestions.map((b) => (
                  <li
                    key={b}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setForm((p) => ({ ...p, brand: b }))
                      setShowSuggestions(false)
                    }}
                    className="px-3 py-2 text-sm text-ink-2 hover:bg-fill cursor-pointer"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {field(
          'Category',
          <CategorySelect
            value={form.category}
            onChange={(c) => setForm((p) => ({ ...p, category: c }))}
          />
        )}

        {field('Weight (g)', input('weight_g', '0', 'number'))}
        {field('Notes', input('memo', 'Notes, purchase memo, etc.'), true)}
      </div>

      {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-ink text-white text-sm rounded-lg hover:bg-ink-2 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Add to Wish List'}
        </button>
      </div>
    </form>
  )
}
