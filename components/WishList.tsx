'use client'

import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { WishItem } from '@/types'
import EditWishItemModal from '@/components/EditWishItemModal'

interface Props {
  items: WishItem[]
  onRefresh: () => void
}


export default function WishList({ items, onRefresh }: Props) {
  const [editingItem, setEditingItem] = useState<WishItem | null>(null)

  const handlePromote = async (item: WishItem) => {
    // Add to gears
    const { error: gearError } = await supabase.from('gears').insert({
      name: item.name,
      brand: item.brand,
      weight_g: item.weight_g,
      category: item.category,
    })
    if (gearError) return

    // Remove from wishlist
    await supabase.from('wishlist').delete().eq('id', item.id)
    onRefresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove from Wish List?')) return
    await supabase.from('wishlist').delete().eq('id', id)
    onRefresh()
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-3 text-sm">Your wish list is empty.</p>
        <p className="text-ink-3 text-xs mt-1">Search the catalog or add an item manually.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white border border-line rounded-xl px-4 py-3 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-ink truncate">{item.name}</span>
                {item.brand && (
                  <span className="text-xs text-ink-3">{item.brand}</span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-fill-2 text-ink-3">
                  {item.category}
                </span>
              </div>
              <div className="flex gap-3 mt-0.5 text-xs text-ink-3">
                {item.weight_g > 0 && (
                  <span className="font-medium text-ink-2 nums">{item.weight_g}g</span>
                )}
              </div>
              {item.memo && (
                <p className="mt-1 text-xs text-ink-3 italic">{item.memo}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handlePromote(item)}
                className="px-3 py-1.5 bg-ink text-white text-xs rounded-lg font-medium hover:bg-ink-2 transition-colors whitespace-nowrap"
                title="Move to Gear List"
              >
                I got it
              </button>
              <button
                onClick={() => setEditingItem(item)}
                className="text-line hover:text-ink transition-colors p-0.5"
                title="Edit"
              >
                <Pencil size={14} strokeWidth={2} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-line hover:text-red-400 transition-colors p-0.5"
                title="Remove"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {editingItem && (
        <EditWishItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={() => { onRefresh(); setEditingItem(null) }}
        />
      )}
    </div>
  )
}
