import React from "react";
import SubtitlesOctopus from "../../../public/libass-wasm/dist/js/subtitles-octopus.js";


export const VideoJS = (props) => {
    const videoRef = React.useRef(null);;
    const playerRef = React.useRef(null);
    const { options, onReady } = props;

    React.useEffect(() => {
        console.log("something changed in VideoJS", options);
        if (!playerRef.current && options.sources[0].src) {

            const player = (playerRef.current = window.videojs(videoRef.current, options, () => {
                player.log("player is ready");
                onReady && onReady(player);
                const subtitles_arr = options.sub || [];
                console.log('Subtitles:', subtitles_arr);
                // 添加多個字幕選項
                if (subtitles_arr.length === 0) {
                    console.log('No subtitles available');
                    return;
                }
                const subtitles = subtitles_arr.map((sub, index) => ({
                    label: `${index + 1}`,
                    srclang: 'zh-TW',
                    subUrl: sub,
                }));

                subtitles.forEach(sub => {
                    if (sub.subUrl.includes('.srt') || sub.subUrl.includes('.vtt')) {
                        player.addRemoteTextTrack({
                            kind: 'subtitles',
                            label: sub.label,
                            srclang: sub.srclang,
                            src: sub.subUrl,
                            default: false,
                        }, false);
                    } else {
                        // 使用 SubtitlesOctopus
                        player.addRemoteTextTrack({
                            kind: 'subtitles',
                            label: sub.label,
                            srclang: sub.srclang,
                            default: false,
                        }, false);
                    }

                });

                let subtitlesEnabled = false;
                let octopusInstance = null;

                // 監聽字幕選擇事件

                player.textTracks().addEventListener('change', () => {
                    const activeTrack = Array.from(player.textTracks()).find(track => track.mode === 'showing');
                    if (activeTrack) {
                        const selectedSubtitle = subtitles.find(sub => sub.label === activeTrack.label);
                        if (selectedSubtitle) {
                            // 啟用 SubtitlesOctopus
                            if (octopusInstance) {
                                octopusInstance.dispose(); // 銷毀當前的實例
                            }
                            if (selectedSubtitle.subUrl.includes('.vtt') || selectedSubtitle.subUrl.includes('.srt')) {
                                octopusInstance = null; // 如果是 VTT，則不使用 SubtitlesOctopus

                            } else {
                                // 使用 SubtitlesOctopus
                                octopusInstance = null; // 先清除舊的實例
                                const options = {
                                    video: player.el().querySelector('video'),
                                    subUrl: selectedSubtitle.subUrl,
                                    fonts: ['/fonts/SourceHanSansTC-Medium.otf'],
                                    debug: true,
                                    workerUrl: '/libass-wasm/dist/js/subtitles-octopus-worker.js',
                                };
                                octopusInstance = new SubtitlesOctopus(options);
                                subtitlesEnabled = true;
                                console.log(`SubtitlesOctopus enabled for ${selectedSubtitle.label}`);
                            }

                        }
                    } else {
                        // 關閉 SubtitlesOctopus
                        if (subtitlesEnabled && octopusInstance) {
                            octopusInstance.dispose();
                            octopusInstance = null;
                            subtitlesEnabled = false;
                            console.log('SubtitlesOctopus disabled');
                        }
                    }
                });
            }));
            
            

            player.on('error', () => {
                console.error('Video.js encountered an error:', player.error());
            });
        }
        else {
            const player = playerRef.current;
            if (player) {
                if (player.src() !== options.sources[0].src) {
                    player.src(options.sources);
                }
                player.autoplay(options.autoplay);
                player.poster(options.poster);
            }
        }
    }, [options, onReady]);

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