"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface JobProps {
  id: string;
  title: string;
  company: string;
  logo: string | null;
  date: string;
  salary: string;
  location: string;
  type: string[];
  status?:
    | "APPLIED"
    | "VIEWED"
    | "INTERVIEW"
    | "COMPLETED"
    | "HIRED"
    | "FAILED"
    | "PAYMENT PENDING"
    | "REJECTED"
    | "Submitted"
    | "Interview Scheduled"
    | "Hired"
    | "Rejected"
    | null
    | string;
  showCompletionActions?: boolean;
  isHireCompleted?: boolean;
  isEmployerConfirmed?: boolean;
  isBookmarked?: boolean;
}

interface JobCardProps {
  job: JobProps;
  onBookmark?: (id: string) => void;
  disableNavigation?: boolean;
  onHiredClick?: () => void;
  onCompletedClick?: () => void;
}

export default function JobCard({
  job,
  onBookmark,
  disableNavigation = false,
  onHiredClick,
  onCompletedClick,
}: JobCardProps) {
  const targetLink =
    job.status === "INTERVIEW" ||
    job.status === "COMPLETED" ||
    job.status === "FAILED" ||
    job.status === "PAYMENT PENDING" ||
    job.status === "Interview Scheduled"
      ? `/jobseeker/jobs/interview/${job.id}`
      : `/jobseeker/jobs/${job.id}`;

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPLIED":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "VIEWED":
        return "bg-sky-100 text-sky-600 border-sky-200";
      case "INTERVIEW":
      case "INTERVIEW SCHEDULED":
        return "bg-orange-100 text-orange-600 border-orange-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "HIRED":
        return "bg-green-100 text-green-600 border-green-200";
      case "FAILED":
        return "bg-red-100 text-red-600 border-red-200";
      case "PAYMENT PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-500 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPLIED":       return "Applied";
      case "VIEWED":        return "Viewed";
      case "INTERVIEW":
      case "INTERVIEW SCHEDULED": return "Interview";
      case "COMPLETED":        return "Completed";
      case "HIRED":         return "Hired";
      case "FAILED":        return "Failed";
      case "PAYMENT PENDING": return "Payment Pending";
      case "REJECTED":      return "Rejected";
      default:              return status;
    }
  };

  const initials = (job.company || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmark?.(job.id);
  };

  const showBookmark = Boolean(onBookmark) && !job.status;
  const showDate = !job.status;
  const showHireActions = Boolean(job.showCompletionActions) && (job.status === "HIRED" || job.status === "COMPLETED");
  const isHireCompleted = Boolean(job.isHireCompleted);
  const isEmployerConfirmed = Boolean(job.isEmployerConfirmed);

  // ── Reusable inner content ──────────────────────────────────────────────────
  const cardContent = (isHired = false) => (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e6eadf] bg-[#f4f7f1] shadow-sm">
            {job.logo ? (
              <Image
                src={job.logo}
                alt={job.company}
                width={44}
                height={44}
                className="h-full w-full rounded-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-xs font-bold text-gray-500">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-500">{job.company}</p>
            {showDate && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-400">
                <Calendar size={11} />
                <span className="truncate">{job.date}</span>
              </div>
            )}
          </div>
        </div>

        {job.status && (
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(job.status)}`}
          >
            {getStatusLabel(job.status)}
          </span>
        )}
      </div>

      <h3
        className={`line-clamp-2 text-[20px] font-semibold leading-tight tracking-tight text-gray-900 ${
          !isHired ? "transition-colors group-hover:text-[#2f8e20]" : ""
        }`}
      >
        {job.title}
      </h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {job.type.map((tag, i) => (
          <Badge
            key={i}
            variant="outline"
            className="rounded-full border-[#cfe3c8] bg-[#fafdf8] px-3 py-1 text-[11px] font-medium text-[#6f7e6a]"
          >
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <p className="text-[15px] font-bold text-[#3FAE2A]">{job.salary}</p>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin size={14} className="shrink-0 text-gray-400" />
          <span className="truncate">{job.location}</span>
        </div>
        {showHireActions && (
          <div className="mt-3 rounded-2xl border border-[#d8e9d3] bg-[#f5fbf2] p-3">
            <p className="text-[12px] leading-5 text-gray-700">
              {isHireCompleted
                ? isEmployerConfirmed
                  ? "This job has been confirmed by the employer. Withdrawals are now unlocked."
                  : "You marked this job completed. Waiting for employer confirmation before withdrawals unlock."
                : "Mark this job as completed to unlock your withdraw request."}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onCompletedClick}
                disabled={isHireCompleted || !onCompletedClick}
                className={`flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
                  isHireCompleted
                    ? "cursor-not-allowed bg-[#3FAE2A] text-white shadow-sm opacity-90"
                    : "bg-[#3FAE2A] text-white shadow-sm hover:bg-[#349223]"
                } disabled:cursor-not-allowed disabled:hover:bg-[#3FAE2A] disabled:opacity-80`}
              >
                Completed
              </button>

              <button
                type="button"
                onClick={onHiredClick}
                className="flex h-11 items-center justify-center rounded-full border border-[#d8e9d3] bg-white px-4 text-sm font-semibold text-[#3FAE2A] transition hover:border-[#b7d9ae] hover:bg-[#f8fcf6]"
              >
                Message
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="group relative flex h-full w-full max-w-[270px] flex-col overflow-hidden rounded-[22px] border border-[#e6eadf] bg-white p-4 shadow-[0_10px_30px_-18px_rgba(63,174,42,0.28)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_36px_-18px_rgba(63,174,42,0.42)]">
      {showBookmark && (
        <button
          className="absolute right-3 top-3 z-10 rounded-full border border-[#d8e8d4] bg-white p-2 text-gray-400 shadow-sm transition-colors hover:border-[#bfe0b5] hover:text-[#3FAE2A]"
          onClick={handleBookmark}
          aria-label={job.isBookmarked ? "Remove bookmark" : "Bookmark job"}
        >
          <Bookmark
            size={16}
            className={job.isBookmarked ? "fill-[#3FAE2A] text-[#3FAE2A]" : ""}
          />
        </button>
      )}

      {/* ── 1. Navigation disabled (APPLIED / VIEWED / REJECTED) ── */}
      {disableNavigation ? (
        <div className="flex h-full flex-col">{cardContent()}</div>

      /* ── 2. HIRED — clickable div → inbox ── */
      ) : job.status === "HIRED" || (job.status === "COMPLETED" && job.showCompletionActions) ? (
        <div
          className="flex h-full flex-col"
        >
          {cardContent(true)}
        </div>

      /* ── 3. Normal — Link to job detail / interview ── */
      ) : (
        <Link href={targetLink} className="flex h-full flex-col">
          {cardContent()}
        </Link>
      )}
    </div>
  );
}
