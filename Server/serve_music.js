import path from 'path';
import { checkAudioSupport } from './audio_converter.js';
import {
    MusicExpireTime,
    MusicAddExpireTime
} from './config.js';

export async function serve_music(id, db, redis) {

    //單曲exp: music:1  專輯exp: music:2-13
    const key = id;
    // console.log(id);
    const cache = await redis.get(key);
    if (cache) {
        const remainingTTL = await redis.ttl(key);
        let addtime = 0;
        if (remainingTTL >= 0){
            if (remainingTTL + MusicAddExpireTime > MusicExpireTime) {
                addtime = MusicExpireTime;
            }
            else {
                addtime = MusicAddExpireTime + remainingTTL;
            }
            await redis.expire(key, addtime); // Refresh cache expiration time
        }
            
        return cache;
    }
    else {
        let music_id = '';
        let music_series_id = '';
        if (id.includes('-')) {
            music_id = id.split(':')[1].split('-')[0];
            music_series_id = id.split(':')[1].split('-')[1];
            const music_series = await db.get('SELECT path, cover FROM music_series WHERE id = ?', [music_series_id]);
            const music_path = path.parse(music_series.path);
            // console.log(music_path);
            // console.log(music_path);
            const music_name = music_path.name;
            const output = '/Music' + '/' + path.basename(music_path.dir) + '/' + music_path.base;
            const out = await checkAudioSupport(music_series.path, music_name, output);
            let audio_info = {
                music_url: out,
                cover_url: music_series.cover,
            };
            audio_info = JSON.stringify(audio_info);
            // console.log('output:', output);
            redis.set(key, audio_info, 'EX', MusicExpireTime); // Cache for 24 hours
            return audio_info;
        }
        else {
            music_id = id.split(':')[1];
            const music = await db.get('SELECT path, cover FROM music WHERE id = ?', [music_id]);
            const music_path = path.parse(music.path);
            // console.log(music_path);
            const music_name = music_path.name;
            const output = '/' + path.basename(music_path.dir) + '/' + music_path.base;
            // console.log(music_name);
            let out = await checkAudioSupport(music.path, music_name, output);
            let audio_info = {
                music_url: out,
                cover_url: music.cover,
            };
            audio_info = JSON.stringify(audio_info);
            redis.set(key, audio_info, 'EX', MusicExpireTime); // Cache for 24 hours
            return audio_info;
        }

    }



}

