"use client";

import { useState } from "react";
import { MapPin, Edit2, AlertCircle } from "lucide-react";
import { useJobPost } from "./JobPostContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";   
import { Badge } from "@/components/ui/badge";
import { usePostJobMutation } from "@/redux/services/employerApi";

export default function Step5Review() {
  const { formData, nextStep, setCurrentStep } = useJobPost();
  const [postJob, { isLoading: isPosting }] = usePostJobMutation();
const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tags array generation based on selections
  const tags = [
    ...(Array.isArray(formData.workType) ? formData.workType : [formData.workType]),
    formData.experienceLevel,
    ...(Array.isArray(formData.workTime) ? formData.workTime : [formData.workTime]),
  ].filter(Boolean);

  // Current Date for Preview
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handlePublish = async () => {
    setErrorMessage(null);
    
    try {
      // Create workTime labels mapping
      const workTimeLabels: Record<string, string> = {
        "REMOTE": "Remote",
        "ON_SITE": "On-Site",
        "HYBRID": "Hybrid"
      };

      // Extract categoryIds from category objects
      const categoryIds = formData.categories.map((cat: any) => typeof cat === 'object' ? cat.id : cat);

      // Prepare the job data for API submission - matching backend structure   
      const jobData = {
        title: formData.jobTitle,
        description: formData.jobOverview,
        categoryIds: categoryIds,
        jobType: [
          ...(Array.isArray(formData.workType) ? formData.workType : [formData.workType]).filter(Boolean),
          ...(Array.isArray(formData.workTime) ? formData.workTime : [formData.workTime]).filter(Boolean)
        ],
        workTime: (Array.isArray(formData.workTime) ? formData.workTime : [formData.workTime])
          .filter(Boolean)
          .map((wt: string) => workTimeLabels[wt] || wt),
        location: formData.location,
        isRemote: (Array.isArray(formData.workTime) ? formData.workTime : [formData.workTime]).includes("REMOTE"),
        experienceLevel: formData.experienceLevel,
        minExperience: parseInt(formData.minExperience) || 0,
        educationLevel: formData.educationLevel,
        salaryAmount: formData.salaryAmount ? String(formData.salaryAmount) : "",
        salaryFrequency: formData.salaryFrequency || "MONTHLY",
        salaryType: formData.salaryType || "FIXED",
        responsibilities: formData.responsibilities.filter(Boolean),
        benefits: formData.benefits.filter(Boolean),
        numberOfEmployees: parseInt(formData.employees) || 1,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        isAnonymous: formData.isAnonymous || false,
      };

      // Call the API
      await postJob(jobData).unwrap();

      // Move to success screen on successful submission
      nextStep();
    } catch (error: any) {
      console.error("Failed to post job:", error);
      setErrorMessage(
        error?.data?.message || 
        "Failed to post job. Please check your information and try again."
      );
    }
  };

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-right-4">
      <h2 className="text-lg font-bold text-gray-900 mb-8">Review & Publish</h2>

      {/* Error Message */}
      {errorMessage && (
        <div className="w-full max-w-[320px] sm:w-[320px] mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Card Component Matching JobOpportunities Style */}
      <Card className="w-full max-w-[320px] sm:w-[320px] bg-white rounded-[10px] border-[0.6px] border-[#E5E7EB] shadow-[0px_0px_10px_2px_#3FAE2A1A] transition-all duration-300 relative overflow-hidden">
        
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-white border rounded-full overflow-hidden">
              <AvatarImage
                src="/image/jobOpportunities.webp"
                alt="Company Logo"
                className="object-cover"
              />
              <AvatarFallback className="bg-gray-100 text-gray-400">CO</AvatarFallback>
            </Avatar>
          </div>

          {/* Date */}
          <div className="flex items-center mt-1">
             <span className="text-xs text-gray-500 font-medium border border-gray-300 px-2 py-0.5 rounded-full bg-white">
                {currentDate}
             </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {/* Company & Title */}
          <div>
            <p className="text-xs text-gray-500 font-medium">
              {formData.isAnonymous ? "Anonymous Company" : "My Company Name"}
            </p>
            <h3 className="text-lg font-bold text-gray-900 leading-tight mt-1 line-clamp-2">
              {formData.jobTitle || "Job Title"}
            </h3>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.length > 0 ? (
              tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="rounded-full text-[10px] px-2 py-0.5 font-normal text-gray-600 border-gray-300 bg-white hover:bg-gray-50"
                >
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-[10px] text-gray-400">No tags selected</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-row items-center justify-between pt-2 pb-4">
          <div className="flex flex-col items-start gap-1">
            {/* Salary */}
            <p className="text-[#3FAE2A] font-bold text-sm">
              {formData.salaryAmount ? `$${formData.salaryAmount}` : "Negotiable"}
              <span className="text-[10px] text-gray-500 font-normal ml-0.5">
                /{formData.salaryFrequency || "Month"}
              </span>
            </p>
            
            {/* Location */}
            <div className="flex items-center text-gray-500 text-xs gap-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1 max-w-[120px]">
                {formData.location || "Location"}
              </span>
            </div>
          </div>

          {/* Edit Button (Visual Integration) */}
          <Button
            size="sm"
            onClick={() => setCurrentStep(1)}
            className="h-8 px-4 bg-[#3FAE2A] hover:bg-green-700 text-white rounded-full text-xs font-bold shadow-sm"
            disabled={isPosting}
          >
            Edit
          </Button>
        </CardFooter>
      </Card>

      {/* Publish Action */}
      <div className="pt-10 w-full md:max-w-xs">
        <Button
          onClick={handlePublish}
          disabled={isPosting}
          className="w-full h-12 bg-[#3FAE2A] hover:bg-green-700 rounded-full font-bold text-base shadow-lg shadow-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPosting ? "Publishing..." : "Publish Job"}
        </Button>
      </div>
    </div>
  );
}