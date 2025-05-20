import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function watchingFile() {

    const videoDir = path.join(__dirname, '../../Video');
    const musicDir = path.join(__dirname, '../../Music');

    const watcher = chokidar.watch([videoDir, musicDir], {
        persistent: true,
        ignoreInitial: true, // 忽略初始事件
        ignored: /(^|[\/\\])\../, // 忽略隱藏文件
        awaitWriteFinish: {
            stabilityThreshold: 2000, // 等待穩定時間
            pollInterval: 100 // 輪詢間隔
        }

    });

    watcher.on('ready', () => {
        console.log('Watching for file changes...');
    });

    watcher.on('change', (filePath) => {
        console.log(`File changed: ${filePath}`);
        // 在這裡可以添加你需要執行的操作，例如重新載入播放器或更新列表
        // 例如：reloadPlayer();
    });

    watcher.on('add', (filePath) => {
        console.log(`File added: ${filePath}`);
        // 在這裡可以添加你需要執行的操作，例如重新載入播放器或更新列表
        // 例如：reloadPlayer();
    });

    watcher.on('addDir', (dirPath) => {
        console.log(`Directory added: ${dirPath}`);
        // 在這裡可以添加你需要執行的操作，例如重新載入播放器或更新列表
        // 例如：reloadPlayer();
    });

    watcher.on('unlinkDir', (dirPath) => {
        console.log(`Directory removed: ${dirPath}`);
        // 在這裡可以添加你需要執行的操作，例如重新載入播放器或更新列表
        // 例如：reloadPlayer();
    });

    watcher.on('unlink', (filePath) => {
        console.log(`File removed: ${filePath}`);
        // 在這裡可以添加你需要執行的操作，例如重新載入播放器或更新列表
        // 例如：reloadPlayer();
    });

    watcher.on('error', (error) => {
        console.error(`Watcher error: ${error}`);
    });


}

watchingFile();