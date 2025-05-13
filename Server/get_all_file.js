import splite from 'better-sqlite3';
import fs from 'fs';

export default function get_all_file(db_path) {
    const db = splite(db_path);
    let output = {};
    const videos = db.prepare('SELECT id, name, type, total_episodes, poster FROM videos').all();
    const music = db.prepare('SELECT id, name, cover FROM music').all();
    const videos_series = db.prepare('SELECT id, from_video_id, season, episode  FROM video_series').all();
    const music_series = db.prepare('SELECT id, from_music_id, name, cover FROM music_series').all();
    output['videos'] = videos;
    output['music'] = music;
    output['video_series'] = videos_series;
    output['music_series'] = music_series;
    let outputJSON = JSON.stringify(output);
    
    db.close();
    return outputJSON;
}

// let output = get_all_file('media.db');
// fs.writeFileSync('output.json', output);