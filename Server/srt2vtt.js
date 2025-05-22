import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import iconv from 'iconv-lite';
import chardet from 'chardet';

// 檢查檔案編碼
function checkEncoding(filePath) {
    const encoding = chardet.detectFileSync(filePath);
    console.log(`Detected encoding for ${filePath}: ${encoding}`);
    return encoding;
}

// 將檔案轉換為 UTF-8
async function convertToUTF8(inputPath, outputPath, originalEncoding) {
    const fileBuffer = await fs.readFile(inputPath);
    const utf8Buffer = iconv.decode(fileBuffer, originalEncoding);
    await fs.writeFile(outputPath, utf8Buffer, 'utf8');
}

export default async function SRT2WVTT(input_path) {
    try {
        // 檢查檔案編碼
        const encoding = checkEncoding(input_path);

        // 如果編碼不是 UTF-8，則轉換為 UTF-8
        if (encoding !== 'UTF-8') {
            const utf8Path = input_path.replace(/\.srt$/, '.utf8.srt');
            await convertToUTF8(input_path, utf8Path, encoding); // 等待轉換完成
            input_path = utf8Path; // 使用轉換後的檔案
        }

        const stream = ffmpeg(input_path)
            .outputOptions('-f', 'webvtt') // 指定輸出格式為 WebVTT
            .on('error', (err) => {
                console.error('Error during conversion:', err);
                throw err;
            })
            .pipe(); // 將輸出作為 stream 返回

        return stream;
    } catch (err) {
        console.error('Error during conversion:', input_path);
        throw err;
    }
}

// console.log(checkEncoding('../../Video/The Great Gatsby/The.Great.Gatsby.2013.1080p.BluRay.x264.srt'));

// let stream = await SRT2WVTT('../../Video/The Great Gatsby/The.Great.Gatsby.2013.1080p.BluRay.x264.srt');
// stream.pipe(process.stdout);