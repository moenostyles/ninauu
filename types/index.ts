// ── Category hierarchy ──────────────────────────────────────────────────────
// 注意: 旧サブカテゴリ名も後方互換のため残す（既存ユーザーのDB値が参照するため）
export const CATEGORY_TREE: Record<string, string[]> = {
  'Tent & Tarp': [
    'Tent', 'Tarp',
    'Groundsheet', 'Ground Sheet',   // seed=Groundsheet、旧=Ground Sheet
    'Stakes', 'Tent Accessories',
  ],
  'Backpack': [
    'Backpack',
    'Sacoche', 'Sacoche & Waist Pouch',  // seed=Sacoche、旧=Sacoche & Waist Pouch
    'Pack Accessories',
  ],
  'Sleep': [
    'Sleeping Bag', 'Sleeping Bag Liner',  // Liner を追加
    'Sleeping Mat',
    'Pillow', 'Quilt',                     // Quilt を追加
    'Bivy',
    'Hammock',                             // ハンモック泊はSleepに分類
  ],
  'Tops': [
    'T-shirt & Shirt', 'Shell Jacket', 'Insulation Jacket',  // 旧名
    'Base Layer', 'Down Jacket', 'Fleece',                   // seed名
    'Insulated Jacket', 'Rain Jacket', 'Wind Shell',          // seed名
  ],
  'Bottoms': [
    'Pants & Shorts', 'Shell Pants', 'Insulation Pants',         // 旧名
    'Hiking Pants', 'Down Pants', 'Insulated Pants',              // seed名
    'Rain Pants', 'Wind Pants', 'Shorts',                         // seed名
  ],
  'Apparel Accessories': [
    'Footwear', 'Headgear', 'Gloves', 'Socks', 'Eyewear', 'Gaiters',
  ],
  'Cookware': [
    'Cooker', 'Stove & Fuel', 'Fire Pit',             // 旧名
    'Stove', 'Stove System', 'Pot', 'Cup',            // seed名
    'Cutlery', 'Bottle & Filter',
  ],
  'Field Gear': [
    'Headlamp', 'Power Bank',
    'GPS & Communication', 'GPS', 'Electronics',      // GPS系
    'Trekking Poles', 'Lantern', 'Solar',              // seed名
    'Knife & Tool', 'Emergency', 'Watch',
  ],
  'Others': [
    'Others',
    'Stuff Sack', 'Umbrella', 'Table',
    'Bear Protection', 'Chair', 'Cot',
    'First Aid', 'Tool', 'Towel',
  ],
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
