"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobPostProvider, useJobPost } from "@/component/post-job/JobPostContext";
import Step1Basics from "@/component/post-job/Step1Basics";
import Stepper from "@/component/post-job/Stepper";
import Step2Details from "@/component/post-job/Step2Details";
import Step3Criteria from "@/component/post-job/Step3Criteria";
import Step5Review from "@/component/post-job/Step5Review";
import Step4Salary from "@/component/post-job/Step4Salary";
import SuccessScreen from "@/component/post-job/SuccessScreen";

const EMPLOYER_CATEGORIES = [
  "Accounting & Finance",
  "Administrative Support",
  "Customer Service",
  "Education",
  "Engineering",
  "Healthcare",
  "Hospitality & Tourism",
  "IT & Tech",
  "Marketing & Sales",
  "Operations",
  "Skilled Trades",
];

const EmployerJobContent = () => {
  const router = useRouter();
  const { currentStep, prevStep } = useJobPost();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Basics categoryList={EMPLOYER_CATEGORIES} />;
      case 2:
        return <Step2Details />;
      case 3:
        return <Step3Criteria />;
      case 4:
        return <Step4Salary />;
      case 5:
        return <Step5Review />;
      case 6:
        return <SuccessScreen />;
      default:
        return <Step1Basics categoryList={EMPLOYER_CATEGORIES} />;
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto p-4 md:p-10 pb-20">
      {/* Header with Back Button */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div className="flex items-center self-start md:self-auto w-full md:w-auto">
          <Button
            variant="ghost"
            size="icon"

            onClick={currentStep === 1 ? () => router.back() : prevStep}
            className="rounded-full border border-gray-200 mr-4"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Post a Job (Company)</h1>
        </div>
      </div>

      <div className="flex justify-center w-full mb-8 px-4">
        <div className="w-full max-w-[700px]">
          <div className="flex w-full justify-center mb-5">
            <Stepper currentStep={currentStep} />
          </div>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="max-w-[700px] mx-auto">
        {renderStep()}
      </div>
    </div>
  );
};

export default function EmployerPostJobPage() {
  return (
    <JobPostProvider>
      <EmployerJobContent />
    </JobPostProvider>
  );
}