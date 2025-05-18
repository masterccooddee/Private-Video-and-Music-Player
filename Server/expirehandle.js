import fs from 'fs/promises';
import path from 'path';

export default async function expire_handle(db, message) {

    const data_type = message.split(':')[0];

    if(data_type === 'video') {
        const video_id = message.split(':')[1];
        if(video_id.includes('-')) {
            const from_video_id = video_id.split('-')[0];
            const video_series_id = video_id.split('-')[1];
            const info = await db.get('SELECT season, episode FROM video_series WHERE id = ?', [video_series_id]);
            const from_video_name = await db.get('SELECT name FROM videos WHERE id = ?', [from_video_id]);
            
            try{
                await fs.rm(path.join('..','public','video_tmp', from_video_name.name, info.season, String(info.episode)), { recursive: true });
            }
            catch(err){
                if (err.code === 'ENOENT') {
                    console.log('File not found:', err.path);
                }
            }
        }
        else {
            const info = await db.get('SELECT name FROM videos WHERE id = ?', [video_id]);
            try{
                await fs.rm(path.join('..','public','video_tmp', info.name), { recursive: true });
            }
            catch(err){
                if (err.code === 'ENOENT') {
                    console.log('File not found:', err.path);
                }
            }
        }
    }
    else{
        const music_id = message.split(':')[1];
        if(music_id.includes('-')) {
            const music_series_id = music_id.split('-')[1];
            const info = await db.get('SELECT name FROM music_series WHERE id = ?', [music_series_id]);
            try{
                await fs.rm(path.join('..','public','music_tmp', info.name + '.mp3'), { recursive: true });
            }
            catch(err){
                if (err.code === 'ENOENT') {
                    console.log('File not found:', err.path);
                }
            }
        }
        else {
            const info = await db.get('SELECT name FROM music WHERE id = ?', [music_id]);
            try{
                await fs.rm(path.join('..','public','music_tmp', info.name + '.mp3'), { recursive: true });
            }
            catch(err){
                if(err.code === 'ENOENT') {
                    console.log('File not found:', err.path);
                }
            }
        }

    }
    
}