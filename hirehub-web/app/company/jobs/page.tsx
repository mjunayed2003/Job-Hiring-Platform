"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Plus, Loader, Crown } from "lucide-react";
import {
  useGetActiveSubscriptionQuery,
  useGetEmployerDashboardQuery,
  useGetEmployerJobsQuery,
} from "@/redux/services/employerApi";

export default function JobsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch dashboard stats
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useGetEmployerDashboardQuery();

  // Fetch employer jobs with pagination and search
  const { data: jobsData, isLoading: jobsLoading, error: jobsError } = useGetEmployerJobsQuery({
    page: currentPage,
    limit: 9,
    search: search || undefined  // Pass search to API
  });

  const { data: activeSubscription, isLoading: subLoading } = useGetActiveSubscriptionQuery();

  const stats = dashboard ? [
    { label: "Active Jobs", count: dashboard.activeJobs || 0 },
    { label: "Pending Applicants", count: dashboard.pendingApplicants || 0, path: "/company/jobs/all-pendin" },
    { label: "Interviews Scheduled + Competed", count: dashboard.interviewsScheduled || 0, path: "/company/jobs/interview" },
    { label: "Hires Completed", count: dashboard.hiresCompleted || 0, path: "/company/jobs/hire-completed" },
  ] : [
    { label: "Active Jobs", count: 0 },
    { label: "Pending Applicants", count: 0, path: "/company/jobs/all-pendin" },
    { label: "Interviews Scheduled + Competed", count: 0, path: "/company/jobs/interview" },
    { label: "Hires Completed", count: 0, path: "/company/jobs/hire-completed" },
  ];

  const jobs = Array.isArray(jobsData)
    ? jobsData
    : jobsData?.data || [];

  const pagination = Array.isArray(jobsData)
    ? { total: jobs.length, totalPages: 1, hasNextPage: false, hasPrevPage: false }
    : jobsData?.meta || { total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false };
  const hasPlan = Boolean(activeSubscription?.planName) && (activeSubscription?.remainingDays ?? 0) > 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-white min-h-screen">
      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {dashLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader className="animate-spin text-[#3FAE2A]" size={32} />
          </div>
        ) : dashError ? (
          <div className="col-span-full text-center text-red-500 py-8">
            Failed to load dashboard data
          </div>
        ) : (
          stats.map((stat, i) => (
            <div
              key={i}
              onClick={() => stat.path && router.push(stat.path)}
              className={`bg-[#EAF6EA] border-none p-6 text-center transition rounded-lg ${stat.path ? "cursor-pointer hover:opacity-80" : "cursor-default"
                }`}
            >
              <h2 className="text-3xl font-bold text-[#3FAE2A]">{stat.count}</h2>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={() => router.push("/company/job-post")}
          className="bg-[#3FAE2A] hover:bg-green-700 px-14 py-6 rounded-xl text-lg gap-2"
        >
          <Plus size={25} /> Post a New Job
        </Button>

        {/* Subscription Badge */}
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 border ${hasPlan
            ? "bg-[#EAF6EA] border-green-100"
            : "bg-gray-50 border-gray-200"
          }`} onClick={()=>router.push("/company/jobs/subcription")}>
          <Crown size={22} className={hasPlan ? "text-[#3FAE2A]" : "text-gray-400"} />
          <div className="flex flex-col">
            <span className={`text-[13px] font-bold ${hasPlan ? "text-[#1a1a1a]" : "text-gray-500"}`}>
              {subLoading ? "Loading plan..." : hasPlan ? activeSubscription.planName : "No plan"}
            </span>
            <span className="text-[11px] text-gray-400">
              {subLoading ? "Checking status" : hasPlan ? `Expires in ${activeSubscription.remainingDays} days` : "Expires in 0 days"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            className="pl-10 rounded-full h-11 border-gray-200"
            placeholder="Search jobs, companies, or locations"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);  // Reset to page 1 when searching
            }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">My Job Posts</h3>

        {jobsLoading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-[#3FAE2A]" size={40} />
          </div>
        ) : jobsError ? (
          <div className="text-center text-red-500 py-12">
            Failed to load jobs. Please try again later.
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {search ? "No jobs found matching your search." : "No jobs posted yet."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {jobs.map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!pagination.hasPrevPage || jobsLoading}
                variant="outline"
                className="rounded-full px-4 py-2 border-[#3FAE2A] text-[#3FAE2A] hover:bg-[#EAF6EA] disabled:opacity-50"
              >
                ← Previous
              </Button>

              <div className="flex gap-2">
                {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-full font-semibold text-sm transition ${currentPage === page
                        ? 'bg-[#3FAE2A] text-white'
                        : 'border border-gray-300 text-gray-600 hover:border-[#3FAE2A] hover:text-[#3FAE2A]'
                      }`}
                  >
                    {String(page).padStart(2, '0')}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages || 1, currentPage + 1))}
                disabled={!pagination.hasNextPage || jobsLoading}
                className="rounded-full px-6 py-2 bg-[#3FAE2A] hover:bg-[#359624] text-white disabled:opacity-50"
              >
                Next Page →
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function JobCard({ job }: { job: any }) {
  const router = useRouter();

  // Helper function to format job type labels
  const formatJobType = (type: string) => {
    const typeMap: Record<string, string> = {
      "FULL_TIME": "Full Time",
      "PART_TIME": "Part Time",
      "CONTRACT": "Contract",
      "INTERNSHIP": "Internship",
    };
    return typeMap[type] || type;
  };

  // Helper function to format work time labels
  const formatWorkTime = (time: string) => {
    const timeMap: Record<string, string> = {
      "ON_SITE": "On-Site",
      "REMOTE": "Remote",
      "HYBRID": "Hybrid",
      "On-Site": "On-Site",
      "Remote": "Remote",
      "Day": "Day Shift",
      "Night": "Night Shift",
    };
    return timeMap[time] || time;
  };

  // Extract tags from API response - SHOW ALL items, not just first
  const tags = [
    // Remote indicator
    ...(job.isRemote ? ["Remote"] : []),
    // All job types
    ...(job.type && Array.isArray(job.type)
      ? job.type.map((t: string) => formatJobType(t))
      : []
    ),
    // Experience level
    ...(job.experienceLevel ? [`${job.experienceLevel} level`] : []),
    // All work times
    ...(job.workTime && Array.isArray(job.workTime)
      ? job.workTime.map((time: string) => formatWorkTime(time))
      : []
    ),
  ].filter(Boolean);

  // Format salary
  const salaryDisplay = job.salary
    ? `JMD ${job.salary}/${job.salaryFrequency === "MONTHLY" ? "Month" : job.salaryFrequency}`
    : "Not specified";
  // Extract categories from response
  const categoryTags = job.categories && Array.isArray(job.categories)
    ? job.categories.map((cat: any) => typeof cat === 'object' ? cat.name : cat).filter(Boolean)
    : [];
  return (
    <div
      className="bg-white relative flex flex-col justify-between p-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] transition-all duration-300"
      style={{
        width: '345px',
        height: 'auto',
        minHeight: '240px',
        borderRadius: '10px',
        border: '0.6px solid #e5e7eb',
      }}
    >

      {/* Top Section */}
      <div>
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-[16px] text-[#1a1a1a] line-clamp-2">{job.title}</h3>
          <span className={`${job.status === 'OPEN'
              ? 'bg-[#EAF6EA] text-[#3FAE2A] border border-green-100'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
            } text-[10px] font-semibold px-2.5 py-0.5 rounded-full`}>
            {job.status === 'OPEN' ? 'Open' : job.status}
          </span>
        </div>

        <div className="flex items-center text-gray-500 text-[12px] mb-3">
          <MapPin size={12} className="mr-1" /> {job.location || 'Location not specified'}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.length > 0 ? (
            tags.map((tag: string, idx: number) => (
              <span key={idx} className="border border-gray-300 text-gray-500 px-2.5 py-[2px] rounded-full text-[10px] font-medium line-clamp-1">
                {tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-gray-400">No tags</span>
          )}
        </div>

        {/* Categories Tags */}
        {categoryTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {categoryTags.map((cat: string, idx: number) => (
              <span key={idx} className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-[2px] rounded-full text-[10px] font-medium">
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Salary & Applicants */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[#3FAE2A] font-bold text-[14px]">
            {salaryDisplay}
          </span>
          <span className="text-gray-500 text-[11px] font-medium">
            Applicants: {String(job.totalApplicants || 0).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Buttons Section (Bottom) */}
      <div className="flex gap-3 mt-auto pt-4">
        <Button
          onClick={() => router.push(`/company/jobs/${job.id}/applicants`)}
          className="flex-1 bg-[#3FAE2A] hover:bg-[#359624] h-[34px] rounded-full text-[12px] font-bold"
        >
          View Applicants
        </Button>
        <Button
          onClick={() => router.push(`/company/jobs/${job.id}/edit`)}
          variant="secondary"
          className="flex-1 bg-[#F0FDF4] hover:bg-green-100 text-[#3FAE2A] h-[34px] rounded-full text-[12px] font-bold"
        >
          Edit Job
        </Button>
      </div>

    </div>
  );
}
