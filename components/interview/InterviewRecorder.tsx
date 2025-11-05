"use client";
import { useState, useRef, useEffect } from "react";

interface InterviewRecorderProps {
  interviewId: string;
  onStart?: () => void;
  onStop?: (recording: Blob) => void;
  onError?: (error: string) => void;
}

const InterviewRecorder = ({
  interviewId,
  onStart,
  onStop,
  onError,
}: InterviewRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      
      // Set up video preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (chunksRef.current.length === 0) return;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        
        if (onStop) {
          onStop(blob);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setHasPermission(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      if (onStart) onStart();
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setHasPermission(false);
      if (onError) onError("Could not access camera/microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Stop all tracks in the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-6 py-3 rounded-full ${
              isRecording 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-medium flex items-center gap-2 transition-colors`}
          >
            {isRecording ? (
              <>
                <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                Stop Recording
              </>
            ) : (
              <>
                <span className="w-3 h-3 bg-white rounded-full"></span>
                Start Recording
              </>
            )}
          </button>
          
          {isRecording && (
            <div className="bg-zinc-800 px-4 py-2 rounded-full text-white">
              {formatTime(recordingTime)}
            </div>
          )}
        </div>
        
        {hasPermission === false && (
          <p className="text-red-500 text-sm">
            Camera/microphone access is required to record the interview.
          </p>
        )}
      </div>

      <div className="relative w-full max-w-3xl mx-auto bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className={`w-full ${!isRecording && !hasPermission ? 'h-64' : ''} object-cover`}
          muted
          playsInline
        />
        {!isRecording && hasPermission !== false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
              <p>Camera is ready. Click "Start Recording" to begin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewRecorder;
