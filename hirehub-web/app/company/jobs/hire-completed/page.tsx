"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, ArrowLeft, MessageSquare } from "lucide-react";
import { useGetAllApplicantsQuery } from "@/redux/services/employerApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type InterviewStatus = "SCHEDULED" | "COMPLETED" | "REJECTED" | "CANCELLED" | "HIRED";

interface HiredApplicant {
  id?: string;
  appId?: string;
  jobId?: string;
  interviewId?: string;
  interviewStatus?: InterviewStatus | string;
  status?: string;
  appliedDate?: string;
  interviewTime?: string;
  interviewType?: string;
  experienceLevel?: string | null;
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

  const { data, isLoading, error } = useGetAllApplicantsQuery({
    filter: "HIRED",
    page: currentPage,
    limit: 10,
  });

  const rawApplicants: HiredApplicant[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.data?.data)
        ? data.data.data
        : [];

  const hiredApplicants = rawApplicants.filter((applicant) => {
    const normalizedInterviewStatus = String(applicant.interviewStatus || "").toUpperCase();
    return normalizedInterviewStatus === "HIRED";
  });

  const meta = data?.meta || data?.data?.meta;
  const pagination = Array.isArray(data)
    ? { total: hiredApplicants.length, totalPages: 1, hasNextPage: false, hasPrevPage: false }
    : meta || { total: hiredApplicants.length, totalPages: 1, hasNextPage: false, hasPrevPage: false };

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
              <HiredCard key={applicant.appId || applicant.id || String(idx)} applicant={applicant} />
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

function HiredCard({ applicant }: { applicant: HiredApplicant }) {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  const userName = applicant.userInfo?.fullName || "Unknown";
  const designation = applicant.userInfo?.designation || applicant.experienceLevel || "--";

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

  const normalizedInterviewStatus = String(applicant.interviewStatus || "").toUpperCase();

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
          className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700"
        >
          {normalizedInterviewStatus || "HIRED"}
        </span>
      </div>

      <div className="space-y-1 text-sm">
        <div>
          <span className="text-gray-500">Applied Date:</span>
          <span className="font-semibold text-gray-900 ml-1">{formatDate(applicant.appliedDate)}</span>
        </div>
        <div>
          <span className="text-gray-500">Interview Time:</span>
          <span className="font-semibold text-gray-900 ml-1">{applicant.interviewTime || "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-500">Interview Type:</span>
          <span className="font-semibold text-gray-900 ml-1">{applicant.interviewType || "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-500">Interview Status:</span>
          <span className="font-semibold text-gray-900 ml-1">{normalizedInterviewStatus || "HIRED"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2">
        <Button
          onClick={handleMessage}
          variant="outline"
          className="text-gray-600 border-gray-300 hover:bg-gray-50 font-semibold rounded-full py-5 text-sm gap-2"
        >
          <MessageSquare size={14} />
          Message
        </Button>
      </div>
    </Card>
  );
}

