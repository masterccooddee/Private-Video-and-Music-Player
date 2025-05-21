import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function watchingFile(db, redis) {
    const videoDir = path.join(__dirname, '../../Video');
    const musicDir = path.join(__dirname, '../../Music');

    const watcher = chokidar.watch([videoDir, musicDir], {
        persistent: true,
        ignoreInitial: true, // 忽略初始事件
        ignored: /(^|[/\\])\../, // 忽略隱藏文件
        awaitWriteFinish: {
            stabilityThreshold: 200, // 等待穩定時間
            pollInterval: 100, // 輪詢間隔
        },
    });

    // 用於暫存 unlink 和 unlinkDir 的路徑
    const unlinkCache = new Map();
    const unlinkDirCache = new Map();

    watcher.on('ready', () => {
        console.log('Watching for file and directory changes...');
    });

    // 偵測檔案變更
    watcher.on('change', (filePath) => {
        console.log(`File changed: ${filePath}`);
        // 在這裡可以添加你需要執行的操作，例如重新載入播放器或更新列表
    });

    // 偵測檔案新增
    watcher.on('add', async(filePath) => {
        console.log(`File added: ${filePath}`);
        // 檢查是否是檔案改名
        const oldPath = Array.from(unlinkCache.keys()).find((oldFilePath) => {
            return path.dirname(oldFilePath) === path.dirname(filePath);
        });

        if (oldPath) {
            console.log(`File renamed from ${oldPath} to ${filePath}`);
            await handlefileRename(oldPath, filePath, db, redis);
            unlinkCache.delete(oldPath); // 從緩存中移除
        } else {
            console.log(`New file added: ${filePath}`);
        }
    });

    // 偵測檔案刪除
    watcher.on('unlink', (filePath) => {
        console.log(`File removed: ${filePath}`);
        // 將檔案路徑暫存到緩存中
        unlinkCache.set(filePath, Date.now());

        // 設置一個超時機制，避免長時間保留無效的 unlink 緩存
        setTimeout(() => {
            if (unlinkCache.has(filePath)) {
                console.log(`File truly removed: ${filePath}`);
                unlinkCache.delete(filePath);
            }
        }, 500); // 3 秒後清除緩存
    });

    // 偵測資料夾新增
    watcher.on('addDir', (dirPath) => {
        console.log(`Directory added: ${dirPath}`);
        // 檢查是否是資料夾改名
        const oldDirPath = Array.from(unlinkDirCache.keys()).find((oldPath) => {
            return path.dirname(oldPath) === path.dirname(dirPath);
        });

        if (oldDirPath) {
            console.log(`Directory renamed from ${oldDirPath} to ${dirPath}`);
            unlinkDirCache.delete(oldDirPath); // 從緩存中移除
        } else {
            console.log(`New directory added: ${dirPath}`);
        }
    });

    // 偵測資料夾刪除
    watcher.on('unlinkDir', (dirPath) => {
        console.log(`Directory removed: ${dirPath}`);
        // 將資料夾路徑暫存到緩存中
        unlinkDirCache.set(dirPath, Date.now());

        // 設置一個超時機制，避免長時間保留無效的 unlinkDir 緩存
        setTimeout(() => {
            if (unlinkDirCache.has(dirPath)) {
                console.log(`Directory truly removed: ${dirPath}`);
                unlinkDirCache.delete(dirPath);
            }
        }, 500); // 3 秒後清除緩存
    });

    watcher.on('error', (error) => {
        console.error(`Watcher error: ${error}`);
    });
}

async function handlefileRename(oldPath, newPath,db, redis) {
    // console.log(`File renamed from ${oldPath} to ${newPath}`);
    
    if(oldPath.includes('Video')) {
        let fileExt = path.extname(oldPath).toLowerCase();
        
        // poster改名
        if (fileExt === '.jpg' || fileExt === '.png' || fileExt === '.jpeg' || fileExt === '.webp')
        {
            const oldname = oldPath.replace(/\\+/g, '/').match(/\/Video.*/)[0];
            const newname = newPath.replace(/\\+/g, '/').match(/\/Video.*/)[0];
            await db.get('UPDATE videos SET poster = ? WHERE poster = ?', [newname, oldname]);
        }
        // 影片改名
        else if (fileExt === '.mp4' || fileExt === '.mkv' || fileExt === '.avi') {
            let file = await db.get('SELECT * FROM videos WHERE path = ?', [oldPath]);
            if (file !== undefined) {
                await db.get('UPDATE videos SET path = ? WHERE path = ?', [newPath, oldPath]);
            }
            else{
                await db.get('UPDATE video_series SET path = ? WHERE path = ?', [newPath, oldPath]);
            }

        }
        // 字幕改名
        else if (fileExt === '.srt' || fileExt === '.vtt '|| fileExt ==='.ass') {
            const oldname = oldPath.replace(/\\+/g, '/').match(/\/Video.*/)[0];
            const newname = newPath.replace(/\\+/g, '/').match(/\/Video.*/)[0];
            const result = await db.get('SELECT subtitle FROM videos WHERE subtitle LIKE ?', [`%${oldname}%`]);
    
            if (result && result.subtitle) {
                // 將字串解析為陣列
                let subtitles = JSON.parse(result.subtitle);
                // 找到舊的字幕路徑並替換為新的路徑
                const index = subtitles.indexOf(oldname);
                if (index !== -1) {
                    subtitles[index] = newname;

                    // 將更新後的陣列轉換回字串
                    const updatedSubtitles = JSON.stringify(subtitles);

                    // 更新資料庫中的字幕路徑
                    await db.run('UPDATE videos SET subtitle = ? WHERE subtitle = ?', [updatedSubtitles, result.subtitle]);
                    console.log(`Updated subtitles: ${oldname} -> ${newname}`);
                } else {
                    console.log(`Old subtitle path not found: ${oldname}`);
                }
            } else {
                const result = await db.get('SELECT subtitle FROM video_series WHERE subtitle LIKE ?', [`%${oldname}%`]);
                if (result && result.subtitle) {
                    // 將字串解析為陣列
                    let subtitles = JSON.parse(result.subtitle);

                    // 找到舊的字幕路徑並替換為新的路徑
                    const index = subtitles.indexOf(oldname);
                    if (index !== -1) {
                        subtitles[index] = newname;

                        // 將更新後的陣列轉換回字串
                        const updatedSubtitles = JSON.stringify(subtitles);

                        // 更新資料庫中的字幕路徑
                        await db.run('UPDATE video_series SET subtitle = ? WHERE subtitle = ?', [updatedSubtitles, result.subtitle]);
                        console.log(`Updated subtitles: ${oldname} -> ${newname}`);
                    } else {
                        console.log(`Old subtitle path not found: ${oldname}`);
                    }
                }
            }
        }
    }
    else if(oldPath.includes('Music')) {
        const reg = /music:(?<music_id>\d+)/;
        const parseID = oldPath.match(reg);
        const music_id = parseID.groups.music_id;
        redis.del(`music:${music_id}`);
    }
    
}
// import sqlite3 from 'sqlite3';
// import { open } from 'sqlite';
// let db = await open({
//     filename: 'media.db',
//     driver: sqlite3.Database
// });
// let file = await db.get('SELECT name FROM videos WHERE subtitle LIKE ?', [`%/Video/shelter/[SweetSub&LoliHouse] Shelter [BDRip 1920x1080 AVC-yuv420p10 FLAC].TC.ass%`]);
// console.log(file);