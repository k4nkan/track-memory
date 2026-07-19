"""
Fetch monthly track ranking from Supabase and return as JSON.
"""

import json
import os
import re
from argparse import ArgumentParser
from datetime import date
from pathlib import Path
from typing import Dict, List

DATA_DIR = Path("design/datas")
DATA_FILE_PATTERN = re.compile(r"^(\d{4})-(\d{2})\.json$")


def get_previous_month(today: date | None = None) -> tuple[int, int]:
    """
    Return the previous month as (year, month).
    """
    current = today or date.today()

    if current.month == 1:
        return current.year - 1, 12

    return current.year, current.month - 1


def get_supabase_client():
    from dotenv import load_dotenv
    from supabase import create_client

    load_dotenv()

    url = os.getenv("SONG_SUPABASE_URL")
    key = os.getenv("SONG_SUPABASE_KEY")

    if not url or not key:
        raise RuntimeError("Missing Supabase env variables")

    return create_client(url, key)


def fetch_monthly_ranking(year: int, month: int, limit: int = 50) -> List[Dict]:
    """
    Return monthly ranking (with rank + size).
    """
    res = get_supabase_client().rpc(
        "get_monthly_track_ranking",
        {
            "target_year": year,
            "target_month": month,
            "result_limit": limit,
        },
    ).execute()

    if not res.data:
        print("⚠️ no data")
        return []

    print(f"✅ fetched ranking: {year}-{month}")

    return [
        {
            "rank": t["rank"],
            "title": t["track_name"],
            "artist": t["artist_name"],
            "plays": t["play_count"],
            "size": t["size"],
            "spotify_url": t["track_url"],
            "image_url": t["image_url"],
        }
        for t in res.data
    ]


def write_monthly_data(year: int, month: int, data: List[Dict]) -> Path:
    if not data:
        raise RuntimeError(f"No data for {year}-{month:02d}")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    output_path = DATA_DIR / f"{year}-{month:02d}.json"

    with output_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return output_path


def write_month_index() -> Path:
    months = []

    for path in DATA_DIR.glob("*.json"):
        match = DATA_FILE_PATTERN.match(path.name)

        if not match:
            continue

        year = int(match.group(1))
        month = int(match.group(2))
        months.append(
            {
                "filename": path.name,
                "label": f"{year}年{month}月",
                "year": year,
                "month": month,
            }
        )

    months.sort(key=lambda item: (item["year"], item["month"]), reverse=True)

    index_path = DATA_DIR / "index.json"
    with index_path.open("w", encoding="utf-8") as f:
        json.dump(months, f, ensure_ascii=False, indent=2)

    return index_path


def parse_args() -> tuple[int, int, int]:
    parser = ArgumentParser(description="Fetch monthly track ranking from Supabase.")
    parser.add_argument("--year", type=int)
    parser.add_argument("--month", type=int, choices=range(1, 13))
    parser.add_argument("--limit", type=int, default=int(os.getenv("SONG_RESULT_LIMIT", "20")))
    args = parser.parse_args()

    if (args.year is None) != (args.month is None):
        parser.error("--year and --month must be specified together")

    if args.year is not None and args.month is not None:
        return args.year, args.month, args.limit

    year, month = get_previous_month()
    return year, month, args.limit


if __name__ == "__main__":
    year, month, limit = parse_args()
    data = fetch_monthly_ranking(year, month, limit)

    data_path = write_monthly_data(year, month, data)
    index_path = write_month_index()
    print(f"wrote {data_path}")
    print(f"wrote {index_path}")
