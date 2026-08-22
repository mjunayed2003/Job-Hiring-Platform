"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useGetAllApplicantsQuery,
  useUpdateInterviewStatusMutation,
  useUpdateApplicationStatusMutation,
} from "@/redux/services/employerApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Interview {
  id: string;
  scheduleTime: string;
  interviewType?: string;
  meetingLink?: string;
  status: "SCHEDULED" | "COMPLETED" | "REJECTED" | "CANCELLED" | "HIRED";
}

interface Applicant {
  id: string;
  jobSeekerId: string;
  chatUserId?: string;
  applicantName: string;
  applicantPic?: string;
  jobTitle?: string;
  experienceLevel?: string;
  appliedDate: string;
  status: string;
  interview: Interview;
  jobId: string;
  appId: string;
  interviewId?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── InterviewScheduledPage ───────────────────────────────────────────────────

export default function InterviewScheduledPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [updateInterviewStatus] = useUpdateInterviewStatusMutation();
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  const {
    data: applicantsData,
    isLoading,
    error,
    refetch,
  } = useGetAllApplicantsQuery({
    page: currentPage,
    limit: 10,
    filter: "SCHEDULED",
  });

  const rawApplicants = applicantsData?.data || [];
  const pagination = applicantsData?.meta || { total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false };
  const summary = applicantsData?.summary || { scheduledApplicants: rawApplicants.length };

  const applicants: Applicant[] = rawApplicants.map((item: any) => ({
    id: item.appId,
    appId: item.appId,
    jobId: item.jobId,
    interviewId: item.interviewId,
    jobSeekerId: item.userInfo?.id || "",
    chatUserId: item.userInfo?.userId || item.userInfo?.id || "",
    applicantName: item.userInfo?.fullName || "Unknown",
    applicantPic: item.userInfo?.profilePic,
    jobTitle: item.userInfo?.designation || "N/A",
    experienceLevel: item.userInfo?.experienceLevel || "Not specified",
    appliedDate: "N/A",
    status: item.applicationStatus,
    interview: {
      id: item.interviewId || item.appId,
      scheduleTime: item.interviewStatus === "COMPLETED" ? "Interview attended" : "Scheduled",
      status: item.interviewStatus || "SCHEDULED",
    },
  }));

  const handleHire = async (applicant: Applicant) => {
    if (!applicant.interviewId) {
      alert("Interview ID not found for this applicant.");
      return;
    }

    try {
      await updateInterviewStatus({ interviewId: applicant.interviewId, status: "HIRED" }).unwrap();
      await updateApplicationStatus({ appId: applicant.appId, status: "HIRED" }).unwrap();
      void refetch();
      alert("Applicant hired successfully");
    } catch (hireError) {
      console.error("Failed to hire applicant:", hireError);
      alert("Failed to hire applicant");
    }
  };

  const handleReject = async (applicant: Applicant) => {
    const shouldReject = window.confirm("Are you sure you want to reject this applicant?");
    if (!shouldReject) return;

    if (!applicant.interviewId) {
      alert("Interview ID not found for this applicant.");
      return;
    }

    try {
      await updateInterviewStatus({ interviewId: applicant.interviewId, status: "REJECTED" }).unwrap();
      void refetch();
    } catch (rejectError) {
      console.error("Failed to reject applicant:", rejectError);
      alert("Failed to reject applicant");
    }
  };

  const handleDetails = (applicant: Applicant) => {
    const params = new URLSearchParams();
    params.set("appId", applicant.appId);
    params.set("jobId", applicant.jobId);
    if (applicant.interviewId) {
      params.set("interviewId", applicant.interviewId);
    }
    router.push(`/company/jobs/details?${params.toString()}`);
  };

