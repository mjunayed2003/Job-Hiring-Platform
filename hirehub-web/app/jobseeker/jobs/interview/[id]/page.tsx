"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetMyApplicationsQuery } from "@/redux/services/jobsApi";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, Copy, Video } from "lucide-react";
import Link from "next/link";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2">
      <span className="text-sm text-[#3FAE2A] w-36 flex-shrink-0">{label}:</span>
      <span className="text-sm text-gray-700 font-medium">{value || "N/A"}</span>
    </div>
  );
}

export default function InterviewDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState("--h --m --s");
  const [copied, setCopied] = useState(false);

  const { data: applicationsData, isLoading } = useGetMyApplicationsQuery();

  const apps = Array.isArray(applicationsData?.data)
    ? applicationsData.data
    : Array.isArray(applicationsData)
    ? applicationsData
    : [];

  const application = apps.find((app: any) => app.id === id);
  const interview = application?.interview;
  const job = application?.job;
  const employer = job?.employer;
  const companyName = employer?.companyName || employer?.fullName || "Unknown";
  const isCompleted = String(interview?.status || "").toUpperCase() === "COMPLETED";

  useEffect(() => {
    if (!interview?.scheduleDate || !interview?.scheduleTime) return;

    const calcTimeLeft = () => {
      try {
        const dateStr = interview.scheduleDate.split("T")[0];
        const startTimeStr = interview.scheduleTime.split("-")[0].trim();
        const match = startTimeStr.match(/(\d+):(\d+)(AM|PM)/i);
        if (!match) return;

        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        const interviewDate = new Date(
          `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
        );
        const diff = interviewDate.getTime() - Date.now();

        if (diff <= 0) {
          setTimeLeft("Started");
          return;
        }

        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1000);
        setTimeLeft(
          `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
        );
      } catch {
        setTimeLeft("--");
      }
    };

    calcTimeLeft();
    const interval = setInterval(calcTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [interview]);

  const handleCopy = () => {
    if (!interview?.meetingLink) return;
    navigator.clipboard.writeText(interview.meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3FAE2A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!application || !interview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm">Interview details not found.</p>
        <button
          onClick={() => router.back()}
          className="text-[#3FAE2A] font-semibold text-sm underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isZoom = interview.interviewType?.toLowerCase().includes("zoom");

  return (
    <div className="min-h-screen bg-white px-4 py-6 max-w-4xl mx-auto font-sans">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Interview Details</h1>
      </div>

      {/* ── Status Banner ── */}
      <div className="w-fit mx-auto mb-10 min-w-[260px]">
        <div className="bg-[#3FAE2A] text-white rounded-t-xl px-8 py-3 flex items-center justify-center gap-2">
          <CheckCircle size={17} />
          <span className="font-semibold text-sm">
            {isCompleted ? "Interview Completed" : "Interview Scheduled"}
          </span>
        </div>
        <div className="bg-green-50 border border-green-100 border-t-0 rounded-b-xl px-8 py-2.5 text-center">
          <p className="text-sm text-gray-500">
            {isCompleted ? "Completed" : (
              <>
                Starts in:{" "}
                <span className="font-bold text-[#3FAE2A]">{timeLeft}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* ─ Left Column ─ */}
        <div className="space-y-8">
          {/* Interview Overview */}
          <div>
            <h2 className="font-bold text-gray-800 mb-4">Interview Overview</h2>
            <div className="space-y-3">
              <InfoRow label="Position" value={job?.title} />
              <InfoRow label="Company" value={companyName} />
              <InfoRow label="Interview Type" value={interview.interviewType} />
              <InfoRow label="Interview Date" value={formatDate(interview.scheduleDate)} />
              <InfoRow label="Interview Time" value={interview.scheduleTime} />
              <InfoRow label="Duration" value={interview.duration} />
            </div>
          </div>

          {/* Join Interview */}
          <div>
            <h2 className="font-bold text-gray-800 mb-4">Join Interview</h2>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Video size={13} className="text-white" />
              </div>
              <span className="text-sm text-gray-600">
                {isZoom ? "Zoom Video Call" : interview.interviewType}
              </span>
            </div>

            <Link
              href={interview.meetingLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#3FAE2A] hover:bg-[#2f8e20] text-white font-semibold text-sm px-10 py-3 rounded-full transition mb-4"
            >
              {isCompleted ? "View Meeting Link" : "Join Interview"}
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Meeting Link:</span>
              <span className="text-sm text-gray-600 truncate max-w-[180px]">
                {interview.meetingLink?.replace(/^https?:\/\//, "") || "N/A"}
              </span>
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-[#3FAE2A] transition"
                title="Copy link"
              >
                <Copy size={14} />
              </button>
              {copied && (
                <span className="text-xs text-[#3FAE2A] font-medium">Copied!</span>
              )}
            </div>
          </div>
        </div>

        {/* ─ Right Column ─ */}
        <div className="space-y-8">
          {/* Need Help */}
          <div>
            <h2 className="font-bold text-gray-800 mb-4">Need Help?</h2>
            <button
              onClick={() => router.push("/support")}
              className="w-full bg-[#3FAE2A] hover:bg-[#2f8e20] text-white font-semibold text-sm py-3 rounded-full transition"
            >
              Support
            </button>
          </div>

          {/* Instructions */}
          <div>
            <h2 className="font-bold text-gray-800 mb-3">Instructions</h2>
            <p className="text-sm text-[#3FAE2A] leading-relaxed">
              Please ensure you have a stable internet connection, a quiet
              environment, and join the interview at least 5 minutes before the
              scheduled time.
            </p>
          </div>

          {/* Reminders */}
          <div>
            <h2 className="font-bold text-gray-800 mb-3">Reminders</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              You will receive reminders 30 minutes and 5 minutes before the
              interview starts.
            </p>
            {interview.notes && (
              <p className="text-sm text-gray-400 mt-2 leading-relaxed italic">
                Note: {interview.notes}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
