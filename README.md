# track-memory

Spotify の月間再生データをまとめて、グリッドで表示する小さなアプリです。

## Links
- App: https://track-log.netlify.app/
- Log collector: https://github.com/k4nkan/save-spotify-logs

## Structure
- `design/`: 表示まわりの HTML / CSS / JS
- `script/main.py`: Supabase から月間ランキングを取得して JSON を出力
- `design/datas/`: 月別ランキング JSON と月一覧 `index.json`
- `.github/workflows/update-data.yml`: 月初に前月分の JSON と月一覧を自動更新

## Update
```bash
pip install -r requirements.txt
python script/main.py
```

特定月を補填する場合:
```bash
python script/main.py --year 2026 --month 6
```
