# 🏮 2026 清邁–南奔蘭納天燈節

5 人 · 11/23–11/29 · 全程五辛素 · 曼谷 → 清邁

互動式旅遊網站。本機開啟：

```bash
python3 serve.py
```

然後打開 http://localhost:8765

## 分頁
概覽 · 行程 · 訂位 · 預算 · 地圖 · 逛街 · 清單（繁中／English／ไทย 可切換）

## 部署成網站（擇一）
- **GitHub Pages**：建一個 public repo，上傳整個資料夾，Settings → Pages → Deploy from branch (main) → `https://<帳號>.github.io/<repo>/`
- **Netlify Drop**：把資料夾拖到 https://app.netlify.com/drop 即得連結
- **Cloudflare Pages**：pages.cloudflare.com → Direct Upload

## 檔案
- `index.html` · `style.css` · `app.js` · `data/trip.json`（資料來源）
- `serve.py`（本機伺服器）
