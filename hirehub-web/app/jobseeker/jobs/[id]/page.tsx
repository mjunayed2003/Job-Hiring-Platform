"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Share2, Bookmark, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportModal from "@/component/card/ReportModal";
import {
  useGetJobDetailsQuery,
  useBookmarkJobMutation,
  useGetPlatformFeeQuery,
} from "@/redux/services/jobsApi";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import GuestAccessAlert from "@/components/auth/guest-access-alert";
import { isJobSeekerUser } from "@/lib/clientAuth";
import { useAppSelector } from "@/redux/hooks";

export default function JobDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const authToken = useAppSelector((state) => state.auth.token || state.auth.tempToken);
  const [hasMounted, setHasMounted] = useState(false);
  const isJobSeeker = hasMounted && isJobSeekerUser();
  const { data: jobData, isLoading, isError, error } = useGetJobDetailsQuery(
    { id: jobId, token: authToken },
    {
      skip: !jobId,
      refetchOnMountOrArgChange: true,
    }
  );
  const [bookmarkJob] = useBookmarkJobMutation();
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [guestAlertOpen, setGuestAlertOpen] = useState(false);
  const [isPreApplyOpen, setIsPreApplyOpen] = useState(false);

  const job = jobData?.data || jobData;
  const posterRole = (job?.employer?.role || "").toLowerCase();

  const { data: platformFeeData, isFetching: isPlatformFeeLoading } =
    useGetPlatformFeeQuery(undefined, { skip: posterRole !== "employer" });
  const platformFeePercent = platformFeeData?.percent ?? 3;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHasMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setIsBookmarked(Boolean(job?.isBookmarked));
  }, [job?.isBookmarked]);

  const openGuestAlert = () => setGuestAlertOpen(true);

  const handleBookmark = async () => {
    if (!isJobSeeker) {
      openGuestAlert();
      return;
    }
    try {
      setIsBookmarking(true);
      const result = await bookmarkJob(jobId).unwrap();
      setIsBookmarked(Boolean(result?.isBookmarked ?? !isBookmarked));
    } catch (err) {
      console.error("Bookmark error:", err);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = async () => {
    if (!isJobSeeker) {
      openGuestAlert();
      return;
    }
    if (!jobId) return;
    const shareUrl = `${window.location.origin}/jobseeker/jobs/${jobId}`;
    const shareTitle = job?.title || "Job Opportunity";
    const shareText = `Check out this job: ${shareTitle}`;
    try {
      setIsSharing(true);
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      }
      const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
      window.open(twitterShareUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert("Share link copied to clipboard");
        return;
      }
      console.error("Share error:", err);
      alert("Unable to share right now. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white font-sans text-[#1a1a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#3FAE2A]" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="min-h-screen bg-white font-sans text-[#1a1a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div>
            <p className="text-red-600 font-semibold mb-2">Failed to load job details</p>
            <p className="text-gray-600 text-sm mb-4">{error?.toString() || "Please try again later"}</p>
          </div>
          <Link href="/jobseeker/jobs" className="text-[#3FAE2A] font-semibold hover:underline">
            Back to jobs
          </Link>
        </div>
      </div>
    );
  }

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const logoUrl = job?.posterPic || job?.employer?.profilePic;
  const logo = logoUrl
    ? /^https?:\/\//i.test(logoUrl) ? logoUrl : `${API_BASE}${logoUrl}`
    : null;

  const companyName = job?.employer?.fullName || job?.company || "Unknown Company";
  const jobTitle = job?.title || "Job Title";
  const location = job?.location || "N/A";
  const postedDate = job?.createdAt
    ? new Date(job.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    : "Recently";

  const jobType = job?.jobType ? (Array.isArray(job.jobType) ? job.jobType[0] : job.jobType) : "Full Time";
  const experienceLevel = job?.experienceLevel || "Not specified";
  const employmentType = job?.employmentType || "On-site";

  const salary = job?.salary || job?.salaryAmount;
  const salaryFrequency = job?.salaryFrequency || "Month";
  const salaryStr = salary ? `JMD ${Number(salary).toLocaleString()}/${salaryFrequency}` : "Negotiable";
  const numericSalary = Number(salary) || 0;
  const platformChargeAmount = Math.round((numericSalary * platformFeePercent) / 100);
  const takeHomeAmount = Math.max(numericSalary - platformChargeAmount, 0);

  const employerAbout =
    job?.employer?.about ||
    job?.employer?.description ||
    job?.employer?.bio ||
    job?.companyDescription ||
    "No employer information provided.";

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1a1a]">
      <GuestAccessAlert
        open={guestAlertOpen}
        onOpenChange={setGuestAlertOpen}
        fromPath={`/jobseeker/jobs/${jobId}`}
      />
      <div className="max-w-[1000px] mx-auto px-6 py-8">

        {/* ---------------- HEADER ---------------- */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/jobseeker/jobs"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Job Details</h1>
        </div>

        {/* ---------------- JOB TITLE & META ---------------- */}
        <div className="mb-8">
          <h2 className="text-[28px] font-bold text-gray-900 leading-tight">{jobTitle}</h2>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logo ? (
                <Image src={logo} alt={companyName} width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">{companyName.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{companyName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{location} • Posted {postedDate}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5 mt-5">
            {[jobType, experienceLevel, employmentType, jobType].map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-full text-[11px] font-medium uppercase tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ---------------- ACTION BUTTONS ---------------- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div className="flex gap-4 w-full md:w-auto">
            <Button
              onClick={() => {
                if (!isJobSeeker) {
                  openGuestAlert();
                  return;
                }
                setIsPreApplyOpen(true);
              }}
              className="w-40 bg-[#3FAE2A] hover:bg-[#359624] text-white rounded-full"
            >
              Apply Now
            </Button>
            <Button
              onClick={handleBookmark}
              disabled={isBookmarking}
              className={`w-40 rounded-full font-bold text-sm flex-1 md:flex-none transition-all ${isBookmarked
                ? "bg-[#3FAE2A] text-white"
                : "bg-[#F0FDF4] hover:bg-green-100 text-[#3FAE2A] border border-green-100"
                }`}
            >
              {isBookmarking ? <Loader2 className="w-4 h-4 animate-spin" /> : isBookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
          </div>

          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleBookmark}
              disabled={isBookmarking}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              <Share2 size={20} />
            </button>
            {isJobSeeker ? (
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-all cursor-pointer">
                <ReportModal jobId={jobId} />
              </div>
            ) : (
              <button
                type="button"
                onClick={openGuestAlert}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-all cursor-pointer"
                aria-label="Report job"
              >
                <span className="text-lg font-bold">!</span>
              </button>
            )}
          </div>

          {/* ---------------- PRE-APPLY MODAL ---------------- */}
          <AlertDialog open={isPreApplyOpen} onOpenChange={setIsPreApplyOpen}>
            <AlertDialogContent className="max-w-md rounded-3xl border border-[#DCEAD9] bg-white p-5 sm:p-6">
              <AlertDialogHeader className="items-start text-left">
                <AlertDialogTitle className="text-xl font-bold text-gray-900">
                  Before You Apply
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-gray-600">
                  <span className="block">
                    {posterRole === "employer"
                      ? "Platform fee will be deducted from your payments for each new job."
                      : "Please review everything before you continue."}
                  </span>
                  <span className="block mt-1">Please review everything before you continue.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Platform fee breakdown — only for EMPLOYER role */}
              {posterRole === "employer" && (
                <div className="rounded-2xl border border-[#DDEADB] bg-[#F7FBF5] p-4 text-sm">
                  <div className="flex items-center justify-between border-b border-[#DDEADB] pb-2">
                    <span className="font-semibold text-gray-500">Total Salary ({salaryFrequency})</span>
                    <span className="font-semibold text-gray-700">
                      {numericSalary > 0 ? `JMD ${numericSalary.toLocaleString()}` : "N/A"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-b border-[#DDEADB] pb-2">
                    <span className="font-semibold text-[#D65252]">
                      Platform Charge ({isPlatformFeeLoading ? "..." : `${platformFeePercent}%`})
                    </span>
                    <span className="font-bold text-[#D65252]">
                      {numericSalary > 0 ? `-JMD ${platformChargeAmount.toLocaleString()}` : "-"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Your 1st Month Take-home</span>
                    <span className="font-extrabold text-[#3FAE2A]">
                      {numericSalary > 0 ? `JMD ${takeHomeAmount.toLocaleString()}` : "N/A"}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2 text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#3FAE2A]" />
                  <span>I confirm that I am 18 years or older and legally eligible to work in Jamaica.</span>
                </p>
                <p className="flex items-start gap-2 text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#3FAE2A]" />
                  <span>I have read and understood all the details above.</span>
                </p>
              </div>

              <div className="grid gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setIsPreApplyOpen(false);
                    router.push(`/jobseeker/jobs/${jobId}/apply`);
                  }}
                  className="h-11 w-full rounded-full bg-[#3FAE2A] text-base font-bold text-white hover:bg-[#359624]"
                >
                  Agree & Apply
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPreApplyOpen(false)}
                  className="h-11 w-full rounded-full border-[#A7D8A1] text-[#4FAE3F] hover:bg-[#F3FAF1]"
                >
                  Cancel
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* ---------------- CONTENT SECTIONS ---------------- */}
        <div className="space-y-8 text-[14px] text-gray-600 leading-[1.8]">

          {/* About This Job */}
          <div>
            <h3 className="text-gray-900 font-bold text-base mb-3">About This Job</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="font-semibold text-gray-900 w-24">Position:</span>
                <span>{jobTitle}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-900 w-24">Company:</span>
                <span>{companyName}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-gray-900 w-24 text-[#3FAE2A]">Salary Range</span>
                <span className="bg-[#F0FDF4] text-[#3FAE2A] px-3 py-0.5 rounded-full text-xs font-semibold border border-green-100">
                  {salaryStr}
                </span>
              </div>
            </div>
          </div>

          {/* Job Overview */}
          {job?.description && (
            <div>
              <h3 className="text-gray-900 font-bold text-base mb-2">Job Overview</h3>
              <p>{job.description}</p>
            </div>
          )}

          {/* Responsibilities */}
          {job?.responsibilities && (
            <div>
              <h3 className="text-gray-900 font-bold text-base mb-2">Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-1 marker:text-gray-400">
                {Array.isArray(job.responsibilities)
                  ? job.responsibilities.map((resp: string, idx: number) => <li key={idx}>{resp}</li>)
                  : job.responsibilities.split("\n").map((resp: string, idx: number) => <li key={idx}>{resp}</li>)}
              </ul>
            </div>
          )}

          {/* Skills Needed */}
          {job?.skills && (
            <div>
              <h3 className="text-gray-900 font-bold text-base mb-2">Skills Needed</h3>
              <ul className="list-disc pl-5 space-y-1 marker:text-gray-400">
                {Array.isArray(job.skills)
                  ? job.skills.map((skill: string, idx: number) => <li key={idx}>{skill}</li>)
                  : job.skills.split(",").map((skill: string, idx: number) => <li key={idx}>{skill.trim()}</li>)}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job?.benefits && (
            <div>
              <h3 className="text-gray-900 font-bold text-base mb-2">Benefits</h3>
              <ul className="list-disc pl-5 space-y-1 marker:text-gray-400">
                {Array.isArray(job.benefits)
                  ? job.benefits.map((benefit: string, idx: number) => <li key={idx}>{benefit}</li>)
                  : job.benefits.split(",").map((benefit: string, idx: number) => <li key={idx}>{benefit.trim()}</li>)}
              </ul>
            </div>
          )}

          {/* Education Level */}
          {job?.educationLevel && (
            <div>
              <h3 className="text-gray-900 font-bold text-base mb-2">Education Level</h3>
              <ul className="list-disc pl-5 marker:text-gray-400">
                <li>{job.educationLevel}</li>
              </ul>
            </div>
          )}

          {/* Minimum Experience */}
          {job?.minimumExperience && (
            <div>
              <h3 className="text-gray-900 font-bold text-base mb-2">Minimum Experience</h3>
              <ul className="list-disc pl-5 marker:text-gray-400">
                <li>{job.minimumExperience}</li>
              </ul>
            </div>
          )}

          {/* Company Info */}
          <div>
            <h3 className="text-gray-900 font-bold text-base mb-4">Company Info</h3>
            <div className="flex items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                  {logo ? (
                    <Image src={logo} alt={companyName} width={40} height={40} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white font-bold">{companyName.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{companyName}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{employerAbout}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
