"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import FormFeature from "../small-components/FormFeature";
import InterviwFormInputs from "../small-components/InterviwFormInputs";

interface NewInterviewFormProps {
  onClose: () => void;
  onStartInterview: (interviewData: any) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const TECH_KEYWORDS = [
  "javascript","typescript","react","node","python","java","c#","c++","go","rust",
  "aws","azure","gcp","docker","kubernetes","sql","mongodb","postgresql","mysql"
];

const NewInterviewForm = ({ onClose, onStartInterview }: NewInterviewFormProps) => {
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    jobRole: "",
    techStack: "",
    yearsOfExperience: 0,
    resumeText: "",
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const [status, setStatus] = useState({
    fileError: "",
    error: "",
    apiWarning: "",
    isSubmitting: false
  });

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetErrors = () => {
    setStatus(prev => ({ ...prev, fileError: "", error: "", apiWarning: "" }));
  };

  const validateInputs = () => {
    const hasResume = (inputMode === "upload" && resumeFile) || (inputMode === "paste" && form.resumeText.trim());
    if (!hasResume && (!form.jobRole.trim() || !form.techStack.trim())) {
      return "Provide a resume or fill Job role & Tech stack.";
    }

    if (inputMode === "upload" && resumeFile) {
      if (resumeFile.size > MAX_FILE_SIZE) return "File size must be under 5MB";
      if (resumeFile.type !== "application/pdf") return "Only PDF files allowed";
    }

    return "";
  };

  const prepareFormData = () => {
    const fd = new FormData();
    fd.append("jobRole", form.jobRole);
    fd.append("techStack", JSON.stringify(form.techStack.split(",").map(i => i.trim())));
    fd.append("yearsOfExperience", String(form.yearsOfExperience));

    if (inputMode === "upload" && resumeFile) {
      fd.append("resume", resumeFile);
      if (form.resumeText.trim()) fd.append("resumeText", form.resumeText);
    } else {
      fd.append("resumeText", form.resumeText);
      fd.append("resume", new Blob([]), "");
    }
    return fd;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    const validationMsg = validateInputs();
    if (validationMsg) {
      setStatus(prev => ({ ...prev, error: validationMsg }));
      return;
    }

    setStatus(prev => ({ ...prev, isSubmitting: true }));

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: prepareFormData()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(response.status === 429 ? "AI busy, try later" : data.message || "Error starting interview");
      }

      if (data.message?.includes("default questions")) {
        setStatus(prev => ({ ...prev, apiWarning: data.message }));
      }

      onStartInterview(data.interview);
    } catch (err: any) {
      setStatus(prev => ({ ...prev, error: err.message || "Unexpected error" }));
    } finally {
      setStatus(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const formIsOptional = resumeFile || form.resumeText.trim();

  return (
    <section className="flex w-full h-screen">
      <form onSubmit={handleSubmit} className="w-1/2 max-sm:w-full flex flex-col items-center justify-center">
        
        <div className="text-center mt-10">
          <h1 className="text-4xl font-semibold">Welcome Buddy!</h1>
          <p>Create your interview to start your journey!</p>
        </div>

        <div className="flex flex-col gap-4 w-[55%] max-sm:w-full max-sm:px-8 p-4 mt-6">

          {/* Inputs */}
          {[
            {
              label: "Job Role",
              key: "jobRole",
              placeholder: "Frontend Developer (Optional if resume)",
              required: !formIsOptional
            },
            {
              label: "Tech-Stack (comma-separated)",
              key: "techStack",
              placeholder: "React, NodeJs, TypeScript",
              required: !formIsOptional
            }
          ].map(({ label, key, placeholder, required }) => (
            <div key={key} className="w-full">
              <InterviwFormInputs
                label={label}
                type="text"
                placeholder={placeholder}
                value={(form as any)[key]}
                required={required}
                onChange={(e) => updateForm(key, e.target.value)}
              />
              <p className="text-xs text-zinc-500 mt-1">
                {formIsOptional ? "Optional — extracted if resume provided" : "Required if no resume"}
              </p>
            </div>
          ))}

          {/* Experience */}
          <div className="w-full">
            <InterviwFormInputs
              label="Years of Experience"
              type="number"
              min={0} max={50}
              value={form.yearsOfExperience || ""}
              onChange={(e) => updateForm("yearsOfExperience", Number(e.target.value) || 0)}
              placeholder="3 (Optional)"
            />
          </div>

          {/* Resume Mode Toggle */}
          <div>
            <div className="flex mb-2">
              {["upload", "paste"].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setInputMode(mode as any)}
                  className={`px-4 py-2 text-sm font-medium ${inputMode === mode ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"} ${mode === "upload" ? "rounded-l-lg" : "rounded-r-lg"}`}
                >
                  {mode === "upload" ? "Upload Resume" : "Paste Content"}
                </button>
              ))}
            </div>

            {/* Conditional Resume Input */}
            {inputMode === "upload" ? (
              <input
                className="border py-2 rounded-lg px-4 border-zinc-700 w-full"
                type="file"
                accept=".pdf"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
            ) : (
              <textarea
                className="w-full h-40 p-3 text-sm border rounded-lg border-zinc-700 bg-zinc-800 text-white"
                placeholder="Paste resume or type experience..."
                value={form.resumeText}
                onChange={(e) => updateForm("resumeText", e.target.value)}
              />
            )}

            {status.fileError && <p className="text-red-500 text-sm mt-1">{status.fileError}</p>}
          </div>

          {/* Warnings / Errors */}
          {status.apiWarning && <Alert text={status.apiWarning} type="warning" />}
          {status.error && <Alert text={status.error} type="error" />}

          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={status.isSubmitting}
              className="w-full bg-[#984CFF] text-white py-2 rounded-md hover:bg-[#974cffba]"
            >
              {status.isSubmitting ? "Creating..." : "Start Interview"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full border border-gray-300 py-2 rounded-md bg-white hover:bg-gray-50 dark:bg-gray-700 text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      <FormFeature />
    </section>
  );
};

const Alert = ({ text, type }: { text: string; type: "error" | "warning" }) => (
  <div className={`p-4 border-l-4 rounded-md ${type === "error" ? "border-red-600 bg-red-900/30" : "border-yellow-600 bg-yellow-900/30"}`}>
    <p className={`text-sm ${type === "error" ? "text-red-200" : "text-yellow-200"}`}>{text}</p>
  </div>
);

export default NewInterviewForm;
