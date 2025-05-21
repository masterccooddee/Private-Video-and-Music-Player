
import ffmpeg from 'fluent-ffmpeg';

export default async function SRT2WVTT(input_path) {
    return new Promise((resolve, reject) => {
        try {
            const stream = ffmpeg(input_path)
                .outputOptions('-f', 'webvtt') // 指定輸出格式為 WebVTT
                .on('error', (err) => {
                    console.error('Error during conversion:', err);
                    reject(err);
                })
                .pipe(); // 將輸出作為 stream 返回

            resolve(stream);
        } catch (err) {
            reject(err);
        }
    });
}

// 使用範例
// (async () => {
//     try {
//         const stream = await SRT2WVTTStream('../../Video/The Office/The.Office.US.S09E01.1080p.BluRay.x265-RARBG.srt');

//         // 將 stream 寫入到標準輸出（或其他地方）
//         stream.pipe(process.stdout);
//     } catch (err) {
//         console.error('Error:', err);
//     }
// })();

// SRT2WVTT('C:\\Users\\arthu\\Desktop\\School\\3\\JS\\Project\\Video\\The Office\\The.Office.US.S09E02.1080p.BluRay.x265-RARBG.srt',
//     'output.vtt'
// )