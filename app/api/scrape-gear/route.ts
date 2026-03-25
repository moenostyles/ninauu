import { NextRequest, NextResponse } from 'next/server'

export interface ScrapeResult {
  name?: string
  brand?: string
  weight_g?: number
  category?: string
  error?: string
}

// ─── 重量文字列 → グラム変換 ───────────────────────────────
function toGrams(value: string, unit: string): number | null {
  const n = parseFloat(value.replace(',', '.'))
  if (isNaN(n)) return null
  const u = unit.toLowerCase().trim()
  if (u === 'kg')  return Math.round(n * 1000)
  if (u === 'oz')  return Math.round(n * 28.3495)
  if (u === 'lbs' || u === 'lb') return Math.round(n * 453.592)
  if (u === 'g')   return Math.round(n)
  return null
}

// ─── HTMLから重量を抽出 ────────────────────────────────────
function extractWeight(html: string): number | null {
  // パターン例: "480g" / "1.2 kg" / "16.9oz" / "重量：480g"
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(kg|g|oz|lbs?)\b/gi,
  ]

  // 重量ラベル周辺を優先的に検索
  const weightContexts = [
    /(?:weight|重量|poids|gewicht|peso)[^\d]{0,30}(\d+(?:[.,]\d+)?)\s*(kg|g|oz|lbs?)/gi,
    /(\d+(?:[.,]\d+)?)\s*(kg|g|oz|lbs?)\s*(?:\(|\/|,|<)/gi,
  ]

  for (const pattern of [...weightContexts, ...patterns]) {
    const matches = [...html.matchAll(pattern)]
    for (const m of matches) {
      const [, val, unit] = m
      const g = toGrams(val, unit)
      // 現実的な重量範囲：1g〜30kg
      if (g && g >= 1 && g <= 30000) return g
    }
  }
  return null
}

// ─── HTMLからタイトルを抽出 ───────────────────────────────
function extractTitle(html: string): string | null {
  // <h1> を優先
  const h1 = html.match(/<h1[^>]*>([^<]{3,100})<\/h1>/i)
  if (h1) return h1[1].trim()

  // <title> フォールバック
  const title = html.match(/<title[^>]*>([^<]{3,200})<\/title>/i)
  if (title) {
    // "商品名 | ブランド名" → 商品名だけ取り出す
    return title[1].split(/[|\-–—]/)[0].trim()
  }
  return null
}

// ─── ブランド別パーサー ───────────────────────────────────

function parseMontbell(html: string): ScrapeResult {
  // 商品名: <h1 class="item-name">...</h1> or <div class="item-name">
  const nameMatch =
    html.match(/class="[^"]*item-name[^"]*"[^>]*>([^<]{3,100})</) ||
    html.match(/class="[^"]*product-?name[^"]*"[^>]*>([^<]{3,100})</) ||
    html.match(/<h1[^>]*>([^<]{3,100})<\/h1>/i)

  const name = nameMatch ? nameMatch[1].trim() : extractTitle(html) ?? undefined

  // 重量: 「重量」ラベルの近くを探す
  const weightNear = html.match(/重量[^<]{0,30}?(\d+(?:\.\d+)?)\s*(g|kg)/i)
  let weight_g: number | undefined
  if (weightNear) {
    const g = toGrams(weightNear[1], weightNear[2])
    if (g) weight_g = g
  }
  if (!weight_g) {
    const g = extractWeight(html)
    if (g) weight_g = g
  }

  return { name, brand: 'mont-bell', weight_g }
}

function parseGossammerGear(html: string): ScrapeResult {
  const name = extractTitle(html) ?? undefined
  const weight_g = extractWeight(html) ?? undefined
  return { name, brand: 'Gossamer Gear', weight_g }
}

function parseSeaToSummit(html: string): ScrapeResult {
  const name = extractTitle(html) ?? undefined
  const weight_g = extractWeight(html) ?? undefined
  return { name, brand: 'Sea to Summit', weight_g }
}

function parseGeneric(html: string, hostname: string): ScrapeResult {
  const name = extractTitle(html) ?? undefined
  const weight_g = extractWeight(html) ?? undefined

  // hostnameからブランド名を推定
  const brand = hostname
    .replace(/^www\./, '')
    .replace(/\.(com|jp|us|eu|net|org|co\.uk).*$/, '')
    .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return { name, brand, weight_g }
}

// ─── メインハンドラー ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url?: string }
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid URL required' }, { status: 400 })
    }

    let hostname: string
    try {
      hostname = new URL(url).hostname
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // サーバーサイドfetch（CORSを回避）
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Site returned ${res.status}. Try entering weight manually.` },
        { status: 200 }
      )
    }

    const html = await res.text()

    // ブランド別パーサーを選択
    let result: ScrapeResult
    if (hostname.includes('montbell.jp') || hostname.includes('webshop.montbell')) {
      result = parseMontbell(html)
    } else if (hostname.includes('montbell.')) {
      result = parseMontbell(html)
    } else if (hostname.includes('gossamergear.com')) {
      result = parseGossammerGear(html)
    } else if (hostname.includes('seatosummit.com')) {
      result = parseSeaToSummit(html)
    } else {
      result = parseGeneric(html, hostname)
    }

    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: `Could not fetch page. Enter weight manually. (${msg})` },
      { status: 200 }
    )
  }
}
