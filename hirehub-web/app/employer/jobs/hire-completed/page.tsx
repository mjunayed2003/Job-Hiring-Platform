"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, ArrowLeft, MessageSquare } from "lucide-react";
import { useGetAllApplicantsQuery } from "@/redux/services/employerApi";
import { useMarkEmployerHireCompletedMutation } from "@/redux/services/featuresApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";



interface HiredApplicant {
  id?: string;
  appId?: string;
  jobId?: string;
  interviewId?: string;
  appliedDate?: string;
  interviewTime?: string;
  interviewType?: string;
  experienceLevel?: string | null;
  scheduleTime?: string;
  interviewStatus?: string;
  paymentStatus?: string | null;
  candidateCompletedAt?: string | null;
  employerCompletedAt?: string | null;
  interview?: {
    status?: string;
    scheduleTime?: string;
    interviewType?: string;
    payment?: {
      status?: string;
      candidateCompletedAt?: string | null;
      employerCompletedAt?: string | null;
    };
  };
  userInfo?: {
    userId?: string;
    id?: string;
    fullName?: string;
    profilePic?: string | null;
    designation?: string | null;
  };
}

export default function HiredPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [markEmployerHireCompleted] = useMarkEmployerHireCompletedMutation();
  const [confirmingInterviewId, setConfirmingInterviewId] = useState<string | null>(null);
  const [confirmedInterviewIds, setConfirmedInterviewIds] = useState<string[]>([]);
  const storageKey = "hirehub:employer-hire-completed-confirmed";

  const { data, isLoading, error, refetch } = useGetAllApplicantsQuery({
    filter: "HIRED",
    page: currentPage,
    limit: 10,
  });

  const hiredApplicants: HiredApplicant[] = Array.isArray(data)
  ? data
  : Array.isArray(data?.data)
    ? data.data.map((item: any) => ({
        ...item,
        interviewId: item.interviewId ?? item.interview?.id,
        interviewStatus: item.interviewStatus ?? item.interview?.status,
        interviewTime: item.interviewTime ?? item.interview?.scheduleTime,
        interviewType: item.interviewType ?? item.interview?.interviewType,
        paymentStatus: item.paymentStatus ?? item.interview?.payment?.status,
        candidateCompletedAt: item.candidateCompletedAt ?? item.interview?.payment?.candidateCompletedAt,
        employerCompletedAt: item.employerCompletedAt ?? item.interview?.payment?.employerCompletedAt,
      }))
    : Array.isArray(data?.data?.data)
      ? data.data.data.map((item: any) => ({
          ...item,
          interviewId: item.interviewId ?? item.interview?.id,
          interviewStatus: item.interviewStatus ?? item.interview?.status,
          interviewTime: item.interviewTime ?? item.interview?.scheduleTime,
          interviewType: item.interviewType ?? item.interview?.interviewType,
          paymentStatus: item.paymentStatus ?? item.interview?.payment?.status,
          candidateCompletedAt: item.candidateCompletedAt ?? item.interview?.payment?.candidateCompletedAt,
          employerCompletedAt: item.employerCompletedAt ?? item.interview?.payment?.employerCompletedAt,
        }))
      : [];

  const meta = data?.meta || data?.data?.meta;
  const pagination = Array.isArray(data)
    ? { total: hiredApplicants.length, totalPages: 1, hasNextPage: false, hasPrevPage: false }
    : meta || { total: hiredApplicants.length, totalPages: 1, hasNextPage: false, hasPrevPage: false };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setConfirmedInterviewIds(parsed.filter((id) => typeof id === "string"));
          }
        }
      } catch {
        // Ignore malformed storage and fall back to backend data.
      }
    }
  }, []);

  useEffect(() => {
    const ids = hiredApplicants
      .filter((item) => Boolean(item.employerCompletedAt || item.interview?.payment?.employerCompletedAt))
      .map((item) => item.interviewId || item.id)
      .filter((id): id is string => Boolean(id));

    if (ids.length === 0) return;

    setConfirmedInterviewIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      const nextArray = Array.from(next);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, JSON.stringify(nextArray));
      }

      return nextArray;
    });
  }, [data]);

  const handleEmployerConfirm = async (interviewId?: string) => {
    if (!interviewId) return;
    setConfirmingInterviewId(interviewId);
    try {
      await markEmployerHireCompleted({ interviewId }).unwrap();
      setConfirmedInterviewIds((prev) =>
        prev.includes(interviewId)
          ? prev
          : (() => {
              const next = [...prev, interviewId];
              if (typeof window !== "undefined") {
                window.localStorage.setItem(storageKey, JSON.stringify(next));
              }
              return next;
            })()
      );
      await refetch();
    } catch (error) {
      console.error("Failed to confirm hire completion", error);
    } finally {
      setConfirmingInterviewId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
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
          <h1 className="text-2xl font-bold text-gray-900">Hire Completed</h1>
          <p className="text-sm text-gray-600">Total Hired: {pagination.total || hiredApplicants.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin text-[#3FAE2A]" size={40} />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">Failed to load hired applicants.</div>
      ) : hiredApplicants.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No hired applicants found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hiredApplicants.map((applicant, idx) => (
              <HiredCard
                key={applicant.appId || applicant.id || String(idx)}
                applicant={applicant}
                onConfirm={handleEmployerConfirm}
                isConfirming={confirmingInterviewId === (applicant.interviewId || applicant.id)}
                isConfirmed={
                  confirmedInterviewIds.includes(applicant.interviewId || applicant.id || "") ||
                  Boolean(applicant.employerCompletedAt || applicant.interview?.payment?.employerCompletedAt)
                }
              />
            ))}
          </div>

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
        </>
      )}
    </div>
  );
}

