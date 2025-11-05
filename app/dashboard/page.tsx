"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import InterviewList from "@/components/interview/InterviewList";
import Loader from "@/components/Loader";
import InterviewBtn from "@/components/interview/InterviewBtn";
// import Button from '@/components/Button';

const Dashboard = () => {
  const router = useRouter();
  const { isAuthenticated, userData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[Dashboard] Auth state:', { isAuthenticated, userData });
    
    // Give some time for AuthContext to initialize after login
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        console.log('[Dashboard] Not authenticated after timeout, redirecting to login');
        router.push("/login");
      } else {
        console.log('[Dashboard] Authenticated, showing dashboard');
        setIsLoading(false);
      }
    }, 1000); // Wait 1 second for AuthContext to update

    // If already authenticated, show dashboard immediately
    if (isAuthenticated) {
      console.log('[Dashboard] Already authenticated, showing dashboard immediately');
      clearTimeout(timer);
      setIsLoading(false);
    }

    return () => clearTimeout(timer);
  }, [isAuthenticated, userData, router]);

  // loader
  if (isLoading) {
    return <Loader />;
  }

  const handleCreateInterview = () => {
    router.push(`/interview/new`);
  };

  return (
    <div className="p-10 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center justify-between w-full max-sm:flex-col max-sm:text-center">
          <div>
            <h1 className="text-3xl font-bold text-white sm:mb-2">
              Your Interviews
            </h1>
            <p className="text-gray-500 max-sm:text-sm">
              Practice your interview skills with AI-powered feedback
            </p>
          </div>

          <div className="max-sm:mt-4">
            <InterviewBtn
              onClick={handleCreateInterview}
              text="Create new Interview"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <InterviewList />
      </div>
    </div>
  );
};

export default Dashboard;
