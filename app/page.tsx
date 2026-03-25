'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Gear, Trip, PackEntry, SavedPack, Visibility, CATEGORY_TREE, PARENT_CATEGORIES, parentOf } from '@/types'
import GearForm from '@/components/GearForm'
import GearList from '@/components/GearList'
import PackSummary from '@/components/PackSummary'
import GearSearchFromDB from '@/components/GearSearchFromDB'
import TripForm from '@/components/TripForm'
import TripList from '@/components/TripList'
import ExploreTab from '@/components/ExploreTab'
import AuthScreen from '@/components/AuthScreen'

type AddMode = null | 'search' | 'manual'
type Tab = 'gear' | 'trips' | 'explore'

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const [gears, setGears] = useState<Gear[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [savedPacks, setSavedPacks] = useState<SavedPack[]>([])
  const [packItems, setPackItems] = useState<PackEntry[]>([])
  const [addMode, setAddMode] = useState<AddMode>(null)
  const [showTripForm, setShowTripForm] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('gear')
  const [filterParent, setFilterParent] = useState<string>('All')
  const [filterChild, setFilterChild] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [gearInitialName, setGearInitialName] = useState('')

  const fetchGears = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('gears').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setGears(data as Gear[])
    setLoading(false)
  }, [user])

  const fetchTrips = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('trips').select('*').eq('user_id', user.id).order('start_date', { ascending: false })
    if (data) setTrips(data as Trip[])
  }, [user])

  const fetchSavedPacks = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('saved_packs').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setSavedPacks(data as SavedPack[])
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchGears()
    fetchTrips()
    fetchSavedPacks()
  }, [user, fetchGears, fetchTrips, fetchSavedPacks])

  const togglePackItem = (gear: Gear) => {
    setPackItems((prev) =>
      prev.find((e) => e.gear.id === gear.id)
        ? prev.filter((e) => e.gear.id !== gear.id)
        : [...prev, { gear, quantity: 1 }]
    )
  }

  const updatePackQuantity = (gearId: string, quantity: number) => {
    if (quantity < 1) { setPackItems((prev) => prev.filter((e) => e.gear.id !== gearId)); return }
    setPackItems((prev) => prev.map((e) => e.gear.id === gearId ? { ...e, quantity } : e))
  }

  const handleSavePack = async (name: string, visibility: Visibility = 'private') => {
    const { data, error } = await supabase.from('saved_packs').insert({ name, visibility, user_id: user?.id }).select('id').single()
    if (error || !data) return
    await supabase.from('saved_pack_items').insert(
      packItems.map((e) => ({
        pack_id: data.id, gear_id: e.gear.id, gear_name: e.gear.name,
        brand: e.gear.brand, weight_g: e.gear.weight_g, category: e.gear.category, quantity: e.quantity,
      }))
    )
    fetchSavedPacks()
  }

  const handleTogglePackVisibility = async (packId: string, visibility: Visibility) => {
    await supabase.from('saved_packs').update({ visibility }).eq('id', packId)
    fetchSavedPacks()
  }

  const handleLoadPack = async (packId: string) => {
    const { data } = await supabase.from('saved_pack_items').select('*').eq('pack_id', packId)
    if (!data) return
    const entries: PackEntry[] = []
    for (const item of data) {
      const gear = item.gear_id ? gears.find((g) => g.id === item.gear_id) : null
      entries.push({
        gear: gear ?? { id: item.gear_id ?? item.id, name: item.gear_name, brand: item.brand, weight_g: item.weight_g, category: item.category, created_at: '' },
        quantity: item.quantity,
      })
    }
    setPackItems(entries)
    setActiveTab('gear')
  }

  const handleDeleteSavedPack = async (packId: string) => {
    await supabase.from('saved_packs').delete().eq('id', packId)
    fetchSavedPacks()
  }

  const filteredGears = gears.filter((g) => {
    if (filterParent === 'All') return true
    if (filterChild !== 'All') return g.category === filterChild
    return parentOf(g.category) === filterParent
  })
  const packGearCount = packItems.reduce((s, e) => s + e.quantity, 0)

  // ── Tab config ──
  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'gear',    label: 'Gear',    badge: packGearCount || undefined },
    { key: 'trips',   label: 'Trips',   badge: trips.length || undefined },
    { key: 'explore', label: 'Explore' },
  ]

  if (authLoading) {
    return <div className="flex items-center justify-center py-32"><p className="text-ink-3 text-sm">Loading...</p></div>
  }
  if (!user) {
    return <AuthScreen />
  }

  return (
    <div>
      {/* ── Segmented Tab Control ── */}
      <div className="bg-[#F2F2F7] rounded-2xl p-1 flex mb-5">
        {tabs.map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key)
              if (key === 'gear') setAddMode(null)
              if (key === 'trips') setShowTripForm(false)
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeTab === key
                ? 'bg-ink text-surface shadow-md'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            {label}
            {badge ? (
              <span className={`text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center leading-none ${
                activeTab === key ? 'bg-surface text-ink' : 'bg-fill-2 text-ink-3'
              }`}>
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Gear List ── */}
      {activeTab === 'gear' && (
        <div>
          {/* Category chips + Add button */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-3">
              {/* Parent chips — horizontal scroll */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1 pb-0.5">
                {['All', ...PARENT_CATEGORIES].map((p) => (
                  <button
                    key={p}
                    onClick={() => { setFilterParent(p); setFilterChild('All') }}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors whitespace-nowrap shrink-0 ${
                      filterParent === p
                        ? 'bg-ink text-surface border-ink shadow-sm'
                        : 'bg-surface text-ink border-line hover:border-ink hover:bg-fill'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setAddMode((p) => (p ? null : 'search')); setGearInitialName('') }}
                className="hidden sm:flex shrink-0 items-center gap-1.5 px-4 py-2 bg-ink text-surface text-sm font-medium rounded-xl hover:bg-ink-2 transition-colors"
              >
                {addMode ? 'Cancel' : <><Plus size={15} strokeWidth={2.5} />Add</>}
              </button>
            </div>
            {/* Child chips */}
            {filterParent !== 'All' && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 pl-1">
                {['All', ...(CATEGORY_TREE[filterParent] ?? [])].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterChild(c)}
                    className={`px-2.5 py-0.5 text-xs rounded-full border transition-colors whitespace-nowrap shrink-0 ${
                      filterChild === c
                        ? 'bg-ink text-surface border-ink shadow-sm'
                        : 'bg-surface text-ink-3 border-line hover:border-ink hover:bg-fill'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {addMode === 'search' && (
            <div className="mb-4">
              <GearSearchFromDB
                onSuccess={fetchGears}
                onManual={(name) => { setGearInitialName(name); setAddMode('manual') }}
              />
            </div>
          )}
          {addMode === 'manual' && (
            <div className="mb-4">
              <GearForm onSuccess={() => { setAddMode(null); fetchGears() }} initialName={gearInitialName} />
            </div>
          )}

          <PackSummary
            items={packItems}
            savedPacks={savedPacks}
            onRemove={togglePackItem}
            onSave={handleSavePack}
            onLoad={handleLoadPack}
            onDeleteSaved={handleDeleteSavedPack}
            onToggleVisibility={handleTogglePackVisibility}
          />

          {loading ? (
            <p className="text-ink-3 text-sm py-12 text-center">Loading…</p>
          ) : (
            <GearList
              gears={filteredGears}
              packItems={packItems}
              onTogglePack={togglePackItem}
              onUpdateQuantity={updatePackQuantity}
              onDelete={fetchGears}
            />
          )}
        </div>
      )}

      {/* ── FAB (mobile only, Gear tab) ── */}
      {activeTab === 'gear' && (
        <button
          onClick={() => { setAddMode((p) => (p ? null : 'search')); setGearInitialName('') }}
          className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-ink text-surface rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
        >
          {addMode
            ? <X size={20} strokeWidth={2.5} />
            : <Plus size={22} strokeWidth={2.5} />}
        </button>
      )}

      {/* ── Trips ── */}
      {activeTab === 'trips' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowTripForm((p) => !p)}
              className="flex items-center gap-1.5 px-4 py-2 bg-ink text-surface text-sm font-medium rounded-xl hover:bg-ink-2 transition-colors"
            >
              {showTripForm ? 'Cancel' : <><Plus size={15} strokeWidth={2.5} />New Trip</>}
            </button>
          </div>
          {showTripForm && (
            <div className="mb-4">
              <TripForm packItems={packItems.map((e) => e.gear)} onSuccess={() => { setShowTripForm(false); fetchTrips() }} />
            </div>
          )}
          <TripList trips={trips} onRefresh={fetchTrips} />
        </div>
      )}

      {/* ── Explore ── */}
      {activeTab === 'explore' && (
        <ExploreTab currentUserId={user.id} />
      )}
    </div>
  )
}