function HiredCard({
  applicant,
  onConfirm,
  isConfirming,
  isConfirmed,
}: {
  applicant: HiredApplicant;
  onConfirm: (interviewId?: string) => void;
  isConfirming: boolean;
  isConfirmed: boolean;
}) {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  const userName = applicant.userInfo?.fullName || "Unknown";
  const designation = applicant.userInfo?.designation || applicant.experienceLevel || "--";
  const isButtonLoading = isConfirming;
  const interviewTime =
    applicant.interviewTime ||
    applicant.scheduleTime ||
    applicant.interview?.scheduleTime ||
    "N/A";
  const interviewType =
    applicant.interviewType ||
    applicant.interview?.interviewType ||
    "N/A";
  const interviewStatus = applicant.interview?.status || applicant.interviewStatus || "HIRED";
  const isEmployerConfirmed = isConfirmed;
  const paymentStatus = applicant.paymentStatus || applicant.interview?.payment?.status || null;

  const profilePic = applicant.userInfo?.profilePic;
  const profileImageUrl = profilePic
    ? profilePic.startsWith("http://") || profilePic.startsWith("https://")
      ? profilePic
      : `${apiUrl}${profilePic}`
    : undefined;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "--/--/----";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleMessage = () => {
    const targetUserId = applicant.userInfo?.userId || applicant.userInfo?.id;
    if (!targetUserId) return;
    router.push(`/inbox?targetUserId=${encodeURIComponent(targetUserId)}`);
  };

  return (
    <Card className="p-4 space-y-3 bg-gray-50 border-gray-200 hover:shadow-md transition rounded-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Avatar className="h-14 w-14 flex-shrink-0">
            <AvatarImage src={profileImageUrl} alt={userName} className="object-cover" />
            <AvatarFallback className="bg-[#EAF6EA] text-[#3FAE2A] font-bold">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{userName}</h3>
            <p className="text-sm text-gray-500 truncate">{designation}</p>
          </div>
        </div>

        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            applicant.interview?.status === "HIRED" ? "bg-emerald-100 text-emerald-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {applicant.interview?.status || "HIRED"}
        </span>
      </div>

      <div className="space-y-1 text-sm">
        <div>
          <span className="text-gray-500">Applied Date:</span>
          <span className="font-semibold text-gray-900 ml-1">{formatDate(applicant.appliedDate)}</span>
        </div>
        <div>
          <span className="text-gray-500">Interview Time:</span>
          <span className="font-semibold text-gray-900 ml-1">{interviewTime}</span>
        </div>
        <div>
          <span className="text-gray-500">Interview Type:</span>
          <span className="font-semibold text-gray-900 ml-1">{interviewType}</span>
        </div>
        <div>
          <span className="text-gray-500">Interview Status:</span>
          <span className="font-semibold text-gray-900 ml-1">
            {interviewStatus}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Payment Status:</span>
          <span className="font-semibold text-gray-900 ml-1">
            {paymentStatus || "PENDING"}
          </span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() => onConfirm(applicant.interviewId || applicant.id)}
            disabled={isButtonLoading || isEmployerConfirmed}
            className={`rounded-full py-5 text-sm font-semibold shadow-sm ${
              isEmployerConfirmed
                ? "bg-[#3FAE2A] text-white opacity-80 cursor-not-allowed"
                : "bg-[#3FAE2A] hover:bg-[#349223] text-white"
            }`}
          >
            {isEmployerConfirmed ? "Confirmed" : isButtonLoading ? "Confirming..." : "Completed"}
          </Button>
          <Button
            onClick={handleMessage}
            variant="outline"
            className="rounded-full py-5 text-sm font-semibold gap-2 border-[#d8e9d3] text-[#3FAE2A] hover:bg-[#f5fbf2] hover:text-[#2f8e20]"
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
    </Card>
  );
}
