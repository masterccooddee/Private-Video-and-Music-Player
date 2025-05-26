import React from "react";
import { WebSocket } from "ws";
import { useEffect, useState } from "react";

const VideoStatus = () => {

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
            console.log('WebSocket connection established');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received data:', data);
            // 在這裡處理接收到的數據
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            ws.close();
            console.log('WebSocket connection closed on component unmount');
        };
    }, []);

    return (
        <div>
            <h2>Video Status</h2>
            <p>WebSocket connection established. Check console for messages.</p>
        </div>
    );

}

export default VideoStatus;