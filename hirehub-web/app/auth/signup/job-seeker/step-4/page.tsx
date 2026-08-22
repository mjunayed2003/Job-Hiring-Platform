"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSetupJobSeekerEducationMutation } from "@/redux/services/authApi";

interface EducationEntry {
  institution: string;   
  degreeName: string;    
  startDate: string;
  completionYear: string; 
  isCurrent: boolean;    
}

export default function Step4Education() {
  const router = useRouter();

  const [educations, setEducations] = useState<EducationEntry[]>([
    { institution: "", degreeName: "", startDate: "", completionYear: "", isCurrent: false }
  ]);
  const [error, setError] = useState("");

  const [setupEducation, { isLoading }] = useSetupJobSeekerEducationMutation();

  const addEducation = () => {
    setEducations([...educations, { institution: "", degreeName: "", startDate: "", completionYear: "", isCurrent: false }]);
  };

  const removeEducation = (index: number) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: string | boolean) => {
    const updated = [...educations];
    updated[index] = { ...updated[index], [field]: value };
    setEducations(updated);
  };

  const handleNext = async () => {
    setError("");

    try {
      const normalizedEducations = educations.map((e) => ({
        institution: e.institution.trim(),
        degreeName: e.degreeName.trim(),
        startDate: e.startDate.trim(),
        completionYear: e.completionYear.trim(),
        isCurrent: e.isCurrent,
      }));

      const hasAnyCompleteEducation = normalizedEducations.some((e) =>
        e.institution && e.degreeName && e.startDate && (e.isCurrent || e.completionYear),
      );

      if (!hasAnyCompleteEducation) {
        setError(
          "Educational details are required. Please add at least one complete education entry.",
        );
        return;
      }

      const hasPartialEducation = normalizedEducations.some((e) => {
        const anyFieldFilled = Boolean(
          e.institution || e.degreeName || e.startDate || e.completionYear || e.isCurrent,
        );
        const completeWithoutCurrent = Boolean(
          e.institution && e.degreeName && e.startDate && e.completionYear && !e.isCurrent,
        );
        const completeWithCurrent = Boolean(
          e.institution && e.degreeName && e.startDate && e.isCurrent,
        );
        return anyFieldFilled && !completeWithoutCurrent && !completeWithCurrent;
      });

      if (hasPartialEducation) {
        setError(
          "Please fill institution, degree, start date, and either completion year or mark it as currently studying.",
        );
        return;
      }

      const completeEducations = normalizedEducations.filter((e) =>
        e.institution && e.degreeName && e.startDate && (e.isCurrent || e.completionYear),
      );

      await setupEducation({ education: completeEducations }).unwrap();
      router.push("/auth/signup/job-seeker/step-5");
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save education. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">

        {/* LEFT SIDE */}
        <div className="relative w-full md:w-1/2 hidden md:block">
          <Image src="/image/jaimica7.webp" alt="Office" fill className="object-cover" priority />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] bg-white/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center text-white shadow-lg">
            <h3 className="text-lg font-bold">Welcome to the <span className="underline decoration-2 underline-offset-4">HireHubJA</span></h3>
            <p className="text-sm opacity-90 mt-1">Login to explore more</p>
            <div className="flex justify-center gap-2 mt-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === 4 ? "bg-[#3FAE2A] ring-2 ring-green-900/50 w-4" : "bg-white/50"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col justify-start p-6 md:p-12 relative overflow-y-auto max-h-[900px] custom-scrollbar">

          <div className="flex items-center mb-8 relative">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 transition">
              <ArrowLeft size={18} className="text-gray-700" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 absolute left-1/2 -translate-x-1/2">Educational Details</h2>
          </div>

          <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-4 pb-10">
            <div className="mb-6">
              <span className="text-base font-bold text-gray-800">Educational Details</span>
              <span className="text-base text-gray-500 ml-1">(If Any)</span>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {educations.map((edu, idx) => (
                <div key={idx} className="bg-[#F8FAFC] border border-gray-100 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-semibold text-gray-700">Education {educations.length > 1 ? idx + 1 : ""}</span>
                    {educations.length > 1 && (
                      <span onClick={() => removeEducation(idx)} className="text-sm text-red-500 cursor-pointer hover:underline">Remove</span>
                    )}
                  </div>
                  <div className="space-y-3">

                    <Input
                      value={edu.institution}
                      onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                      placeholder="Name Of School / College / University"
                      className="bg-white border-gray-200 text-sm h-[46px] rounded-xl focus-visible:ring-[#3FAE2A]"
                    />

                    <Input
                      value={edu.degreeName}
                      onChange={(e) => updateEducation(idx, "degreeName", e.target.value)}
                      placeholder="e.g - Graduation / Post-Graduation"
                      className="bg-white border-gray-200 text-sm h-[46px] rounded-xl focus-visible:ring-[#3FAE2A]"
                    />

                    {/* ✅ Responsive Date Container (flex-col on mobile, flex-row on md) */}
                    <div className="flex flex-col md:flex-row gap-3">
                      
                      {/* Start Date (Native Calendar) */}
                      <div className="relative w-full">
                        {/* Custom Placeholder */}
                        {!edu.startDate && (
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none bg-white pr-2">
                            Start Date
                          </div>
                        )}
                        <Input
                          type="date"
                          value={edu.startDate}
                          onChange={(e) => updateEducation(idx, "startDate", e.target.value)}
                          className="w-full bg-white border-gray-200 text-sm h-[46px] rounded-xl text-gray-600 focus-visible:ring-[#3FAE2A]"
                        />
                      </div>

                      {/* Completion Year (Native Calendar) */}
                      <div className="relative w-full">
                        {!edu.completionYear && !edu.isCurrent && (
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none bg-white pr-2 z-10">
                            Completion Year
                          </div>
                        )}
                        <Input
                          type={edu.isCurrent ? "text" : "date"}
                          value={edu.isCurrent ? "" : edu.completionYear}
                          onChange={(e) => updateEducation(idx, "completionYear", e.target.value)}
                          placeholder={edu.isCurrent ? "N/A" : ""}
                          disabled={edu.isCurrent}
                          className={`w-full bg-white border-gray-200 text-sm h-[46px] rounded-xl text-gray-600 focus-visible:ring-[#3FAE2A] ${edu.isCurrent ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      </div>
                    </div>

                    <div
                      onClick={() => updateEducation(idx, "isCurrent", !edu.isCurrent)}
                      className="flex items-center gap-3 cursor-pointer select-none mt-2"
                    >
                      <div className={`w-[18px] h-[18px] rounded border flex items-center justify-center transition ${edu.isCurrent ? "border-[#3FAE2A] bg-[#3FAE2A]" : "border-gray-300 bg-white"}`}>
                        {edu.isCurrent && (
                          <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3">
                            <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">Currently studying here</span>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={addEducation} className="bg-[#3FAE2A] hover:bg-[#359624] text-white font-medium rounded-lg px-6 h-10 shadow-sm">
                Add Education
              </Button>
            </div>

            <Button onClick={handleNext} disabled={isLoading} className="w-full bg-[#3FAE2A] hover:bg-[#359624] text-white font-bold rounded-full py-6 mt-10 shadow-lg shadow-green-100 text-base">
              {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
