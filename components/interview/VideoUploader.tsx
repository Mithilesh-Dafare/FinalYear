"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Upload, X, CheckCircle, Video, AlertCircle } from "lucide-react";

interface VideoUploaderProps {
  interviewId: string;
  onUploadComplete: (url: string) => void;
  onError: (error: string) => void;
  initialVideoUrl?: string | null;
}

const VideoUploader = ({
  interviewId,
  onUploadComplete,
  onError,
  initialVideoUrl = null,
}: VideoUploaderProps) => {
  const { getToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(!!initialVideoUrl);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl);
  const [error, setError] = useState<string | null>(null);

  const uploadVideo = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("video", file);

      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            setVideoUrl(response.url);
            setIsComplete(true);
            onUploadComplete(response.url);
            resolve();
          } else {
            const error = xhr.responseText ? JSON.parse(xhr.responseText) : { error: 'Upload failed' };
            reject(new Error(error.error || 'Upload failed'));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };
      });

      xhr.open('POST', `/api/interview/${interviewId}/upload-recording`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

      await uploadPromise;
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload video';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        setError("File size must be less than 100MB");
        return;
      }
      uploadVideo(file);
    }
  };

  const handleRetry = () => {
    setError(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        uploadVideo(file);
      }
    };
    input.click();
  };

  if (isComplete && videoUrl) {
    return (
      <div className="relative w-full max-w-3xl mx-auto bg-black rounded-lg overflow-hidden">
        <video
          src={videoUrl}
          controls
          className="w-full max-h-[500px] object-contain bg-black"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={() => {
              setVideoUrl(null);
              setIsComplete(false);
              onUploadComplete('');
            }}
            className="p-2 text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
            title="Remove video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center transition-colors hover:border-blue-500 dark:hover:border-blue-400">
        {isUploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Uploading... {uploadProgress}%
            </p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 mx-auto text-red-500 bg-red-100 rounded-full dark:bg-red-900/30">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className="text-red-500">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 mx-auto text-gray-400 bg-gray-100 rounded-full dark:bg-gray-800">
              <Video className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                MP4, WebM up to 100MB
              </p>
            </div>
            <input
              type="file"
              accept="video/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Or record directly using your camera
        </p>
      </div>
    </div>
  );
};

export default VideoUploader;
