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
> 在<span style="background-color: rgba(237, 222, 11, 0.7);">**Server資料夾**</span>有```.env.example```，請在使用時把.example去除變成```.env```
    
  