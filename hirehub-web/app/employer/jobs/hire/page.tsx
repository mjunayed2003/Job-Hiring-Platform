"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  useGetJobByIdQuery,
  useGetJobApplicantsQuery,
  useUpdateInterviewStatusMutation,
  useUpdateApplicationStatusMutation,
} from "@/redux/services/employerApi";
import { 
  useCreatePaymentUrlMutation,
} from "@/redux/services/featuresApi";

export default function HirePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get("appId");
  const interviewId = searchParams.get("interviewId");
  const jobId = searchParams.get("jobId");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();
  const [updateInterviewStatus] = useUpdateInterviewStatusMutation();
  const [createPaymentUrl] = useCreatePaymentUrlMutation();


  const { data: applicantsData, isLoading: applicantsLoading } = useGetJobApplicantsQuery(
    { jobId: jobId || "", page: 1, limit: 100 },
    { skip: !jobId, refetchOnMountOrArgChange: true }
  );

  const applicants = Array.isArray(applicantsData)
    ? applicantsData
    : applicantsData?.data || [];

  const selectedApplicant = useMemo(() => {
    if (!appId) return undefined;
    return applicants.find((item: any) => item.id === appId);
  }, [applicants, appId]);

  const effectiveJobId = jobId || selectedApplicant?.jobId;

  const { data: jobByIdData, isLoading: jobLoading, error: jobError } = useGetJobByIdQuery(
    effectiveJobId || "",
    { skip: !effectiveJobId }
  );

  const extractJobFromResponse = (payload: any) => {
    if (!payload) return undefined;
    const directCandidates = [
      payload, payload?.data, payload?.data?.data,
      payload?.data?.job, payload?.job,
    ];
    for (const candidate of directCandidates) {
      if (
        candidate && typeof candidate === "object" &&
        (candidate.id || candidate.title || candidate.location || candidate.salary || candidate.salaryAmount)
      ) return candidate;
    }
    const nestedArrays = [payload?.data, payload?.data?.data, payload?.items, payload?.results];
    for (const list of nestedArrays) {
      if (Array.isArray(list)) {
        const matched = list.find((item: any) => item?.id === effectiveJobId) || list[0];
        if (matched) return matched;
      }
    }
    return undefined;
  };

  const jobFromApi = extractJobFromResponse(jobByIdData);

  useEffect(() => {
    if (!appId) {
      router.replace(jobId ? `/employer/jobs/${jobId}/applicants` : "/employer/jobs");
    }
  }, [appId, jobId, router]);

  const candidateName = selectedApplicant?.jobSeeker?.fullName || "Unknown Candidate";
  const job = jobFromApi || selectedApplicant?.job;
  const interview = selectedApplicant?.interview;
  const position = job?.title || "N/A";
  const workLocation = job?.location || "N/A";

  const typeSource = job?.jobType ?? job?.type ?? job?.workType;
  const employmentType = Array.isArray(typeSource)
    ? typeSource.join(", ")
    : typeSource || "N/A";

  const salaryFrequencyRaw = job?.salaryFrequency ?? job?.salaryType;
  const salaryFrequency = salaryFrequencyRaw
    ? String(salaryFrequencyRaw).replace(/_/g, " ")
    : "N/A";

  const salaryAmountRaw = job?.salaryAmount ?? job?.salary;
  const salaryAmount = Number(salaryAmountRaw || 0);

  const formatMoney = (value: number) => `JMD ${value.toLocaleString("en-US")}`;

  const interviewDate = interview?.scheduleDate
    ? new Date(interview.scheduleDate).toLocaleDateString("en-GB", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      })
    : "N/A";

  const startDate = selectedApplicant?.createdAt
    ? new Date(selectedApplicant.createdAt).toLocaleDateString("en-GB", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      })
    : "N/A";

  const handleConfirmHire = async () => {
    if (!appId || !interviewId) {
      alert("Missing interview information. Please try again.");
      return;
    }


    setIsSubmitting(true);
    try {
      const paymentResponse = await createPaymentUrl({ interviewId }).unwrap();
      const redirectData = paymentResponse?.redirectData;
      if (!redirectData) {
        alert("Payment request created, but redirect data was missing.");
        return;
      }
      const popup = window.open("", "_self");
      if (popup?.document) {
        popup.document.open();
        popup.document.write(redirectData);
        popup.document.close();
        return;
      }
      document.open();
      document.write(redirectData);
      document.close();
    } catch (error) {
      console.error("Failed to process payment:", error);
      alert("Failed to process payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (jobLoading || applicantsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3FAE2A] border-t-transparent" />
      </div>
    );
  }

  if (jobError && !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6 text-center text-red-500">
        Failed to load job details.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center">

      {/* Header */}
      <div className="mx-auto w-full max-w-[1390px] px-6 py-6 md:px-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0 rounded-full border border-gray-200 bg-white hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 md:text-2xl lg:text-3xl">
            Confirm Hire & Deposit Salary
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[1170px] px-6 pb-12 md:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_0.6fr]">

          {/* LEFT COLUMN */}
          <div>
            {/* Illustration */}
            <div className="mb-10 flex flex-col items-center text-center">
              <div className="mb-4 flex items-center justify-center">
                <div className="relative h-[150px] w-[300px]">
                  <Image
                    src="/image/powertanz.png"
                    alt="Payment confirmation"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Confirm Your Hiring & Salary Deposit
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-500">
                Please review the job details carefully before proceeding with the salary deposit.
              </p>
            </div>

            {/* Two-column info grid */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">

              {/* Candidate Information + Job Details */}
              <div>
                <h2 className="mb-3 text-base font-semibold text-gray-800">
                  Candidate Information
                </h2>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-400">Candidate Name: </span>
                    <span className="font-medium text-gray-800">{candidateName}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Position: </span>
                    <span className="font-medium text-gray-800">{position}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Interview Date: </span>
                    <span className="font-medium text-gray-800">{interviewDate}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Start Date: </span>
                    <span className="font-medium text-gray-800">{startDate}</span>
                  </p>
                </div>

                <h2 className="mb-3 mt-8 text-base font-semibold text-gray-800">Job Details</h2>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-400">Employment Type: </span>
                    <span className="font-medium text-gray-800">{employmentType}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Work Location: </span>
                    <span className="font-medium text-gray-800">{workLocation}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Salary Frequency: </span>
                    <span className="font-medium text-gray-800">{salaryFrequency}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Agreed Salary: </span>
                    <span className="font-medium text-gray-800">
                      {salaryAmount > 0 ? formatMoney(salaryAmount) : "N/A"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Salary Deposit Summary — শুধু salary, কোনো fee নেই */}
              <div className="sm:border-l sm:border-gray-200 sm:pl-8">
                <h2 className="mb-3 text-base font-semibold text-gray-800">
                  Salary Deposit Summary
                </h2>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-400">Salary Amount: </span>
                    <span className="font-medium text-gray-800">
                      {salaryAmount > 0 ? formatMoney(salaryAmount) : "N/A"}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">Total Payable Today: </span>
                    <span className="font-bold text-gray-900 text-base">
                      {salaryAmount > 0 ? formatMoney(salaryAmount) : "N/A"}
                    </span>
                  </p>
                </div>

                <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                  <p className="mb-1 font-semibold text-gray-700">Note:</p>
                  <p className="leading-relaxed">
                    This amount will be securely held by the platform until job completion.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col justify-end">
            <Button
              onClick={handleConfirmHire}
              disabled={isSubmitting || applicantsLoading}
              className="w-full rounded-full bg-[#4CB82F] py-7 text-lg font-semibold text-white shadow-lg shadow-green-200 hover:bg-[#3ea327] disabled:opacity-60"
            >
              {isSubmitting ? "Processing..." : "Make Payment"}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}