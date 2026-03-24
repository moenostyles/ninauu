/**
 * LighterPack auto-importer
 * Reddit r/ultralight から公開リストを自動収集して gear_catalog に取り込む
 *
 * 使い方:
 *   node scripts/import-lighterpack.mjs
 */

import { writeFileSync } from 'fs'

// ─── Reddit から LighterPack リストIDを収集 ───────────────────────────
async function collectListIds() {
  console.log('Reddit r/ultralight から LighterPack リストを検索中...')

  const headers = { 'User-Agent': 'ninauu-gear-importer/1.0', 'Accept': 'application/json' }
  const ids = new Set()

  const queries = ['lighterpack.com/r/', 'lighterpack gear list', 'lighterpack pack list']

  for (const q of queries) {
    const url = `https://www.reddit.com/r/ultralight/search.json?q=${encodeURIComponent(q)}&sort=top&limit=100&restrict_sr=1`
    try {
      const res = await fetch(url, { headers })
      const json = await res.json()
      for (const post of json?.data?.children || []) {
        const text = [post.data.url, post.data.selftext, post.data.title].join(' ')
        for (const m of text.matchAll(/lighterpack\.com\/r\/([a-zA-Z0-9]{4,10})/g)) ids.add(m[1])
      }
      console.log(`  "${q}" → ${ids.size} IDs`)
      await sleep(1000)
    } catch (e) {
      console.warn(`  ⚠ ${e.message}`)
    }
  }

  return [...ids]
}

// ─── HTMLをデコード ───────────────────────────────────────────────────
function decodeHtml(str) {
  return (str || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x2F;/g, '/').replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/g, '').trim()
}

// ─── 重さをgに変換 ────────────────────────────────────────────────────
function toGrams(weight, unit) {
  const w = parseFloat(weight) || 0
  switch ((unit || 'g').toLowerCase()) {
    case 'oz': return Math.round(w * 28.3495)
    case 'lb': return Math.round(w * 453.592)
    case 'kg': return Math.round(w * 1000)
    default:   return Math.round(w)
  }
}

// ─── LighterPack カテゴリ → Ninauu カテゴリ ──────────────────────────
const CATEGORY_MAP = {
  shelter: 'Tent', tent: 'Tent',
  sleep: 'Sleeping bag', quilt: 'Sleeping bag', 'sleeping bag': 'Sleeping bag',
  pad: 'Sleeping mat', 'sleep pad': 'Sleeping mat', mat: 'Sleeping mat',
  pack: 'Backpack', backpack: 'Backpack',
  cloth: 'Apparel', apparel: 'Apparel', wear: 'Apparel',
  footwear: 'Footwear', shoe: 'Footwear', boot: 'Footwear',
  cook: 'Cook', kitchen: 'Cook', stove: 'Cook', food: 'Cook',
  water: 'Water', hydration: 'Water', filter: 'Water',
  electronic: 'Electronics', navigation: 'Electronics', tech: 'Electronics',
  chair: 'Chair', seat: 'Chair',
  pillow: 'Pillow',
}

function mapCategory(name) {
  const key = (name || '').toLowerCase()
  for (const [pattern, mapped] of Object.entries(CATEGORY_MAP)) {
    if (key.includes(pattern)) return mapped
  }
  return 'Others'
}

// ─── 1ページからアイテムを抽出 ───────────────────────────────────────
function parseHtml(html) {
  const items = []

  // カテゴリ名とその位置を収集
  const categoryPositions = []
  for (const m of html.matchAll(/class="lpCategoryName">([\s\S]*?)<\/h2>/g)) {
    categoryPositions.push({ pos: m.index, name: decodeHtml(m[1]) })
  }

  // li.lpItem の開始位置を全て取得し、直前のカテゴリを紐付け
  // ネストした </ul> で止まらないよう li の開始〜次の lpItem 開始まで切り出す
  const itemStarts = []
  for (const m of html.matchAll(/<li class="lpItem[^"]*"/g)) {
    itemStarts.push(m.index)
  }

  for (let i = 0; i < itemStarts.length; i++) {
    const start = itemStarts[i]
    const end   = itemStarts[i + 1] ?? html.length
    const chunk = html.slice(start, end)

    const nameMatch   = chunk.match(/class="lpName">\s*([\s\S]*?)\s*<\/span>/)
    const descMatch   = chunk.match(/class="lpDescription">\s*([\s\S]*?)\s*<\/span>/)
    const weightMatch = chunk.match(/class="lpWeight">([\d.]+)</)
    const unitMatch   = chunk.match(/class="lpWeightUnit">(\w+)</)

    const name   = decodeHtml(nameMatch?.[1])
    const brand  = decodeHtml(descMatch?.[1]?.split('\n')[0])
    const weight = weightMatch?.[1] || '0'
    const unit   = unitMatch?.[1] || 'g'
    const weight_g = toGrams(weight, unit)

    if (!name || name.length < 2 || weight_g < 1 || weight_g > 25000) continue

    // 直前のカテゴリを探す
    const cat = categoryPositions.filter(c => c.pos < start).at(-1)
    const category = mapCategory(cat?.name || '')

    items.push({ name, brand, weight_g, category })
  }

  return items
}

// ─── 1リストをフェッチ ────────────────────────────────────────────────
async function fetchList(listId) {
  const res = await fetch(`https://lighterpack.com/r/${listId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
  })
  const html = await res.text()
  if (html.includes('Invalid list')) return []
  return parseHtml(html)
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function esc(str)  { return (str || '').replace(/'/g, "''") }

// ─── メイン ───────────────────────────────────────────────────────────
const listIds = await collectListIds()
console.log(`\n${listIds.length} 件のリストを取得開始\n`)

if (listIds.length === 0) {
  console.error('リストが見つかりませんでした。')
  process.exit(1)
}

const allItems = []
let fetched = 0

for (const id of listIds) {
  process.stdout.write(`[${++fetched}/${listIds.length}] ${id} ... `)
  try {
    const items = await fetchList(id)
    process.stdout.write(`${items.length} items\n`)
    allItems.push(...items)
  } catch (e) {
    process.stdout.write(`error\n`)
  }
  await sleep(400)
}

// 重複排除
const seen = new Set()
const unique = allItems.filter(({ name, brand }) => {
  const key = `${name.toLowerCase()}|${brand.toLowerCase()}`
  if (seen.has(key)) return false
  seen.add(key)
  return true
})

console.log(`\n重複排除後: ${unique.length} 件`)

if (unique.length === 0) {
  console.log('インポートできるアイテムがありませんでした。')
  process.exit(0)
}

const rows = unique.map(i =>
  `  ('${esc(i.name)}', '${esc(i.brand)}', ${i.weight_g}, '${i.category}', false)`
)

const sql = `-- LighterPack auto-import: ${unique.length} items
-- Source: Reddit r/ultralight (${listIds.length} lists)
-- is_verified = false

insert into gear_catalog (name, brand, weight_g, category, is_verified)
values
${rows.join(',\n')}
on conflict do nothing;
`

writeFileSync('supabase/seed_lighterpack.sql', sql)
console.log('✓ supabase/seed_lighterpack.sql に保存しました')
console.log('Supabase SQL Editor に貼り付けて実行してください。')
