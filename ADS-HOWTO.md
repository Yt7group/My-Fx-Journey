# How to post ads

Edit `ads.json` on GitHub (pencil icon -> Commit). The app reads it every time it opens. With `"ads": []` the app shows "No ads".

```json
{
  "ads": [
    {
      "title": "Free webinar",
      "text": "Saturday 8 PM - price action basics",
      "icon": "🎓",
      "image": "ads/webinar.jpg",
      "link": "https://t.me/yourchannel",
      "linkText": "Join now",
      "date": "2026-11-14",
      "until": "2026-11-30",
      "featured": true
    }
  ]
}
```

- `featured: true` -> this ad is shown on the Home strip. If none is featured, the newest one is shown.
- `icon`: an emoji, or a picture path such as `ads/icon.png` (upload the file to GitHub).
- `image`, `link`, `linkText`, `date`, `until` are optional. `until` hides the ad automatically after that date.
- Tapping the strip opens the full ads list.
- GitHub Pages can take a few minutes to update. If it seems stuck, bump the cache version in sw.js.
