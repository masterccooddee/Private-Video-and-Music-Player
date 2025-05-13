# Private-Video-and-Music-Player


# 影音資料庫前端（React + Vite）

本專案為一個影音撥放器，並使用 React 搭配 Vite 建立的影音資料庫前端介面

---

## 🚀 快速啟動

### 1️⃣ 安裝相關套件
```bash
npm install
```

### 2️⃣ 啟動開發伺服器
```bash
npm run dev
```

### 3️⃣ 打開瀏覽器
開啟瀏覽器並前往：
```
http://localhost:3000
```

## 路徑結構
```
📂Upper folder   
 ├── 📂Video  
 │   ├── 📂video1        
 │   │   ├── video1.mp4  
 │   │   └── video1.jpg  
 │   ├── 📂video2  
 │   │   ├── 📂S1  
 │   │   │   ├── video2_E1.mp4  
 │   │   │   └── video2_E2.mp4  
 │   │   ├── 📂S2  
 │   │   |   ├── video2_E1.mp4  
 │   │   |   └── video2_E2.mp4  
 │   │   └── video2.jpg  
 │   ├── 📂video3  
 │   │   ├── video3_E1.mp4  
 │   │   └── video3_E2.mp4  
 │   └── video3.mp4  
 ├── 📂Music  
 │   ├── 📂專輯名稱  
 │   │   ├── 歌曲名稱1.mp3  
 │   │   └── 歌曲名稱2.mp3  
 │   ├── music1.mp3  
 │   └── music2.mp3  
 └── 📂MultiMediaPlayer  (This Project)
 ```

 # Server
 ## 設定
- **```.env```**  
  內容如下  
  ```
  TMDB_KEY = "YOUR_TMDB_API_KEY"

  ```
  *```TMDB_KEY```*  
  如果想使用自動抓取電影、影集的海報，請填入你的**TMDB API KEY**，如果沒有填寫就不會自動抓取，[TMDB官網](https://www.themoviedb.org/)申請API KEY，在[TMDB API網站](https://developer.themoviedb.org/reference/intro/authentication)能查到自己的API KEY  
  ![key](md_img/tmdb_key.png) 
  
> [!IMPORTANT]
> 在**Server資料夾**有```.env.example```，請在使用時把`.example`去除變成```.env```
    
## API請求
### ```/get_all```  
獲取Database中所有資料，總共有4項 
- `videos`
  - id: 影片類別中的唯一ID
  - name: 影片名稱，也就是影片資料夾名稱
  - type: video或series，`video`代表資料夾只有單個影片、`series`代表是影集，有多影片
  - total_episodes: 總共集數，如果是單影片```value = null```，影集```value = {"S1":20,"S2":25}```，如果是沒季數直接把集數放入```value = {"NONE":25}```
  - poster: 影片海報，如果資料夾有poster圖檔會優先使用，沒有會根據有沒有**TMDB API KEY**來決定要不要線上獲取  
  ***Example:***  
  ```json
  "videos": [
        {
            "id": 1,
            "name": "Kimi wo Aishita Hitori no Boku e／Boku ga Aishita Subete no Kimi e",
            "type": "series",
            "total_episodes": "{\"NONE\":2}",
            "poster": "/Kimi wo Aishita Hitori no Boku e／Boku ga Aishita Subete no Kimi e/poster.jpg"
        },
        {
            "id": 2,
            "name": "shelter",
            "type": "video",
            "total_episodes": null,
            "poster": "/shelter/q6ldb9vaZdfEPAx0kWynv8ZGcb6.webp"
        },
        {
            "id": 3,
            "name": "Steins;Gate",
            "type": "series",
            "total_episodes": "{\"S2\":2,\"[Seed-Raws] Steins;Gate - BD-BOX (BD 1280x720 AVC AAC)\":27}",
            "poster": "https://image.tmdb.org/t/p/original/5DZix6ggRiFEbsGqUeTAI1z2wtX.jpg"
        },
        {
            "id": 4,
            "name": "為美好的世界獻上祝福！紅傳說 ",
            "type": "video",
            "total_episodes": null,
            "poster": "https://image.tmdb.org/t/p/original/dCPjrCFBPuKgWt78c9DfxXCS4zm.jpg"
        }
    ]
    ```
- `music`
  - id: 音樂類別中的唯一ID
  - name: 音樂名稱
  - cover: 音樂封面
  - type: 單曲: `value = music` 專輯(有資料夾): `value = series`  
  ***Example:***  
  ```json
  "music": [
        {
            "id": 1,
            "name": "ALBUM",
            "cover": null,
            "type": "series"
        },
        {
            "id": 2,
            "name": "001. 一番の宝物 ～Yui final ver.～",
            "cover": "/001. 一番の宝物 ～Yui final ver.～.jpg",
            "type": "music"
        },
        {
            "id": 3,
            "name": "002. late in autumn",
            "cover": "/002. late in autumn.jpg",
            "type": "music"
        },
        {
            "id": 4,
            "name": "003. 天使にふれたよ!",
            "cover": "/003. 天使にふれたよ!.jpg",
            "type": "music"
        },
        {
            "id": 5,
            "name": "搖曳露營 ED",
            "cover": null,
            "type": "music"
        }
    ]
    ```
- `video_series`
- `music_series`