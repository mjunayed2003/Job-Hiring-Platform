"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Copy, Loader, Video } from "lucide-react";
import { MoreVertical, PencilLine, X, Save } from "lucide-react";
import {
  useGetJobApplicantsQuery,
  useGetJobByIdQuery,
  useUpdateInterviewMutation,
  useUpdateInterviewStatusMutation,
  useUpdateApplicationStatusMutation,
} from "@/redux/services/employerApi";
import Link from "next/link";

export default function InterviewListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [now, setNow] = useState(Date.now());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const jobId = searchParams.get("jobId");
  const interviewId = searchParams.get("interviewId");
  const { data: applicantsData, isLoading, error } = useGetJobApplicantsQuery(
    {
      jobId: jobId || "",
      page: 1,
      limit: 100,
    },
    {
      skip: !jobId,
      refetchOnMountOrArgChange: true,
    }
  );
  const { data: jobByIdData } = useGetJobByIdQuery(jobId || "", {
    skip: !jobId,
  });
  const [updateInterview] = useUpdateInterviewMutation();
  const [updateInterviewStatus] = useUpdateInterviewStatusMutation();
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const applicants = useMemo(
    () => (Array.isArray(applicantsData) ? applicantsData : applicantsData?.data || []),
    [applicantsData]
  );

  const interviewsData = useMemo(
    () =>
      applicants
        .filter((item: any) => !!item.interview)
        .map((item: any) => ({
          ...item.interview,
          application: {
            id: item.id,
            jobId: item.jobId,
            jobSeeker: item.jobSeeker,
          },
        })),
    [applicants]
  );

  const filteredInterviews = useMemo(
    () =>
      interviewsData.filter((interview: any) => {
        if (!jobId) return true;
        return interview.application?.jobId === jobId;
      }),
    [interviewsData, jobId]
  );

  const selectedInterview = useMemo(
    () => (interviewId ? filteredInterviews.find((item: any) => item.id === interviewId) : filteredInterviews[0]),
    [filteredInterviews, interviewId]
  );

  const jobDetails = useMemo(() => {
    const candidates = [jobByIdData, jobByIdData?.data, jobByIdData?.job, jobByIdData?.data?.job];
    for (const candidate of candidates) {
      if (candidate && typeof candidate === "object") {
        return candidate;
      }
    }
    return undefined;
  }, [jobByIdData]);

  const companyDisplayName =
    selectedInterview?.application?.job?.companyName ||
    jobDetails?.companyName ||
    jobDetails?.employer?.companyName ||
    jobDetails?.employer?.fullName ||
    jobDetails?.company?.name ||
    "N/A";

  const [editForm, setEditForm] = useState({
    scheduleDate: "",
    scheduleStartTime: "",
    scheduleEndTime: "",
    interviewType: "",
    duration: "",
    meetingLink: "",
    notes: "",
  });

  useEffect(() => {
    if (!selectedInterview) return;

    const timeRange = String(selectedInterview.scheduleTime || "");
    const [startLabel, endLabel] = timeRange.split("-").map((item: string) => item?.trim());

    setEditForm({
      scheduleDate: selectedInterview.scheduleDate ? String(selectedInterview.scheduleDate).slice(0, 10) : "",
      scheduleStartTime: startLabel || "",
      scheduleEndTime: endLabel || "",
      interviewType: selectedInterview.interviewType || "",
      duration: selectedInterview.duration || "",
      meetingLink: selectedInterview.meetingLink || "",
      notes: selectedInterview.notes || "",
    });
  }, [selectedInterview]);

  const parseStartDateTime = (dateValue?: string, timeRange?: string) => {
    if (!dateValue || !timeRange) return null;
    const startLabel = String(timeRange).split("-")[0]?.trim();
    if (!startLabel) return null;
    const match = startLabel.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
    if (!match) return null;
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const baseDate = new Date(dateValue);
    if (Number.isNaN(baseDate.getTime())) return null;

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Jamaica",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(baseDate);
    const yyyy = parts.find((p) => p.type === "year")?.value;
    const mm = parts.find((p) => p.type === "month")?.value;
    const dd = parts.find((p) => p.type === "day")?.value;

    if (!yyyy || !mm || !dd) return null;

    const hh = String(hours).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    const isoString = `${yyyy}-${mm}-${dd}T${hh}:${m}:00-05:00`;

    const finalDate = new Date(isoString);
    return Number.isNaN(finalDate.getTime()) ? null : finalDate;
  };

  const getCountdownLabel = (dateValue?: string, timeRange?: string) => {
    const startAt = parseStartDateTime(dateValue, timeRange);
    if (!startAt) return "Date not available";
    const diff = startAt.getTime() - now;
    if (diff <= 0) return "Already started";

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const formatInterviewDate = (value?: string) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString("en-GB", {
      timeZone: "America/Jamaica",
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const copyLink = async (url?: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      alert("Meeting link copied");
    } catch {
      alert("Failed to copy meeting link");
    }
  };

  const to12Hour = (time24: string) => {
    const [hoursRaw, minutesRaw] = time24.split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return "";
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}${period}`;
  };

  const getEndTimeLabel = (startTime: string, durationText: string) => {
    const durationMatch = String(durationText).match(/(\d+)/);
    const minutesToAdd = durationMatch ? Number(durationMatch[1]) : 0;
    if (!startTime || !minutesToAdd) return "";

    const [hoursRaw, minutesRaw] = startTime.split(":").map(Number);
    if (Number.isNaN(hoursRaw) || Number.isNaN(minutesRaw)) return "";

    const start = new Date(0, 0, 0, hoursRaw, minutesRaw, 0, 0);
    const end = new Date(start.getTime() + minutesToAdd * 60 * 1000);
    return to12Hour(`${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`);
  };

  const mapInterviewStatusToApplicationStatus = (status: string) => {
    if (status === "HIRED") return "HIRED";
    if (status === "REJECTED" || status === "CANCELLED") return "REJECTED";
    if (status === "COMPLETED") return "INTERVIEW";
    return "INTERVIEW";
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selectedInterview) return;
    setIsSaving(true);
    try {
      if (status === "CANCELLED") {
        await updateInterview({
          interviewId: selectedInterview.id,
          body: {
            scheduleDate: selectedInterview.scheduleDate,
            scheduleTime: null,
            interviewType: selectedInterview.interviewType,
            duration: selectedInterview.duration,
            meetingLink: selectedInterview.meetingLink,
            notes: selectedInterview.notes,
          },
        }).unwrap();
      }

      await updateInterviewStatus({
        interviewId: selectedInterview.id,
        status,
      }).unwrap();

      const appId = selectedInterview.application?.id;
      if (appId) {
        await updateApplicationStatus({
          appId,
          status: mapInterviewStatusToApplicationStatus(status),
        }).unwrap();
      }

      setIsMenuOpen(false);
      alert("Status updated successfully");

      if (status === "REJECTED" || status === "COMPLETED") {
        router.back();
      }
    } catch (updateError) {
      console.error("Failed to update interview status:", updateError);
      alert("Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditInterview = async () => {
    if (!selectedInterview) return;
    if (!editForm.scheduleDate || !editForm.scheduleStartTime || !editForm.interviewType || !editForm.duration || !editForm.meetingLink) {
      alert("Please fill all required fields.");
      return;
    }

    const startLabel = editForm.scheduleStartTime;
    const durationMinutes = Number(String(editForm.duration).match(/\d+/)?.[0] || 0);
    if (!durationMinutes) {
      alert("Please enter a valid duration.");
      return;
    }

    const [hoursText, minutesTextWithPeriod] = startLabel.split(":");
    const minutesText = minutesTextWithPeriod?.slice(0, 2);
    const period = minutesTextWithPeriod?.slice(2).toUpperCase();
    let hours = Number(hoursText);
    const minutes = Number(minutesText);
    if (Number.isNaN(hours) || Number.isNaN(minutes) || !period) {
      alert("Please enter a valid start time.");
      return;
    }
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const start = new Date(0, 0, 0, hours, minutes, 0, 0);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const endLabel = to12Hour(`${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`);

    setIsSaving(true);
    try {
      await updateInterview({
        interviewId: selectedInterview.id,
        body: {
          scheduleDate: new Date(editForm.scheduleDate).toISOString(),
          scheduleTime: `${startLabel}-${endLabel}`,
          interviewType: editForm.interviewType,
          duration: editForm.duration,
          meetingLink: editForm.meetingLink,
          notes: editForm.notes,
        },
      }).unwrap();

      setIsEditing(false);
      alert("Interview updated successfully");
    } catch (updateError) {
      console.error("Failed to update interview:", updateError);
      alert("Failed to update interview");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSupport = () => {
    router.push("/support");
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full border bg-white hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Interview Details</h1>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="rounded-full border bg-white hover:bg-gray-100"
              disabled={isSaving}
            >
              <MoreVertical size={18} />
            </Button>

            {isMenuOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <PencilLine size={16} />
                  Edit Interview
                </button>
                <div className="border-t border-gray-100" />
                {["SCHEDULED", "COMPLETED", "REJECTED", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusUpdate(status)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <span>{status}</span>
                    {selectedInterview.status === status ? (
                      <CheckCircle2 size={14} className="text-[#3AB32A]" />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="h-8 w-8 animate-spin text-[#47B649]" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-16">Failed to load interview details.</div>
        ) : !selectedInterview ? (
          <div className="text-center text-gray-500 py-16">No interview details found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8">
              <div className="overflow-hidden rounded-xl border border-[#4CAF5033] bg-[#DDE8DC]">
                <div className="flex items-center gap-2 bg-[#39AA28] px-4 py-2 text-white">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-medium">
                    {selectedInterview.status === "SCHEDULED" ? "Interview Scheduled" : selectedInterview.status}
                  </span>
                </div>
                <p className="py-3 text-center text-2xl text-gray-600">
                  Starts in:{" "}
                  <span className="font-medium text-[#31A226]">
                    {getCountdownLabel(selectedInterview.scheduleDate, selectedInterview.scheduleTime)}
                  </span>
                </p>
              </div>

              <div className="space-y-4 text-gray-700">
                <h2 className="text-3xl font-semibold text-gray-900">Interview Overview</h2>
                <p><span className="text-gray-500">Position:</span> {selectedInterview.application?.job?.title || jobDetails?.title || "N/A"}</p>
                <p><span className="text-gray-500">Company:</span> {companyDisplayName}</p>
                <p><span className="text-gray-500">Interview Type:</span> {selectedInterview.interviewType || "N/A"}</p>
                <p><span className="text-gray-500">Interview Date:</span> {formatInterviewDate(selectedInterview.scheduleDate)}</p>
                <p><span className="text-gray-500">Interview Time:</span> {selectedInterview.scheduleTime || "N/A"}</p>
                <p><span className="text-gray-500">Duration:</span> {selectedInterview.duration || "N/A"}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-3xl font-semibold text-gray-900">Join Interview</h3>
                <div className="flex items-center gap-2 text-xl text-gray-700">
                  <Video className="text-[#3F8CFF]" size={22} />
                  <span>Zoom Video Call</span>
                </div>
                <Button
                  asChild
                  className="h-14 rounded-full bg-[#3AB32A] px-12 text-2xl font-semibold text-white hover:bg-[#2f9722]"
                >
                  <Link href={selectedInterview.meetingLink || "#"} target="_blank" rel="noopener noreferrer">
                    Join Interview
                  </Link>
                </Button>
                <div className="flex items-center gap-2 text-xl text-gray-600">
                  <span className="text-gray-500">Meeting Link:</span>
                  <span>{selectedInterview.meetingLink || "N/A"}</span>
                  {selectedInterview.meetingLink ? (
                    <button
                      onClick={() => copyLink(selectedInterview.meetingLink)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-200"
                      type="button"
                    >
                      <Copy size={18} />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ─ Right Column ─ */}
            <div className="space-y-4 lg:pt-8">
              <p className="text-2xl text-gray-800">Need Help?</p>
              <Button
                type="button"
                onClick={handleSupport}
                className="h-14 w-full rounded-full bg-[#3AB32A] px-8 text-3xl font-semibold hover:bg-[#2f9722]"
              >
                Support
              </Button>
            </div>
          </div>
        )}

        {isEditing && selectedInterview ? (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Interview</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                  <X size={18} />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Interview Type</label>
                  <input
                    value={editForm.interviewType}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, interviewType: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-[#3AB32A]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Interview Date</label>
                  <input
                    type="date"
                    value={editForm.scheduleDate}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, scheduleDate: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-[#3AB32A]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Interview Time</label>
                  <input
                    value={editForm.scheduleStartTime}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, scheduleStartTime: e.target.value }))}
                    placeholder="11:00AM"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-[#3AB32A]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Duration</label>
                  <input
                    value={editForm.duration}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, duration: e.target.value }))}
                    placeholder="30 minutes"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-[#3AB32A]"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Meeting Link</label>
                  <input
                    value={editForm.meetingLink}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-[#3AB32A]"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-[#3AB32A]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleEditInterview}
                  disabled={isSaving}
                  className="bg-[#3AB32A] text-white hover:bg-[#2f9722]"
                >
                  <Save size={16} className="mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}