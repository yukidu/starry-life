# 繁星生命靈數｜正式版本紀錄

## v1.4 午夜星艦 × 香檳金（目前正式）

- 日期（台灣）：2026-10-23；部署時間（UTC）：2026-10-23T04:18:09.293585Z
- 網域：https://life.starry.phd/
- Cloudflare Worker：`life-starry`
- Worker Production Version：`29762d4f-a217-449d-964c-016bdf5a6109`，100% 正式流量
- Cloudflare Deployment ID：`08bcc6b1-ccf1-44b6-a8c6-cc55d4794e6b`
- 還原代碼：`LIFE-20261023-29762D4F`
- Worker SHA-256：`04ff81217b660e19954045ee00913dc3ba6210cae7fd45950bb0828c64b81357`
- 改版：全站「星際午夜藍＋香檳金」；側欄、手機底部導覽、首頁、輸入框、報告、九宮星環、色彩圖例、雙人比較、知識庫，全部統一使用深色版的設計色票。1～9 的專屬九色限定用於數字同心圓。
- 未變動：2012 新浪計算器五類算法、九宮排列、N 次 N 圈、同心圓中心數字、圖例與雙人比較邏輯；聲音仍預設關閉。
- 已驗證：9/9 計算測試、147 組生日公式驗證、四種尺寸 Chromium 操作測試，另有四種尺寸 × 跨畫面深色一致性測試；正式網域首頁及 CSS、JS、SW、manifest 均透過 Cloudflare Browser Rendering HTTP 200 驗證；100% Production 流量。

## 版本還原

| 版本 | 還原代碼 | Worker Version |
|---|---|---|
| v1.4 現行 | `LIFE-20261023-29762D4F` | `29762d4f-a217-449d-964c-016bdf5a6109` |
| v1.3 上一版 | `LIFE-20261023-4462E3E8` | `4462e3e8-b3ef-4947-bc7d-9982cf92dc4e` |
| v1.2 | `LIFE-20261023-D2DC8A43` | `d2dc8a43-83de-498c-9003-88f8915ba64c` |
| v1.1 | `LIFE-20261023-3F79F003` | `3f79f003-bac9-4940-8db0-6e1ccd5b62f6` |
| v1.0 | `LIFE-20261023-307285EE` | `307285ee-c8a3-42cf-ace4-ccbc3980370d` |

Cloudflare 將指定 Worker Version 的流量切回 100% 即可復原該版本（僅限 Cloudflare 仍保有該版本時）。

## 後續尚待

GitHub 獨立 `yukidu/starry-life` repo 與 Actions 自動部署仍未完成；Cloudflare API 部署成功，非 GitHub CI/CD 部署。已保存獨立原始碼、全部測試與 CI Workflow，避免動到其他 Starry App。

---

## v1.3 ASTRA STATION（可還原前版）

- 日期（台灣）：2026-10-23；部署時間（UTC）：2026-10-22T22:02:19.902987Z
- 網域：https://life.starry.phd/
- Cloudflare Worker：`life-starry`
- Worker Production Version：`4462e3e8-b3ef-4947-bc7d-9982cf92dc4e`，100% 正式流量
- Cloudflare Deployment ID：`65506749-690f-46f0-bf68-47a958df02eb`
- 還原代碼：`LIFE-20261023-4462E3E8`
- Worker SHA-256：`1a4262a9802db44fe02cf97b242407f7cef3438f21dd259d0a2e5e8a46716a76`
- 本版變更：全新三畫面指揮艙介面、手機底部導航、桌面側邊操作、報告四分頁、全新鈦白×深空視覺；保留既有五類數字算法、N圈同心圓與九色圖例；音效預設關閉、可自行開啟。
- 驗證：9 項單元測試、147 組生日比對、4 尺寸 Chromium 測試通過；Cloudflare 正式網域 Browser Rendering 主頁 200 並顯示新版標題及新版主畫面；Production Worker 100%。

