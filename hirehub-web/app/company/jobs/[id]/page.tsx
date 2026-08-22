"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, CheckCircle2 } from "lucide-react";
import {
    useGetJobApplicantsQuery,
    useUpdateApplicationStatusMutation,
} from "@/redux/services/employerApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "lucide-react";
import Link from "next/link";

export default function JobSeekerProfilePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const jobSeekerId = params?.id as string;
    const appId = searchParams.get("appId");
    const jobId = searchParams.get("jobId");
    // const interviewId = searchParams.get("interviewId"); // যদি প্রয়োজন না হয় মুছে দিতে পারেন

    const [isRejecting, setIsRejecting] = useState(false);
    const [showReferences, setShowReferences] = useState(false); // ✅ রেফারেন্স দেখানোর স্টেট
    const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

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

    const selectedApplicant = useMemo(() => {
        const applicants = Array.isArray(applicantsData)
            ? applicantsData
            : applicantsData?.data || [];
        if (appId) {
            const byAppId = applicants.find((item: any) => item.id === appId);
            if (byAppId) return byAppId;
        }
        if (jobSeekerId) {
            return applicants.find((item: any) => item.jobSeeker?.id === jobSeekerId);
        }
        return undefined;
    }, [applicantsData, appId, jobSeekerId]);

    const jobSeeker = selectedApplicant?.jobSeeker;
    const interview = selectedApplicant?.interview;
    const references = selectedApplicant?.references; // ✅ রেফারেন্স ডাটা

    const formatDate = (dateString: string) => {
        if (!dateString) return "Present";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    };

    const formatDateLong = (dateString?: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const handleScheduleInterview = () => {
        if (!appId) {
            alert("Application ID not found. Please navigate from the applicants list.");
            return;
        }
        const queryParams = new URLSearchParams();
        queryParams.set("appId", appId);
        if (jobId) queryParams.set("jobId", jobId);
        queryParams.set("jobSeekerId", jobSeekerId);
        router.push(`/company/jobs/schedule?${queryParams.toString()}`);
    };

    const handleRejectApplicant = async () => {
        if (!appId) {
            alert("Application ID not found. Please navigate from the applicants list.");
            return;
        }
        if (!window.confirm("Are you sure you want to reject this applicant?")) return;

        setIsRejecting(true);
        try {
            await updateApplicationStatus({ appId, status: "REJECTED" }).unwrap();
            alert("Applicant rejected successfully");
            router.back();
        } catch (error) {
            console.error("Failed to reject applicant:", error);
            alert("Failed to reject applicant. Please try again.");
        } finally {
            setIsRejecting(false);
        }
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const profileImageUrl = jobSeeker?.profilePic
        ? `${apiUrl}${jobSeeker.profilePic}`
        : undefined;

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <Loader className="animate-spin text-[#3FAE2A]" size={48} />
            </div>
        );
    }

    if (error || !jobSeeker) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="text-center text-red-500">
                    <p>Failed to load candidate profile</p>
                    <Button
                        onClick={() => router.back()}
                        className="mt-4 rounded-full bg-[#3FAE2A] text-white hover:bg-[#2d8620]"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // ==========================================
    // ✅ REFERENCE VIEW
    // ==========================================
    if (showReferences) {
        const RefRow = ({ label, value }: { label: string; value?: string }) => (
            <div className="flex sm:flex-row flex-col sm:items-center sm:gap-2">
                <span className="w-56 font-semibold text-gray-800">{label}:</span>
                <span className="text-gray-500">{value || "N/A"}</span>
            </div>
        );

        return (
            <div className="min-h-screen w-full bg-white px-6 py-6 md:px-10">
                <div className="mx-auto w-full max-w-[800px]">
                    {/* Header */}
                    <div className="mb-10 flex items-center relative">
                        <button
                            onClick={() => setShowReferences(false)}
                            className="absolute left-0 p-3 hover:bg-gray-50 rounded-full border border-gray-100 shadow-sm transition"
                        >
                            <ArrowLeft size={20} className="text-gray-800" />
                        </button>
                        <h1 className="w-full text-center text-xl font-semibold text-gray-900">
                            References
                        </h1>
                    </div>

                    {/* Content */}
                    <div className="space-y-10">
                        {!references ? (
                            <p className="text-center text-gray-500 mt-10">No references found for this applicant.</p>
                        ) : (
                            <div className="space-y-8">
                                {/* 1. Previous Job Experience */}
                                {references.previousJob && (
                                    <div>
                                        <p className="font-medium text-gray-900 mb-3">From Job Experiences</p>
                                        <div className="space-y-2 text-[15px]">
                                            <RefRow label="Reference Name" value={references.previousJob.name} />
                                            <RefRow label="Company" value={references.previousJob.company} />
                                            <RefRow label="Designation / Job Title" value={references.previousJob.title} />
                                            <RefRow label="Relationship to Applicant" value={references.previousJob.relationship} />
                                            <RefRow label="Phone Number" value={references.previousJob.phone} />
                                            <RefRow label="Email Address" value={references.previousJob.email} />
                                        </div>
                                        <hr className="mt-8 border-gray-100" />
                                    </div>
                                )}

                                {/* 2. Justice of the Peace */}
                                {references.justiceOfThePeace && (
                                    <div>
                                        <p className="font-medium text-gray-900 mb-3">Justice of the Peace</p>
                                        <div className="space-y-2 text-[15px]">
                                            <RefRow label="Reference Name" value={references.justiceOfThePeace.name} />
                                            <RefRow label="Jurisdiction" value={references.justiceOfThePeace.jurisdiction} />
                                            <RefRow label="Relationship to Applicant" value={references.justiceOfThePeace.relationship} />
                                            <RefRow label="Contact Information" value={references.justiceOfThePeace.contact} />
                                        </div>
                                        <hr className="mt-8 border-gray-100" />
                                    </div>
                                )}

                                {/* 3. Pastor */}
                                {references.pastor && (
                                    <div>
                                        <p className="font-medium text-gray-900 mb-3">Pastor</p>
                                        <div className="space-y-2 text-[15px]">
                                            <RefRow label="Reference Name" value={references.pastor.name} />
                                            <RefRow label="Church" value={references.pastor.church} />
                                            <RefRow label="Relationship to Applicant" value={references.pastor.relationship} />
                                            <RefRow label="Contact Information" value={references.pastor.contact} />
                                        </div>
                                        <hr className="mt-8 border-gray-100" />
                                    </div>
                                )}

                                {/* 4. Relative */}
                                {references.relative && (
                                    <div>
                                        <p className="font-medium text-gray-900 mb-3">Relative</p>
                                        <div className="space-y-2 text-[15px]">
                                            <RefRow label="Reference Name" value={references.relative.name} />
                                            <RefRow label="Relationship to Applicant" value={references.relative.relationship} />
                                            <RefRow label="Contact Information" value={references.relative.contact} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // ✅ MAIN PROFILE VIEW
    // ==========================================
    return (
        <div className="min-h-screen w-full bg-white">
            <div className="mx-auto w-full max-w-[1300px] px-6 py-6 md:px-10">

                {/* ── Back + Title ── */}
                <div className="mb-8 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 p-2 hover:text-gray-900 rounded-full border border-gray-200 "
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Candidate Profile</h1>
                </div>

                <div className="w-full max-w-[1100px] items-center justify-center mx-auto">
                    {/* ── Profile Header: Avatar | Info | Buttons ── */}
                    <div className="mb-6 flex w-full max-w-[1170px] items-center justify-between gap-6">
                        {/* Avatar + Info */}
                        <div className="flex items-start gap-5">
                            <Avatar className="h-24 w-24 flex-shrink-0">
                                <AvatarImage
                                    src={profileImageUrl}
                                    alt={jobSeeker.fullName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-[#EAF6EA] text-2xl font-bold text-[#3FAE2A]">
                                    {jobSeeker.fullName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-0.5">
                                <h2 className="text-xl font-bold text-gray-900">{jobSeeker.fullName}</h2>
                                {jobSeeker.experience?.length > 0 && (
                                    <p className="text-sm text-gray-500">{jobSeeker.experience[0].designation}</p>
                                )}
                                <p className="text-sm text-gray-600">
                                    Experience level:{" "}
                                    <span className="font-semibold text-gray-800">
                                        {jobSeeker.experienceLevel || "Not specified"}
                                    </span>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Location:{" "}
                                    <span className="font-semibold text-gray-800">
                                        {jobSeeker.location || "N/A"}
                                    </span>
                                </p>
                                <div className="flex gap-2 pt-1">
                                    {jobSeeker.idCardFront && jobSeeker.idCardBack && (
                                        <div className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-500">
                                            <CheckCircle2 size={12} />
                                            <span className="text-xs">Id Verified</span>
                                        </div>
                                    )}
                                    {jobSeeker.selfieImage && (
                                        <div className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-500">
                                            <CheckCircle2 size={12} />
                                            <span className="text-xs">Face Verified</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Schedule + Reject buttons */}
                        <div className="flex flex-shrink-0 items-center gap-4">
                            <Button
                                onClick={handleScheduleInterview}
                                className="rounded-full bg-[#3FAE2A] px-8 py-2 text-sm font-semibold text-white hover:bg-[#2d8620]"
                            >
                                Schedule Interview
                            </Button>
                            <button
                                onClick={handleRejectApplicant}
                                disabled={isRejecting}
                                className="text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-60"
                            >
                                {isRejecting ? "Rejecting..." : "Reject Applicants"}
                            </button>
                        </div>
                    </div>

                    {/* ── Resume + See references buttons ── */}
                    <div className="mb-8 flex gap-3">
                        {jobSeeker.resumeUrl ? (
                            <Link
                                href={`${apiUrl}${jobSeeker.resumeUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button className="gap-2 rounded-full bg-[#3FAE2A] px-7 text-sm font-semibold text-white hover:bg-[#2d8620]">
                                    <Download size={14} /> Resume
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                onClick={() => alert("No resume uploaded yet.")}
                                className="gap-2 rounded-full bg-[#3FAE2A] px-7 text-sm font-semibold text-white hover:bg-[#2d8620]"
                            >
                                <Download size={14} /> Resume
                            </Button>
                        )}

                        {/* ✅ Message এর পরিবর্তে See references */}
                        <Button
                            onClick={() => setShowReferences(true)}
                            variant="outline"
                            className="gap-2 rounded-full border border-[#D5EED5] bg-[#EAF6EA] px-8 text-[15px] font-bold text-[#3FAE2A] hover:bg-[#d6f0d6] hover:text-[#2d8620]"
                        >
                            See references
                        </Button>
                    </div>

                    {/* ── Content sections — no card, no border ── */}
                    <div className="space-y-8">

                        {/* Overview */}
                        {jobSeeker.about && (
                            <div>
                                <h3 className="mb-2 text-base font-bold text-gray-900">Overview</h3>
                                <p className="text-sm leading-relaxed text-gray-600">{jobSeeker.about}</p>
                            </div>
                        )}

                        {/* Application Information */}
                        <div>
                            <h3 className="mb-3 text-base font-bold text-gray-900">Application Information</h3>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-400">Application Status</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedApplicant?.status || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Available From</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedApplicant?.availableFrom
                                            ? formatDateLong(selectedApplicant.availableFrom)
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Short Message</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedApplicant?.shortMessage || "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Interview Information */}
                        {interview && (
                            <div>
                                <h3 className="mb-3 text-base font-bold text-gray-900">Interview Information</h3>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-gray-400">Interview Type</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {interview.interviewType || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Interview Date</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDateLong(interview.scheduleDate)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Interview Time</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {interview.scheduleTime || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Interview Status</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {interview.status || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Experience */}
                        {jobSeeker.experience?.length > 0 && (
                            <div>
                                <h3 className="mb-4 text-base font-bold text-gray-900">Experience</h3>
                                <div className="space-y-4">
                                    {jobSeeker.experience.map((exp: any) => (
                                        <div key={exp.id}>
                                            <h4 className="text-sm font-semibold text-gray-900">{exp.designation}</h4>
                                            <p className="text-sm text-gray-500">{exp.companyName}</p>
                                            <p className="text-sm text-gray-400">
                                                {formatDate(exp.startDate)} –{" "}
                                                {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                                            </p>
                                            {exp.description && (
                                                <p className="mt-1 text-sm text-gray-600">{exp.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        {jobSeeker.skills?.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-base font-bold text-gray-900">Skills</h3>
                                <ul className="space-y-1.5">
                                    {jobSeeker.skills.map((skill: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                            <span className="text-gray-400">•</span>
                                            {skill}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Education */}
                        {jobSeeker.education?.length > 0 && (
                            <div>
                                <h3 className="mb-4 text-base font-bold text-gray-900">Educations</h3>
                                <div className="space-y-4">
                                    {jobSeeker.education.map((edu: any) => (
                                        <div key={edu.id}>
                                            <h4 className="text-sm font-semibold text-gray-900">{edu.degreeName}</h4>
                                            <p className="text-sm text-gray-500">{edu.institution}</p>
                                            <p className="text-sm text-gray-400">
                                                {formatDate(edu.startDate)} –{" "}
                                                {edu.isCurrent ? "Present" : formatDate(edu.completionYear)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}