  const handleMessage = (applicant: Applicant) => {
    const targetUserId = applicant.chatUserId || applicant.jobSeekerId;
    if (!targetUserId) {
      return;
    }

    router.push(`/inbox?targetUserId=${encodeURIComponent(targetUserId)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1300px] mx-auto px-4 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex  items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-9 h-9 border-gray-300 bg-white"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Interview Scheduled</h1>
            <p className="text-sm text-gray-500">
              Total Interview Scheduled:{" "}
              <span className="font-semibold text-gray-800">
                {String(summary.scheduledApplicants || applicants.length || 0).padStart(2, "0")}
              </span>
            </p>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="w-full max-w-[1170px] mx-auto overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader className="animate-spin text-[#3FAE2A]" size={36} />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 text-sm">
              Failed to load scheduled interviews.
            </div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm">
              No scheduled interviews found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {applicants.map((applicant) => (
                <ApplicantCard
                  key={applicant.id}
                  applicant={applicant}
                  onHire={handleHire}
                  onReject={handleReject}
                  onDetails={handleDetails}
                  onMessage={handleMessage}
                />
              ))}
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

// ─── ApplicantCard ────────────────────────────────────────────────────────────

interface ApplicantCardProps {
  applicant: Applicant;
  onHire: (a: Applicant) => void;
  onReject: (a: Applicant) => void;
  onDetails: (a: Applicant) => void;
  onMessage: (a: Applicant) => void;
}

function ApplicantCard({
  applicant,
  onHire,
  onReject,
  onDetails,
  onMessage,
}: ApplicantCardProps) {
  const [loading, setLoading] = useState<"hire" | "reject" | null>(null);

  const isCompleted  = applicant.interview.status === "COMPLETED";
  const isScheduled  = applicant.interview.status === "SCHEDULED";
  const isRejected   = applicant.interview.status === "REJECTED";
  const isCancelled  = applicant.interview.status === "CANCELLED";
  const isHired      = applicant.interview.status === "HIRED";

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  const avatarSrc = applicant.applicantPic
    ? `${apiBase}${applicant.applicantPic}`
    : undefined;

  async function wrap(
    action: "hire" | "reject",
    fn: (a: Applicant) => void
  ) {
    setLoading(action);
    await Promise.resolve(fn(applicant));
    setLoading(null);
  }

  // Badge
  const badgeConfig: Record<string, { label: string; className: string }> = {
    SCHEDULED: { label: "Interview Scheduled", className: "bg-orange-100 text-orange-600 border-orange-200" },
    COMPLETED:  { label: "Completed", className: "bg-blue-100 text-blue-600 border-blue-200" },
    REJECTED:   { label: "Rejected",            className: "bg-red-100 text-red-600 border-red-200" },
    CANCELLED:  { label: "Cancelled",           className: "bg-gray-100 text-gray-600 border-gray-200" },
    HIRED:      { label: "Hired",               className: "bg-green-100 text-green-700 border-green-200" },
  };
  const badge = badgeConfig[applicant.interview.status] ?? badgeConfig.SCHEDULED;

  return (
    <Card className="bg-white  border border-gray-200 shadow-none rounded-xl hover:shadow-sm transition-shadow duration-200">
      <CardContent className="p-4 space-y-3">

        {/* ── Card Header ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <Avatar className="w-10 h-10 flex-shrink-0">
              {avatarSrc && (
                <AvatarImage src={avatarSrc} alt={applicant.applicantName} className="object-cover" />
              )}
              <AvatarFallback className="bg-green-100 text-green-700 font-bold text-sm">
                {getInitials(applicant.applicantName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">
                {applicant.applicantName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {applicant.jobTitle ?? "—"}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${badge.className}`}
          >
            {badge.label}
          </Badge>
        </div>

        {/* ── Info ── */}
        <div className="space-y-1 text-xs">
          <InfoRow label="Experience level" value={applicant.experienceLevel ?? "Not specified"} />
          <InfoRow label="Applied Date"     value={applicant.appliedDate} />
          <InfoRow label="Interview Schedule" value={applicant.interview.scheduleTime} />
        </div>

        {/* ── Action Buttons ── */}
        {isRejected || isCancelled ? (
          <div className={`rounded-lg p-2.5 text-center text-xs font-semibold
            ${isRejected ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
            {isRejected ? "Rejected" : "Cancelled"}
          </div>
        ) : isHired ? (
          <div className="bg-green-50 text-green-700 rounded-lg p-2.5 text-center text-xs font-semibold">
            Hired
          </div>
        ) : isCompleted ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              className="rounded-full bg-[#3FAE2A] hover:bg-[#2e9020] text-white text-xs font-semibold h-9"
              disabled={loading !== null}
              onClick={() => wrap("hire", onHire)}
            >
              {loading === "hire" ? "Hiring…" : "Hire"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold h-9"
              disabled={loading !== null}
              onClick={() => wrap("reject", onReject)}
            >
              {loading === "reject" ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        ) : isScheduled ? (
          // Upcoming interview → Details / Message
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              className="rounded-full bg-[#3FAE2A] hover:bg-[#2e9020] text-white text-xs font-semibold h-9"
              onClick={() => onDetails(applicant)}
            >
              Details
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-semibold h-9 gap-1"
              onClick={() => onMessage(applicant)}
            >
              <MessageSquare className="w-3 h-3" />
              Message
            </Button>
          </div>
        ) : null}

      </CardContent>
    </Card>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-gray-500">
      {label}:{" "}
      <span className="font-semibold text-gray-800">{value}</span>
    </p>
  );
}
