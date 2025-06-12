import Fuse from 'fuse.js';

export default async function search(db, keyword) {
    const videos = await db.all('SELECT id,name,type,total_episodes,poster FROM videos');
    const musics = await db.all('SELECT id,name,type,cover FROM music');
    const music_series = await db.all('SELECT id,from_music_id,name,cover FROM music_series');
    const all = [...videos, ...musics, ...music_series];
    const options = {
        keys: ['name'],
        threshold: 0.4,
        includeScore: true,
        ignoreLocation: true,
        
    };
    const fuse = new Fuse(all, options);
    const result = fuse.search(keyword,{limit: 10}).map((item) => {
        return item.item;
    });
    // console.log(result);
    return result;
    


}
