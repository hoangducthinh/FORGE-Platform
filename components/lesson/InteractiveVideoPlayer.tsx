'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/voice-utils';

interface InteractiveVideoPlayerProps {
  videoUrl: string;
  title?: string;
}

export default function InteractiveVideoPlayer({
  videoUrl,
  title,
}: InteractiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          handleSeek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          handleSeek(Math.min(duration, currentTime + 5));
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    },
    [togglePlayPause, handleSeek, currentTime, duration, toggleMute, toggleFullscreen]
  );

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Check if URL is a YouTube embed
  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');

  return (
    <div
      className="group relative w-full overflow-hidden rounded-lg bg-black aspect-video"
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={`Video player: ${title || 'Lesson video'}`}
    >
      {isYouTube ? (
        <iframe
          width="100%"
          height="100%"
          src={videoUrl}
          title={title || 'Lesson video'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0"
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          className="h-auto w-full"
          poster="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop"
          controls
        />
      )}

      {!isYouTube && (
        <>
          {/* Progress Bar */}
          <div
            className="absolute bottom-12 left-0 h-1 bg-blue-600 transition-all"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Controls */}
          <div
            className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent transition-opacity ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="space-y-3 p-4">
              {/* Progress bar with hover seek */}
              <div
                className="h-1 cursor-pointer rounded-full bg-gray-600 hover:h-2 transition-all"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  handleSeek(percent * duration);
                }}
                role="slider"
                aria-label="Video progress"
                aria-valuenow={Math.round(progressPercentage)}
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
              >
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progressPercentage}%` }} />
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayPause}
                    className="rounded-lg p-2 hover:bg-white/20 transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="rounded-lg p-2 hover:bg-white/20 transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5 text-white" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-white" />
                    )}
                  </button>

                  <div className="text-sm font-mono text-white">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Playback Rate */}
                  <select
                    value={playbackRate}
                    onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                    className="rounded-lg bg-white/20 px-2 py-1 text-sm text-white hover:bg-white/30 transition-colors"
                    aria-label="Playback speed"
                  >
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                  </select>

                  <button
                    onClick={toggleFullscreen}
                    className="rounded-lg p-2 hover:bg-white/20 transition-colors"
                    aria-label="Fullscreen"
                  >
                    <Maximize2 className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Keyboard hints */}
              <div className="text-xs text-gray-300">
                <p>Space: play/pause | ← →: seek | M: mute | F: fullscreen</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
