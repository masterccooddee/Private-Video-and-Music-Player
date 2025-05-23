import Fuse from 'fuse.js';
// import { open } from 'sqlite';
// import sqlite3 from 'sqlite3';

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
// const db = await open({
//     filename: './media.db',
//     driver: sqlite3.Database
// });
// // 從終端機讀取輸入
// console.log('請輸入搜尋關鍵字:');
// process.stdin.on('data', async (data) => {
//     const keyword = data.toString().trim(); // 去除多餘的空白
//     await search(db, keyword);
//     process.stdin.pause(); // 停止讀取輸入
// });