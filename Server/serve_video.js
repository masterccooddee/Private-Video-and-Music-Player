import fs from 'fs/promises';
import path from 'path';
import { convertToDASH_single } from './video_DASH_converter.js';


export async function serve_video(id, db, redis) {
    const key = id;
    const cache = await redis.get(key);
    if(cache){
        const remainingTTL = await redis.ttl(key);
        if (remainingTTL >= 0)
            await redis.expire(key, 600 + remainingTTL); // Refresh cache expiration time
        return cache;
    }
    else{

        try{
            await fs.access(path.join('..','public','video_tmp'));
        }
        catch{
            await fs.mkdir(path.join('..','public','video_tmp'), { recursive: true });
        }

        let video_id = '';
        let video_series_id = '';
        if (id.includes('-')) {
            let reg = /video:(?<video_id>\d+)-(?<series_id>\d+)/;
            let parseID = id.match(reg);
            video_id = parseID.groups.video_id;
            video_series_id = parseID.groups.series_id;
            
            const video_series = await db.get('SELECT path, season, episode FROM video_series WHERE id = ?', [video_series_id]);
            let video = await db.get('SELECT name, poster FROM videos WHERE id = ?', [video_id]);
            const video_name = video.name;
            const video_poster = video.poster;
            const video_path = video_series.path;
            const video_season = video_series.season;
            const video_episode = video_series.episode;
            let output_dir = '../public/video_tmp/' + video_name + '/' + video_season + '/' + video_episode;
            try {
                await fs.access(output_dir);
            } catch {
                await fs.mkdir(output_dir, { recursive: true });
            }
            output_dir = output_dir + '/' + 'output.mpd';
            await convertToDASH_single(video_path, output_dir);
            let output = {
                video_url: '/video_tmp/' + video_name + '/' + video_season + '/' + video_episode + '/output.mpd',
                poster_url: video_poster
            };
            output = JSON.stringify(output);
            redis.set(key, output, 'EX', 3600); // Cache for 30 minutes
            return output;

        }
        else {
            video_id = id.split(':')[1];
            const video = await db.get('SELECT path, name, poster FROM videos WHERE id = ?', [video_id]);
            const video_path = video.path;
            const video_name = video.name;
            const video_poster = video.poster;

            let output_dir = '../public/video_tmp/' + video_name;
            try {
                await fs.access(output_dir);
            } catch {
                await fs.mkdir(output_dir, { recursive: true });
            }
            output_dir = output_dir + '/' + 'output.mpd';
            await convertToDASH_single(video_path, output_dir);

            let output = {
                video_url: '/video_tmp/' + video_name + '/output.mpd',
                poster_url: video_poster,
            };
            output = JSON.stringify(output);
            redis.set(key, output, 'EX', 3600); // Cache for 30 minutes

            return output;
        }
    }
}
