
export default async function randomMusicList(db) {
    
    const musicFromMusic = await db.all('SELECT id, name, cover, type, info FROM music WHERE type = "music"');
    const musicFromSeriesRows = await db.all('SELECT id, from_music_id, name, cover, info FROM music_series');

    const combinedMusicList = [...musicFromMusic, ...musicFromSeriesRows];

    if (combinedMusicList.length === 0) {
        return [];
    }

    // Fisher-Yates (Knuth) Shuffle 演算法
    // 這個函式會原地修改傳入的陣列
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            // 產生一個從 0 到 i (包含 i) 的隨機索引
            const j = Math.floor(Math.random() * (i + 1));
            // 交換 array[i] 和 array[j]
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 打亂合併後的列表
    shuffleArray(combinedMusicList);

    // 選取打亂後的前 20 個元素 (如果總數少於20，則選取所有)
    const numToSelect = Math.min(20, combinedMusicList.length);
    const randomSelection = combinedMusicList.slice(0, numToSelect);

    return randomSelection;
}
