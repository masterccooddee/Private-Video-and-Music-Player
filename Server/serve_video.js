import fs from 'fs/promises';
import path from 'path';
import { convertToDASH_single } from './video_DASH_converter.js';
import {
    VideoExpireTime,
    VideoAddExpireTime,
    PreConvertEpisodesCount
} from './config.js';

let converting_set = new Set();
let convert_promise = new Map();
export async function serve_video(id, db, redis) {
    const key = id;
    const cache = await redis.get(key);

    if (cache) {
        console.log('cache:', cache);
        const remainingTTL = await redis.ttl(key);
        let addtime = 0;
        if (remainingTTL >= 0){
            if (remainingTTL + VideoAddExpireTime > VideoExpireTime) {
                addtime = VideoExpireTime;
            }
            else {
                addtime = VideoAddExpireTime + remainingTTL;
            }
            await redis.expire(key, addtime); // Refresh cache expiration time
        }
            
        (async () => {
            if (id.includes('-')) {
                let reg = /video:(?<video_id>\d+)-(?<series_id>\d+)/;
                let parseID = id.match(reg);
                if (parseID && parseID.groups) {
                    const video_id = parseID.groups.video_id; // 這是 videos 表的 ID
                    const series_id = parseID.groups.series_id;
                    // 獲取當前影集的資訊 (主要是集數和季數)
                    const video_series = await db.get('SELECT path, season, episode, subtitle FROM video_series WHERE id = ?', [series_id]);
                    // 獲取系列資訊 (主要是名稱和海報)
                    const video = await db.get('SELECT name, poster FROM videos WHERE id = ?', [video_id]);
                    if (video && video_series) {
                        // 預轉換下一集和下下一集
                        preconvertNextEpisodes(db, redis, video, video_series, video_id, PreConvertEpisodesCount); // 預轉換下一集和下下一集
                    }
                }
            }
        })().catch(err => {
            console.error('預轉換下一集失敗:', err)
        });

        return cache;
    }
    else {

        // 檢查是否是正在轉換的影片
        if (converting_set.has(key)) {
            // 如果影片正在轉換，返回該轉換的 Promise
            return convert_promise.get(key);
        }

        try {
            await fs.access(path.join('..', 'public', 'video_tmp'));
        }
        catch {
            await fs.mkdir(path.join('..', 'public', 'video_tmp'), { recursive: true });
        }

        let video_id = '';
        let video_series_id = '';
        if (id.includes('-')) { // 檢查是否為 video_series 的 ID 格式
            // 假設 video_series 的 ID 格式為 "video:123-45"
            let reg = /video:(?<video_id>\d+)-(?<series_id>\d+)/;
            let parseID = id.match(reg);
            video_id = parseID.groups.video_id;
            video_series_id = parseID.groups.series_id;

            const video_series = await db.get('SELECT path, season, episode, subtitle FROM video_series WHERE id = ?', [video_series_id]);
            let video = await db.get('SELECT name, poster FROM videos WHERE id = ?', [video_id]);
            const video_name = video.name;
            const video_poster = video.poster;
            const video_path = video_series.path;
            const video_season = video_series.season;
            const video_episode = video_series.episode;
            const video_subtitle = JSON.parse(video_series.subtitle);
            let output_dir = '../public/video_tmp/' + video_name + '/' + video_season + '/' + video_episode;
            try {
                await fs.access(output_dir);
            } catch {
                await fs.mkdir(output_dir, { recursive: true });
            }
            output_dir = output_dir + '/' + 'output.mpd';

            const conversionPromise = (async () => {
                try {
                    converting_set.add(key); // 標記為正在轉換
                    await convertToDASH_single(video_path, output_dir);
                    let output = {
                        video_url: '/video_tmp/' + video_name + '/' + video_season + '/' + video_episode + '/output.mpd',
                        poster_url: video_poster,
                        subtitle_url: video_subtitle
                    };
                    output = JSON.stringify(output);
                    redis.set(key, output, 'EX', VideoExpireTime); 
                    return output; // 直接返回結果
                } finally {
                    converting_set.delete(key); // 移除轉換標記
                    convert_promise.delete(key); // 清理 Promise
                }
            })();

            convert_promise.set(key, conversionPromise); // 存儲 Promise
            // 預轉換
            preconvertNextEpisodes(db, redis, video, video_series, video_id, PreConvertEpisodesCount); // 預轉換下一集和下下一集
            return conversionPromise; // 返回 Promise

        }
        else { //單影片
            video_id = id.split(':')[1];
            const video = await db.get('SELECT path, name, poster, subtitle FROM videos WHERE id = ?', [video_id]);
            const video_path = video.path;
            const video_name = video.name;
            const video_poster = video.poster;
            const video_subtitle = JSON.parse(video.subtitle);

            let output_dir = '../public/video_tmp/' + video_name;
            try {
                await fs.access(output_dir);
            } catch {
                await fs.mkdir(output_dir, { recursive: true });
            }
            output_dir = output_dir + '/' + 'output.mpd';

            const conversionPromise = (async () => {
                try {
                    converting_set.add(key); // 標記為正在轉換
                    await convertToDASH_single(video_path, output_dir);
                    let output = {
                        video_url: '/video_tmp/' + video_name + '/output.mpd',
                        poster_url: video_poster,
                        subtitle_url: video_subtitle
                    };
                    output = JSON.stringify(output);
                    redis.set(key, output, 'EX', VideoExpireTime); 
                    return output; // 解析 Promise
                } finally {
                    converting_set.delete(key); // 移除轉換標記
                    convert_promise.delete(key); // 清理 Promise
                }
            })();
            convert_promise.set(key, conversionPromise); // 存儲 Promise
            return conversionPromise; // 返回 Promise
        }
    }
}

