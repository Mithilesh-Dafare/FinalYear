"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/Loader";
import ErrorInterview from "@/components/errors/ErrorInterview";
import InterviewSession from "@/components/interviewSession/InterviewSession";
import InterviewNav from "@/components/interview/InterviewNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Interview } from "@/components/interviewSession/SessionTypes";

interface InterviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

function InterviewPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { isAuthenticated, getToken } = useAuth();
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const interviewId = unwrappedParams.id;

  const fetchInterview = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!interviewId) {
      setError("No interview ID provided");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/interview/${interviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch interview");
      }

      const data = await response.json();
      setInterview(data.interview);
    } catch (err) {
      console.error("Error fetching interview:", err);
      setError(err instanceof Error ? err.message : "Failed to load interview");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterview();
  }, [interviewId, isAuthenticated, getToken]);

  const handleInterviewUpdate = (updatedInterview: Interview) => {
    setInterview(updatedInterview);

    if (updatedInterview.status === "completed") {
      window.location.href = `/interview/${interviewId}/results`;
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <ErrorBoundary 
        fallback={
          <ErrorInterview 
            errors={error} 
            bg="red" 
          />
        }
      >
        <ErrorInterview 
          errors={error} 
          bg="red" 
          onRetry={fetchInterview}
        />
      </ErrorBoundary>
    );
  }

  if (!interview) {
    return (
      <ErrorBoundary 
        fallback={
          <ErrorInterview 
            errors="Failed to load interview" 
            bg="yellow" 
          />
        }
      >
        <ErrorInterview 
          errors="Interview not found" 
          bg="yellow" 
          onRetry={() => router.push('/dashboard')}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary 
      fallback={
        <ErrorInterview 
          errors="Something went wrong with the interview session" 
          bg="red"
          onRetry={() => window.location.reload()}
        />
      }
    >
      <div className="min-h-screen bg-gray-900">
        <InterviewNav interview={interview} />
        <main className="container mx-auto px-4 py-8">
          <InterviewSession
            interview={interview}
            onInterviewUpdate={handleInterviewUpdate}
          />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const router = useRouter();
  const { isAuthenticated, getToken } = useAuth();
  return (
    <ErrorBoundary 
      fallback={
        <ErrorInterview 
          errors="Something went wrong" 
          bg="red"
          onRetry={() => window.location.reload()}
        />
      }
    >
      <InterviewPageContent params={params} />
    </ErrorBoundary>
  );
}
