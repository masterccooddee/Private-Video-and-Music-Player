import { parseFile } from 'music-metadata';
import fs from 'fs/promises';

async function findCoverofMusic(musicpath) {
    try {
        const metadata = await parseFile(musicpath);

        // 檢查是否有封面
        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const cover = metadata.common.picture[0]; // 取得第一個封面
            console.log(cover.format);
            const coverPath = `./cover.jpg`;
            await fs.writeFile(coverPath, cover.data); // 將封面儲存為檔案
            console.log('Cover extracted and saved to:', coverPath);
            return coverPath;
        } else {
            console.log('No cover found in:', musicpath);
            return null;
        }
    } catch (error) {
        console.error('Error extracting cover from music file:', error);
        return null;
    }
}

// 測試
await findCoverofMusic("..\\..\\Music\\003. 天使にふれたよ!.m4a");
