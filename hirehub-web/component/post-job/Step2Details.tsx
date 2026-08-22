"use client";
import { Plus, Minus } from "lucide-react";
import { useJobPost } from "./JobPostContext";
import { Button } from "@/components/ui/button";

export default function Step2Details() {
  const { formData, setFormData, nextStep } = useJobPost();

  const handleListChange = (field: "responsibilities" | "skills" | "benefits", index: number, value: string) => {
    const newList = [...formData[field]];
    newList[index] = value;
    setFormData((prev) => ({ ...prev, [field]: newList }));
  };

  const addField = (field: "responsibilities" | "skills" | "benefits") => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeField = (field: "responsibilities" | "skills" | "benefits", index: number) => {
    const newList = [...formData[field]];
    if (newList.length > 1) {
      newList.splice(index, 1);
      setFormData((prev) => ({ ...prev, [field]: newList }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-lg font-bold text-gray-900">Job Details</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">Job Overview</label>
        <textarea rows={4} className="w-full border rounded-lg px-4 py-3 text-sm focus:border-[#3FAE2A] focus:outline-none resize-none"
          placeholder="Describe the job..." value={formData.jobOverview} onChange={(e) => setFormData(p => ({...p, jobOverview: e.target.value}))} />
      </div>

      {[
        { key: "responsibilities" as const, label: "Responsibilities", ph: "Add responsibilities" },
        { key: "skills" as const, label: "Skills Needed", ph: "Add Skill" },
        { key: "benefits" as const, label: "Benefits", ph: "Add Benefits" },
      ].map((section) => (
        <div key={section.key} className="space-y-3">
          <label className="text-sm font-medium text-gray-600">{section.label}</label>
          {formData[section.key].map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input type="text" value={item} onChange={(e) => handleListChange(section.key, idx, e.target.value)}
                placeholder={section.ph} className="w-full border rounded-lg px-4 py-3 text-sm focus:border-[#3FAE2A] focus:outline-none" />
              <Button variant="outline" size="icon" onClick={() => idx === formData[section.key].length - 1 ? addField(section.key) : removeField(section.key, idx)}
                className={`rounded-full ${idx === formData[section.key].length - 1 ? "text-gray-500 hover:text-[#3FAE2A]" : "text-gray-500 hover:text-red-500"}`}>
                {idx === formData[section.key].length - 1 ? <Plus size={18} /> : <Minus size={18} />}
              </Button>
            </div>
          ))}
        </div>
      ))}
      <div className="pt-6">
        <Button onClick={nextStep} className="w-full h-12 bg-[#3FAE2A] hover:bg-green-700 rounded-full font-bold">Next</Button>
      </div>
    </div>
  );
}