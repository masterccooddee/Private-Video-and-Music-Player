import React from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export const VideoJS = (props) => {
    const videoRef = React.useRef(null);;
    const playerRef = React.useRef(null);
    const { options, onReady } = props;

    React.useEffect(() => {
        if (!playerRef.current && options.sources[0].src) {

            const player = (playerRef.current = videojs(videoRef.current, options, () => {
                player.log("player is ready");
                onReady && onReady(player);
            }));

            player.on('error', () => {
                console.error('Video.js encountered an error:', player.error());
            });
        }
        else {
            const player = playerRef.current;
            if (player) {
                player.autoplay(options.autoplay);
                player.src(options.sources);
                player.poster(options.poster);
            }
        }
    }, [options.sources]);

    React.useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    return (
        <div>
            <video
                ref={videoRef} // 將 <video> 元素綁定到 ref
                className="video-js vjs-default-skin" // 添加 Video.js 的 className
                controls
                preload="auto"
            ></video>
        </div>
    );
};

export default VideoJS;