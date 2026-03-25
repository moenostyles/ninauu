// ── Category hierarchy (based on Moonlight Gear) ──────────────────────────
export const CATEGORY_TREE: Record<string, string[]> = {
  'Tent & Tarp':         ['Tent', 'Tarp'],
  'Backpack':            ['Backpack', 'Sacoche & Waist Pouch', 'Pack Accessories'],
  'Sleep':               ['Sleeping Bag', 'Sleeping Mat', 'Pillow', 'Bivy', 'Hammock', 'Ground Sheet'],
  'Tops':                ['T-shirt & Shirt', 'Shell Jacket', 'Insulation Jacket'],
  'Bottoms':             ['Pants & Shorts', 'Shell Pants', 'Insulation Pants'],
  'Apparel Accessories': ['Footwear', 'Headgear', 'Gloves', 'Socks', 'Eyewear'],
  'Cookware':            ['Cooker', 'Cutlery', 'Stove & Fuel', 'Table', 'Bottle & Filter', 'Fire Pit'],
  'Field Gear':          ['Stuff Sack', 'Headlamp', 'GPS & Communication', 'Power Bank', 'Knife & Tool', 'Umbrella', 'Emergency'],
  'Others':              ['Others'],
}

export const PARENT_CATEGORIES = Object.keys(CATEGORY_TREE) as string[]

// Flat list of all leaf categories
export const CATEGORIES = Object.values(CATEGORY_TREE).flat() as string[]

// Derive parent from child category（大文字小文字を区別しない）
export function parentOf(category: string): string {
  const normalized = category.toLowerCase()
  for (const [parent, children] of Object.entries(CATEGORY_TREE)) {
    if (children.some(c => c.toLowerCase() === normalized)) return parent
  }
  return 'Others'
}

export interface Gear {
  id: string
  name: string
  brand: string
  weight_g: number
  category: string
  created_at: string
}

export interface PackEntry {
  gear: Gear
  quantity: number
}

export interface SavedPack {
  id: string
  name: string
  created_at: string
  user_id?: string
  visibility?: Visibility
}

export interface SavedPackItem {
  id: string
  pack_id: string
  gear_id: string | null
  gear_name: string
  brand: string
  weight_g: number
  category: string
  quantity: number
}

export interface WishItem {
  id: string
  name: string
  brand: string
  weight_g: number
  category: string
  memo: string
  catalog_id: string | null
  created_at: string
}

export interface Trip {
  id: string
  destination: string
  start_date: string
  end_date: string
  total_weight_g: number
  memo: string
  rating: number
  created_at: string
  user_id?: string
  visibility?: Visibility
}

export interface TripItem {
  id: string
  trip_id: string
  gear_name: string
  brand: string
  weight_g: number
  category: string
}

export type Visibility = 'public' | 'followers' | 'private'

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}
