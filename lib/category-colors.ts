// ── カテゴリ別カラーパレット（全コンポーネント共通） ────────────────
// ドーナツチャート / スタックバー / 左ボーダーアクセント で同じ色を使う

export const BIG3_COLORS = {
  shelter: '#3B82F6',  // blue-500   — Tent & Tarp
  pack:    '#22C55E',  // green-500  — Backpack
  sleep:   '#A855F7',  // purple-500 — Sleep
  others:  '#6B7280',  // gray-500   — それ以外
} as const

/** 親カテゴリ名 → hex カラー */
export const PARENT_COLOR: Record<string, string> = {
  'Tent & Tarp':         BIG3_COLORS.shelter,
  'Backpack':            BIG3_COLORS.pack,
  'Sleep':               BIG3_COLORS.sleep,
  'Tops':                '#F97316',  // orange-500
  'Bottoms':             '#F59E0B',  // amber-500
  'Apparel Accessories': '#EAB308',  // yellow-500
  'Cookware':            '#EF4444',  // red-500
  'Field Gear':          '#06B6D4',  // cyan-500
  'Others':              BIG3_COLORS.others,
}
