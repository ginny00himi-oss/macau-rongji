# 路環跡事｜手勢掃描檔案

以紅綠 ASCII 字符、五個建築視角與手勢互動呈現路環魚舖空間的網頁作品。

## 線上體驗

GitHub Pages：<https://ginny00himi-oss.github.io/coloane-handscan/>

## 互動方式

- 點擊「啟動手勢掃描」並允許攝像頭權限。
- 張開手掌並上下移動，控制建築掃描進度。
- 左右移動手掌，切換魚舖的不同空間視角。
- 無法使用攝像頭時，可使用滑鼠、觸控、方向鍵或畫面下方按鈕操作。

攝像頭只在瀏覽器內用於讀取手部關鍵點；網站不錄影、不儲存，也不上傳攝像頭畫面。

## 本地運行

攝像頭功能需要 HTTPS 或 localhost。可在項目目錄啟動任意靜態伺服器，例如：

```bash
python -m http.server 8000
```

然後開啟 <http://localhost:8000>。

## 文件結構

```text
.
├── index.html
├── style.css
├── app.js
├── favicon.svg
└── assets/
    ├── view-01-front.png
    ├── view-02-front-right.png
    ├── view-03-roof.png
    ├── view-04-rear.png
    └── view-05-side.png
```

