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

const PORT = 3000;


console.log('Starting server...');
await init()
    .then(() => {
        console.log('\n\nInitialization complete');
    })
    .catch(err => {
        console.error('\n\nError initializing: ' + err);
    });

const db = await open({
    filename: 'media.db',
    driver: sqlite3.Database
});

const redis = new Redis(parseInt(process.env.REDIS_PORT), process.env.REDIS_HOST);

redis.on('error', (err) => {
    console.error('Redis error: ', err);
});

redis.on('connect', () => {
    console.log('Redis connected');
});

redis.on('end', () => {
    console.log('Redis disconnected');
});

process.on('exit', async () => {
    await db.close();
    await redis.quit();
});

const app = express();
app.use(morgan('dev'));

app.use('/', express.static('../public'));
app.use('/cover', express.static('../public/music_cover'));
// app.use('/Music', express.static('../../Music'));
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
    res.send(output);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});