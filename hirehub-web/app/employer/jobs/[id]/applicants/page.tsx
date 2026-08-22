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
import { useMarkEmployerHireCompletedMutation } from "@/redux/services/featuresApi";
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
  paymentStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  candidateCompletedAt?: string | null;
  employerCompletedAt?: string | null;
  interview?: {
    payment?: {
      employerCompletedAt?: string | null;
    };
  };
}

export default function JobApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = typeof params?.id === "string" ? params.id : "";
  const [activeTab, setActiveTab] = useState<"all" | "applied" | "scheduled">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: applicantsData,
    isLoading: applicantsLoading,
    error: applicantsError,
    refetch: refetchApplicants,
  } = useGetJobApplicantsQuery(
    { jobId, page: currentPage, limit: 10 },
    { skip: !jobId, refetchOnMountOrArgChange: true }
  );

  const handleStatusUpdated = () => {
    void refetchApplicants();
  };

  const allApplicants = Array.isArray(applicantsData)
    ? applicantsData
    : applicantsData?.data || [];

  const pagination = Array.isArray(applicantsData)
    ? { total: allApplicants.length, totalPages: 1, hasNextPage: false, hasPrevPage: false }
    : applicantsData?.meta || { total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false };

  const validApplicants = allApplicants.filter((item: any) => {
    const appStatus = item.status;
    const interviewStatus = item.interview?.status;
    const paymentStatus = item.interview?.payment?.status || item.payment?.status || item.paymentStatus;

    if (appStatus === "APPLIED" || appStatus === "VIEWED") return true;

    if (
      item.interview &&
      (interviewStatus === "SCHEDULED" || interviewStatus === "COMPLETED")
    ) {
      if (
        paymentStatus &&
        paymentStatus !== "PAID" &&
        paymentStatus !== "FAILED" &&
        paymentStatus !== "PENDING"
      ) {
        return false;
      }
      return true;
    }

    if (paymentStatus === "PAID" || paymentStatus === "FAILED" || paymentStatus === "PENDING") return true;

    return false;
  });

  const appliedApplicants: Applicant[] = validApplicants
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

  const scheduledApplicants: Applicant[] = validApplicants
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
      interviewStatus: item.interview?.status,
      paymentStatus:
        item.interview?.payment?.status ||
        item.payment?.status ||
        (item.paymentStatus === true
          ? "PAID"
          : item.paymentStatus === false
            ? "PENDING"
            : undefined),
      candidateCompletedAt: item.interview?.payment?.candidateCompletedAt,
      employerCompletedAt: item.interview?.payment?.employerCompletedAt,
    }));

  const scheduledApplicantIds = new Set(scheduledApplicants.map((a) => a.id));
  const onlyAppliedApplicants = appliedApplicants.filter((a) => !scheduledApplicantIds.has(a.id));

  const filteredApplicants =
    activeTab === "applied"
      ? onlyAppliedApplicants
      : activeTab === "scheduled"
        ? scheduledApplicants
        : [...onlyAppliedApplicants, ...scheduledApplicants];

  const totalApplicants = validApplicants.length;
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
        {(["all", "applied", "scheduled"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 font-semibold rounded-md transition duration-200 ${activeTab === tab
                ? "bg-[#3FAE2A] text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
              }`}
          >
            {tab === "all"
              ? `All (${totalApplicants})`
              : tab === "applied"
                ? `Applied (${totalApplied})`
                : `Scheduled (${totalScheduled})`}
          </button>
        ))}
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
          {activeTab === "scheduled"
            ? "No interviews scheduled yet for this job."
            : "No applicants found."}
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

          {/* Pagination */}
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
                  className={`w-10 h-10 rounded-full font-semibold text-sm transition ${currentPage === page
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

function ApplicantCard({
  applicant,
  isScheduled,
  jobId,
  onStatusUpdated,
}: {
  applicant: Applicant;
  isScheduled: boolean;
  jobId: string;
  onStatusUpdated: () => void;
}) {
  const router = useRouter();
  const [isRejecting, setIsRejecting] = useState(false);
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();
  const [updateInterviewStatus] = useUpdateInterviewStatusMutation();
  const [markEmployerHireCompleted, { isLoading: isConfirming }] = useMarkEmployerHireCompletedMutation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleReject = async () => {
    if (!window.confirm("Are you sure you want to reject this applicant?")) return;
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

  const handleHire = () => {
    const queryParams = new URLSearchParams();
    queryParams.set("appId", applicant.id);
    if (jobId) queryParams.set("jobId", jobId);
    if (applicant.interviewId) queryParams.set("interviewId", applicant.interviewId);
    router.push(`/employer/jobs/hire?${queryParams.toString()}`);
  };

  const handleMessage = () => {
    const targetUserId = applicant.chatUserId || applicant.jobSeekerId;
    if (!targetUserId) return;
    router.push(`/inbox?targetUserId=${encodeURIComponent(targetUserId)}`);
  };

  const handleCompleted = async () => {
    if (!applicant.interviewId || isEmployerConfirmed) return;

    try {
      await markEmployerHireCompleted({ interviewId: applicant.interviewId }).unwrap();
      onStatusUpdated();
    } catch (error) {
      console.error("Failed to confirm hire completion:", error);
      alert("Failed to confirm completion. Please try again.");
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const profileImageUrl = applicant.applicantPic
    ? `${apiUrl}${applicant.applicantPic}`
    : undefined;

  // ✅ isScheduled comes from props — do NOT redeclare it
  // ✅ Derive a separate local boolean for "interview is in SCHEDULED status"
  const isInterviewScheduled = !!applicant.interviewId && applicant.interviewStatus === "SCHEDULED";
  const isViewed = !isScheduled && applicant.status === "VIEWED";
  const isCompleted = applicant.interviewStatus === "COMPLETED";
  const isHired = applicant.interviewStatus === "HIRED";
  const isEmployerConfirmed = Boolean(applicant.employerCompletedAt || applicant.interview?.payment?.employerCompletedAt);

  const paymentStatus = applicant.paymentStatus?.toUpperCase() as Applicant["paymentStatus"] | undefined;
  const isPaymentPaid = paymentStatus === "PAID";
  const isPaymentFailed = paymentStatus === "FAILED";
  const isPaymentPending = paymentStatus === "PENDING" || (!paymentStatus && isHired);
  const isPaymentActionable = paymentStatus === "FAILED" || paymentStatus === "PENDING";

  const badgeStatus = isPaymentFailed
    ? "FAILED"
    : isHired && isPaymentPending
      ? "PAYMENT PENDING"
      : isHired && isPaymentPaid
        ? "HIRED"
        : isCompleted
          ? "COMPLETED"
          : applicant.interviewStatus === "SCHEDULED"
            ? "SCHEDULED"
            : isViewed
              ? "VIEWED"
              : "APPLIED";

  const badgeConfig: Record<string, { label: string; className: string }> = {
    SCHEDULED: { label: "Interview Scheduled", className: "bg-orange-100 text-orange-600 border-orange-200" },
    COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-600 border-blue-200" },
    FAILED: { label: "Failed", className: "bg-red-100 text-red-600 border-red-200" },
    "PAYMENT PENDING": { label: "Payment Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    HIRED: { label: "Hired", className: "bg-green-100 text-green-700 border-green-200" },
    VIEWED: { label: "Viewed", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    APPLIED: { label: "Applied", className: "bg-blue-100 text-blue-600 border-blue-200" },
  };

  const badge = badgeConfig[badgeStatus] ?? badgeConfig.APPLIED;

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
        <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1 text-sm">
        {!isScheduled && (
          <div>
            <span className="text-gray-500">Experience:</span>
            <span className="font-semibold text-gray-900 ml-1">
              {applicant.experienceLevel || "Not specified"}
            </span>
          </div>
        )}
        <div>
          <span className="text-gray-500">Applied Date:</span>
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
        {isScheduled && paymentStatus && (
          <div>
            <span className="text-gray-500">Payment Status:</span>
            <span className="font-semibold text-gray-900 ml-1">{paymentStatus}</span>
          </div>
        )}
      </div>

      {/* Skills — only for applied */}
      {!isScheduled && applicant.skills.length > 0 && (
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
      {isHired ? (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCompleted}
              disabled={isConfirming || isEmployerConfirmed || !applicant.interviewId}
              className={`font-semibold rounded-full py-5 text-sm ${
                isEmployerConfirmed
                  ? "bg-[#3FAE2A] text-white opacity-80 cursor-not-allowed"
                  : "bg-[#3FAE2A] hover:bg-[#2d8620] text-white"
              }`}
            >
              Completed
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

          <div className="rounded-2xl border border-[#cfe3ff] bg-[#f3f7ff] px-4 py-4 shadow-sm">
            <div className="flex gap-3">
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#28406f] text-white">
                <span className="text-sm font-bold leading-none">✓</span>
              </div>
              <p className="text-sm leading-6 text-gray-700">
                {isEmployerConfirmed
                  ? "Completion confirmed. Payment can be released."
                  : "The hired employee has submitted the job as completed. Please review the job details and confirm completion. Once you're satisfied, you can release the payment."}
              </p>
            </div>
          </div>
        </div>
      ) : isPaymentPaid ? (
        <div className="pt-1">
          <Button
            onClick={handleMessage}
            variant="outline"
            className="w-full text-gray-600 border-gray-300 hover:bg-gray-50 font-semibold rounded-full py-5 text-sm gap-2"
          >
            <MessageSquare size={14} />
            Message
          </Button>
        </div>
      ) : isCompleted ? (
        // Interview COMPLETED → Hire + Reject
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            onClick={handleHire}
            className="bg-[#3FAE2A] hover:bg-[#2d8620] text-white font-semibold rounded-full py-5 text-sm"
          >
            Hire
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
      ) : isScheduled ? (
        // Interview SCHEDULED → Details only
        <div className="pt-1">
          <Button
            onClick={() => {
              const queryParams = new URLSearchParams();
              if (applicant.interviewId) {
                if (jobId) queryParams.set("jobId", jobId);
                queryParams.set("interviewId", applicant.interviewId);
                router.push(`/employer/jobs/details?${queryParams.toString()}`);
              }
            }}
            className="w-full bg-[#3FAE2A] hover:bg-[#2d8620] text-white font-semibold rounded-full py-5 text-sm"
          >
            Details
          </Button>
        </div>
      ) : (
        // Applied / Viewed → View Profile
        <div className="pt-1">
          <Button
            onClick={async () => {
              if (!isScheduled && applicant.status === "APPLIED") {
                try {
                  await updateApplicationStatus({
                    appId: applicant.id,
                    status: "VIEWED",
                  }).unwrap();
                  onStatusUpdated();
                } catch (error) {
                  console.error("Failed to update status to VIEWED:", error);
                }
              }
              const queryParams = new URLSearchParams();
              queryParams.set("appId", applicant.id);
              if (jobId) queryParams.set("jobId", jobId);
              router.push(`/employer/jobs/jobseeker/${applicant.jobSeekerId}?${queryParams.toString()}`);
            }}
            className="w-full bg-[#3FAE2A] hover:bg-[#2d8620] text-white font-semibold rounded-full py-5 text-sm"
          >
            View Profile
          </Button>
        </div>
      )}
    </Card>
  );
}
