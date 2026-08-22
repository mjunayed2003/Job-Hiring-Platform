"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useGetAllApplicantsQuery,
  useUpdateApplicationStatusMutation,
} from "@/redux/services/employerApi";

interface Applicant {
  appId: string;
  jobId: string;
  interviewId?: string | null;
  applicationStatus: string;
  interviewStatus?: string;
  appliedDate?: string;
  experienceLevel?: string | null;
  userInfo?: {
    userId?: string;
    id?: string;
    fullName?: string;
    profilePic?: string | null;
    experienceLevel?: string | null;
    location?: string | null;
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatAppliedDate(value?: string): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

const statusBadgeClasses: Record<string, string> = {
  APPLIED: "bg-[#E8F5E5] text-[#3FAE2A] border-[#9FD38F]",
  VIEWED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INTERVIEW: "bg-orange-100 text-orange-600 border-orange-200",
  HIRED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-600 border-red-200",
};

export default function AppliedApplicantsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: applicantsData, isLoading, error, refetch } = useGetAllApplicantsQuery({
    page: currentPage,
    limit: 10,
    filter: "APPLIED",
  });
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  const applicants: Applicant[] = applicantsData?.data || [];
  const pagination = applicantsData?.meta || {
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const totalApplicants = applicantsData?.summary?.pendingApplicants ?? pagination.total ?? applicants.length;

  const handleViewProfile = async (applicant: Applicant) => {
    const queryParams = new URLSearchParams();
    queryParams.set("appId", applicant.appId);
    queryParams.set("jobId", applicant.jobId);
    if (applicant.interviewId) {
      queryParams.set("interviewId", applicant.interviewId);
    }

    const jobSeekerId = applicant.userInfo?.id;
    if (!jobSeekerId) return;

    if (applicant.appId && applicant.applicationStatus !== "VIEWED") {
      try {
        await updateApplicationStatus({
          appId: applicant.appId,
          status: "VIEWED",
        }).unwrap();
        refetch();
      } catch (err) {
        console.error("Failed to update application status to VIEWED", err);
      }
    }

    router.push(`/employer/jobs/jobseeker/${jobSeekerId}?${queryParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1300px] mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-9 h-9 border-gray-300 bg-white"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Applicants</h1>
            <p className="text-sm text-gray-500">
              Total Applicants:{" "}
              <span className="font-semibold text-gray-800">
                {String(totalApplicants).padStart(2, "0")}
              </span>
            </p>
          </div>
        </div>

        <div className="w-full max-w-[1170px] mx-auto overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader className="animate-spin text-[#3FAE2A]" size={36} />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 text-sm">Failed to load applicants.</div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm">No applicants found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {applicants.map((applicant) => {
                const applicantName = applicant.userInfo?.fullName || "Unknown";
                const experienceLevel =
                  applicant.userInfo?.experienceLevel || applicant.experienceLevel || "Not specified";
                const jobTitle = applicant.userInfo?.location || "N/A";
                const avatarSrc = applicant.userInfo?.profilePic
                  ? `${process.env.NEXT_PUBLIC_API_URL ?? ""}${applicant.userInfo.profilePic}`
                  : undefined;
                const statusKey = applicant.applicationStatus || "APPLIED";
                const badgeClass = statusBadgeClasses[statusKey] || "bg-gray-100 text-gray-600 border-gray-200";
                const appliedDate = formatAppliedDate(applicant.appliedDate);

                return (
                  <Card
                    key={applicant.appId}
                    className="bg-white border border-gray-200 shadow-none rounded-xl hover:shadow-sm transition-shadow duration-200"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <Avatar className="w-11 h-11 flex-shrink-0">
                            {avatarSrc && (
                              <AvatarImage src={avatarSrc} alt={applicantName} className="object-cover" />
                            )}
                            <AvatarFallback className="bg-green-100 text-green-700 font-bold text-sm">
                              {getInitials(applicantName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">{applicantName}</p>
                            <p className="text-xs text-gray-500 truncate">{jobTitle}</p>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${badgeClass}`}
                        >
                          {statusKey}
                        </Badge>
                      </div>

                      <div className="border-t border-dashed border-gray-200" />

                      <div className="space-y-1.5 text-xs">
                        <p className="text-gray-500">
                          Experience level:{" "}
                          <span className="font-semibold text-gray-800">{experienceLevel}</span>
                        </p>
                        <p className="text-gray-500">
                          Applied Date:{" "}
                          <span className="font-semibold text-gray-800">{appliedDate}</span>
                        </p>
                      </div>

                      <div className="pt-1">
                        <Button
                          size="sm"
                          className="w-full rounded-full bg-[#3FAE2A] hover:bg-[#2e9020] text-white text-xs font-semibold h-9"
                          onClick={() => handleViewProfile(applicant)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!isLoading && !error && applicants.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!pagination.hasPrevPage || isLoading}
                variant="outline"
                className="rounded-full px-4 py-2 border-[#3FAE2A] text-[#3FAE2A] hover:bg-[#EAF6EA] disabled:opacity-50"
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-full font-semibold text-sm transition ${
                      currentPage === page
                        ? "bg-[#3FAE2A] text-white"
                        : "border border-gray-300 text-gray-600 hover:border-[#3FAE2A] hover:text-[#3FAE2A]"
                    }`}
                  >
                    {String(page).padStart(2, "0")}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages || 1, currentPage + 1))}
                disabled={!pagination.hasNextPage || isLoading}
                className="rounded-full px-6 py-2 bg-[#3FAE2A] hover:bg-[#359624] text-white disabled:opacity-50"
              >
                Next Page {">"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}