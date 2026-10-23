# 繁星生命靈數｜GitHub 專案／自動部署交接

正式網站：`https://life.starry.phd/`，正式 Worker：`life-starry`。

## GitHub 專案狀態

- 專案：`https://github.com/yukidu/starry-life`
- 這份原始碼是 **Cloudflare v1.4 正式版的可重現原始碼**；推送到 GitHub 不等於重新部署。
- **首次匯入時刻意不啟用自動正式發布。** 只讓 GitHub Actions 做 CI 驗證。開關預設關閉，避免取代 Cloudflare 目前 100% 服務中的版本。
- GitHub 專案建立時為 **Public**。如需私有專案，請由管理者在 GitHub Settings → General → Danger Zone → Change repository visibility 改為 Private。不要上傳任何憑證、私密會員資料或 Cloudflare API Token。

## 初次正式接管（完成 CI 之後）

1. 查看 GitHub Actions → `Life Starry - Test and Production` 驗證工作是否成功。
2. GitHub Settings → Secrets and variables → Actions → Secrets，安全建立：
   - `CLOUDFLARE_API_TOKEN`：只需 `life-starry` Worker 部署權限的 token；不要寫入程式碼。
   - `CLOUDFLARE_ACCOUNT_ID`：Cloudflare Account ID，透過 Secrets 輸入。
3. 將 repo variable `PRODUCTION_DEPLOY_ENABLED` 設成 `true` 之後，才允許 `main` 的已測試版本自動更新正式網站。
4. 部署前確認 `.deploy/worker.mjs` 內容與正式 v1.4 一致，確保首次接管不是實際改版。後續皆採 PR → 測試 → merge `main` → 正式部署 → 實際網址驗證。
5. 如需暫停自動上線，將 `PRODUCTION_DEPLOY_ENABLED` 設回 `false`。

## 已驗證 v1.4 基準

- Worker Version ID：`29762d4f-a217-449d-964c-016bdf5a6109`。
- 還原代碼：`LIFE-20261023-29762D4F`。
- 本專案可重現的 Worker SHA-256：`04ff81217b660e19954045ee00913dc3ba6210cae7fd45950bb0828c64b81357`。
- 驗證：`npm run check && node scripts/generate-worker.mjs && node scripts/verify-release.mjs`。
- 需要瀏覽器實測時：`node scripts/make-offline-preview.mjs` 後執行 `python tests/browser_smoke.py` 與 `python tests/theme_smoke.py`。

**重要：** Cloudflare Worker 的正式部署和 GitHub CI 是兩件事，兩者都成功並驗證正式網址後，才能說 GitHub 全自動部署已正式啟用。
