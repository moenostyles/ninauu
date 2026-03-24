"""
seed_lighterpack.sql のHTMLタグをname欄から除去してクリーンなSQLを生成する。
出力: seed_lighterpack_cleaned.sql
"""

import re

INPUT = "seed_lighterpack.sql"
OUTPUT = "seed_lighterpack_cleaned.sql"

with open(INPUT, "r", encoding="utf-8") as f:
    content = f.read()

def clean_html_name(match):
    """<a href="...">テキスト</a> → テキストのみ抽出してSQLシングルクォートでエスケープ"""
    inner = match.group(1)
    # タグ除去 → 空白正規化
    text = re.sub(r"<[^>]+>", "", inner)
    text = " ".join(text.split())
    # SQLシングルクォートエスケープ
    text = text.replace("'", "''")
    return f"('{text}'"

# <a href="...">...</a> にマッチ（複数行）
pattern = re.compile(
    r"\('<a\s+href=[^>]+class=\"lpHref\">(.*?)</a>'",
    re.DOTALL
)

cleaned, count = pattern.subn(clean_html_name, content)

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write(cleaned)

print(f"修正完了: {count} 件のHTMLタグを除去 → {OUTPUT}")