async function preconvertNextEpisodes(
    db, redis, videoinfo, video_series_info, video_id, numberOfEpisodesToPreconvert = 1
) {
    const video_episode = video_series_info.episode;
    const video_season = video_series_info.season;
    const video_name = videoinfo.name;

    for (let i = 1; i <= numberOfEpisodesToPreconvert; i++) {

        const nextEpisode = video_episode + i;
        const nextEpisodeInfo = await db.get('SELECT path, id, subtitle FROM video_series WHERE from_video_id = ? AND episode = ? AND season = ?', [video_id, nextEpisode, video_season]);
        if (!nextEpisodeInfo) {
            console.log(`No next episode found for episode ${nextEpisode} of video ${video_id}.`);
            continue; // 如果沒有找到下一集，則跳過
        }

        const nextEpisodeID = nextEpisodeInfo.id;
        const nextEpisodePath = nextEpisodeInfo.path;
        const key = 'video:' + String(video_id) + '-' + String(nextEpisodeID);
        const cache = await redis.get(key);
        if (cache) {
            console.log(`Episode ${nextEpisode} already exists in cache.`);
            continue; // 如果已經存在於快取中，則跳過
        }

        if (nextEpisodePath) {
            let output_dir = `../public/video_tmp/${video_name}/${video_season}/${nextEpisode}`;
            try {
                await fs.access(output_dir);
            } catch {
                await fs.mkdir(output_dir, { recursive: true });
            }
            output_dir = output_dir + '/output.mpd';

            if (!converting_set.has(key)) {
                const conversionPromise = (async () => {
                    try {
                        converting_set.add(key); // 標記為正在轉換
                        await convertToDASH_single(nextEpisodePath, output_dir);
                        let output = {
                            video_url: '/video_tmp/' + videoinfo.name + '/' + video_season + '/' + nextEpisode + '/output.mpd',
                            poster_url: videoinfo.poster,
                            subtitle_url: JSON.parse(nextEpisodeInfo.subtitle)
                        };
                        output = JSON.stringify(output);
                        redis.set(key, output, 'EX', VideoExpireTime); 
                        return output; // 直接返回結果
                    } finally {
                        converting_set.delete(key); // 移除轉換標記
                        convert_promise.delete(key); // 清理 Promise
                    }
                })();

                convert_promise.set(key, conversionPromise); // 存儲 Promise

            }
        }


    }

}