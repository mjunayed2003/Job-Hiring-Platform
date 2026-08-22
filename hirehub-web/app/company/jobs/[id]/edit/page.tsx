"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, ArrowLeft, AlertCircle } from "lucide-react";
import { useGetJobByIdQuery, useUpdateJobMutation, useDeleteJobMutation } from "@/redux/services/jobsApi";
import { useGetCategoriesQuery } from "@/redux/services/featuresApi";

interface EditFormData {
  title: string;
  description: string;
  location: string;
  categoryIds: string[];
  jobType: string[];
  workTime: string[];
  responsibilities: string[];
  benefits: string[];
  experienceLevel: string;
  minExperience: number;
  educationLevel: string;
  salaryType: string;
  salaryFrequency: string;
  salaryAmount: string;
  numberOfEmployees: number;
  isAnonymous: boolean;
  isRemote: boolean;
  deadline: string;
}

// Categories are now fetched from API via useGetCategoriesQuery()

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const { data: jobData, isLoading: isLoadingJob, error: jobError } = useGetJobByIdQuery(jobId);
  const { data: categoriesData, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    categoryIds: [] as string[],
    jobType: [] as string[],
    workTime: [] as string[],
    isRemote: false,
    numberOfEmployees: 1,
    minExperience: 0,
    experienceLevel: "Mid",
    educationLevel: "Bachelor's",
    responsibilities: [] as string[],
    benefits: [] as string[],
    salaryType: "FIXED",
    salaryFrequency: "MONTHLY",
    salaryAmount: "",
    deadline: "",
    isAnonymous: false,
  });

  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const [workTimeInput, setWorkTimeInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load job data when fetched
  useEffect(() => {
    if (jobData) {
      // Handle both categoryId (singular) and categories (array) from API response
      let categoryIds: string[] = [];
      if (jobData.categories && Array.isArray(jobData.categories)) {
        // If categories array exists, extract all IDs
        categoryIds = jobData.categories.map((cat: any) => typeof cat === 'object' ? cat.id : cat);
      } else if (jobData.categoryId) {
        // Fallback to single categoryId
        categoryIds = [jobData.categoryId];
      }

      setFormData({
        title: jobData.title || "",
        description: jobData.description || "",
        location: jobData.location || "",
        categoryIds: categoryIds,
        jobType: jobData.jobType || [],
        workTime: jobData.workTime || [],
        isRemote: jobData.isRemote || false,
        numberOfEmployees: jobData.numberOfEmployees || 1,
        minExperience: jobData.minExperience || 0,
        experienceLevel: jobData.experienceLevel || "Mid",
        educationLevel: jobData.educationLevel || "Bachelor's",
        responsibilities: jobData.responsibilities || [],
        benefits: jobData.benefits || [],
        salaryType: jobData.salaryType || "FIXED",
        salaryFrequency: jobData.salaryFrequency || "MONTHLY",
        salaryAmount: jobData.salaryAmount || "",
        deadline: jobData.deadline ? new Date(jobData.deadline).toISOString().split('T')[0] : "",
        isAnonymous: jobData.isAnonymous || false,
      });
    }
  }, [jobData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (name === "numberOfEmployees" || name === "minExperience") {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleJobTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      jobType: prev.jobType.includes(type)
        ? prev.jobType.filter((t) => t !== type)
        : [...prev.jobType, type],
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const addResponsibility = () => {
    if (responsibilityInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        responsibilities: [...prev.responsibilities, responsibilityInput.trim()],
      }));
      setResponsibilityInput("");
    }
  };

  const removeResponsibility = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index),
    }));
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()],
      }));
      setBenefitInput("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const addWorkTime = () => {
    if (workTimeInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        workTime: [...prev.workTime, workTimeInput.trim()],
      }));
      setWorkTimeInput("");
    }
  };

  const removeWorkTime = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      workTime: prev.workTime.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    if (formData.categoryIds.length === 0) {
      setErrorMessage("Please select at least one category");
      return;
    }

    if (formData.jobType.length === 0) {
      setErrorMessage("Please select at least one job type");
      return;
    }

    if (formData.workTime.length === 0) {
      setErrorMessage("Please add at least one work time");
      return;
    }

    try {
      await updateJob({
        jobId,
        body: {
          title: formData.title,
          description: formData.description,
          location: formData.location,
          categoryIds: formData.categoryIds,
          jobType: formData.jobType,
          workTime: formData.workTime,
          isRemote: formData.isRemote,
          numberOfEmployees: formData.numberOfEmployees,
          minExperience: formData.minExperience,
          experienceLevel: formData.experienceLevel,
          educationLevel: formData.educationLevel,
          responsibilities: formData.responsibilities,
          benefits: formData.benefits,
          salaryType: formData.salaryType,
          salaryFrequency: formData.salaryFrequency,
          salaryAmount: formData.salaryAmount,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
          isAnonymous: formData.isAnonymous,
          status: "OPEN",
        },
      }).unwrap();

      setSuccessMessage("Job updated successfully!");
      setTimeout(() => router.back(), 2000);
    } catch (error: any) {
      setErrorMessage(error?.data?.message || "Failed to update job");
      console.error("Update error:", error);
    }
  };

  const handleDeleteJob = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this job? This action cannot be undone.");

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteJob(jobId).unwrap();
      setSuccessMessage("Job deleted successfully!");
      router.push("/company/jobs");
    } catch (error: any) {
      setErrorMessage(error?.data?.message || "Failed to delete job");
      console.error("Delete error:", error);
    }
  };

  if (isLoadingJob) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-[#3FAE2A]" size={40} />
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-red-500">Failed to load job details</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full border border-gray-200"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Job Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g. Senior Caregiver"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Job description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                placeholder="e.g. Dhaka, Bangladesh"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Categories</h2>
            {isCategoriesLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader className="animate-spin" size={16} />
                <span>Loading categories from API...</span>
              </div>
            ) : (categoriesData?.categories || categoriesData || [])?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No categories available from API
              </div>
            ) : (
              <div className="space-y-2">
                {(categoriesData?.categories || categoriesData || []).map((category: any) => {
                  const isSelected = formData.categoryIds.includes(category.id);
                  return (
                    <label 
                      key={category.id} 
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        isSelected 
                          ? 'border-[#3FAE2A] bg-[#EAF6EA]' 
                          : 'border-gray-300 bg-white hover:border-[#3FAE2A]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCategoryChange(category.id)}
                        className="w-5 h-5 accent-[#3FAE2A] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${isSelected ? 'text-[#3FAE2A]' : 'text-gray-900'}`}>
                          {category.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {category.description || 'No description'}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0 text-[#3FAE2A] font-bold">✓</div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
            {!isCategoriesLoading && (formData.categoryIds.length > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-700 font-medium">
                  Selected: {formData.categoryIds.length} categor{formData.categoryIds.length === 1 ? 'y' : 'ies'}
                </p>
              </div>
            )}
          </div>

          {/* Job Type & Work Time */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Work Arrangement</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <div className="space-y-2">
                {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"].map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.jobType.includes(type)}
                      onChange={() => handleJobTypeChange(type)}
                      className="w-4 h-4 accent-[#3FAE2A]"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Remote</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRemote || false}
                  onChange={(e) => setFormData({ ...formData, isRemote: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-[#3FAE2A] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Location Type</label>
              <div className="space-y-2">
                {formData.workTime.map((time, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <span className="text-sm">{time}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWorkTime(idx)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  type="text"
                  value={workTimeInput}
                  onChange={(e) => setWorkTimeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addWorkTime();
                    }
                  }}
                  placeholder="e.g. Day, Night, Shift..."
                />
                <Button type="button" onClick={addWorkTime} className="bg-[#3FAE2A] hover:bg-[#2d8620]">
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Positions & Experience */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Candidates</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Positions Needed</label>
                <Input
                  type="number"
                  name="numberOfEmployees"
                  value={formData.numberOfEmployees}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Experience (years)</label>
                <Input
                  type="number"
                  name="minExperience"
                  value={formData.minExperience}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="Entry">Entry</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education Level</label>
                <Input
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleInputChange}
                  placeholder="e.g. Bachelor's"
                />
              </div>
            </div>
          </div>

          {/* Responsibilities */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Responsibilities</h2>
            <div className="space-y-2">
              {formData.responsibilities.map((resp, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <span className="text-sm">{resp}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeResponsibility(idx)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addResponsibility();
                  }
                }}
                placeholder="Add responsibility..."
              />
              <Button type="button" onClick={addResponsibility} className="bg-[#3FAE2A] hover:bg-[#2d8620]">
                Add
              </Button>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Benefits</h2>
            <div className="space-y-2">
              {formData.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <span className="text-sm">{benefit}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBenefit(idx)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
                placeholder="Add benefit..."
              />
              <Button type="button" onClick={addBenefit} className="bg-[#3FAE2A] hover:bg-[#2d8620]">
                Add
              </Button>
            </div>
          </div>

          {/* Salary */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Salary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Type</label>
                <select
                  name="salaryType"
                  value={formData.salaryType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="FIXED">Fixed</option>
                  <option value="RANGE">Range</option>
                  <option value="NEGOTIABLE">Negotiable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  name="salaryFrequency"
                  value={formData.salaryFrequency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <Input
                  type="number"
                  name="salaryAmount"
                  value={formData.salaryAmount}
                  onChange={handleInputChange}
                  placeholder="e.g. 25000"
                />
              </div>
            </div>
          </div>

          {/* Deadline & Anonymous */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                <Input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Post Anonymously</span>
                </label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
              disabled={isUpdating || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteJob}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={isUpdating || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Job"}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#3FAE2A] hover:bg-[#2d8620] text-white font-semibold"
              disabled={isUpdating || isDeleting}
            >
              {isUpdating ? "Updating..." : "Update Job"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

