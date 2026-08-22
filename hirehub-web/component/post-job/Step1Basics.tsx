"use client";
import { useState } from "react";
import { ChevronDown, Check, X, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useJobPost } from "@/component/post-job/JobPostContext";
import { useGetCategoriesQuery } from "@/redux/services/featuresApi";

const WORK_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
];

const WORK_TIMES = [
  { value: "REMOTE", label: "Remote" },
  { value: "ON_SITE", label: "On-Site" },
  { value: "HYBRID", label: "Hybrid" },
];

interface Step1BasicsProps {
  categoryList?: string[]; 
}


export default function Step1Basics({ categoryList }: Step1BasicsProps) {
  const { formData, setFormData, nextStep } = useJobPost();
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isWorkTypeOpen, setIsWorkTypeOpen] = useState(false);
  const [isWorkTimeOpen, setIsWorkTimeOpen] = useState(false);

  // Get categories from API, fallback to prop
  const categories = categoriesData?.categories || categoriesData || categoryList || [];

  const toggleCategory = (cat: any) => {
    const catId = typeof cat === 'object' ? cat.id : cat;
    const catName = typeof cat === 'object' ? cat.name : cat;
    
    setFormData((prev) => {
      const exists = prev.categories.some((c: any) => (typeof c === 'object' ? c.id : c) === catId);
      const newCats = exists
        ? prev.categories.filter((c: any) => (typeof c === 'object' ? c.id : c) !== catId)
        : [...prev.categories, typeof cat === 'object' ? cat : { id: catId, name: catName }];
      return { ...prev, categories: newCats };
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getCategoryName = (cat: any) => {
    return typeof cat === 'object' && cat?.name ? cat.name : cat;
  };

  const toggleWorkType = (workType: string) => {
    const current = Array.isArray(formData.workType) ? formData.workType : [];
    const updated = current.includes(workType)
      ? current.filter((t) => t !== workType)
      : [...current, workType];
    handleChange("workType", updated);
  };

  const toggleWorkTime = (workTime: string) => {
    const current = Array.isArray(formData.workTime) ? formData.workTime : [];
    const updated = current.includes(workTime)
      ? current.filter((t) => t !== workTime)
      : [...current, workTime];
    handleChange("workTime", updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-lg font-bold text-gray-900">Job Basics</h2>

      {/* Job Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">Job Title (Required)</label>
        <input
          type="text"
          value={formData.jobTitle}
          onChange={(e) => handleChange("jobTitle", e.target.value)}
          className="w-full border rounded-lg px-4 py-3 text-sm focus:border-[#3FAE2A] focus:outline-none"
          placeholder="Ex: Senior Caregiver"
        />
      </div>

      {/* Number of Employees */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">Number of employees</label>
        <input
          type="number"
          value={formData.employees}
          onChange={(e) => handleChange("employees", e.target.value)}
          className="w-full border rounded-lg px-4 py-3 text-sm focus:border-[#3FAE2A] focus:outline-none"
          placeholder="Ex: 1"
        />
      </div>

      {/* Multiple Category Modal */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">Job Category</label>
        <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
          <DialogTrigger asChild>
            <div className="w-full border rounded-lg px-4 py-3 text-sm flex justify-between items-center cursor-pointer hover:border-[#3FAE2A] bg-white">
              <span className={formData.categories.length ? "text-gray-900" : "text-gray-400"}>
                {formData.categories.length > 0
                  ? `${getCategoryName(formData.categories[0])} ${formData.categories.length > 1 ? `+ ${formData.categories.length - 1} more` : ""}`
                  : "Select Categories"}
              </span>
              <ChevronDown size={18} className="text-gray-400" />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-md h-[80vh] flex flex-col p-6">
            <DialogHeader>
              <DialogTitle>Select Categories</DialogTitle>
            </DialogHeader>
            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.categories.map((cat: any) => {
                const catName = typeof cat === 'object' ? cat.name : cat;
                return (
                  <span key={catName} className="bg-green-50 text-[#3FAE2A] text-xs px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
                    {catName} <X size={12} className="cursor-pointer" onClick={() => toggleCategory(cat)} />
                  </span>
                );
              })}
            </div>
            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {categoriesLoading ? (
                <div className="text-center py-4 text-gray-500">Loading categories...</div>
              ) : categories && categories.length > 0 ? (
                categories.map((cat: any) => {
                  const catId = typeof cat === 'object' ? cat.id : cat;
                  const catName = typeof cat === 'object' ? cat.name : cat;
                  const isSelected = formData.categories.some((c: any) => (typeof c === 'object' ? c.id : c) === catId);
                  
                  return (
                    <div 
                      key={catId} 
                      onClick={() => toggleCategory(cat)} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <span className={isSelected ? "text-[#3FAE2A] font-medium" : "text-gray-700"}>{catName}</span>
                      <div className={`w-5 h-5 border rounded flex items-center justify-center ${isSelected ? "bg-[#3FAE2A] border-[#3FAE2A]" : "border-gray-400"}`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">No categories available</div>
              )}
            </div>
            <Button onClick={() => setIsCategoryOpen(false)} className="bg-[#3FAE2A] w-full">Done</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid: Work Type & Work Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Work Type Modal */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600">Work Type</label>
          <Dialog open={isWorkTypeOpen} onOpenChange={setIsWorkTypeOpen}>
            <DialogTrigger asChild>
              <div className="w-full border rounded-lg px-4 py-3 text-sm flex justify-between items-center cursor-pointer hover:border-[#3FAE2A] bg-white">
                <span className={Array.isArray(formData.workType) && formData.workType.length ? "text-gray-900" : "text-gray-400"}>
                  {Array.isArray(formData.workType) && formData.workType.length > 0
                    ? `${WORK_TYPES.find(t => t.value === formData.workType[0])?.label} ${formData.workType.length > 1 ? `+ ${formData.workType.length - 1} more` : ""}`
                    : "Select Work Types"}
                </span>
                <ChevronDown size={18} className="text-gray-400" />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md h-[80vh] flex flex-col p-6">
              <DialogHeader>
                <DialogTitle>Select Work Types</DialogTitle>
              </DialogHeader>
              {/* Selected Tags */}
              <div className="flex flex-wrap gap-2 mb-2">
                {Array.isArray(formData.workType) && formData.workType.map((type) => (
                  <span key={type} className="bg-green-50 text-[#3FAE2A] text-xs px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
                    {WORK_TYPES.find(t => t.value === type)?.label} <X size={12} className="cursor-pointer" onClick={() => toggleWorkType(type)} />
                  </span>
                ))}
              </div>
              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {WORK_TYPES.map((type) => {
                  const isSelected = Array.isArray(formData.workType) && formData.workType.includes(type.value);
                  return (
                    <div 
                      key={type.value} 
                      onClick={() => toggleWorkType(type.value)} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <span className={isSelected ? "text-[#3FAE2A] font-medium" : "text-gray-700"}>{type.label}</span>
                      <div className={`w-5 h-5 border rounded flex items-center justify-center ${isSelected ? "bg-[#3FAE2A] border-[#3FAE2A]" : "border-gray-400"}`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button onClick={() => setIsWorkTypeOpen(false)} className="bg-[#3FAE2A] w-full">Done</Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Work Time Modal */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600">Work Time</label>
          <Dialog open={isWorkTimeOpen} onOpenChange={setIsWorkTimeOpen}>
            <DialogTrigger asChild>
              <div className="w-full border rounded-lg px-4 py-3 text-sm flex justify-between items-center cursor-pointer hover:border-[#3FAE2A] bg-white">
                <span className={Array.isArray(formData.workTime) && formData.workTime.length ? "text-gray-900" : "text-gray-400"}>
                  {Array.isArray(formData.workTime) && formData.workTime.length > 0
                    ? `${WORK_TIMES.find(t => t.value === formData.workTime[0])?.label} ${formData.workTime.length > 1 ? `+ ${formData.workTime.length - 1} more` : ""}`
                    : "Select Work Times"}
                </span>
                <ChevronDown size={18} className="text-gray-400" />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md h-[80vh] flex flex-col p-6">
              <DialogHeader>
                <DialogTitle>Select Work Times</DialogTitle>
              </DialogHeader>
              {/* Selected Tags */}
              <div className="flex flex-wrap gap-2 mb-2">
                {Array.isArray(formData.workTime) && formData.workTime.map((time) => (
                  <span key={time} className="bg-green-50 text-[#3FAE2A] text-xs px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
                    {WORK_TIMES.find(t => t.value === time)?.label} <X size={12} className="cursor-pointer" onClick={() => toggleWorkTime(time)} />
                  </span>
                ))}
              </div>
              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {WORK_TIMES.map((time) => {
                  const isSelected = Array.isArray(formData.workTime) && formData.workTime.includes(time.value);
                  return (
                    <div 
                      key={time.value} 
                      onClick={() => toggleWorkTime(time.value)} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <span className={isSelected ? "text-[#3FAE2A] font-medium" : "text-gray-700"}>{time.label}</span>
                      <div className={`w-5 h-5 border rounded flex items-center justify-center ${isSelected ? "bg-[#3FAE2A] border-[#3FAE2A]" : "border-gray-400"}`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button onClick={() => setIsWorkTimeOpen(false)} className="bg-[#3FAE2A] w-full">Done</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">Job Location</label>
        <div className="relative">
          <input type="text" placeholder="Set job location" className="w-full border rounded-lg px-4 py-3 text-sm focus:border-[#3FAE2A] focus:outline-none pr-10" 
          onChange={(e) => handleChange("location", e.target.value)} value={formData.location}/>
          <MapPin className="absolute right-4 top-3 text-gray-400" size={18} />
        </div>
      </div>

      {/* Remote Toggle */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-600 font-medium">Remote</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={formData.isRemote || false} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("isRemote", e.target.checked)} 
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-[#3FAE2A] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
        </label>
      </div>

      {/* Applied Deadline (New Field) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">Applied Deadline</label>
        <input
          type="date"
          value={formData.deadline}
          onChange={(e) => handleChange("deadline", e.target.value)}
          className="w-full border rounded-lg px-4 py-3 text-sm focus:border-[#3FAE2A] focus:outline-none text-gray-600"
        />
      </div>

      {/* Next Button */}
      <div className="pt-6">
        <Button onClick={nextStep} className="w-full h-12 bg-[#3FAE2A] hover:bg-green-700 rounded-full font-bold">Next</Button>
      </div>
    </div>
  );
}