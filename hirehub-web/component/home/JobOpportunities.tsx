"use client";
import JobCard from "@/component/card/JobCard";
import React, { useState } from "react";
import { useGetPublicJobsQuery } from "@/redux/services/jobsApi";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

// TypeScript Types
type JobType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "TEMPORARY"
  | "ON_SITE"
  | "REMOTE";
type ExperienceLevel = "Entry" | "Mid" | "Senior" | "Executive";
type SalaryFrequency = "MONTHLY" | "YEARLY" | "HOURLY";

interface Employer {
  fullName: string | null;
  profilePic: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  id: string;
  employerId: string;
  title: string;
  description: string;
  location: string;
  isRemote: boolean;
  salaryType: string;
  salaryFrequency: SalaryFrequency;
  salaryAmount: string;
  isAnonymous: boolean;
  responsibilities: string[];
  benefits: string[];
  experienceLevel: ExperienceLevel;
  minExperience: number;
  educationLevel: string;
  numberOfEmployees: number;
  deadline: string;
  categoryId: string;
  jobType: JobType[];
  status: string;
  createdAt: string;
  updatedAt: string;
  employer: Employer;
  category: Category;
}

const JobOpportunities: React.FC = () => {
  const { data: jobsResponse, isLoading, error } = useGetPublicJobsQuery({});
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);

  const user = useSelector((state: any) => state.auth?.user);
  const role = user?.role;

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  const jobsList: Job[] = Array.isArray(jobsResponse?.data)
    ? jobsResponse.data
    : Array.isArray(jobsResponse?.data?.data)
      ? jobsResponse.data.data
      : Array.isArray(jobsResponse)
        ? jobsResponse
        : [];


const formatSalary = (amount: string, frequency?: string): string => {
  if (!amount) return "Negotiable";
  
  const freq = (frequency || "").toUpperCase();
  const frequencyLabel: Record<string, string> = {
    MONTHLY: "Month",
    WEEKLY: "Week",
    CONTRACT: "Contract",
  };

  const label = frequencyLabel[freq] ?? frequency ?? "";
  return ` JMD ${Number(amount).toLocaleString()}${label ? `/${label}` : ""}`;
};

  const formatDate = (deadline?: string, createdAt?: string): string => {
    const source = deadline || createdAt;
    if (!source) return "Recent";
    try {
      return new Date(source).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return "Recent";
    }
  };

  const buildImageUrl = (path?: string | null): string | null => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    if (!API_BASE) return null;
    return `${API_BASE}${path}`;
  };

  const handleJobClick = (jobId: string) => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    if (role === "JOB_SEEKER") {
      router.push(`/jobseeker/jobs/${jobId}`);
      return;
    }

    if (role === "COMPANY" || role === "EMPLOYER") {
      setShowAlert(true);
      return;
    }
  };

  const handleLogout = () => {
  localStorage.clear();
  setShowAlert(false);
  window.location.href = "/auth/signin";
};

  return (
    <div className="max-w-[1622px] w-full mx-auto pb-10 px-4">

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Wrong Account Type</h3>
            <p className="text-gray-500 text-sm mb-6">
              This page is for job seekers. Please log out and sign in with a
              job seeker account to view job details.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAlert(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 rounded-xl bg-[#3FAE2A] text-white text-sm font-semibold hover:bg-[#35a020] transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mx-auto pb-12">
        <h5 className="text-[40px] md:text-[64px] font-bold mx-auto text-center text-[#3FAE2A] leading-tight">
          Explore Job Opportunities
        </h5>
        <p className="text-[16px] md:text-[20px] mx-auto text-center text-[#6B7280] mt-4">
          Discover the latest verified job openings from trusted employers - updated in real time.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading job opportunities...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">
            Failed to load job opportunities. Please try again later.
          </p>
        </div>
      )}

      {/* Job Cards */}
      {!isLoading && !error && jobsList.length > 0 && (
        <div className="flex flex-wrap justify-center gap-6">
          {jobsList.slice(0, 6).map((job: Job) => (
            <div
              key={job.id}
              onClick={() => handleJobClick(job.id)}
              className="cursor-pointer w-full max-w-[260px] flex justify-center"
            >
              <JobCard
                job={{
                  id: job.id,
                  title: job.title,
                  company: job.employer?.fullName || "Company",
                  logo:
                    buildImageUrl(job.employer?.profilePic) ||
                    buildImageUrl(job.category?.image) ||
                    "/image/jobOpportunities.webp",
                  date: formatDate(job.deadline, job.createdAt),
                  salary: job.salaryAmount
                    ? formatSalary(job.salaryAmount, job.salaryFrequency)
                    : "Negotiable",
                  location: job.location || "Location not specified",
                  type: [
                    ...(job.jobType?.map((t) => t.replace(/_/g, " ")) || []),
                    job.experienceLevel ? `${job.experienceLevel} level` : "",
                  ].filter(Boolean),
                  status: null,
                }}
                disableNavigation={true}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && jobsList.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No job opportunities available at the moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default JobOpportunities;