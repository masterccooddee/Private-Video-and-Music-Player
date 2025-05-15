import fs from 'fs/promises';
import path from 'path';


export async function serve_video(id, db, redis) {
    const key = id;
    const cache = await redis.get(key);
    if(cache){
        const remainingTTL = await redis.ttl(key);
        if (remainingTTL >= 0)
            await redis.expire(key, 30 + remainingTTL); // Refresh cache expiration time
        return cache;
    }
    else{
        let video_id = '';
        let video_series_id = '';
        if (id.includes('-')) {
            let reg = /video:(?<video_id>\d+)-(?<series_id>\d+)/;
            let parseID = id.match(reg);
            video_id = parseID.groups.video_id;
            video_series_id = parseID.groups.series_id;
            
            const video_series = await db.get('SELECT path, season, episode, from_video_id FROM video_series WHERE id = ?', [video_series_id]);
            
        }
        else {
            video_id = id.split(':')[1];
            const video = await db.get('SELECT path, cover FROM video WHERE id = ?', [video_id]);
            const video_path = path.parse(video.path);
            const video_name = video_path.name;
            const output = '/' + path.basename(video_path.dir) + '/' + video_path.base;
            let out = await checkVideoSupport(video.path,video_name,output);
            let video_info = {
                video_url: out,
                cover_url: video.cover,
            };
            video_info = JSON.stringify(video_info);
            redis.set(key, video_info, 'EX', 180); // Cache for 24 hours
            return video_info;
        }
    }
}

let str = 'video:1-1-23';
let reg = /video:(?<video_id>\d+)-(?<series_id>\d+)-(?<episode>\d+)/;
let out = str.match(reg);
console.log(out);
console.log(out[1]);
console.log(out[2]);
console.log(out[3]);
console.log(out.groups.video_id);
console.log(out.groups.series_id);
console.log(out.groups.episode);