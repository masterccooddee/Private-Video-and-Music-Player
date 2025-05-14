import sqlite from 'better-sqlite3';
import fs from 'fs';

export default function get_all_file(db_path) {
    const db = sqlite(db_path);
    let output = {};
    const videos = db.prepare('SELECT id, name, type, total_episodes, poster FROM videos').all();
    const music = db.prepare('SELECT id, name, cover,type FROM music').all();
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

export function get_from_type(db_path, type = '') {
    let type_list = [];
    if (type === '') return null;
    type.trim();
    type_list = type.split(',');
    type_list = type_list.map((item) => item.trim());
    type_list = type_list.filter((item) => { return (item !== '' && (item === 'videos' || item === 'music' || item === 'video_series' || item === 'music_series')) });
    if (type_list.length === 0) return null;
    const db = sqlite(db_path);
    let output = {};
    type_list.forEach((item) => {


        switch (item) {

            case 'videos':
                const videos = db.prepare('SELECT id, name, type, total_episodes, poster FROM videos').all();
                output['videos'] = videos;
                break;
            case 'music':
                const music = db.prepare('SELECT id, name, cover,type FROM music').all();
                output['music'] = music;
                break;
            case 'video_series':
                const videos_series = db.prepare('SELECT id, from_video_id, season, episode  FROM video_series').all();
                output['video_series'] = videos_series;
                break;
            case 'music_series':
                const music_series = db.prepare('SELECT id, from_music_id, name, cover FROM music_series').all();
                output['music_series'] = music_series;
                break;
        }
    });

    let outputJSON = JSON.stringify(output);
    db.close();
    return outputJSON;

}

// let output = get_all_file('media.db');
// fs.writeFileSync('output.json', output);
console.log(get_from_type('media.db', 'music,music_series'));