import fs from 'fs/promises';
import path from 'path';
import sqlite from 'better-sqlite3';
import { fileURLToPath } from 'url';
import process from 'node:process';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import { parseFile } from 'music-metadata';
import mime from 'mime-types';
import { loading } from './loading.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function init() {
    const db = initDB();
    try {
        // 初始化影片資料庫
        await classifyMedia(db);

        // 如果影片資料庫沒 poster，有 TMDB API KEY，則下載海報
        const tmdb_key = process.env.TMDB_KEY;
        if (tmdb_key !== undefined && tmdb_key !== 'YOUR_TMDB_API_KEY') {
            console.log('\nTMDB_KEY is defined, starting poster finding.');
            await findPosterFromTMDB(db, tmdb_key);
        } else {
            console.log('\nTMDB_KEY is undefined, skipping poster finding.');
        }
    } finally {
        db.close(); // 確保連線被正確關閉
    }


}

function initDB() {
    const db = new sqlite('media.db');

    db.pragma('foreign_keys = ON');
    // 刪除舊的表（如果存在）
    db.exec(`
        DROP TABLE IF EXISTS video_series;
        DROP TABLE IF EXISTS videos;
        DROP TABLE IF EXISTS music_series;
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
            poster TEXT DEFAULT '-1',
            subtitle TEXT
        );

        CREATE TABLE video_series (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_video_id INTEGER,
            path TEXT,
            season TEXT,
            episode INTEGER,
            subtitle TEXT,
            FOREIGN KEY (from_video_id) REFERENCES videos(id) ON DELETE CASCADE
        );

        CREATE TABLE music (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            path TEXT,
            cover TEXT,
            info TEXT,
            type TEXT
        );

        CREATE TABLE music_series (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_music_id INTEGER,
            name TEXT,
            path TEXT,
            cover TEXT,
            info TEXT,
            FOREIGN KEY (from_music_id) REFERENCES music(id) ON DELETE CASCADE
        );
    `);

    console.log('Database initialized.');
    return db;
}

// 📂MultiMediaPlayer為本專案資料

