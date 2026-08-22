"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { useScheduleInterviewMutation, useUpdateApplicationStatusMutation } from "@/redux/services/employerApi";

export default function ScheduleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get("appId");
  const jobId = searchParams.get("jobId");

  const [interviewType, setInterviewType] = useState("Video (Zoom)");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleStartTime, setScheduleStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("Please be on time.");
  const [scheduleInterview, { isLoading }] = useScheduleInterviewMutation();
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  const durationLabel = useMemo(() => {
    const mins = Number(durationMinutes || 0);
    if (!mins || mins < 1) return "";
    return `${mins} minutes`;
  }, [durationMinutes]);

  const to12Hour = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return "";
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")}${period}`;
  };

  const buildScheduleTime = () => {
    const mins = Number(durationMinutes || 0);
    if (!scheduleStartTime || mins < 1) return "";
    const [h, m] = scheduleStartTime.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return "";
    const start = new Date(0, 0, 0, h, m, 0);
    const end = new Date(start.getTime() + mins * 60 * 1000);
    const startLabel = to12Hour(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    const endLabel = to12Hour(`${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`);
    return `${startLabel}-${endLabel}`;
  };

  const handleSubmit = async () => {
    if (!appId) {
      alert("Application ID is missing in URL.");
      return;
    }
    if (!interviewType || !scheduleDate || !scheduleStartTime || !durationLabel || !meetingLink) {
      alert("Please fill all required fields.");
      return;
    }

    const scheduleTime = buildScheduleTime();
    if (!scheduleTime) {
      alert("Please provide valid time and duration.");
      return;
    }

    try {
      await scheduleInterview({
        appId,
        body: {
          interviewType,
          scheduleDate: scheduleDate + "T00:00:00Z",
          scheduleTime,
          duration: durationLabel,
          meetingLink,
          notes,
        },
      }).unwrap();

      await updateApplicationStatus({
        appId,
        status: "INTERVIEW",
      }).unwrap();

      alert("Interview scheduled successfully");
      if (jobId) {
        router.push(`/company/jobs/${jobId}/applicants`);
      } else {
        router.push(`/company/jobs/details`);
      }
    } catch (error) {
      console.error("Failed to schedule interview:", error);
      alert("Failed to schedule interview. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-10 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full border">
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold">Schedule Interview</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Interview Setup</label>
          <p className="text-xs text-gray-400">Interview type</p>
          <Input
            placeholder="Video (Zoom)"
            className="h-12 bg-gray-50/50"
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 relative">
            <label className="text-xs text-gray-400">Interview Date</label>
            <Input
              type="date"
              className="h-12 bg-gray-50/50 pr-10"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
            <Calendar size={18} className="absolute right-3 bottom-3 text-gray-400" />
          </div>
          <div className="space-y-2 relative">
            <label className="text-xs text-gray-400">Interview Time</label>
            <Input
              type="time"
              className="h-12 bg-gray-50/50 pr-10"
              value={scheduleStartTime}
              onChange={(e) => setScheduleStartTime(e.target.value)}
            />
            <Clock size={18} className="absolute right-3 bottom-3 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400">Interview Duration</label>
          <Input
            type="number"
            min={1}
            placeholder="30"
            className="h-12 bg-gray-50/50"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Video Call Link</label>
          <p className="text-xs text-gray-400">Interview type</p>
          <Input
            placeholder="Paste Zoom meeting link"
            className="h-12 bg-gray-50/50"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400">Notes (Optional)</label>
          <Input
            placeholder="Please be on time."
            className="h-12 bg-gray-50/50"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-[#3FAE2A] hover:bg-green-700 py-7 text-lg rounded-2xl font-bold mt-4 shadow-lg shadow-green-100"
        >
          {isLoading ? "Scheduling..." : "Confirm Schedule"}
        </Button>
      </div>
    </div>
  );
}
