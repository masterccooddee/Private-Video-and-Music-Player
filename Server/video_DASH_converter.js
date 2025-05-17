import ffmpeg from 'fluent-ffmpeg';
import { loading } from './loading.js';

export async function convertToDASH_single(inputFilePath, outputDir) {


    let startTime = Date.now();
    return new Promise((resolve, reject) => {

        ffmpeg.ffprobe(inputFilePath, (err, metadata) => {
            if (err) {
                console.error('Error reading file metadata:', err);
                return reject(err);
            }

            // 獲取影片的編碼格式
            const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
            const codecName = videoStream ? videoStream.codec_name : null;
            const pixFmt = videoStream ? videoStream.pix_fmt : null;

            console.log('Video codec:', codecName);
            console.log('Pixel format:', pixFmt);

            // 根據編碼格式決定是否使用 GPU
            const videoCodec = codecName === 'hevc' ? 'h264_nvenc' : 'copy';

        ffmpeg(inputFilePath)
                .videoCodec(videoCodec)
                .audioCodec('aac')
                .format('dash')
                .outputOptions([
                    '-use_template 1',
                    '-use_timeline 1',
                    '-seg_duration 10',
                    '-pix_fmt yuv420p', 
                ])
                .output(outputDir)
                .on('end', () => {
                    console.log('\nDASH conversion completed successfully!');
                    resolve(outputDir)        
                })
                .on('error', (err) => {
                    console.error('Error during DASH conversion:', err);
                    reject(err);
                })
                .on('progress', (progress) => {
                    loading(Math.ceil(progress.percent), 100, startTime);
                })
                .on('start', () => {
                    console.log('Start to convert to DASH of', inputFilePath);
                    
                })
                .run();
        });
    });
}