//基本結構
// 📂Upper folder
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
// │   ├── 📂video3
// │   │   ├── video3_E1.mp4
// │   │   ├── video3_E2.mp4
// │   |   └── video3.jpg
// │   └── video4.mp4        
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
    console.log('Total video folders', folders.length);
    let finished_folder = 0;
    let starttime = Date.now();
    process.stdout.write('\x1b[?25l');
    loading(finished_folder, folders.length, starttime);
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
                        // console.log('Video already exists in database:', video.name);
                        db.prepare('UPDATE videos SET path = @path WHERE name = @name').run({ name: folder, path: seriesPath });
                    } else {
                        // console.log('Inserting video into database:', folder);
                        db.prepare('INSERT INTO videos (name, path, type, poster) VALUES (@name,@path,@type,@poster)').run({ name: folder, path: seriesPath, type: 'series', poster: '-1' });
                    }
                    let season = subfolder;
                    await classifyVideoSeries(db, seriesPath, folder, season); // 季資料夾處理

                } else {
                    // 如果是檔案，有可能是單影片或series影片的海報或字幕
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
                        await classifyVideo(db, filePath, folder);
                        await findsubtitlesOneVideo(subfolders, db, folder, folderpath, true);
                    }

                    // 如果有多個影片檔案，則是系列影片
                    else if (videoFiles.length > 1) {

                        if (fileExt === '.jpg' || fileExt === '.png' || fileExt === '.jpeg' || fileExt === '.webp') {
                            PutInSeriesPoster(db, filePath, folder);
                            continue;
                        }
                        //檢查是否已經存在，存在代表已把全部集數放入資料庫
                        const video = db.prepare('SELECT name FROM videos WHERE name = ?').get(folder);
                        if (video === undefined) {
                            const seriesPath = folderpath;
                            db.prepare('INSERT INTO videos (name, path, type) VALUES (@name,@path,@type)').run({ name: folder, path: seriesPath, type: 'series'});
                            let season = 'NONE';
                            await classifyVideoSeries(db, seriesPath, folder, season); // 季資料夾處理
                        }
                        else {
                            continue;
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
            classifyVideo(db, filePath, path.basename(folder, path.extname(folder)));
            findsubtitlesOneVideo(folders, db, path.basename(folder, path.extname(folder)), videoFolder, false);
        }
        finished_folder++;
        loading(finished_folder, folders.length, starttime);
    }
    process.stdout.write('\x1b[?25h');
    // console.log('...........................................................');
    finished_folder = 0;

    try {
        await fs.access('../public/music_cover')
    }
    catch {
        await fs.mkdir('../public/music_cover', { recursive: true });
    }
    //分類音樂
    const musicFiles = await fs.readdir(musicFolder);
    console.log('\nTotal music files', musicFiles.length);
    let alone_music_list = [];
    starttime = Date.now();
    process.stdout.write('\x1b[?25l');
    loading(finished_folder, musicFiles.length, starttime);
    // 專輯或單曲
    for (const musicFile of musicFiles) {
        const stats = await fs.stat(path.join(musicFolder, musicFile));
        // 專輯
        if (stats.isDirectory()) {
            const albumPath = path.join(musicFolder, musicFile);
            const albumFiles = await fs.readdir(albumPath);
            // console.log('Found album:', musicFile);
            const albumname = path.basename(albumPath);
            db.prepare('INSERT INTO music (name, path, type) VALUES (@name,@path,@type)').run({ name: albumname, path: albumPath, type: 'series' });

            const album_ID = db.prepare('SELECT id FROM music WHERE name = ?').get(albumname).id;
            // 將專輯中的每首歌曲插入資料庫
            const insert_music = db.prepare('INSERT INTO music_series (from_music_id,name, path,cover,info) VALUES (@id,@name,@path,@cover,@info)');
            const musiclist = [];
            for (const file of albumFiles) {
                const musicname = path.basename(file, path.extname(file));
                const fileExt = path.extname(file).toLowerCase();
                if (fileExt === '.mp3' || fileExt === '.wav' || fileExt === '.flac' || fileExt === '.aac' || fileExt === '.ogg' || fileExt === '.m4a') {
                    const filePath = path.join(albumPath, file);
                    const info = await findCoverofMusic(filePath);
                    musiclist.push({ path: filePath, name: musicname, cover: info.cover_path, id: album_ID, info: JSON.stringify(info) });
                }
            }
            const insert_album = db.transaction((files) => {
                for (const file of files) { insert_music.run(file); }
            });
            insert_album(musiclist);
        }

        // 單曲
        else {
            const musicname = path.basename(musicFile, path.extname(musicFile));
            const filePath = path.join(musicFolder, musicFile);
            const fileExt = path.extname(filePath).toLowerCase();
            if (fileExt === '.mp3' || fileExt === '.wav' || fileExt === '.flac' || fileExt === '.aac' || fileExt === '.ogg' || fileExt === '.m4a') {
                
                //Find Cover
                const info = await findCoverofMusic(filePath);
                alone_music_list.push({ path: filePath, name: musicname, cover: info.cover_path, type: 'music', info: JSON.stringify(info) });
            }
        }
        finished_folder++;
        loading(finished_folder, musicFiles.length, starttime);
    }
    process.stdout.write('\x1b[?25h');

    // 將單曲插入資料庫
    const insert_music = db.prepare('INSERT INTO music (name, path, cover, type, info) VALUES (@name,@path,@cover,@type, @info)');
    const insert_alone_music = db.transaction((files) => {
        for (const file of files) { insert_music.run(file); }
    });
    insert_alone_music(alone_music_list);
    // console.log('Inserted music into database:', alone_music_list.length);

    // console.log('\n...............................................................................');

}


async function classifyVideo(db, filePath, folder) {


    const fileExt = path.extname(filePath).toLowerCase();
    const search_name = db.prepare('SELECT name FROM videos WHERE name = ?');
    const insert_video = db.prepare('INSERT INTO videos (name, path, type, poster) VALUES (@name,@path,@type,@poster)');
    const update_poster = db.prepare('UPDATE videos SET poster = @poster WHERE name = @name');
    const update_video = db.prepare('UPDATE videos SET path = @path WHERE name = @name');

    if (fileExt === '.mp4' || fileExt === '.mkv' || fileExt === '.avi') {
        // console.log('Found video file:', fileName);

        // 使用檔案路徑作為唯一標識

        const video = search_name.get(folder);
        if (video !== undefined) {
            // console.log('Video already exists in database:', video.name);
            update_video.run({ name: folder, path: filePath });
        } else {
            // console.log('Inserting video into database:', fileName);
            insert_video.run({ name: folder, path: filePath, type: 'video', poster: '-1' });
        }
    }

    if (fileExt === '.jpg' || fileExt === '.png' || fileExt === '.jpeg' || fileExt === '.webp') {
        // console.log('Found poster file:', fileName);

        // 使用檔案路徑作為唯一標識
        const video = search_name.get(folder);
        const posterpath = '/Video/' + folder + '/' + path.basename(filePath);
        if (video !== undefined) {
            // console.log('Poster already exists in database:', video.name);
            update_poster.run({ name: folder, poster: posterpath });
        } else {
            // console.log('Inserting poster into database:', fileName);
            insert_video.run({ name: folder, path: '-1', type: 'video', poster: posterpath });
        }
    }

}

