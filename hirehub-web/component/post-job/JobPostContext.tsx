"use client";
import React, { createContext, useContext, useState } from "react";

// Types
export type JobFormData = {
  jobTitle: string;
  employees: string;
  categories: any[];
  workType: string[] | string;
  workTime: string[] | string;
  location: string;
  isRemote: boolean;
  deadline: string;
  jobOverview: string;
  responsibilities: string[];
  skills: string[];
  benefits: string[];
  experienceLevel: string;
  minExperience: string;
  educationLevel: string;
  salaryType: string;
  salaryFrequency: string;
  salaryAmount: string;
  isAnonymous: boolean;
};

interface JobPostContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  formData: JobFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobFormData>>;
  nextStep: () => void;
  prevStep: () => void;
}

const JobPostContext = createContext<JobPostContextType | undefined>(undefined);

export const JobPostProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<JobFormData>({
    jobTitle: "",
    employees: "",
    categories: [],
    workType: [],
    workTime: [],
    location: "",
    isRemote: false,
    deadline: "",
    jobOverview: "",
    responsibilities: [""],
    skills: [""],
    benefits: [""],
    experienceLevel: "",
    minExperience: "",
    educationLevel: "",
    salaryType: "Fixed",
    salaryFrequency: "Monthly",
    salaryAmount: "",
    isAnonymous: false,
  });

  const nextStep = () => setCurrentStep((prev) => (prev < 6 ? prev + 1 : prev));
  const prevStep = () => setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));

  return (
    <JobPostContext.Provider value={{ currentStep, setCurrentStep, formData, setFormData, nextStep, prevStep }}>
      {children}
    </JobPostContext.Provider>
  );
};

export const useJobPost = () => {
  const context = useContext(JobPostContext);
  if (!context) throw new Error("useJobPost must be used within a JobPostProvider");
  return context;
};