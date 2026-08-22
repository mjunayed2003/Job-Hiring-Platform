"use client";
import { useJobPost } from "./JobPostContext";
import { Button } from "@/components/ui/button";

export default function Step3Criteria() {
  const { formData, setFormData, nextStep } = useJobPost();
  const levels = ["Entry", "Mid", "Senior"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-lg font-bold text-gray-900">Skills & Candidate Criteria</h2>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-600">Experience Level:</label>
        <div className="flex gap-4">
          {levels.map((level) => (
            <label key={level} className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1 transition-all ${formData.experienceLevel === level ? "border-[#3FAE2A] bg-green-50" : "hover:border-[#3FAE2A]"}`}>
              <input type="radio" name="level" checked={formData.experienceLevel === level} onChange={() => setFormData(p => ({...p, experienceLevel: level}))} className="accent-[#3FAE2A] w-4 h-4" />
              <span className="text-sm text-gray-700">{level}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">Minimum Experience (Years)</label>
        <input type="number" placeholder="Add Years" className="w-full border rounded-lg px-4 py-3 text-sm focus:border-[#3FAE2A] focus:outline-none" 
        value={formData.minExperience} onChange={(e) => setFormData(p => ({...p, minExperience: e.target.value}))}/>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">Education Level</label>
        <select className="w-full border rounded-lg px-4 py-3 text-sm focus:border-[#3FAE2A] focus:outline-none bg-white"
         value={formData.educationLevel} onChange={(e) => setFormData(p => ({...p, educationLevel: e.target.value}))}>
          <option>Select Work Type</option>
          <option>High School</option>
          <option>Bachelor's</option>
        </select>
      </div>

      <div className="pt-6">
        <Button onClick={nextStep} className="w-full h-12 bg-[#3FAE2A] hover:bg-green-700 rounded-full font-bold">Next</Button>
      </div>
    </div>
  );
}