function PutInSeriesPoster(db, filePath, folder) {
    const search_name = db.prepare('SELECT name FROM videos WHERE name = ?');
    const update_poster = db.prepare('UPDATE videos SET poster = @poster WHERE name = @name');
    const insert_poster = db.prepare('INSERT INTO videos (name, path, type, poster) VALUES (@name,@path,@type,@poster)');

    const video = search_name.get(folder);
    const posterpath = '/Video/' + folder + '/' + path.basename(filePath);
    if (video !== undefined) {
        // console.log('From putinposter Video already exists in database:', video.name);
        update_poster.run({ name: folder, poster: posterpath });
    } else {
        // console.log('Inserting poster into database:', folder);
        insert_poster.run({ name: folder, path: '-1', type: 'series', poster: posterpath });
    }
}

// 季資料夾處理
async function classifyVideoSeries(db, seriesPath, folder, season) {

    const seriesname = folder;
    let seasonFolder = seriesPath;

    const search_video_id = db.prepare('SELECT id FROM videos WHERE name = ?', { cached: true });
    const insert_video_series = db.prepare('INSERT INTO video_series (from_video_id, path, season, episode, subtitle) VALUES (@from_video_id,@path,@season,@episode,@subtitle)');

    let seasonFiles = await fs.readdir(seriesPath);

    // 排序檔案名稱（字典順序）
    const sortedFiles = seasonFiles
        .filter(file => {
            // 過濾出影片檔案
            const fileExt = path.extname(file).toLowerCase();
            return fileExt === '.mp4' || fileExt === '.mkv' || fileExt === '.avi';
        })
        .sort((a, b) => a.localeCompare(b)); // 按字典順序排序

    //找字幕
    const subtitles = seasonFiles.filter(file => {
        return (path.extname(file).toLowerCase() === '.ass' || path.extname(file).toLowerCase() === '.srt' || path.extname(file).toLowerCase() === '.vtt');
    }).sort((a, b) => a.localeCompare(b));

    let total_episodes = db.prepare('SELECT total_episodes FROM videos WHERE name = ?').get(seriesname);
    // console.log('total_episodes:', total_episodes);
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
            let subtitle = subtitles.filter(sub => {
                return sub.includes(path.basename(file, path.extname(file)));
            });
            subtitle = subtitle.map(sub => {
                let full_path = path.join(seasonFolder, sub).replace(/\\/g, '/');
                const match = full_path.match(/\/Video\/.*/);
                if (match) {
                    return match[0];
                }
                else {
                    return '';
                }
            });


            insert_video_series.run({
                from_video_id: f_v_id,
                path: filePath,
                season: season,
                episode: index + 1,
                subtitle: JSON.stringify(subtitle)
            });
        });
    });

    insert_series(sortedFiles);
    // console.log('Inserted series videos into database:', seriesname, season);

}

async function findPosterFromTMDB(db, tmdb_key) {

    const allVideos = db.prepare('SELECT * FROM videos').all();
    const allSeries = allVideos.filter(video => video.poster === '-1');
    const videoname = allSeries.map(video => video.name);

    let start_time = Date.now();
    let finished = 0;
    process.stdout.write('\x1b[?25l');
    loading(finished, videoname.length, start_time);
    for (const name of videoname) {
        const poster_url = await getPosterFromTMDB(name, tmdb_key);
        if (poster_url !== null) {
            db.prepare('UPDATE videos SET poster = @poster WHERE name = @name').run({ name: name, poster: poster_url });
            // console.log('Updated poster URL for video:', name);
        } else {
            // console.log('Poster URL is null for video:', name);
        }
        finished++;
        loading(finished, videoname.length, start_time);
    }


}

