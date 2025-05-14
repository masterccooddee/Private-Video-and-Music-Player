import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
dotenv.config();


export async function serve_music(id, db, redis) {

    //單曲exp: music:1  專輯exp: music:2-13
    const key = id;
    console.log(id);
    const cache = await redis.get(key);
    if (cache) {
        const remainingTTL = await redis.ttl(key);
        if (remainingTTL >= 0)
            await redis.expire(key, 30 + remainingTTL); // Refresh cache expiration time
        return cache;
    }
    else {
        let music_id = '';
        let music_series_id = '';
        if (id.includes('-')) {
            music_id = id.split(':')[1].split('-')[0];
            music_series_id = id.split(':')[1].split('-')[1];
            const music_series = await db.get('SELECT path FROM music_series WHERE id = ?', [music_series_id]);
            const music_path = path.parse(music_series.path);
            // console.log(music_path);
            const output = '/Music' + '/' + path.basename(music_path.dir) + '/' + music_path.base;
            // console.log('output:', output);
            redis.set(key, output, 'EX', 60); // Cache for 24 hours
            return output;
        }
        else {
            music_id = id.split(':')[1];
            const music = await db.get('SELECT path FROM music WHERE id = ?', [music_id]);
            const music_path = path.parse(music.path);
            const output = '/' + path.basename(music_path.dir) + '/' + music_path.base;
            redis.set(key, output, 'EX', 60); // Cache for 24 hours
            return output;
        }

    }



}
// const db = await open({
//     filename: 'media.db',
//     driver: sqlite3.Database
// });
// const music_series = await db.get('SELECT path FROM music_series WHERE id = ?', [1]);
// console.log(music_series);
// const music_path = path.parse(music_series.path);
// console.log(music_path);