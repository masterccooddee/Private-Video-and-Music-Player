
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