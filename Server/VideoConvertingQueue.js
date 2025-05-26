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
    
    return video_queue;
    
}

export function clearfinishedVideoQueue() {
    video_queue = video_queue.filter(video => video.percent < 100);
    return video_queue;
}