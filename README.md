# 繁星生命靈數｜Starry Life v1.4

正式網址：https://life.starry.phd/

## 統一深色「ASTRA STATION／星際午夜指揮艙」

本版沿用 v1.3 經驗證的算法及三畫面／四分頁操作方式，統一全部頁面的色彩：

- 全站統一星際午夜藍背景、深藍色卡片、香檳金強調色；九色僅用於數字環，沒有混雜的淺色卡片。
- 電腦採固定側邊指揮欄；手機採底部導覽，分別切換「單人星圖、雙人共鳴、星圖知識庫」。
- 分析報告切換「九宮星環、星光連線、九色圖例、深度解讀」四分頁，不必長距離尋找功能。
- 九宮格固定 1-4-7／2-5-8／3-6-9，數字居中，N 次 N 層同心圓，1～9 分別採專屬色。
- 可關閉的合成互動音效（預設關閉）；尊重系統減少動態效果設定。
- 不添加會員、資料庫或第三方追蹤；日期在瀏覽器本機運算。
- 改採 CSS 預定義星環色，符合正式站的嚴格安全設定（不使用動態行內樣式）；模組式 JS/CSS 採 no-cache 避免更新時版本錯配。

## 算法與隱私

沿用 v1.1 核對新浪原始計算器的五來源算法。1985-07-03 命數 6（特殊數 33）、生日數 3、星座數 4、天賦數 33、缺數 2；數字 3 六圈，8 條連線。程式碼 `src/numerology.mjs` 沒有更改。數字學僅供娛樂與自我探索，不是科學預測。

## 測試

```bash
npm ci
npm run check
node scripts/make-offline-preview.mjs
python3 tests/browser_smoke.py
python3 tests/theme_smoke.py
node scripts/generate-worker.mjs
```

測試含 9 項單元測試，並以獨立原站算法參照驗證 147 組生日。瀏覽器測試涵蓋 375px、390px、768px、1280px 螢幕、三畫面與四報告分頁、九宮圈數、九色、音效開關、雙人比較及匯出。

## 正式版與版本還原

詳見 `RELEASE.md`。Cloudflare Worker 為 `life-starry`；PWA 支援手機瀏覽器。Cloudflare v1.4 是先前 API 直接正式發布的版本，**不是 GitHub Actions 自動部署**；目前已把相同原始碼納入 GitHub 管理。

## GitHub CI／正式部署交接

已新增可重現正式 Worker 的 GitHub Actions 設定，詳見 [`GITHUB_SETUP.md`](GITHUB_SETUP.md)。GitHub 獨立專案 `yukidu/starry-life` 的 `main` 已上傳 v1.4 原始碼；正式網站維持 v1.4，安全啟用開關預設關閉。雲端 CI 與 Cloudflare 自動發布仍待驗證／設定。
