'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, X, Backpack, MapPin, Compass } from 'lucide-react'
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
import Onboarding from '@/components/Onboarding'

type AddMode = null | 'search' | 'manual'
type Tab = 'gear' | 'trips' | 'explore'

const BIG3_CATEGORIES = ['Tent', 'Backpack', 'Sleeping Bag']

const SORT_OPTIONS = [
  { key: 'date',        label: 'Latest'        },
  { key: 'name',        label: 'Name'          },
  { key: 'weight_asc',  label: 'Light → Heavy' },
  { key: 'weight_desc', label: 'Heavy → Light' },
] as const

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const [gears, setGears] = useState<Gear[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [savedPacks, setSavedPacks] = useState<SavedPack[]>([])
  const [packItems, setPackItems] = useState<PackEntry[]>([])
  const [addMode, setAddMode] = useState<AddMode>(null)
  const [searchInitialQuery, setSearchInitialQuery] = useState('')
  const [showTripForm, setShowTripForm] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('gear')
  const [filterParent, setFilterParent] = useState<string>('All')
  const [filterChild, setFilterChild] = useState<string>('All')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'weight_asc' | 'weight_desc'>('date')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [gearInitialName, setGearInitialName] = useState('')

  const [onboardingSkipped, setOnboardingSkipped] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('ninauu_onboarding_v2')
  })

  useEffect(() => {
    if (!showSortMenu) return
    const close = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showSortMenu])

  const skipOnboarding = () => {
    localStorage.setItem('ninauu_onboarding_v2', '1')
    setOnboardingSkipped(true)
  }

  const registeredBig3 = new Set(
    gears.map((g) => g.category).filter((c) => BIG3_CATEGORIES.includes(c))
  )
  const allBig3Done = BIG3_CATEGORIES.every((c) => registeredBig3.has(c))
  const showOnboarding = !onboardingSkipped && !loading && !allBig3Done && activeTab === 'gear'

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
    fetchGears(); fetchTrips(); fetchSavedPacks()
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
    const entries: PackEntry[] = data.map((item) => {
      const gear = item.gear_id ? gears.find((g) => g.id === item.gear_id) : null
      return {
        gear: gear ?? { id: item.gear_id ?? item.id, name: item.gear_name, brand: item.brand, weight_g: item.weight_g, category: item.category, created_at: '' },
        quantity: item.quantity,
      }
    })
    setPackItems(entries)
    setFilterParent('All'); setFilterChild('All'); setActiveTab('gear')
  }

  const handleDeleteSavedPack = async (packId: string) => {
    await supabase.from('saved_packs').delete().eq('id', packId)
    fetchSavedPacks()
  }

  const filteredGears = gears
    .filter((g) => {
      if (filterParent === 'All') return true
      if (filterChild !== 'All') return g.category === filterChild
      return parentOf(g.category) === filterParent
    })
    .sort((a, b) => {
      if (sortBy === 'name')        return a.name.localeCompare(b.name)
      if (sortBy === 'weight_asc')  return a.weight_g - b.weight_g
      if (sortBy === 'weight_desc') return b.weight_g - a.weight_g
      return 0
    })

  const packGearCount = packItems.reduce((s, e) => s + e.quantity, 0)
  const getTabIcon = (key: Tab) => {
    switch(key) {
      case 'gear': return <Backpack size={16} strokeWidth={2} />
      case 'trips': return <MapPin size={16} strokeWidth={2} />
      case 'explore': return <Compass size={16} strokeWidth={2} />
    }
  }
  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'gear',    label: 'Gear',    badge: packGearCount || undefined },
    { key: 'trips',   label: 'Trips',   badge: trips.length || undefined },
    { key: 'explore', label: 'Explore' },
  ]

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <p style={{ fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)' }}>Loading…</p>
      </div>
    )
  }
  if (!user) return <AuthScreen />

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortBy)?.label ?? 'Latest'

  return (
    <div>
      {/* ── Tab control ── */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {tabs.map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key)
              if (key === 'gear') setAddMode(null)
              if (key === 'trips') setShowTripForm(false)
            }}
            style={{
              padding: '10px 16px',
              fontSize: 'var(--text-weight)',
              fontWeight: activeTab === key ? 600 : 400,
              color: activeTab === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderBottom: activeTab === key ? '2px solid var(--text-primary)' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'none',
              border: 'none',
              borderBottomStyle: 'solid',
              borderBottomWidth: '2px',
              borderBottomColor: activeTab === key ? 'var(--text-primary)' : 'transparent',
              cursor: 'pointer',
              transition: 'color var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (activeTab !== key) e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { if (activeTab !== key) e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            {getTabIcon(key)}
            {label}
            {badge ? (
              <span
                style={{
                  fontSize: 'var(--text-cat)',
                  fontWeight: 600,
                  borderRadius: '999px',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  background: activeTab === key ? 'var(--text-primary)' : 'var(--bg-tertiary)',
                  color: activeTab === key ? 'var(--bg-primary)' : 'var(--text-secondary)',
                }}
              >
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Gear tab ── */}
      {activeTab === 'gear' && (
        <div>
          {/* Filter row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Parent filter chips */}
              <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                <div className="scrollbar-hide" style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {['All', ...PARENT_CATEGORIES].map((p) => {
                    const active = filterParent === p
                    return (
                      <button
                        key={p}
                        onClick={() => { setFilterParent(p); setFilterChild('All') }}
                        style={{
                          padding: '4px 12px',
                          fontSize: 'var(--text-cat)',
                          fontWeight: active ? 600 : 400,
                          borderRadius: '999px',
                          border: active ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
                          background: active ? 'var(--bg-elevated)' : 'transparent',
                          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          transition: 'all var(--transition)',
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)' }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
                      >
                        {p === 'Apparel Accessories' ? 'Apparel Acc.' : p}
                      </button>
                    )
                  })}
                </div>
                <div style={{ pointerEvents: 'none', position: 'absolute', inset: '0 0 0 auto', width: '24px', background: 'linear-gradient(to left, var(--bg-primary), transparent)' }} />
              </div>

              {/* + Add button (desktop) */}
              <button
                onClick={() => { setAddMode((p) => (p ? null : 'search')); setGearInitialName(''); setSearchInitialQuery('') }}
                className="hidden sm:flex"
                style={{
                  flexShrink: 0,
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 12px',
                  background: 'var(--color-accent)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  borderRadius: '999px',
                  fontSize: 'var(--text-weight)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'opacity var(--transition)',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {addMode ? <X size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
                {addMode ? 'Cancel' : 'Add'}
              </button>
            </div>

            {/* Child chips */}
            {filterParent !== 'All' && (
              <div className="scrollbar-hide" style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px', paddingLeft: '8px' }}>
                {['All', ...(CATEGORY_TREE[filterParent] ?? [])].map((c) => {
                  const active = filterChild === c
                  return (
                    <button
                      key={c}
                      onClick={() => setFilterChild(c)}
                      style={{
                        padding: '2px 10px',
                        fontSize: 'var(--text-cat)',
                        fontWeight: active ? 600 : 400,
                        borderRadius: '999px',
                        border: active ? '1px solid var(--border-default)' : '1px solid var(--border-subtle)',
                        background: active ? 'var(--bg-tertiary)' : 'transparent',
                        color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all var(--transition)',
                      }}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Sort */}
            <div ref={sortMenuRef} style={{ position: 'relative', alignSelf: 'flex-start' }}>
              <button
                onClick={() => setShowSortMenu(p => !p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'border-color var(--transition)',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              >
                <span style={{ fontSize: 'var(--text-cat)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sort</span>
                <span style={{ fontSize: 'var(--text-cat)', color: 'var(--text-secondary)', fontWeight: 500 }}>{currentSortLabel}</span>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ transition: `transform var(--transition)`, transform: showSortMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M1 2.5L4 5.5L7 2.5" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {showSortMenu && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 'calc(100% + 4px)',
                    zIndex: 'var(--z-popover)' as string,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    padding: '2px 0',
                    width: '144px',
                  }}
                >
                  {SORT_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setShowSortMenu(false) }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        fontSize: 'var(--text-weight)',
                        fontWeight: sortBy === key ? 600 : 400,
                        color: sortBy === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                        background: sortBy === key ? 'var(--bg-tertiary)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background var(--transition)',
                        display: 'block',
                      }}
                      onMouseEnter={e => { if (sortBy !== key) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                      onMouseLeave={e => { if (sortBy !== key) e.currentTarget.style.background = 'transparent' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Onboarding */}
          {showOnboarding && (
            <Onboarding
              registeredCategories={registeredBig3}
              onAdd={(query) => {
                setSearchInitialQuery(query); setGearInitialName(''); setAddMode('search')
              }}
              onSkip={skipOnboarding}
            />
          )}

          {addMode === 'search' && (
            <div style={{ marginBottom: '16px' }}>
              <GearSearchFromDB
                key={searchInitialQuery}
                initialQuery={searchInitialQuery}
                onSuccess={() => {
                  if (searchInitialQuery) setAddMode(null)
                  setSearchInitialQuery('')
                  fetchGears()
                }}
                onManual={(name) => { setGearInitialName(name); setAddMode('manual') }}
              />
            </div>
          )}
          {addMode === 'manual' && (
            <div style={{ marginBottom: '16px' }}>
              <GearForm onSuccess={() => { setAddMode(null); fetchGears() }} initialName={gearInitialName} />
            </div>
          )}

          <PackSummary
            items={packItems}
            savedPacks={savedPacks}
            onRemove={togglePackItem}
            onClearAll={() => setPackItems([])}
            onSave={handleSavePack}
            onLoad={handleLoadPack}
            onDeleteSaved={handleDeleteSavedPack}
            onToggleVisibility={handleTogglePackVisibility}
          />

          {loading ? (
            <p style={{ fontSize: 'var(--text-sub)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '48px 0' }}>Loading…</p>
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

      {/* ── FAB (Gear tab) ── */}
      {activeTab === 'gear' && (
        <button
          onClick={() => { setAddMode((p) => (p ? null : 'search')); setGearInitialName(''); setSearchInitialQuery('') }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 'var(--z-popover)' as string,
            width: '52px',
            height: '52px',
            background: 'var(--color-accent)',
            color: 'var(--bg-primary)',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'transform var(--transition)',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {addMode ? <X size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
        </button>
      )}

      {/* ── Trips tab ── */}
      {activeTab === 'trips' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={() => setShowTripForm((p) => !p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 16px',
                background: 'var(--color-accent)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: 'var(--radius-card)',
                fontSize: 'var(--text-weight)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'opacity var(--transition)',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {showTripForm ? 'Cancel' : <><Plus size={13} strokeWidth={2.5} />New Trip</>}
            </button>
          </div>
          {showTripForm && (
            <div style={{ marginBottom: '16px' }}>
              <TripForm packItems={packItems.map((e) => e.gear)} onSuccess={() => { setShowTripForm(false); fetchTrips() }} />
            </div>
          )}
          <TripList trips={trips} onRefresh={fetchTrips} onNewTrip={() => setShowTripForm(true)} />
        </div>
      )}

      {/* ── Explore tab ── */}
      {activeTab === 'explore' && (
        <ExploreTab currentUserId={user.id} />
      )}
    </div>
  )
}
