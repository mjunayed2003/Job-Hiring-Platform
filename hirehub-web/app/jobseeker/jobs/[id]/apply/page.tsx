"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useApplyForJobMutation } from "@/redux/services/jobsApi";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReferenceFields {
  name: string;
  company: string;
  designation: string;
  relationship: string;
  phone: string;
  email: string;
}

interface JpFields {
  fullName: string;
  contact: string;
  jurisdiction: string;
  relationship: string;
}

interface PastorFields {
  fullName: string;
  church: string;
  contact: string;
  relationship: string;
}

interface RelativeFields {
  fullName: string;
  contact: string;
  relationship: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-gray-800 mb-4">{children}</h2>
  );
}

function FieldLabel({
  children,
  optional,
}: {
  children: React.ReactNode;
  optional?: string;
}) {
  return (
    <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
      {children}{" "}
      {optional && (
        <span className="text-gray-400 font-normal">({optional})</span>
      )}
    </Label>
  );
}

function StyledInput({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <Input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="h-12 rounded-xl border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus-visible:ring-[#3FAE2A] focus-visible:border-[#3FAE2A]"
    />
  );
}

function Divider() {
  return <hr className="border-gray-100 my-6" />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [applyForJob, { isLoading }] = useApplyForJobMutation();

  // Basic Info
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [message, setMessage] = useState("");
  const MAX_CHARS = 50;
  const [fieldErrors, setFieldErrors] = useState<{
    resume?: string;
    availabilityDate?: string;
    message?: string;
    checkbox?: string;
  }>({});

  // Reference
  const [reference, setReference] = useState<ReferenceFields>({
    name: "",
    company: "",
    designation: "",
    relationship: "",
    phone: "",
    email: "",
  });

  // JP
  const [jp, setJp] = useState<JpFields>({
    fullName: "",
    contact: "",
    jurisdiction: "",
    relationship: "",
  });

  // Pastor
  const [pastor, setPastor] = useState<PastorFields>({
    fullName: "",
    church: "",
    contact: "",
    relationship: "",
  });

  // Relative
  const [relative, setRelative] = useState<RelativeFields>({
    fullName: "",
    contact: "",
    relationship: "",
  });

  // Confirmation checkbox
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [checkboxError, setCheckboxError] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!jobId) {
      setError("Missing job id. Please go back and try again.");
      return;
    }

    const nextFieldErrors: typeof fieldErrors = {};

    if (!resumeFile) {
      nextFieldErrors.resume = "Please upload your resume before submitting.";
    }

    if (!availabilityDate) {
      nextFieldErrors.availabilityDate = "Please choose your availability / start date.";
    }

    if (!message.trim()) {
      nextFieldErrors.message = "Please write a short message.";
    }

    if (!isConfirmed) {
      setCheckboxError(true);
      nextFieldErrors.checkbox = "Please confirm your work eligibility to continue.";
    } else {
      setCheckboxError(false);
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      const summary = [
        nextFieldErrors.resume,
        nextFieldErrors.availabilityDate,
        nextFieldErrors.message,
        nextFieldErrors.checkbox,
      ].filter(Boolean).join(" ");
      setError(summary || "Please complete the required fields.");
      return;
    }

    const formData = new FormData();

    formData.append("jobId", jobId);
    formData.append("workEligibilityConfirmed", "true");

    if (resumeFile) formData.append("resume", resumeFile);
    if (availabilityDate) formData.append("availableFrom", availabilityDate);
    if (message.trim()) formData.append("shortMessage", message.trim());

    if (reference.name)         formData.append("refJobName", reference.name);
    if (reference.company)      formData.append("refJobCompany", reference.company);
    if (reference.designation)  formData.append("refJobTitle", reference.designation);
    if (reference.relationship) formData.append("refJobRelationship", reference.relationship);
    if (reference.phone)        formData.append("refJobPhone", reference.phone);
    if (reference.email)        formData.append("refJobEmail", reference.email);

    if (jp.fullName)     formData.append("refJpName", jp.fullName);
    if (jp.contact)      formData.append("refJpContact", jp.contact);
    if (jp.jurisdiction) formData.append("refJpJurisdiction", jp.jurisdiction);
    if (jp.relationship) formData.append("refJpRelationship", jp.relationship);

    if (pastor.fullName)     formData.append("refPastorName", pastor.fullName);
    if (pastor.church)       formData.append("refPastorChurch", pastor.church);
    if (pastor.contact)      formData.append("refPastorContact", pastor.contact);
    if (pastor.relationship) formData.append("refPastorRelationship", pastor.relationship);

    if (relative.fullName)     formData.append("refRelativeName", relative.fullName);
    if (relative.contact)      formData.append("refRelativeContact", relative.contact);
    if (relative.relationship) formData.append("refRelativeRelationship", relative.relationship);

    try {
      await applyForJob(formData).unwrap();
      router.push("/jobseeker/jobs");
    } catch (err: unknown) {
      const msg: string =
        typeof err === "object" &&
        err !== null &&
        "data" in err &&
        typeof (err as { data?: { message?: unknown } }).data?.message === "string"
          ? (err as { data?: { message?: string } }).data?.message ?? "Something went wrong. Please try again."
          : "Something went wrong. Please try again.";
      setError(msg);
    }
  };

  const updateRef = (field: keyof ReferenceFields, val: string) =>
    setReference((prev) => ({ ...prev, [field]: val }));
  const updateJp = (field: keyof JpFields, val: string) =>
    setJp((prev) => ({ ...prev, [field]: val }));
  const updatePastor = (field: keyof PastorFields, val: string) =>
    setPastor((prev) => ({ ...prev, [field]: val }));
  const updateRelative = (field: keyof RelativeFields, val: string) =>
    setRelative((prev) => ({ ...prev, [field]: val }));

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex justify-center">
      <div className="w-full mx-auto max-w-[800px] px-3 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/jobseeker/jobs"
            className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">Apply Details</h1>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <p className="font-semibold mb-1">Please complete the required fields</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-0">

          {/* ── Basic Information ── */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <SectionTitle>Basic Information</SectionTitle>

            {/* Resume Preview */}
            <div className="mb-5">
              <FieldLabel>Resume Preview <span className="text-red-500">*</span></FieldLabel>
              <div className={`flex items-center justify-between w-full h-12 px-4 bg-white border rounded-xl ${fieldErrors.resume ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                <div className="flex items-center gap-2 text-gray-400 min-w-0">
                  <FileText size={18} className="flex-shrink-0" />
                  <span className="text-sm text-gray-400 truncate">
                    {resumeFile ? resumeFile.name : "Preview Resume"}
                  </span>
                </div>
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer p-1.5 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                >
                  <Upload size={17} className="text-gray-500" />
                </label>
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {fieldErrors.resume && (
                <p className="mt-1.5 text-xs text-red-500">{fieldErrors.resume}</p>
              )}
            </div>

            {/* Availability Date */}
            <div className="mb-5">
              <FieldLabel>Availability / Start Date <span className="text-red-500">*</span></FieldLabel>
              <Input
                type="date"
                value={availabilityDate}
                onChange={(e) => setAvailabilityDate(e.target.value)}
                className={`h-12 rounded-xl bg-white text-sm focus-visible:ring-[#3FAE2A] focus-visible:border-[#3FAE2A] w-full ${fieldErrors.availabilityDate ? "border-red-300 text-red-700 bg-red-50" : "border-gray-200 text-gray-500"}`}
              />
              {fieldErrors.availabilityDate && (
                <p className="mt-1.5 text-xs text-red-500">{fieldErrors.availabilityDate}</p>
              )}
            </div>

            {/* Short Message */}
            <div>
              <FieldLabel>Short Message <span className="text-red-500">*</span></FieldLabel>
              <div className="relative">
                <Textarea
                  placeholder="Enter your short note"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={MAX_CHARS}
                  className={`min-h-[120px] rounded-xl bg-white text-sm resize-none focus-visible:ring-[#3FAE2A] focus-visible:border-[#3FAE2A] pb-8 ${fieldErrors.message ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200"}`}
                />
                <span className="absolute bottom-3 right-4 text-xs text-gray-400">
                  {message.length}/{MAX_CHARS}
                </span>
              </div>
              {fieldErrors.message && (
                <p className="mt-1.5 text-xs text-red-500">{fieldErrors.message}</p>
              )}
            </div>
          </div>

          {/* ── References ── */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <SectionTitle>
              References{" "}
              <span className="text-[#3FAE2A] font-semibold">(Optional)</span>
            </SectionTitle>

            {/* Previous/Current Job */}
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Previous/Current Job{" "}
              <span className="text-gray-400 font-normal">(If any)</span>
            </p>
            <div className="space-y-3">
              <div>
                <FieldLabel>Reference Name</FieldLabel>
                <StyledInput placeholder="Enter the name of manager or supervisor" value={reference.name} onChange={(e) => updateRef("name", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Company Name</FieldLabel>
                <StyledInput placeholder="Enter the Company name" value={reference.company} onChange={(e) => updateRef("company", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Designation / Job Title</FieldLabel>
                <StyledInput placeholder="The role or position" value={reference.designation} onChange={(e) => updateRef("designation", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Relationship to Applicant</FieldLabel>
                <StyledInput placeholder="e.g. Supervisor" value={reference.relationship} onChange={(e) => updateRef("relationship", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Phone Number <span className="text-gray-400 font-normal">(Reference)</span></FieldLabel>
                <StyledInput placeholder="Phone Number (Reference)" type="tel" value={reference.phone} onChange={(e) => updateRef("phone", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Email Address <span className="text-gray-400 font-normal">(Reference)</span></FieldLabel>
                <StyledInput placeholder="Email Address (Reference)" type="email" value={reference.email} onChange={(e) => updateRef("email", e.target.value)} />
              </div>
            </div>

            <Divider />

            {/* Justice of the Peace */}
            <p className="text-sm font-semibold text-gray-700 mb-3">Justice of the Peace (JP)</p>
            <div className="space-y-3">
              <div>
                <FieldLabel>JP Full Name</FieldLabel>
                <StyledInput placeholder="Enter the JP Full Name" value={jp.fullName} onChange={(e) => updateJp("fullName", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Contact Number or Email</FieldLabel>
                <StyledInput placeholder="Enter the Contact Number or Email" value={jp.contact} onChange={(e) => updateJp("contact", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Jurisdiction / Parish</FieldLabel>
                <StyledInput placeholder="Jurisdiction / Parish" value={jp.jurisdiction} onChange={(e) => updateJp("jurisdiction", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Relationship</FieldLabel>
                <StyledInput placeholder="e.g., JP for verification of character" value={jp.relationship} onChange={(e) => updateJp("relationship", e.target.value)} />
              </div>
            </div>

            <Divider />

            {/* Pastor */}
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Pastor / Religious Leader{" "}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </p>
            <div className="space-y-3">
              <div>
                <FieldLabel>Pastor Full Name</FieldLabel>
                <StyledInput placeholder="Enter the Pastor Full Name" value={pastor.fullName} onChange={(e) => updatePastor("fullName", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Church / Religious Institution Name</FieldLabel>
                <StyledInput placeholder="Enter the Church / Religious Institution Name" value={pastor.church} onChange={(e) => updatePastor("church", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Contact Number or Email</FieldLabel>
                <StyledInput placeholder="Contact Number or Email" value={pastor.contact} onChange={(e) => updatePastor("contact", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Relationship</FieldLabel>
                <StyledInput placeholder="e.g., Pastor or Youth Leader" value={pastor.relationship} onChange={(e) => updatePastor("relationship", e.target.value)} />
              </div>
            </div>

            <Divider />

            {/* Relative */}
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Relative{" "}
              <span className="text-[#3FAE2A] font-normal">(Optional)</span>
            </p>
            <div className="space-y-3">
              <div>
                <FieldLabel>Relative Full Name</FieldLabel>
                <StyledInput placeholder="Enter the Relative Full Name" value={relative.fullName} onChange={(e) => updateRelative("fullName", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Contact Number or Email</FieldLabel>
                <StyledInput placeholder="Enter the Contact Number or Email" value={relative.contact} onChange={(e) => updateRelative("contact", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Relationship to JobSeeker</FieldLabel>
                <StyledInput placeholder="e.g., uncle, aunt, sibling" value={relative.relationship} onChange={(e) => updateRelative("relationship", e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Confirmation Checkbox ── */}
          <div
            onClick={() => {
              const next = !isConfirmed;
              setIsConfirmed(next);
              if (next) setCheckboxError(false);
              if (next) {
                setFieldErrors((prev) => ({ ...prev, checkbox: undefined }));
              }
            }}
            className={`bg-white rounded-2xl p-5 shadow-sm mb-4 cursor-pointer select-none transition-all duration-200 ${
              checkboxError
                ? "border border-red-300"
                : isConfirmed
                ? "border border-[#3FAE2A]"
                : "border border-transparent"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="relative mt-0.5 flex-shrink-0">
                <input type="checkbox" checked={isConfirmed} onChange={() => {}} className="sr-only" />
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                    isConfirmed
                      ? "bg-[#3FAE2A] border-[#3FAE2A]"
                      : checkboxError
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isConfirmed && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className={`text-sm leading-relaxed ${checkboxError ? "text-red-600" : "text-gray-700"}`}>
                I confirm that I am 18 years or older and legally eligible to work in Jamaica.
              </span>
            </div>
            {checkboxError && (
              <p className="mt-2 ml-8 text-xs text-red-500 font-medium">
                {fieldErrors.checkbox || "This confirmation is required to proceed."}
              </p>
            )}
          </div>

          {/* ── Submit Button ── */}
          <div className="pt-2 flex justify-center">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3FAE2A] hover:bg-[#359624] text-white font-bold py-6 rounded-full text-base shadow-md transition-transform hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
