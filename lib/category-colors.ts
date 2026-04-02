// ── カテゴリカラーパレット (dark mode — 彩度控えめ) ──────────────────
// ui-ux-pro-max spec準拠: CSS変数から取得

export const BIG3_COLORS = {
  shelter: '#5B9BD5',  // --cat-shelter
  pack:    '#6BC77A',  // --cat-pack
  sleep:   '#9B7FCF',  // --cat-sleep
  others:  '#6B6B6E',  // --cat-others
} as const

export const PARENT_COLOR: Record<string, string> = {
  'Tent & Tarp':         '#5B9BD5',  // --cat-shelter
  'Backpack':            '#6BC77A',  // --cat-pack
  'Sleep':               '#9B7FCF',  // --cat-sleep
  'Tops':                '#D4915E',  // --cat-cookware (warm)
  'Bottoms':             '#C49A4E',  // --cat-apparel
  'Apparel Accessories': '#C49A4E',  // --cat-apparel
  'Cookware':            '#D4915E',  // --cat-cookware
  'Field Gear':          '#5BBFCF',  // --cat-field
  'Others':              '#6B6B6E',  // --cat-others
}
