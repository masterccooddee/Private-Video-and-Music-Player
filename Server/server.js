"use strict";
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import process from 'node:process';
import { fileURLToPath } from 'url';
import { init } from './init.js';
import get_all from './get_all_file.js';
import { get_from_type } from './get_all_file.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
dotenv.config();
import Redis from 'ioredis';
import { serve_music } from './serve_music.js';
import { serve_video } from './serve_video.js';
import expire_handle from './expirehandle.js';
import { watchingFile } from './listenfilechange.js';
// import multer from 'multer';
import SRT2WVTT from './srt2vtt.js';

//import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const upload = multer({ storage: multer.memoryStorage() });

const PORT = 3000;

console.log('Starting server...');
await init()
    .then(() => {
        console.log('\n\nInitialization complete');
    })
    .catch(err => {
        console.error('\n\nError initializing: ' + err);
    });

// 與SQLite資料庫建立連線
const db = await open({
    filename: 'media.db',
    driver: sqlite3.Database
});

// 與Redis建立連線
if (process.env.REDIS_HOST === undefined || process.env.REDIS_PORT === undefined) {
    console.error('Redis host or port not set in environment variables');
    process.exit(1);
}
const redis = new Redis(parseInt(process.env.REDIS_PORT), process.env.REDIS_HOST);

// Redis監聽事件
redis.on('error', (err) => {
    console.error('Redis error: ', err);

});

redis.on('connect', () => {
    console.log('Redis connected');
});

redis.on('end', () => {
    console.log('Redis disconnected');
});

// 創建一個新的 Redis 客戶端來監聽事件
const subscriber = new Redis(parseInt(process.env.REDIS_PORT), process.env.REDIS_HOST);

// 訂閱過期事件
subscriber.psubscribe('__keyevent@0__:expired', (err, count) => {
    if (err) {
        console.error('訂閱過期事件失敗:', err);
    } else {
        console.log(`成功訂閱 ${count} 個頻道的過期事件`);
    }
});

// 處理過期事件
subscriber.on('pmessage', (pattern, channel, message) => {
    console.log(`鍵過期: ${message}`);
    expire_handle(db, message)

});


// 監聽關閉事件
process.on('SIGINT', async () => {
    console.log('Received SIGINT. Closing database and Redis connections...');
    await db.close();
    await redis.quit();
    process.exit(0);
});

watchingFile(db, redis);

const app = express();
app.use(morgan('dev'));
// app.use(cors());

app.use('/', express.static('../public'));
app.use('/cover', express.static('../public/music_cover'));
app.use('/Music', express.static('../../Music'));

app.get(/\/Video.*.srt/, async (req, res) => {
    const filepath = '../..' + decodeURIComponent(req.path);
    console.log('srt file path:', filepath);
    const stream = await SRT2WVTT(filepath);
    res.setHeader('Content-Type', 'text/vtt');
    res.setHeader('Content-Disposition', 'inline; filename="subtitle.vtt"');
    stream.pipe(res);

});

app.use('/Video', express.static('../../Video'));

app.get('/get_all', async (req, res) => {


    const type = req.query.type;
    let output;
    if (type === undefined) {
        output = await get_all(db);
    }
    else {
        output = await get_from_type(db, type);
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(output);
});

app.get('/music/:id', async (req, res) => {
    const id = req.params.id;
    const output = await serve_music(id, db, redis);
    res.setHeader('Content-Type', 'application/json');
    res.send(output);
});

app.get('/video/:id', async (req, res) => {
    const id = req.params.id;
    const video_promise = serve_video(id, db, redis);
    video_promise
        .then((output) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(output);
        })
        .catch((err) => {
            console.error('Error serving video:', err);
            res.status(500).send('Internal Server Error');
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// // 處理所有前端頁面
// app.get(/^\/(tag|upload|profile|favorites|rank|login)(\/.*)?$/, (req, res) => {
//     res.sendFile(path.join(__dirname, '../dist/index.html'));
// });

// 處理上傳音樂或影片的請求 
// app.post('/api/upload', upload.fields([
//     { name: 'file', maxCount: 1 },
//     { name: 'cover', maxCount: 1 }
// ]), async (req, res) => {
//     const { type, title } = req.body;
//     const file = req.files?.file?.[0];
//     const cover = req.files?.cover?.[0];

//     if (!file || !title) {
//         return res.status(400).send('缺少檔案或標題');
//     }

//     const baseDir = type === 'music' ? '../../Music' : '../../Video';
//     const useSubfolder = !!cover;
//     const safeTitle = title.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
//     const targetFolder = useSubfolder
//         ? path.join(baseDir, safeTitle)
//         : baseDir;

//     const fileExt = path.extname(file.originalname);
//     const filePath = path.join(targetFolder, `${safeTitle}${fileExt}`);

//     const coverPath = cover
//         ? path.join(targetFolder, `${safeTitle}${path.extname(cover.originalname)}`)
//         : null;

//     try {
//         if (fs.existsSync(filePath)) {
//             return res.status(409).send('已有相同音樂或影片檔案，請重新命名');
//         }

//         if (cover && fs.existsSync(coverPath)) {
//             return res.status(409).send('已有相同封面圖片，請重新命名');
//         }

//         if (!fs.existsSync(targetFolder)) {
//             fs.mkdirSync(targetFolder, { recursive: true });
//         }

//         fs.writeFileSync(filePath, file.buffer);

//         if (cover) {
//             fs.writeFileSync(coverPath, cover.buffer);
//         }

//         res.send({ success: true });
//     } catch (err) {
//         console.error('上傳失敗:', err);
//         res.status(500).send('儲存檔案錯誤');
//     }
// });
