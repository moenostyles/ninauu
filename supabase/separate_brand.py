"""
seed_lighterpack_cleaned.sql のname欄からブランドを分離し、
brand / description / name を正しく振り分けて新しいSQLを生成する。

変換前: insert into gear_catalog (name, brand, weight_g, category, is_verified)
変換後: insert into gear_catalog (name, brand, description, weight_g, category, is_verified)
"""

import re

INPUT  = "seed_lighterpack_cleaned.sql"
OUTPUT = "seed_lighterpack_cleaned.sql"  # 上書き

# ===== ブランドリスト（長い名前を先に配置して優先マッチ） =====
BRANDS = [
    # Multi-word brands first
    "Arc'Teryx", "Arc'teryx", "Arcteryx",
    "Black Diamond",
    "Darn Tough",
    "Enlightened Equipment",
    "Gossamer Gear",
    "Granite Gear",
    "HammockGear",
    "Hammer Nutrition",
    "Hyperlite Mountain Gear",
    "La Sportiva",
    "LightHeart Gear",
    "Mountain Hardwear",
    "Mountain Laurel Designs",
    "Sea to Summit",
    "Therm-a-Rest", "Therm-a-rest",
    "Western Mountaineering",
    "Big Agnes",
    "Dirty Girl",
    "Frogg Toggs",
    "HydraPak", "Hydrapak",
    "HydroBlu", "Hydroblu",
    "Katabatic Gear",
    "LiteAF",
    "Outdoor Research",
    "Pa'Lante", "Pa''Lante",
    "Point6",
    "Paria Outdoor",
    "QuadLock",
    "Ridge Merino",
    "Sea2Summit",
    "SnowPeak", "Snowpeak", "Snow Peak",
    "Tarptent",
    "Tentlab",
    "Ultimate Direction",
    "Yama Mountain",
    "ZPacks", "Zpacks",
    # Single-word brands
    "Acapulka",
    "Aclima",
    "AegisMax", "Aegismax",
    "Altra",
    "Anker",
    "Aonijie",
    "Asics",
    "Bearikade",
    "BoglerCo",
    "Borah",
    "Brooks",
    "Buff",
    "Calazo",
    "Camelback",
    "Casio",
    "CNOC", "Cnoc",
    "Coleman",
    "Columbia",
    "Coros",
    "DAC",
    "Dakine",
    "Decathlon",
    "Devold",
    "Dirigo",
    "Durston",
    "DutchWare",
    "Easton",
    "Evernew",
    "ExOfficio",
    "Exped",
    "Fizan",
    "Flylow",
    "Forclaz",
    "Garmin",
    "Gerber",
    "GoPro",
    "Goodr",
    "GSI",
    "Haglofs",
    "Hestra",
    "Hilleberg",
    "Hillsound",
    "HMG",
    "Hoka",
    "Icebreaker",
    "Injinji",
    "Julbo",
    "Katabatic",
    "Katadyn",
    "Kelty",
    "Klymit", "Klymite", "Kylmit",
    "Kuhl",
    "Kuiu",
    "Leatherman",
    "Leki",
    "Litesmith",
    "Lixada",
    "Lowa",
    "Lululemon",
    "Macpac",
    "Marmot",
    "Melanzana",
    "Merrell",
    "MLD",
    "MontBell", "Montbell", "Monbell",
    "Mora",
    "MSR",
    "Nalgene",
    "Naturehike",
    "NEMO", "Nemo",
    "Nitecore", "NiteCore", "Nightcore",
    "Norrona",
    "Nunatak",
    "Nuun",
    "Ombraz",
    "Opinel",
    "Opsak",
    "OR",
    "Osprey",
    "Patagonia",
    "Petzl",
    "Platypus",
    "PrAna", "Prana",
    "Primus",
    "Rab",
    "Ravpower",
    "REI",
    "Rhone",
    "Ruffwear",
    "Salomon",
    "Samsung",
    "Sawyer",
    "Senchi",
    "Shokz",
    "Silva",
    "Smartwool",
    "Snowline",
    "Sony",
    "Soto",
    "Superfeet",
    "Suunto",
    "Teva",
    "Tilley", "Tilly",
    "Timex",
    "TOAKS", "Toaks",
    "Trangia",
    "UGQ",
    "ULA",
    "Uniqlo",
    "Ursack", "URSAC",
    "Vargo",
    "Victorinox",
    "Vuori",
    "Wigwam",
    "Woolpower",
    "Xero",
    "Zpacks",
]

