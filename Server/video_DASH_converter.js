import ffmpeg from 'fluent-ffmpeg';
import { loading } from './loading.js';
import si from 'systeminformation';
import path from 'node:path';
import { video_queue, clearfinishedVideoQueue } from './VideoConvertingQueue.js';
import updatevideoqueue from './VideoConvertingQueue.js';
import { clients } from './server.js';
import WebSocket from 'ws';

export async function convertToDASH_single(inputFilePath, outputDir) {


    let startTime = Date.now();
    return new Promise((resolve, reject) => {

        ffmpeg.ffprobe(inputFilePath, async (err, metadata) => {
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

            // 動態檢測顯卡並選擇編碼器
            const gpuInfo = await si.graphics();
            const gpuVendor = gpuInfo.controllers.map((item) => (item.vendor.toLowerCase()));
            let gpuSet = new Set(gpuVendor);
            let videoCodec;

            if (gpuSet.has('nvidia')) {
                videoCodec = codecName === 'hevc' ? 'h264_nvenc' : 'copy'; // NVIDIA 硬體加速
                console.log('Using NVIDIA GPU for encoding:', videoCodec);
            } else if (gpuSet.has('amd')) {
                videoCodec = codecName === 'hevc' ? 'h264_amf' : 'copy'; // AMD 硬體加速
                console.log('Using AMD GPU for encoding:', videoCodec);
            } else if (gpuSet.has('intel')) {
                videoCodec = codecName === 'hevc' ? 'h264_qsv' : 'copy'; // Intel Quick Sync Video
                console.log('Using Intel GPU for encoding:', videoCodec);
            } else {
                videoCodec = 'libx264'; // 默認使用軟體編碼
                console.log('No supported GPU detected. Falling back to software encoding:', videoCodec);
            }

            ffmpeg(inputFilePath)
                .videoCodec(videoCodec)
                .audioCodec('aac')
                .audioChannels(2)
                .audioBitrate('128k')
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
                    const filename = path.basename(inputFilePath);
                    clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            let updateinfo = updatevideoqueue(filename, Math.ceil(progress.percent), Math.ceil((Date.now() - startTime) / 1000));
                            client.send(JSON.stringify(updateinfo));
                            clearfinishedVideoQueue();
                        }
                    });
                    loading(Math.ceil(progress.percent), 100, startTime);
                })
                .on('start', () => {
                    console.log('Start to convert to DASH of', inputFilePath);
                    let convertingInfo = {
                        name: path.basename(inputFilePath),
                        percent: 0,
                        time: 0,
                    };
                    video_queue.push(convertingInfo);
                })
                .run();
        });
    });
}


