"""
Fetch monthly track ranking from Supabase and return as JSON.
"""

import json
import os
from datetime import date
from typing import Dict, List

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SONG_SUPABASE_URL")
key = os.getenv("SONG_SUPABASE_KEY")

if not url or not key:
    raise RuntimeError("Missing Supabase env variables")

supabase = create_client(url, key)


def get_previous_month(today: date | None = None) -> tuple[int, int]:
    """
    Return the previous month as (year, month).
    """
    current = today or date.today()

    if current.month == 1:
        return current.year - 1, 12

    return current.year, current.month - 1


def fetch_monthly_ranking(year: int, month: int, limit: int = 50) -> List[Dict]:
    """
    Return monthly ranking (with rank + size).
    """
    res = supabase.rpc(
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


if __name__ == "__main__":
    year, month = get_previous_month()
    limit = int(os.getenv("SONG_RESULT_LIMIT", "20"))
    data = fetch_monthly_ranking(year, month, limit)

    with open(f"design/datas/{year}-{month:02d}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
