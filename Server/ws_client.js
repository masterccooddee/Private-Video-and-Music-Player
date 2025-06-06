import  { WebSocket } from 'ws';
import { loading } from './loading.js';
import process from 'node:process';

const ws = new WebSocket('ws://localhost:8080');
process.stdout.write('\x1b[?25l');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const notcompletedVideos = data.filter(item => !(item.finished));
    console.clear();
    notcompletedVideos.forEach(item => {
        
        console.log(item.name);
        loading(item.percent, 100, Date.now() - item.time * 1000);
        process.stdout.write('\n');
    });

};