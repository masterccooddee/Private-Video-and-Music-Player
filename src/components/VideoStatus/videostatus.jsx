import React from "react";
import { ProgressBar } from 'primereact/progressbar';

import './videostatus.css';

export const VideoStatus = ({videoStatus}) => {
    

    return (
        <div>
            
            {videoStatus.length > 0 ? (
                <div className="videostatuscontainer">
                     {videoStatus.map((item, index) => (
                        
                        <div key={index} className="videoStatus">
                            <p className="videoname">{`${item.name}`}</p>
                            <div className="barwithtime">
                                 <ProgressBar value={item.percent}></ProgressBar>
                                 <p className="time insideword">{`Via: ${changeTimeFormat(item.time)}`}</p>
                                 <p className="speed insideword">{caulcSpeed(item.time,item.percent).speed}</p>
                                 <p className="esttime insideword">{caulcSpeed(item.time,item.percent).est}</p>
                            </div>
                        </div>
                    ))} 
                    
                </div>
            ) : (
                <p className="notConverting">沒有影片正在轉換</p>
            )}
            
        </div>
    );

}

function changeTimeFormat(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function caulcSpeed(elapsedTime, percent) {
    if (percent === 0) return {
        speed: '0.00 Percent/s',
        est: 'EST:\n--:--:--'
    };
    const speed = percent / elapsedTime;
    const esttime = (100 - percent) / speed;
    const speed_str = `${(speed).toFixed(2)} Percent/s`;

    const est_hours = Math.floor(esttime / 3600);
    const est_minutes = Math.floor((esttime % 3600) / 60);
    const est_seconds = Math.floor(esttime % 60);
    const est_str = `EST: ${est_hours.toString().padStart(2, '0')}:${est_minutes.toString().padStart(2, '0')}:${est_seconds.toString().padStart(2, '0')}`;
    return {
        speed: speed_str,
        est: est_str
    };
}

export default VideoStatus;