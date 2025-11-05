export interface Question {
  text: string;
  answer?: string;
  analysis?: {
    score: number;
    technicalFeedback: string;
    communicationFeedback: string;
    improvementSuggestions: string[];
  };
}

export interface Interview {
  _id: string;
  jobRole: string;
  techStack: string[];
  yearsOfExperience: number;
  status: string;
  questions: Question[];
  overallScore?: number;
  feedback?: {
    overallFeedback: string;
    strengths: string[];
    areasForImprovement: string[];
    nextSteps: string[];
  };
  createdAt: string;
  completedAt?: string;
}

export interface InterviewSessionProps {
  interview: Interview;
  onInterviewUpdate?: (updatedInterview: Interview) => void;
}

export interface ISpeechRecognition extends EventTarget {
  new (): ISpeechRecognition;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: ISpeechRecognitionEvent) => void;
  onerror: (event: ISpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

export interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    isFinal: boolean;
    [key: number]: {
      transcript: string;
    };
  }[];
}

export interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
