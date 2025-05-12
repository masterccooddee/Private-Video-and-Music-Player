import fs from 'fs/promises';
import path from 'path';
import sqlite from 'better-sqlite3';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function init() {
    const db = initDB();
    // 初始化影片資料庫
    await classifyMedia(db);
    // 如果影片資料庫沒poster，有TMDB API KEY，則下載海報
    const tmdb_key = process.env.TMDB_KEY;
    if (tmdb_key !== undefined) {
        console.log('TMDB_KEY is defined, starting poster finding.');
        await findPosterFromTMDB(db, tmdb_key);
    }
    else {
        console.log('TMDB_KEY is undefined, skipping poster finding.');
    }


}

function initDB() {
    const db = new sqlite('media.db');

    db.pragma('foreign_keys = ON');
    // 刪除舊的表（如果存在）
    db.exec(`
        DROP TABLE IF EXISTS video_series;
        DROP TABLE IF EXISTS videos;
        DROP TABLE IF EXISTS music;
    `);

    // 創建新的表
    db.exec(`
        CREATE TABLE videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL,
            total_episodes TEXT,
            poster TEXT NOT NULL
        );

        CREATE TABLE video_series (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_video_id INTEGER,
            path TEXT,
            season TEXT,
            episode INTEGER,
            FOREIGN KEY (from_video_id) REFERENCES videos(id) ON DELETE CASCADE
        );

        CREATE TABLE music (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            path TEXT,
            cover BLOB
        );
    `);

    console.log('Database initialized.');
    return db;
}

// 📂MultiMediaPlayer為本專案資料

//基本結構
// 📂Upper folder
// ├── 📂Video
// │   ├── 📂video1      ✔️
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
// │   ├── 📂video3
// │   │   ├── video3_E1.mp4
// │   │   └── video3_E2.mp4
// │   └── video3.mp4        ✔️
// ├── 📂Music
// │   ├── 📂專輯名稱
// │   │   ├── 歌曲名稱1.mp3
// │   │   └── 歌曲名稱2.mp3
// │   ├── music1.mp3
// │   └── music2.mp3
// └── 📂MultiMediaPlayer


async function classifyMedia(db) {
    const upperfolder = path.join(__dirname, '..', '..');
    const videoFolder = path.join(upperfolder, 'Video');
    const musicFolder = path.join(upperfolder, 'Music');

    try {
        await fs.access(videoFolder);
    }
    catch {
        await fs.mkdir(videoFolder, { recursive: true });
    }
    try {
        await fs.access(musicFolder);
    }
    catch {
        await fs.mkdir(musicFolder, { recursive: true });
    }

    //分類影片
    const folders = await fs.readdir(videoFolder);
    console.log('Total folders', folders.length);
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
                    let video = db.prepare('SELECT name FROM videos WHERE name = ?').get(folder);

                    if (video !== undefined) {
                        console.log('Video already exists in database:', video.name);
                        db.prepare('UPDATE videos SET path = @path WHERE name = @name').run({ name: folder, path: seriesPath });
                    } else {
                        console.log('Inserting video into database:', folder);
                        db.prepare('INSERT INTO videos (name, path, type, poster) VALUES (@name,@path,@type,@poster)').run({ name: folder, path: seriesPath, type: 'series', poster: '-1' });
                    }
                    let season = subfolder;
                    await classifyVideoSeries(db, seriesPath, folder, season); // 季資料夾處理

                } else {
                    // 如果是檔案，有可能是單影片或series影片的海報
                    const filePath = subfolderpath;
                    const fileExt = path.extname(filePath).toLowerCase();

                    const videoFiles = subfolders.filter(file => {
                        const ext = path.extname(file).toLowerCase();
                        return ext === '.mp4' || ext === '.mkv' || ext === '.avi';
                    });

                    // 只有一個影片檔案 => 單影片
                    // 多個影片檔案 => 系列影片
                    // 沒有影片檔案 => 系列影片的海報

                    // 如果只有一個影片檔案，則是單影片
                    if (videoFiles.length == 1) {
                        await classifyVideo(db, filePath, folder, true);
                    }

                    // 如果有多個影片檔案，則是系列影片
                    else if (videoFiles.length > 1) {

                        //檢查是否已經存在，存在代表已把全部集數放入資料庫
                        const video = db.prepare('SELECT name FROM videos WHERE name = ?').get(folder);
                        if (video === undefined) {
                            const seriesPath = folderpath;
                            db.prepare('INSERT INTO videos (name, path, type, poster) VALUES (@name,@path,@type,@poster)').run({ name: folder, path: seriesPath, type: 'series', poster: '-1' });
                            let season = 'NONE';
                            await classifyVideoSeries(db, seriesPath, folder, season); // 季資料夾處理
                        }
                        else {
                            continue;
                        }

                        if (fileExt === '.jpg' || fileExt === '.png' || fileExt === '.jpeg' || fileExt === '.webp') {
                            PutInSeriesPoster(db, filePath, folder);
                            console.log('Found poster file:', folder);
                        }
                    }
                    // 如果沒有影片檔案，則是系列影片的海報
                    else if (videoFiles.length == 0) {

                        const seriesPath = subfolderpath;
                        const fileExt = path.extname(seriesPath).toLowerCase();
                        if (fileExt === '.jpg' || fileExt === '.png' || fileExt === '.jpeg' || fileExt === '.webp')
                            PutInSeriesPoster(db, seriesPath, folder);

                    }

                }
            }
        }
        else {
            // 如果是檔案，則是單影片
            const filePath = path.join(videoFolder, folder);
            classifyVideo(db, filePath, path.basename(folder, path.extname(folder)), false);
        }
    }
}


