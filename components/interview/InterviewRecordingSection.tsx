"use client";
import { useState, useCallback } from "react";
import { Video, Upload as UploadIcon, VideoOff } from "lucide-react";
import InterviewRecorder from "./InterviewRecorder";
import VideoUploader from "./VideoUploader";

type RecordingMode = 'camera' | 'upload' | null;

interface InterviewRecordingSectionProps {
  interviewId: string;
  onRecordingComplete: (blob: Blob | null, url: string) => void;
  initialVideoUrl?: string | null;
  className?: string;
}

const InterviewRecordingSection = ({
  interviewId,
  onRecordingComplete,
  initialVideoUrl = null,
  className = "",
}: InterviewRecordingSectionProps) => {
  const [mode, setMode] = useState<RecordingMode>(initialVideoUrl ? null : 'camera');
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl);
  const [error, setError] = useState<string | null>(null);

  const handleRecordingComplete = useCallback((blob: Blob) => {
    setRecordingBlob(blob);
    const url = URL.createObjectURL(blob);
    setVideoUrl(url);
    onRecordingComplete(blob, url);
  }, [onRecordingComplete]);

  const handleUploadComplete = useCallback((url: string) => {
    setVideoUrl(url);
    setRecordingBlob(null);
    onRecordingComplete(null, url);
  }, [onRecordingComplete]);

  const handleRemoveVideo = useCallback(() => {
    if (recordingBlob) {
      URL.revokeObjectURL(videoUrl || '');
      setRecordingBlob(null);
    }
    setVideoUrl(null);
    setMode(null);
    onRecordingComplete(null, '');
  }, [recordingBlob, videoUrl, onRecordingComplete]);

  if (videoUrl) {
    return (
      <div className={`relative ${className}`}>
        <video
          src={videoUrl}
          controls
          className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
        />
        <button
          onClick={handleRemoveVideo}
          className="absolute top-2 right-2 p-2 text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
          title="Remove video"
        >
          <VideoOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (mode === 'camera') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Record your response</h3>
          <button
            onClick={() => setMode('upload')}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Or upload a video instead
          </button>
        </div>
        <InterviewRecorder
          interviewId={interviewId}
          onStop={handleRecordingComplete}
          onError={(err) => setError(err)}
        />
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'upload') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Upload your response</h3>
          <button
            onClick={() => setMode('camera')}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Or record with your camera
          </button>
        </div>
        <VideoUploader
          interviewId={interviewId}
          onUploadComplete={handleUploadComplete}
          onError={(err) => setError(err)}
        />
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="inline-flex rounded-lg shadow-sm">
        <button
          type="button"
          onClick={() => setMode('camera')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
        >
          <Video className="w-4 h-4 mr-2" />
          Record Video
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border-t border-b border-r border-gray-200 rounded-r-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
        >
          <UploadIcon className="w-4 h-4 mr-2" />
          Upload Video
        </button>
      </div>
    </div>
  );
};

export default InterviewRecordingSection;
