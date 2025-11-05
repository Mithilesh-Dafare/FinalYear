"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import Webcam from "react-webcam";
import {
  ISpeechRecognition,
  ISpeechRecognitionEvent,
  ISpeechRecognitionErrorEvent,
  InterviewSessionProps,
} from "./SessionTypes";
import PrevNextBtn from "./PrevNextBtn";
import RecordingBtn from "./RecordingBtn";
import InterviewRecordingSection from "@/components/interview/InterviewRecordingSection";
import { Mic, Sparkles, Lightbulb, Zap, CheckCircle2, Video } from "lucide-react";

export default function InterviewSession({
  interview,
  onInterviewUpdate,
}: InterviewSessionProps) {
  const router = useRouter();
  // State management
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Refs
  const webcamRef = useRef<Webcam>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const timeRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize interview session
  useEffect(() => {
    if (interview?.questions?.length) {
      try {
        const firstUnansweredIndex = interview.questions.findIndex(
          (q) => !q.answer || q.answer.trim() === ""
        );
        const newIndex = firstUnansweredIndex === -1 ? 0 : firstUnansweredIndex;
        setCurrentIndex(newIndex);
        setUserAnswer(interview.questions[newIndex]?.answer || "");
      } catch (err) {
        setError("Error initializing interview. Please refresh the page");
      }
    }
  }, [interview]);

  // Update progress when current index changes
  useEffect(() => {
    if (interview?.questions?.length) {
      setProgress(Math.round((currentIndex / interview.questions.length) * 100));
    }
  }, [currentIndex, interview]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeRef.current) {
        clearInterval(timeRef.current);
      }
    };
  }, []);

  // Handle video recording completion
  const handleVideoRecordingComplete = useCallback((blob: Blob | null, url: string) => {
    setVideoBlob(blob);
    setVideoUrl(url);
  }, []);

  // Handle speech to text
  const handleSpeechToText = () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    startRecording();
  };

  const startRecording = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError("Speech Recognition is not supported in your browser. Try using Chrome or Edge");
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      setTranscript("");
      setRecordingTime(0);
      
      timeRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      recognition.onstart = () => {
        console.log("Speech recognition started");
        setIsRecording(true);
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimResults = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
            setUserAnswer(prev => {
              const trimmedPrev = prev.trim();
              return trimmedPrev ? `${trimmedPrev} ${transcript}` : transcript;
            });
          } else {
            interimResults += transcript;
          }
        }
        setTranscript(interimResults);
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        stopRecording();
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        stopRecording();
      };

      recognition.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setError("Failed to start speech recognition. Please try again");
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timeRef.current) {
      clearInterval(timeRef.current);
      timeRef.current = null;
    }
    setIsRecording(false);
    setTranscript("");
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Navigation between questions
  const handleNextQuestion = async () => {
    if (currentIndex < interview.questions.length - 1) {
      if (isRecording) stopRecording();
      await saveCurrentAnswer();
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setUserAnswer(interview.questions[newIndex]?.answer || "");
      setTranscript("");
    }
  };

  const handlePreviousQuestion = async () => {
    if (currentIndex > 0) {
      if (isRecording) stopRecording();
      await saveCurrentAnswer();
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setUserAnswer(interview.questions[newIndex]?.answer || "");
      setTranscript("");
    }
  };

  // Save current answer
  const saveCurrentAnswer = async (): Promise<boolean> => {
    if (!userAnswer.trim()) return false;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/interview/${interview._id}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionIndex: currentIndex,
          answer: userAnswer.trim(),
          recordingUrl: videoUrl || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save answer");
      }

      const data = await response.json();
      if (onInterviewUpdate && data.interview) {
        onInterviewUpdate(data.interview);
      }
      return true;
    } catch (err) {
      console.error("Error saving answer:", err);
      setError(err instanceof Error ? err.message : "Failed to save answer");
      return false;
    }
  };

  // Handle interview completion
  const handleCompleteInterview = async () => {
    // 1. Check for video blob
    if (!videoBlob) {
      alert("No video recorded. Please record your interview to complete it.");
      return;
    }

    setLoadingMessage("Uploading your recording...");
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // 2. Upload the video recording
      const formData = new FormData();
      formData.append("video", videoBlob, `interview-${interview._id}.webm`);

      const uploadRes = await fetch(
        `/api/interview/${interview._id}/upload-recording`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!uploadRes.ok) {
        throw new Error("Video upload failed. Please try again.");
      }

      setLoadingMessage("Finalizing analysis...");

      // 3. Finalize the interview (to trigger AI feedback)
      const completeRes = await fetch(
        `/api/interview/${interview._id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        if (errorData.unansweredCount) {
          throw new Error(
            `Please answer all questions before completing the interview. ${errorData.unansweredCount} questions remain unanswered`
          );
        }
        throw new Error(errorData.message || "Failed to finalize interview analysis.");
      }

      // 4. Redirect to results page on success
      router.push(`/interview/${interview._id}/results`);
      
    } catch (error: any) {
      console.error("Failed to complete interview:", error);
      setError(error.message || "An error occurred during completion.");
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      // If we have a video blob but no URL, upload it first
      if (videoBlob && !videoUrl) {
        setIsUploadingVideo(true);
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("No authentication token found");
          }

          const formData = new FormData();
          formData.append("video", videoBlob, `interview-${interview._id}-${currentIndex}.webm`);
          
          const uploadResponse = await fetch(
            `/api/interview/${interview._id}/upload-recording`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            }
          );

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || "Failed to upload video");
          }

          const uploadData = await uploadResponse.json();
          setVideoUrl(uploadData.url);
        } catch (uploadError) {
          console.error("Video upload error:", uploadError);
          throw new Error("Failed to upload video. Please try again.");
        } finally {
          setIsUploadingVideo(false);
        }
      }

      // Save the answer with the video URL
      await saveCurrentAnswer();

      // Move to next question or complete interview
      const nextIndex = currentIndex + 1;
      if (nextIndex < interview.questions.length) {
        setCurrentIndex(nextIndex);
        setUserAnswer(interview.questions[nextIndex]?.answer || "");
        setVideoBlob(null);
        setVideoUrl(null);
      } else {
        await handleCompleteInterview();
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!interview || !interview.questions) {
    return <div className="p-6 text-white">Loading interview data...</div>;
  }

  const currentQuestion = interview.questions[currentIndex];
  if (!currentQuestion) {
    return <div className="p-6 text-white">No questions found in this interview.</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6 text-white bg-[var(--input-bg)]/30 rounded-lg shadow-sm">
      {/* Navigation and progress */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-400">
          <div className="flex items-center gap-2">
            Question
            <span className="bg-gradient-to-br from-[#b87a9c] to-[#d8a1bc] text-white font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs shadow-lg shadow-[#b87a9c]/20">
              {currentIndex + 1}
            </span>{" "}
            <span>of {interview.questions.length}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <PrevNextBtn
            onClick={handlePreviousQuestion}
            disabled={currentIndex === 0 || isSubmitting}
            label="Previous"
          />
          <PrevNextBtn
            onClick={handleNextQuestion}
            disabled={currentIndex === interview.questions.length - 1 || isSubmitting}
            label="Next"
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full rounded-full h-2.5 bg-slate-800">
        <div
          className="bg-gradient-to-r from-[#b87a9c] to-[#d8a1bc] h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Video recording section */}
        <div className="lg:w-1/3 bg-gradient-to-r from-[#b87a9c]/20 to-[#d8a1bc]/10 rounded-xl backdrop-blur-sm border border-[#b87a9c]/30 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#b87a9c]/20 to-transparent p-6">
            <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
              <span className="h-5 w-1 bg-[#b87a9c] rounded-full"></span>
              Video Response
            </h1>
          </div>
          
          <div className="p-6">
            <InterviewRecordingSection
              interviewId={interview._id}
              onRecordingComplete={handleVideoRecordingComplete}
              initialVideoUrl={videoUrl}
            />
          </div>
        </div>

        {/* Question and answer section */}
        <div className="flex-1 space-y-6">
          {/* Question */}
          <div className="p-6 bg-gradient-to-r from-[#1e1e2d] to-[#2d1e2d] rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Question</h2>
            <p className="text-gray-300">{currentQuestion.text}</p>
          </div>

          {/* Answer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Your Answer</h2>
              <button
                type="button"
                onClick={handleSpeechToText}
                disabled={isSubmitting || isUploadingVideo}
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                <Mic className="w-4 h-4" />
                {isRecording ? `Recording... ${formatTime(recordingTime)}` : 'Use Voice Input'}
              </button>
            </div>

            <div className="relative">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type or record your answer here..."
                className="w-full min-h-[200px] p-4 bg-[#1e1e2d] border border-[#3a2a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#b87a9c] focus:border-transparent"
                disabled={isSubmitting || isUploadingVideo}
              />
              {transcript && (
                <div className="absolute bottom-2 left-2 right-2 p-2 text-sm text-gray-400 bg-black/50 rounded">
                  {transcript}
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || isUploadingVideo || !userAnswer.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-[#b87a9c] to-[#d8a1bc] text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isUploadingVideo ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isUploadingVideo ? 'Uploading Video...' : 'Saving...'}
                </span>
              ) : currentIndex < interview.questions.length - 1 ? (
                'Save & Continue'
              ) : (
                'Submit Interview'
              )}
            </button>

            {/* Error message */}
            {error && (
              <div className="p-3 text-red-500 bg-red-900/30 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