async function classifyVideo(db, filePath, folder, have_Folder = false) {

    const fileName = folder;

    const fileExt = path.extname(filePath).toLowerCase();
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
            update_video.run({ name: folder, path: filePath });
        } else {
            console.log('Inserting video into database:', fileName);
            insert_video.run({ name: folder, path: filePath, type: 'video', poster: '-1' });
        }
    }

    if (fileExt === '.jpg' || fileExt === '.png' || fileExt === '.jpeg' || fileExt === '.webp') {
        console.log('Found poster file:', fileName);

        // 使用檔案路徑作為唯一標識
        const video = search_name.get(folder);
        const posterpath = '/' + folder + '/' + path.basename(filePath);
        if (video !== undefined) {
            console.log('Poster already exists in database:', video.name);
            update_poster.run({ name: folder, poster: posterpath });
        } else {
            console.log('Inserting poster into database:', fileName);
            insert_video.run({ name: folder, path: '-1', type: 'video', poster: posterpath });
        }
    }

}

function PutInSeriesPoster(db, filePath, folder) {
    const search_name = db.prepare('SELECT name FROM videos WHERE name = ?');
    const update_poster = db.prepare('UPDATE videos SET poster = @poster WHERE name = @name');
    const insert_poster = db.prepare('INSERT INTO videos (name, path, type, poster) VALUES (@name,@path,@type,@poster)');

    const video = search_name.get(folder);
    const posterpath = '/' + folder + '/' + path.basename(filePath);
    if (video !== undefined) {
        console.log('From putinposter Video already exists in database:', video.name);
        update_poster.run({ name: folder, poster: posterpath });
    } else {
        console.log('Inserting poster into database:', folder);
        insert_poster.run({ name: folder, path: '-1', type: 'series', poster: posterpath });
    }
}

// 季資料夾處理
async function classifyVideoSeries(db, seriesPath, folder, season) {

    const seriesname = folder;
    let seasonFolder = seriesPath;

    const search_video_id = db.prepare('SELECT id FROM videos WHERE name = ?', { cached: true });
    const insert_video_series = db.prepare('INSERT INTO video_series (from_video_id, path, season, episode) VALUES (@from_video_id,@path,@season,@episode)');

    let seasonFiles = await fs.readdir(seriesPath);

    // 排序檔案名稱（字典順序）
    const sortedFiles = seasonFiles
        .filter(file => {
            // 過濾出影片檔案
            const fileExt = path.extname(file).toLowerCase();
            return fileExt === '.mp4' || fileExt === '.mkv' || fileExt === '.avi';
        })
        .sort((a, b) => a.localeCompare(b)); // 按字典順序排序

    let total_episodes = db.prepare('SELECT total_episodes FROM videos WHERE name = ?').get(seriesname);
    console.log('total_episodes:', total_episodes);
    let episodes = {};
    if (total_episodes.total_episodes === null) {
        episodes[`${season}`] = sortedFiles.length;
        db.prepare('UPDATE videos SET total_episodes = @total_episodes WHERE name = @name').run({ name: seriesname, total_episodes: JSON.stringify(episodes) });
    }
    else {
        let total_episodes_json = JSON.parse(total_episodes.total_episodes);

        total_episodes_json[`${season}`] = sortedFiles.length;
        db.prepare('UPDATE videos SET total_episodes = @total_episodes WHERE name = @name').run({ name: seriesname, total_episodes: JSON.stringify(total_episodes_json) });

    }

    const f_v_id = search_video_id.get(seriesname).id;

    const insert_series = db.transaction((files) => {

        files.forEach((file, index) => {
            const filePath = path.join(seasonFolder, file);

            insert_video_series.run({
                from_video_id: f_v_id,
                path: filePath,
                season: season,
                episode: index + 1
            });
        });
    });

    insert_series(sortedFiles);
    console.log('Inserted series videos into database:', seriesname, season);


}

async function findPosterFromTMDB(db, tmdb_key) {

    const allVideos = db.prepare('SELECT * FROM videos').all();
    const allSeries = allVideos.filter(video => video.poster === '-1');
    const videoname = allSeries.map(video => video.name);

    for (const name of videoname) {
        const poster_url = await getPosterFromTMDB(name, tmdb_key);
        if (poster_url !== null) {
            db.prepare('UPDATE videos SET poster = @poster WHERE name = @name').run({ name: name, poster: poster_url });
            console.log('Updated poster URL for video:', name);
        } else {
            console.log('Poster URL is null for video:', name);
        }
    }


}

async function getPosterFromTMDB(videoname, tmdb_key) {
    try {
        const response = await axios.get('https://api.themoviedb.org/3/search/multi', {
            params: {
                query: videoname,
                included_adult: true,
                language: 'zh-TW',
                page: 1
            },
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${tmdb_key}`
            }

        });
        let poster_url = 'https://image.tmdb.org/t/p/original' + response.data.results[0].poster_path;
        console.log('Poster URL:', poster_url);
        return poster_url;
    }
    catch (error) {
        console.error('Error fetching data from TMDB:', error);
        return null;
    }
}