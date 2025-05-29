
export default async function get_all_file(db) {

    let output = {};
    const videos = await db.all('SELECT id, name, type, total_episodes, poster FROM videos');
    const music = await db.all('SELECT id, name, cover,type, info FROM music');
    const videos_series = await db.all('SELECT id, from_video_id, season, episode  FROM video_series');
    const music_series = await db.all('SELECT id, from_music_id, name, cover, info FROM music_series');
    output['videos'] = videos;
    output['music'] = music;
    output['video_series'] = videos_series;
    output['music_series'] = music_series;
    let outputJSON = JSON.stringify(output);

    return outputJSON;
}

export async function get_from_type(db, type = '') {
    let type_list = [];
    if (type === '') return null;
    type.trim();
    type_list = type.split(',');
    type_list = type_list.map((item) => item.trim());
    type_list = type_list.filter((item) => { return (item !== '' && (item === 'videos' || item === 'music' || item === 'video_series' || item === 'music_series')) });
    if (type_list.length === 0) return null;
    const type_set = new Set(type_list);
    let output = {};
    for (const item of type_set) {

        switch (item) {

            case 'videos':
                const videos = await db.all('SELECT id, name, type, total_episodes, poster FROM videos');
                output['videos'] = videos;
                break;
            case 'music':
                const music = await db.all('SELECT id, name, cover,type,info FROM music');
                output['music'] = music;
                break;
            case 'video_series':
                const videos_series = await db.all('SELECT id, from_video_id, season, episode  FROM video_series');
                output['video_series'] = videos_series;
                break;
            case 'music_series':
                const music_series = await db.all('SELECT id, from_music_id, name, cover, info FROM music_series');
                output['music_series'] = music_series;
                break;
        }
    }

    let outputJSON = JSON.stringify(output);
    return outputJSON;

}

// let output =await get_all_file('media.db');
// console.log(output);
// console.log(await get_from_type('media.db', 'music,music_series'));