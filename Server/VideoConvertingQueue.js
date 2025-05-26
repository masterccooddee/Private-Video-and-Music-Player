import path from 'path';

export let video_queue = [];

export default function UpdateVideoConvertingPercent(videoPath, percent = 0, timeduration = 0) {
    
    const videoName = path.basename(videoPath);
    const index = video_queue.findIndex(video => video.name === videoName);
    
    if (index !== -1) {
        video_queue[index].percent = percent;
        video_queue[index].time = timeduration;
    } else {
        console.warn(`Video not found in queue: ${videoName}`);
    }
    
    // Optionally, you can log the updated queue for debugging
    // console.log('Updated Video Queue:', video_queue);

    return video_queue;
    
}