import  { WebSocket } from 'ws';

const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received data:', data);
};