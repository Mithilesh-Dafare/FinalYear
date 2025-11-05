"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Calendar, Clock, Video } from "lucide-react";
import Link from "next/link";
import RecordingViewer from "@/components/interview/RecordingViewer";

interface Recording {
  _id: string;
  jobRole: string;
  techStack: string[];
  createdAt: string;
  recording: {
    url: string;
    mimeType: string;
    duration: number;
    size: number;
  };
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchRecordings = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await fetch("/api/interview/recordings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch recordings");
        }

        const data = await response.json();
        setRecordings(data.recordings || []);
      } catch (err) {
        console.error("Error fetching recordings:", err);
        setError("Failed to load recordings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, [isAuthenticated, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-7xl mx-auto p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white sm:mb-2">
              My Recordings
            </h1>
            <p className="text-gray-500">
              Review and manage your interview recordings
            </p>
          </div>
          <Link
            href="/interview/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors whitespace-nowrap text-sm"
          >
            New Interview
          </Link>
        </div>

        {selectedRecording ? (
          <div className="mb-8">
            <button
              onClick={() => setSelectedRecording(null)}
              className="mb-4 flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to list
            </button>
            
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-white mb-3">
                  {selectedRecording.jobRole}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(selectedRecording.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatDuration(selectedRecording.recording.duration)}</span>
                  </div>
                  <div className="flex items-center">
                    <Video className="h-4 w-4 mr-1" />
                    <span>{formatFileSize(selectedRecording.recording.size)}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <RecordingViewer
                    recordingUrl={selectedRecording.recording.url}
                    mimeType={selectedRecording.recording.mimeType}
                    className="w-full"
                  />
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-white mb-3">
                    Technologies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecording.techStack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#2a2a2a] text-blue-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden">
            {recordings.length === 0 ? (
              <div className="text-center p-10">
                <div className="mx-auto w-20 h-20 bg-[#1f1f1f] rounded-full flex items-center justify-center mb-5">
                  <Video className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                  No recordings yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Start a new interview to record your first session and track your progress.
                </p>
                <Link
                  href="/interview/new"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm"
                >
                  Start New Interview
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-200">
                {recordings.map((recording) => (
                  <li key={recording._id}>
                    <div className="p-5 hover:bg-[#1f1f1f] transition-colors border-b border-[#2a2a2a] last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <Video className="flex-shrink-0 h-5 w-5 text-zinc-500 mr-2" />
                            <p className="text-sm font-medium text-white truncate text-base">
                              {recording.jobRole}
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                              <span className="text-sm">{formatDate(recording.createdAt)}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
                              <span className="text-sm">{formatDuration(recording.recording.duration)}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs bg-[#2a2a2a] text-gray-300 px-2.5 py-1 rounded">
                                {recording.recording.mimeType.split("/")[1].toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button
                            onClick={() => setSelectedRecording(recording)}
                            className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
