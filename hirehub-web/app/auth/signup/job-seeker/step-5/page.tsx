"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSetupJobSeekerProfessionalMutation } from "@/redux/services/authApi";

interface ExperienceEntry {
  designation: string;
  companyName: string;
  startDate: string;
  endDate: string;
}

export default function Step5Professional() {
  const router = useRouter();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [experienceLevel, setExperienceLevel] = useState("Entry");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState("");

  const [experiences, setExperiences] = useState<ExperienceEntry[]>([
    { designation: "", companyName: "", startDate: "", endDate: "" }
  ]);

  const [setupProfessional, { isLoading }] = useSetupJobSeekerProfessionalMutation();

  const addExperience = () => {
    setExperiences([...experiences, { designation: "", companyName: "", startDate: "", endDate: "" }]);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setResumeName(file.name);
    }
  };

  const handleNext = async () => {
    setError("");
    try {
      if (!resumeFile) {
        setError("Please upload your CV / Resume.");
        return;
      }

      if (skills.length === 0) {
        setError("Please add at least one skill.");
        return;
      }

      const normalizedExperiences = experiences.map((exp) => ({
        designation: exp.designation.trim(),
        companyName: exp.companyName.trim(),
        startDate: exp.startDate.trim(),
        endDate: exp.endDate.trim(),
      }));

      const hasPartialExperience = normalizedExperiences.some((exp) => {
        const anyFieldFilled = Boolean(
          exp.designation || exp.companyName || exp.startDate || exp.endDate,
        );
        const allFieldsFilled = Boolean(
          exp.designation && exp.companyName && exp.startDate && exp.endDate,
        );
        return anyFieldFilled && !allFieldsFilled;
      });

      if (hasPartialExperience) {
        setError("If you add an experience, please fill designation, company name, start date, and end date.");
        return;
      }

      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("experienceLevel", experienceLevel);
      formData.append("skills", JSON.stringify(skills));
      const filledExperiences = normalizedExperiences.filter((e) =>
        e.designation || e.companyName || e.startDate || e.endDate,
      );
      formData.append("experience", JSON.stringify(filledExperiences));

      await setupProfessional(formData).unwrap();
      router.push("/auth/signup/job-seeker/step-6");
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save professional details. Please try again.");
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
                <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === 5 ? "bg-[#3FAE2A] ring-2 ring-green-900/50 w-4" : "bg-white/50"}`} />
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
            <h2 className="text-lg font-semibold text-gray-800 absolute left-1/2 -translate-x-1/2">Professional Details</h2>
          </div>

          <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-4 pb-10">
            <div className="mb-6">
              <span className="text-base font-bold text-gray-800">Professional Details</span>
              <span className="text-base text-gray-500 ml-1">(Mandatory)</span>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm rounded">
                {error}
              </div>
            )}

            <div className="space-y-6">

              {/* Upload Resume */}
              <div>
                <Label className="text-sm font-medium text-gray-700 block mb-2">Upload CV / Resume</Label>
                <label className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-sm text-gray-500 truncate max-w-[80%]">
                    {resumeName
                      ? <span className="text-[#3FAE2A]">✓ {resumeName}</span>
                      : "Upload CV / Resume"
                    }
                  </span>
                  <Upload size={18} className="text-gray-500 flex-shrink-0" />
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              {/* Experience entries */}
              <div>
                <Label className="text-sm font-medium text-gray-700 block mb-3">
                  Experience <span className="text-gray-400 font-normal">(If Any)</span>
                </Label>
                <div className="space-y-4">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="bg-[#F8FAFC] border border-gray-100 p-5 rounded-2xl">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold text-gray-700">
                          Experience {experiences.length > 1 ? idx + 1 : ""}
                        </span>
                        {experiences.length > 1 && (
                          <span onClick={() => removeExperience(idx)} className="text-sm text-red-500 cursor-pointer hover:underline">Remove</span>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Input
                          value={exp.designation}
                          onChange={(e) => updateExperience(idx, "designation", e.target.value)}
                          placeholder="Occupation"
                          className="bg-white border-gray-200 text-sm h-[46px] rounded-xl focus-visible:ring-[#3FAE2A]"
                        />
                        <Input
                          value={exp.companyName}
                          onChange={(e) => updateExperience(idx, "companyName", e.target.value)}
                          placeholder="Company Name"
                          className="bg-white border-gray-200 text-sm h-[46px] rounded-xl focus-visible:ring-[#3FAE2A]"
                        />

                        {/* ✅ Responsive Date Container (flex-col on mobile, flex-row on md) */}
                        <div className="flex flex-col md:flex-row gap-3">
                          
                          {/* Start Date (Native Calendar) */}
                          <div className="relative w-full">
                            {!exp.startDate && (
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none bg-white pr-2">
                                Start Date
                              </div>
                            )}
                            <Input
                              type="date"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                              className="w-full bg-white border-gray-200 text-sm h-[46px] rounded-xl text-gray-600 focus-visible:ring-[#3FAE2A]"
                            />
                          </div>

                          {/* End Date (Native Calendar) */}
                          <div className="relative w-full">
                            {!exp.endDate && (
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none bg-white pr-2">
                                End Date
                              </div>
                            )}
                            <Input
                              type="date"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                              className="w-full bg-white border-gray-200 text-sm h-[46px] rounded-xl text-gray-600 focus-visible:ring-[#3FAE2A]"
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={addExperience} className="bg-[#3FAE2A] hover:bg-[#359624] text-white font-medium rounded-lg px-6 h-10 shadow-sm">
                    Add Experience
                  </Button>
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-medium text-gray-700">Experience Level:</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  {["Entry", "Mid", "Senior"].map((lvl) => (
                    <div
                      key={lvl}
                      onClick={() => setExperienceLevel(lvl)}
                      className={`flex-1 flex items-center gap-3 bg-white px-4 py-3.5 rounded-xl border cursor-pointer transition ${experienceLevel === lvl ? "border-[#3FAE2A]" : "border-gray-100 hover:border-gray-200"}`}
                    >
                      <div className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 ${experienceLevel === lvl ? "border-[#3FAE2A]" : "border-gray-300"}`}>
                        {experienceLevel === lvl && <div className="w-[10px] h-[10px] rounded-full bg-[#3FAE2A]" />}
                      </div>
                      <span className="text-sm text-gray-600">{lvl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Skills */}
              <div className="pt-2">
                <Label className="text-sm font-medium text-gray-700 block mb-3">Work Skills</Label>
                <div className="flex gap-3 mb-4">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                    placeholder="Add a skill (e.g Python)"
                    className="rounded-xl bg-white border-gray-200 shadow-sm text-sm h-[50px] focus-visible:ring-[#3FAE2A]"
                  />
                  <Button
                    onClick={handleAddSkill}
                    className="bg-[#64748B] hover:bg-[#475569] text-white h-[50px] rounded-xl px-6 text-sm font-medium"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <div key={skill} className="flex items-center gap-3 bg-[#F8FAFC] px-4 py-2 rounded-xl text-sm font-medium text-gray-700 border border-gray-100">
                      {skill}
                      <X size={14} className="cursor-pointer text-gray-400 hover:text-red-500" onClick={() => setSkills(skills.filter((s) => s !== skill))} />
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="w-full bg-[#3FAE2A] hover:bg-[#359624] text-white font-bold rounded-full py-6 mt-8 shadow-lg shadow-green-100 text-base"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
