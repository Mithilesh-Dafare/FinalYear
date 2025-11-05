import InterviewBtn from "../interview/InterviewBtn";
import { useRouter } from "next/navigation";

interface ErrorInterviewProps {
  errors: string;
  bg: string;
  onRetry?: () => void;
  buttonText?: string;
}

const ErrorInterview = ({ 
  errors, 
  bg, 
  onRetry, 
  buttonText = "Return to Dashboard" 
}: ErrorInterviewProps) => {
  const router = useRouter();
  
  const handleButtonClick = () => {
    if (onRetry) {
      onRetry();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex flex-col items-center h-[80vh] justify-center">
      <div className="p-6 text-center">
        <div
          className={`bg-${bg}-100 text-${bg}-700 px-6 border-2 font-medium border-${bg}-700 py-3 rounded-md mb-4`}
        >
          {errors}
        </div>
        <InterviewBtn
          text={buttonText}
          onClick={handleButtonClick}
        />
      </div>
    </div>
  );
};

export default ErrorInterview;
