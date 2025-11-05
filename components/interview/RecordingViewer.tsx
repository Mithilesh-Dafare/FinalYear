"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, Download, Trash2 } from "lucide-react";

interface RecordingViewerProps {
  recordingUrl: string;
  mimeType?: string;
  onDelete?: () => void;
  className?: string;
}

const RecordingViewer = ({
  recordingUrl,
  mimeType = "video/webm",
  onDelete,
  className = "",
}: RecordingViewerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", () => setIsPlaying(true));
    video.addEventListener("pause", () => setIsPlaying(false));
    video.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", () => setIsPlaying(true));
      video.removeEventListener("pause", () => setIsPlaying(false));
      video.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, [recordingUrl]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTime = pos * duration;
    
    videoRef.current.currentTime = seekTime;
    setProgress(pos * 100);
    setCurrentTime(seekTime);
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = recordingUrl;
    link.download = `interview-recording-${new Date().toISOString().split('T')[0]}.${mimeType.split('/')[1] || 'webm'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!recordingUrl) {
    return (
      <div className={`bg-zinc-900 rounded-lg flex items-center justify-center ${className}`} style={{ aspectRatio: '16/9' }}>
        <p className="text-zinc-500">No recording available</p>
      </div>
    );
  }

  return (
    <div className={`bg-zinc-900 rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={recordingUrl}
        className="w-full"
        style={{ aspectRatio: '16/9' }}
        controls={false}
        preload="metadata"
      />
      
      <div className="p-4 bg-zinc-800">
        {/* Progress bar */}
        <div 
          className="h-1.5 bg-zinc-700 rounded-full mb-2 cursor-pointer"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-blue-500 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 translate-x-1/2"></div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded-full transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
            
            <div className="text-sm text-zinc-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Download recording"
            >
              <Download className="w-5 h-5" />
            </button>
            
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
                aria-label="Delete recording"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingViewer;
