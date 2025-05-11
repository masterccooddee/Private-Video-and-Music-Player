import fs from 'fs/promises';
import path from 'path';
import sqlite from 'better-sqlite3';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

export async function init(){
   const db = initDB();
   await classifyMedia(db);

        
}

function initDB() {
    const db = new sqlite('media.db', { verbose: console.log });

    // 刪除舊的表（如果存在）
    db.exec(`
        DROP TABLE IF EXISTS videos;
        DROP TABLE IF EXISTS video_series;
        DROP TABLE IF EXISTS music;
    `);

    // 創建新的表
    db.exec(`
        CREATE TABLE videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL,
            poster TEXT NOT NULL
        );

        CREATE TABLE video_series (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_video_id INTEGER,
            path TEXT,
            season TEXT,
            episode TEXT,
            FOREIGN KEY (from_video_id) REFERENCES videos(id)
        );

        CREATE TABLE music (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            path TEXT
        );
    `);

    console.log('Database initialized.');
    return db;
}

// 📂MultiMediaPlayer為本專案資料

//基本結構
//📂Upper folder
// ├── 📂Video
// │   ├── 📂video1
// │   │   ├── video1.mp4
// │   │   └── video1.jpg
// │   ├── 📂video2
// │   │   ├── 📂S1
// │   │   │   ├── video2_E1.mp4
// │   │   │   └── video2_E2.mp4
// │   │   ├── 📂S2
// │   │   |   ├── video2_E1.mp4
// │   │   |   └── video2_E2.mp4
// │   │   └── video2.jpg
// │   └── video3.mp4
// ├── 📂Music
// │   ├── 📂專輯名稱
// │   │   ├── 歌曲名稱1.mp3
// │   │   └── 歌曲名稱2.mp3
// │   ├── music1.mp3
// │   └── music2.mp3
// └── 📂MultiMediaPlayer


async function classifyMedia(db){
    const upperfolder = path.join(__dirname, '..', '..');
    const videoFolder = path.join(upperfolder, 'Video');
    const musicFolder = path.join(upperfolder, 'Music');

    try{
        await fs.access(videoFolder);
    }
    catch{
        await fs.mkdir(videoFolder, {recursive: true});
    }
    try{
        await fs.access(musicFolder);
    }
    catch{
        await fs.mkdir(musicFolder, {recursive: true});
    }

    //分類影片
    const folders = await fs.readdir(videoFolder);
    for (const folder of folders) {
        const folderpath = path.join(videoFolder, folder);
        const stats = await fs.stat(folderpath);
        if (stats.isDirectory()) {
            const subfolders = await fs.readdir(folderpath);
            for (const subfolder of subfolders) {
                const subfolderpath = path.join(folderpath, subfolder);
                const substats = await fs.stat(subfolderpath);
                if (substats.isDirectory()) {
                    // 如果是資料夾，則是系列影片
                    const seriesPath = subfolderpath;
                    classifyVideoSeries(db, seriesPath, folder);

                } else {
                    // 如果是檔案，則是單影片
                    const filePath = subfolderpath;
                    classifyVideo(db, filePath, folder);
                }
            }
        }
        else {
            // 如果是檔案，則是單影片
            const filePath = path.join(videoFolder, folder);
            classifyVideo(db, filePath, folder);
        }
    }
}


async function classifyVideo(db, filePath, folder) {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(fileName).toLowerCase();
    const search_name = db.prepare('SELECT name FROM videos WHERE name = ?');
    const insert_video = db.prepare('INSERT INTO videos (name, path, type, poster) VALUES (@name,@path,@type,@poster)');
    const update_poster = db.prepare('UPDATE videos SET poster = @poster WHERE name = @name');
    const update_video = db.prepare('UPDATE videos SET path = @path WHERE name = @name');

    if (fileExt === '.mp4' || fileExt === '.mkv' || fileExt === '.avi') {
        console.log('Found video file:', fileName);

        // 使用檔案路徑作為唯一標識
        
        const video = search_name.get(folder);
        if (video !== undefined) {
            console.log('Video already exists in database:', video.name);
            update_video.run({name: folder, path: filePath});
        } else {
            console.log('Inserting video into database:', fileName);
            insert_video.run({name: folder, path: filePath, type: 'video', poster: '-1'});
        }
    }

    if (fileExt === '.jpg' || fileExt === '.png' || fileExt === '.jpeg' || fileExt === '.webp') {
        console.log('Found poster file:', fileName);

        // 使用檔案路徑作為唯一標識
        const video = search_name.get(folder);
        if (video !== undefined) {
            console.log('Poster already exists in database:', video.name);
            update_poster.run({name: folder, poster: filePath});
        } else {
            console.log('Inserting poster into database:', fileName);
            insert_video.run({name: folder, path: '-1', type: 'video', poster: filePath});
        }
    }
    
}

function classifyVideoSeries(db, seriesPath, folder) {





}