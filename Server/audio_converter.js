import ffmpeg from "fluent-ffmpeg";
import path from "path";

export async function convertAudio(audio_path, name) {

    let output_path = path.join('..','public','tmp', `${name}.mp3`);

    return new Promise((resolve, reject) => {
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
    
}

// let audiopath = await convertAudio('D:\\School\\3\\JS\\Project_MultiMediaPlayer\\Music\\003. 天使にふれたよ!.m4a', '003. 天使にふれたよ!');
// console.log(audiopath);