import ffmpeg from "fluent-ffmpeg";
import path from "path";

let converting_set = new Set();
let convert_promise = new Map();
export async function convertAudio(audio_path, name) {

    // 檢查是否是正在轉換的影片
    if (converting_set.has(name)) {
        // 如果影片正在轉換，返回該轉換的 Promise
        return convert_promise.get(name);
    }

    let output_path = path.join('..','public','tmp', `${name}.mp3`);

    const convert_audio =  new Promise((resolve, reject) => {
        ffmpeg(audio_path)
            .audioCodec("libmp3lame")
            .audioBitrate("128k")
            .on("end", async () => {
                console.log(`${name} conversion finished`);
                resolve(`/tmp/${name}.mp3`);
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

// let audiopath = await convertAudio('D:\\School\\3\\JS\\Project_MultiMediaPlayer\\Music\\003. 天使にふれたよ!.m4a', '003. 天使にふれたよ!');
// console.log(audiopath);