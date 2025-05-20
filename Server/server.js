import express from 'express';
import morgan from 'morgan';
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

import cors from 'cors';

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
app.use('/Video', express.static('../../Video'));
app.use('/node_modules', express.static('../node_modules'));

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