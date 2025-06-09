import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";

let converting_set = new Set();
let convert_promise = new Map();
async function convertAudio(audio_path, name) {

    // 檢查是否是正在轉換的影片
    if (converting_set.has(name)) {
        // 如果影片正在轉換，返回該轉換的 Promise
        return convert_promise.get(name);
    }

    let output_path = path.join('..','public','music_tmp', `${name}.mp3`);

    const convert_audio =  new Promise((resolve, reject) => {
        ffmpeg(audio_path)
            .audioCodec("libmp3lame")
            .audioBitrate("128k")
            .on("end", async () => {
                console.log(`${name} conversion finished`);
                resolve(`/music_tmp/${name}.mp3`);
            })
            .on("error", (err) => {
                console.error("Error during audio conversion: ", err);
                reject(err);
            })
            .save(output_path);
    });

    convert_promise.set(name, convert_audio);
    converting_set.add(name); // 標記為正在轉換
    convert_audio.finally(() => {
        converting_set.delete(name); // 轉換完成後移除標記
        convert_promise.delete(name); // 轉換完成後移除 Promise
    });
    return convert_audio;
    
}

export async function checkAudioSupport(music_path, name, output) {

    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(music_path, async(err, metadata) => {

            if (err){
                console.error('Error reading file metadata:', err);
                reject(err);
                return;
            }

            const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
            if (!audioStream) {
                console.error('No audio stream found in the file:', music_path);
                reject(new Error('No audio stream found'));
                return;
            }

            if (audioStream.codec_name == 'alac') {
                try {
                    await fs.access(path.join('..', 'public', 'music_tmp'));
                }
                catch {
                    await fs.mkdir(path.join('..', 'public', 'music_tmp'), { recursive: true });
                }
                const converted_path = await convertAudio(music_path, name);
                resolve(converted_path);
            }
            else{
                resolve(output); // 如果音訊格式已經是支援的格式，直接返回原始路徑
            }

        });
    });
    

}


// let audiopath = await convertAudio('D:\\School\\3\\JS\\Project_MultiMediaPlayer\\Music\\003. 天使にふれたよ!.m4a', '003. 天使にふれたよ!');
// console.log(audiopath);