async function getPosterFromTMDB(videoname, tmdb_key, maxRetries = 3, initialDelayMs = 1000) {
    let retries = 0;
    let currentDelayMs = initialDelayMs;

    while (retries < maxRetries) {
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

            if (response.data.results && response.data.results.length > 0 && response.data.results[0].poster_path) {
                return 'https://image.tmdb.org/t/p/original' + response.data.results[0].poster_path;
            } else {
                // console.log(`No poster found on TMDB for: ${videoname}`);
                return null;
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response && error.response.status === 429) { // 如果是 429 錯誤，表示 TMDB API 的速率限制被觸發
                retries++;
                let retryAfterSeconds = parseInt(error.response.headers['retry-after'], 10);
                let waitMs = currentDelayMs;

                if (!isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
                    waitMs = retryAfterSeconds * 1000;
                    console.warn(`TMDB API rate limit hit for "${videoname}". Retry-After: ${retryAfterSeconds}s. Retrying (attempt ${retries}/${maxRetries})...`);
                } else {
                    console.warn(`TMDB API rate limit hit for "${videoname}". Retrying in ${waitMs / 1000}s (attempt ${retries}/${maxRetries})...`);
                }

                if (retries >= maxRetries) {
                    console.error(`TMDB API rate limit exceeded for "${videoname}" after ${maxRetries} retries. Giving up.`);
                    return null;
                }

                await new Promise(resolve => setTimeout(resolve, waitMs));
                currentDelayMs *= 2; // 指數退避，用於沒有 Retry-After 或下一次預設等待
            } else {
                console.error(`Error fetching data from TMDB for "${videoname}":`, error.message);
                return null; // 對於其他錯誤，不重試
            }
        }
    }
    return null; // 如果達到最大重試次數
}

// findCoverofMusic
async function findCoverofMusic(musicpath) {

    let info = {
        cover_path: null,
        album: null,
        artist: null,
        title: null,
        year: null
    }
    try {
        const metadata = await parseFile(musicpath);

        // 檢查是否有封面
        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const cover = metadata.common.picture[0]; // 取得第一個封面
            const ext = mime.extension(cover.format);
            const coverPath = '../public/music_cover/' + path.basename(musicpath, path.extname(musicpath)) + '.' + ext;
            await fs.writeFile(coverPath, cover.data); // 將封面儲存為檔案
            // console.log(cover.format);
            const outputPath = '/cover' + '/' + path.basename(musicpath, path.extname(musicpath)) + '.' + ext;
            info.cover_path = outputPath; // 封面路徑
        }

        // 取得其他音樂資訊
        info.album = metadata.common.album;
        info.artist = metadata.common.artist;
        info.title = metadata.common.title;
        info.year = metadata.common.year;
    } catch (error) {
        console.error('Error extracting cover from music file:', error);

    }

    return info;
}

async function findsubtitlesOneVideo(video_folder, db, name, filepath, have_Folder = false) {

    const subtitles = video_folder.filter(file => {
        return (path.extname(file).toLowerCase() === '.ass' || path.extname(file).toLowerCase() === '.srt' || path.extname(file).toLowerCase() === '.vtt');
    });

    let video_sub = [];

    if (!have_Folder) {
        video_sub = subtitles.filter(sub => {
            return sub.includes(name)
        })
            .map(sub => {
                let full_path = path.join(filepath, sub).replace(/\\/g, '/');
                const match = full_path.match(/\/Video\/.*/);
                if (match) {
                    return match[0];
                }
                else {
                    return '';
                }
            });
    }
    else {
        video_sub = subtitles.map(sub => {
            let full_path = path.join(filepath, sub).replace(/\\/g, '/');
            const match = full_path.match(/\/Video\/.*/);
            if (match) {
                return match[0];
            }
            else {
                return '';
            }
        });
    }



    let sub2db = JSON.stringify(video_sub);
    // console.log(sub2db);
    let update_sub = db.prepare('UPDATE videos SET subtitle = @subtitle WHERE name = @name');
    update_sub.run({ subtitle: sub2db, name: name })

}


// let file = 'C:\\Users\\arthu\\Desktop\\School\\3\\JS\\Project\\Music\\023. 時を刻む唄.mp3';
// let metadata = await parseFile(file);
// console.log(metadata);