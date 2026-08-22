"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, ArrowLeft, MessageSquare } from "lucide-react";
import {
  useGetJobApplicantsQuery,
  useUpdateApplicationStatusMutation,
  useUpdateInterviewStatusMutation,
} from "@/redux/services/employerApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Applicant {
  id: string;
  jobSeekerId: string;
  chatUserId?: string;
  applicantName: string;
  applicantPic?: string;
  experienceLevel?: string;
  location?: string;
  skills: string[];
  status: string;
  appliedDate: string;
  interviewId?: string;
  interviewTime?: string;
  interviewType?: string;
  meetingLink?: string;
  interviewStatus?: string;
}

export default function JobApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = typeof params?.id === "string" ? params.id : "";
  const [activeTab, setActiveTab] = useState<"all" | "applied" | "scheduled">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch applicants
  const { data: applicantsData, isLoading: applicantsLoading, error: applicantsError, refetch: refetchApplicants } = useGetJobApplicantsQuery(
    {
      jobId,
      page: currentPage,
      limit: 10,
    },
    { skip: !jobId, refetchOnMountOrArgChange: true }
  );

  const handleStatusUpdated = () => {
    void refetchApplicants();
  };

  const applicants = Array.isArray(applicantsData)
    ? applicantsData
    : applicantsData?.data || [];

  const pagination = Array.isArray(applicantsData)
    ? { total: applicants.length, totalPages: 1, hasNextPage: false, hasPrevPage: false }
    : applicantsData?.meta || { total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false };

  // Map only non-interviewed applicants
  const appliedApplicants: Applicant[] = applicants
    .filter((item: any) => !item.interview)
    .map((item: any) => ({
      id: item.id,
      jobSeekerId: item.jobSeeker?.id || item.userInfo?.id || "",
      chatUserId: item.userInfo?.userId || item.jobSeeker?.userId || item.jobSeeker?.id || "",
      applicantName: item.jobSeeker?.fullName || item.userInfo?.fullName || "Unknown",
      applicantPic: item.jobSeeker?.profilePic || item.userInfo?.profilePic,
      experienceLevel: item.jobSeeker?.experienceLevel || item.userInfo?.experienceLevel,
      location: item.jobSeeker?.location,
      skills: item.jobSeeker?.skills || [],
      status: item.status || item.applicationStatus,
      appliedDate: item.createdAt || item.appliedDate,
    }));

  // Map interviewed applicants from the same API response
  const scheduledApplicants: Applicant[] = applicants
    .filter((item: any) => !!item.interview)
    .map((item: any) => ({
      id: item.id,
      jobSeekerId: item.jobSeeker?.id || item.userInfo?.id || "",
      chatUserId: item.userInfo?.userId || item.jobSeeker?.userId || item.jobSeeker?.id || "",
      applicantName: item.jobSeeker?.fullName || item.userInfo?.fullName || "Unknown",
      applicantPic: item.jobSeeker?.profilePic || item.userInfo?.profilePic,
      experienceLevel: item.jobSeeker?.experienceLevel || item.userInfo?.experienceLevel,
      location: item.jobSeeker?.location,
      skills: item.jobSeeker?.skills || [],
      status: item.status || item.applicationStatus,
      appliedDate: item.createdAt || item.appliedDate,
      interviewId: item.interview?.id,
      interviewTime: item.interview?.scheduleTime,
      interviewType: item.interview?.interviewType,
      meetingLink: item.interview?.meetingLink,
      interviewStatus: item.interview?.status || item.interviewStatus,
    }));

  // Get IDs of applicants that have scheduled interviews
  const scheduledApplicantIds = new Set(scheduledApplicants.map((a) => a.id));

  // Only applied (without scheduled interviews)
  const onlyAppliedApplicants = appliedApplicants.filter((a) => !scheduledApplicantIds.has(a.id));

  // Combine and filter based on tab
  const filteredApplicants =
    activeTab === "applied"
      ? onlyAppliedApplicants
      : activeTab === "scheduled"
        ? scheduledApplicants
        : [...onlyAppliedApplicants, ...scheduledApplicants];

  const totalApplicants = applicants.length;
  const totalScheduled = scheduledApplicants.length;
  const totalApplied = onlyAppliedApplicants.length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applicants</h1>
          <p className="text-sm text-gray-600">Total Applicants: {totalApplicants}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-6 py-2.5 font-semibold rounded-md transition duration-200 ${
            activeTab === "all"
              ? "bg-[#3FAE2A] text-white shadow-md"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          }`}
        >
          All ({totalApplicants})
        </button>
        <button
          onClick={() => setActiveTab("applied")}
          className={`px-6 py-2.5 font-semibold rounded-md transition duration-200 ${
            activeTab === "applied"
              ? "bg-[#3FAE2A] text-white shadow-md"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          }`}
        >
          Applied ({totalApplied})
        </button>
        <button
          onClick={() => setActiveTab("scheduled")}
          className={`px-6 py-2.5 font-semibold rounded-md transition duration-200 ${
            activeTab === "scheduled"
              ? "bg-[#3FAE2A] text-white shadow-md"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          }`}
        >
          Scheduled ({totalScheduled})
        </button>
      </div>

      {applicantsLoading ? (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin text-[#3FAE2A]" size={40} />
        </div>
      ) : applicantsError ? (
        <div className="text-center text-red-500 py-12">
          Failed to load applicants. Please try again later.
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {activeTab === "scheduled" ? "No interviews scheduled yet for this job." : "No applicants found."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplicants.map((applicant) => (
              <ApplicantCard
                key={applicant.id}
                applicant={applicant}
                isScheduled={activeTab === "scheduled" || !!applicant.interviewId}
                jobId={jobId}
                onStatusUpdated={handleStatusUpdated}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={!pagination.hasPrevPage || applicantsLoading}
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
              disabled={!pagination.hasNextPage || applicantsLoading}
              className="rounded-full px-6 py-2 bg-[#3FAE2A] hover:bg-[#359624] text-white disabled:opacity-50"
            >
              Next Page {">"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ApplicantCard({ applicant, isScheduled, jobId, onStatusUpdated }: { applicant: Applicant; isScheduled: boolean; jobId: string; onStatusUpdated: () => void }) {
  const router = useRouter();
  const [isRejecting, setIsRejecting] = useState(false);
  const [isHiring, setIsHiring] = useState(false);
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();
  const [updateInterviewStatus] = useUpdateInterviewStatusMutation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleReject = async () => {
    if (!window.confirm("Are you sure you want to reject this applicant?")) {
      return;
    }

    setIsRejecting(true);
    try {
      if (isScheduled && applicant.interviewId) {
        await updateInterviewStatus({
          interviewId: applicant.interviewId,
          status: "REJECTED",
        }).unwrap();
      } else {
        await updateApplicationStatus({
          appId: applicant.id,
          status: "REJECTED",
        }).unwrap();
      }
      onStatusUpdated();
      alert("Applicant rejected successfully");
    } catch (error) {
      console.error("Failed to reject applicant:", error);
      alert("Failed to reject applicant. Please try again.");
    } finally {
      setIsRejecting(false);
    }
  };

      const handleHire = async () => {
        if (!applicant.interviewId) {
          alert("Interview ID not found for this applicant.");
          return;
        }

        if (!window.confirm("Are you sure you want to hire this applicant?")) {
          return;
        }

        setIsHiring(true);
        try {
          await updateInterviewStatus({
            interviewId: applicant.interviewId,
            status: "HIRED",
          }).unwrap();

          await updateApplicationStatus({
            appId: applicant.id,
            status: "HIRED",
          }).unwrap();

          onStatusUpdated();
          alert("Applicant hired successfully");
        } catch (error) {
          console.error("Failed to hire applicant:", error);
          alert("Failed to hire applicant. Please try again.");
        } finally {
          setIsHiring(false);
        }
      };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const profileImageUrl = applicant.applicantPic
    ? `${apiUrl}${applicant.applicantPic}`
    : undefined;

  const normalizedInterviewStatus = (applicant.interviewStatus || applicant.status || "").toUpperCase();
  const normalizedApplicationStatus = (applicant.status || "").toUpperCase();
  const isRejected = normalizedInterviewStatus === "REJECTED" || normalizedApplicationStatus === "REJECTED";
  const isViewed = !isScheduled && normalizedApplicationStatus === "VIEWED";
  const isCompleted = normalizedInterviewStatus === "COMPLETED" || normalizedInterviewStatus === "COMPLETE";
  const isHired = normalizedInterviewStatus === "HIRED" || normalizedApplicationStatus === "HIRED";
  const isScheduledStatus = normalizedInterviewStatus === "SCHEDULED" || normalizedApplicationStatus === "INTERVIEW" || isScheduled;

  const badgeStatus = isRejected
    ? "REJECTED"
    : isHired
      ? "HIRED"
      : isCompleted
        ? "COMPLETED"
        : isScheduledStatus
          ? "SCHEDULED"
          : isViewed
            ? "VIEWED"
            : "APPLIED";

  const interviewBadgeClasses =
    badgeStatus === "HIRED"
      ? "bg-emerald-100 text-emerald-700"
      : badgeStatus === "REJECTED"
        ? "bg-red-100 text-red-600"
        : badgeStatus === "COMPLETED"
          ? "bg-blue-100 text-blue-600"
          : badgeStatus === "SCHEDULED"
            ? "bg-orange-100 text-orange-600"
            : badgeStatus === "VIEWED"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-blue-100 text-blue-600";

  const handleDetails = () => {
    if (!applicant.interviewId) {
      return;
    }

    const queryParams = new URLSearchParams();
    if (jobId) queryParams.set("jobId", jobId);
    queryParams.set("interviewId", applicant.interviewId);
    router.push(`/company/jobs/details?${queryParams.toString()}`);
  };

  const handleMessage = () => {
    const targetUserId = applicant.chatUserId || applicant.jobSeekerId;
    if (!targetUserId) return;
    router.push(`/inbox?targetUserId=${encodeURIComponent(targetUserId)}`);
  };

  return (
    <Card className="p-4 space-y-3 bg-gray-50 border-gray-200 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Avatar className="h-14 w-14 flex-shrink-0">
            <AvatarImage src={profileImageUrl} alt={applicant.applicantName} className="object-cover" />
            <AvatarFallback className="bg-[#EAF6EA] text-[#3FAE2A] font-bold">
              {applicant.applicantName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">{applicant.applicantName}</h3>
            <p className="text-sm text-gray-500">{applicant.location || "Location not specified"}</p>
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
            isRejected
              ? "bg-red-100 text-red-600"
              : interviewBadgeClasses
          }`}
        >
          {badgeStatus}
        </span>
      </div>

      {/* Details - Show for both, but different content */}
      <div className="space-y-1 text-sm">
        {!isScheduled && !isRejected && (
          <div>
            <span className="text-gray-500">Experience:</span>
            <span className="font-semibold text-gray-900 ml-1">
              {applicant.experienceLevel || "Not specified"}
            </span>
          </div>
        )}
        <div>
          <span className="text-gray-500">{isScheduled ? "Applied Date:" : "Applied Date:"}</span>
          <span className="font-semibold text-gray-900 ml-1">{formatDate(applicant.appliedDate)}</span>
        </div>
        {isScheduled && applicant.interviewTime && (
          <div>
            <span className="text-gray-500">Interview Time:</span>
            <span className="font-semibold text-gray-900 ml-1">{applicant.interviewTime}</span>
          </div>
        )}
        {isScheduled && applicant.interviewType && (
          <div>
            <span className="text-gray-500">Interview Type:</span>
            <span className="font-semibold text-gray-900 ml-1">{applicant.interviewType}</span>
          </div>
        )}
      </div>

      {/* Skills - Only show for applied applicants */}
      {!isScheduled && !isRejected && applicant.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {applicant.skills.slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              className="bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-medium"
            >
              {skill}
            </span>
          ))}
          {applicant.skills.length > 4 && (
            <span className="text-[10px] text-gray-400">+{applicant.skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {isRejected ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-red-600 text-sm font-semibold">Rejected</p>
        </div>
      ) : isHired ? (
        <div className="grid grid-cols-1 gap-3 pt-1">
          <Button
            onClick={handleMessage}
            variant="outline"
            className="text-gray-600 border-gray-300 hover:bg-gray-50 font-semibold rounded-full py-5 text-sm gap-2"
          >
            <MessageSquare size={14} />
            Message
          </Button>
        </div>
      ) : isCompleted ? (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            onClick={handleHire}
            disabled={isHiring || isRejecting}
            className="bg-[#3FAE2A] hover:bg-[#2d8620] text-white font-semibold rounded-full py-5 text-sm disabled:opacity-60"
          >
            {isHiring ? "Hiring..." : "Hire"}
          </Button>
          <Button
            onClick={handleReject}
            disabled={isRejecting}
            variant="outline"
            className="text-red-500 border-red-300 hover:bg-red-50 font-semibold rounded-full py-5 text-sm"
          >
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            onClick={async () => {
              if (!isScheduled && !isRejected && applicant.status === "APPLIED") {
                try {
                  await updateApplicationStatus({
                    appId: applicant.id,
                    status: "VIEWED",
                  }).unwrap();
                  onStatusUpdated();
                } catch (error) {
                  console.error("Failed to update applicant status to VIEWED:", error);
                }
              }

              const queryParams = new URLSearchParams();
              if (isScheduled && applicant.interviewId) {
                if (jobId) queryParams.set('jobId', jobId);
                queryParams.set('interviewId', applicant.interviewId);
                router.push(`/company/jobs/details?${queryParams.toString()}`);
                return;
              }

              queryParams.set('appId', applicant.id);
              if (jobId) queryParams.set('jobId', jobId);
              router.push(`/company/jobs/${applicant.jobSeekerId}?${queryParams.toString()}`);
            }}
            className="bg-[#3FAE2A] hover:bg-[#2d8620] text-white font-semibold rounded-full py-5 text-sm"
          >
            {isScheduled ? "Details" : "View Profile"}
          </Button>
          <Button
            onClick={handleMessage}
            variant="outline"
            className="text-gray-600 border-gray-300 hover:bg-gray-50 font-semibold rounded-full py-5 text-sm gap-2"
          >
            <MessageSquare size={14} />
            Message
          </Button>
        </div>
      )}
    </Card>
  );
}

