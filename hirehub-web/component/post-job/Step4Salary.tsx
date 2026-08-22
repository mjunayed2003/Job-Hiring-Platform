"use client";
import { useJobPost } from "./JobPostContext";
import { Button } from "@/components/ui/button";

export default function Step4Salary() {
  const { formData, setFormData, nextStep } = useJobPost();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-lg font-bold text-gray-900">Salary & Payment</h2>

      {/* Salary Type */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-600">Salary Type</label>
        <div className="flex gap-4">
          {["Fixed", "Range", "Negotiable"].map((type) => (
            <label key={type} className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1 ${formData.salaryType === type ? "border-[#3FAE2A] bg-green-50" : ""}`}>
              <input type="radio" name="sType" checked={formData.salaryType === type} onChange={() => setFormData(p => ({...p, salaryType: type}))} className="accent-[#3FAE2A] w-4 h-4" />
              <span className="text-sm text-gray-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-600">Salary Frequency</label>
        <div className="flex gap-4">
          {["Monthly", "Weekly", "Contract"].map((freq) => (
            <label key={freq} className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1 ${formData.salaryFrequency === freq ? "border-[#3FAE2A] bg-green-50" : ""}`}>
              <input type="radio" name="sFreq" checked={formData.salaryFrequency === freq} onChange={() => setFormData(p => ({...p, salaryFrequency: freq}))} className="accent-[#3FAE2A] w-4 h-4" />
              <span className="text-sm text-gray-700">{freq}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">Salary</label>
        <input type="number" placeholder="Ex: 1000" className="w-full border rounded-lg px-4 py-3 text-sm focus:border-[#3FAE2A] focus:outline-none"
         value={formData.salaryAmount} onChange={(e) => setFormData(p => ({...p, salaryAmount: e.target.value}))} />
      </div>

      {/* Anonymous Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-600">Post anonymously</label>
            <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={formData.isAnonymous} onChange={(e) => setFormData(p => ({...p, isAnonymous: e.target.checked}))} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-gray-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
        </div>
        <p className="text-xs text-gray-400">Enable to hide your company name and logo.</p>
      </div>

      <div className="pt-6">
        <Button onClick={nextStep} className="w-full h-12 bg-[#3FAE2A] hover:bg-green-700 rounded-full font-bold">Next</Button>
      </div>
    </div>
  );
}   