# 正規表現パターン生成（長い名前優先）
def make_brand_pattern(brands):
    escaped = [re.escape(b) for b in sorted(brands, key=len, reverse=True)]
    return re.compile(r'^(' + '|'.join(escaped) + r')\s+(.+)$', re.IGNORECASE)

BRAND_PAT = make_brand_pattern(BRANDS)

def normalize_brand(brand_str):
    """ブランド名を正規化（表記ゆれ統一）"""
    mapping = {
        "arc'teryx": "Arc'Teryx",
        "arcteryx": "Arc'Teryx",
        "therm-a-rest": "Therm-a-Rest",
        "montbell": "Montbell",
        "montbell": "Montbell",
        "monbell": "Montbell",
        "nitecore": "Nitecore",
        "nightcore": "Nitecore",
        "klymite": "Klymit",
        "kylmit": "Klymit",
        "aegismax": "AegisMax",
        "cnoc": "CNOC",
        "prana": "PrAna",
        "nemo": "NEMO",
        "zpacks": "ZPacks",
        "toaks": "TOAKS",
        "ursac": "Ursack",
        "snowpeak": "SnowPeak",
        "tilley": "Tilley",
    }
    return mapping.get(brand_str.lower(), brand_str)

def parse_value(s):
    """SQLシングルクォート文字列をPythonstr に変換"""
    return s.replace("''", "'")

def to_sql_str(s):
    """Python str をSQLシングルクォート文字列に変換"""
    return s.replace("'", "''")

def process_line(line):
    """1エントリの行を処理"""
    # ('name', 'brand', weight, 'category', false) を解析
    m = re.match(
        r"^(\s*)\('((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*(\d+),\s*'((?:[^']|'')*)',\s*(true|false)\)(,?)$",
        line
    )
    if not m:
        return line

    indent  = m.group(1)
    name    = parse_value(m.group(2))
    old_brand = parse_value(m.group(3))
    weight  = m.group(4)
    cat     = m.group(5)
    verified = m.group(6)
    comma   = m.group(7)

    # ブランドをnameから抽出
    bm = BRAND_PAT.match(name.strip())
    if bm:
        brand    = normalize_brand(bm.group(1))
        new_name = bm.group(2).strip()
    else:
        brand    = ""
        new_name = name.strip()

    description = old_brand.strip()

    return (
        f"{indent}('{to_sql_str(new_name)}', '{to_sql_str(brand)}', "
        f"'{to_sql_str(description)}', {weight}, '{to_sql_str(cat)}', {verified}){comma}"
    )

# ===== メイン処理 =====
with open(INPUT, "r", encoding="utf-8") as f:
    lines = f.readlines()

# INSERTヘッダーを書き換え
out_lines = []
matched = 0
for line in lines:
    if "insert into gear_catalog (name, brand, weight_g" in line:
        line = line.replace(
            "insert into gear_catalog (name, brand, weight_g",
            "insert into gear_catalog (name, brand, description, weight_g"
        )
        out_lines.append(line)
    else:
        processed = process_line(line.rstrip("\n"))
        if processed != line.rstrip("\n"):
            matched += 1
        out_lines.append(processed + "\n")

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.writelines(out_lines)

print(f"完了: {matched} 件のエントリを変換 → {OUTPUT}")

# 結果サンプル表示
print("\n--- サンプル（ブランド抽出済み） ---")
count = 0
for line in out_lines:
    if line.startswith("  ('") and count < 10:
        print(line.rstrip())
        count += 1
