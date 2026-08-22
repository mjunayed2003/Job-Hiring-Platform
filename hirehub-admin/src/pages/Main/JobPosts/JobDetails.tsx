import React from "react";
import { useGetJobByIdQuery, useDeleteJobMutation } from "../../../redux/features/jobsApi/JobsApi";

import { useNavigate } from "react-router-dom";

const JobDetails = ({ job, onBack }) => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetJobByIdQuery(job?.id, {
    skip: !job?.id,
  });

  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center items-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading Job Details...</p>
        </div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center items-center min-h-[500px] flex-col">
        <p className="text-red-500 font-medium mb-4">Failed to load job details.</p>
        <button onClick={onBack} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition">
          Go Back
        </button>
      </div>
    );
  }

  const fullJob = data?.data;

  // Formatting date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ==========================================
  // Image URL Logic (Like RegistrationDetails)
  // ==========================================
  const baseUrl = import.meta.env.VITE_SERVER_URL?.replace(/\/$/, "") || "http://localhost:5000";

  const imgUrl = (path) =>
    path && !path.includes("undefined") ? `${baseUrl}${path}` : null;

  const logoSrc = imgUrl(fullJob.employer?.profilePic) || "https://via.placeholder.com/150";
  // ==========================================

  // Employer Data Extraction
  const employerName = fullJob.employer?.companyName || fullJob.employer?.fullName || "N/A";
  const employerEmail = fullJob.employer?.user?.email || "N/A";
  const totalApplications = fullJob._count?.applications || 0;



  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full p-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6 border-b border-dashed border-gray-200 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Job Details</h2>
        </div>

        <div className="flex items-center gap-3"> {/* ✅ gap এর জন্য flex */}

          {/* ✅ Delete Button */}
          <button
            onClick={async () => {
              if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;
              try {
                await deleteJob(fullJob.id).unwrap();
                alert("Job deleted successfully.");
                onBack();
              } catch (err) {
                alert("Failed to delete job. Please try again.");
              }
            }}
            disabled={isDeleting}
            className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Job
              </>
            )}
          </button>

          {/* Status Badge */}
          <div className="px-4 py-1.5 border border-gray-200 rounded text-sm text-gray-600 bg-white shadow-sm flex items-center gap-2">
            Status:
            <span className={`font-semibold ${fullJob.status === "OPEN" || fullJob.status === "ACTIVE" ? "text-[#00B074]" : "text-red-500"}`}>
              {fullJob.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="md:border-r border-gray-200 md:pr-10">
          <div className="flex items-start gap-5 mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#E7F8EE] flex-shrink-0">
              <img
                src={logoSrc}
                alt="Company Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/150";
                }}
              />
            </div>
            <div className="pt-2">
              <h3 className="text-lg font-bold text-gray-800">{fullJob.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Employer: <span className="text-gray-700 font-medium">{employerName}</span>
              </p>
              <p className="text-sm text-gray-500">
                Email: <span className="text-gray-700">{employerEmail}</span>
              </p>
              <p className="text-sm text-gray-500">
                Location: <span className="text-gray-700">{fullJob.location || "N/A"}</span>
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="bg-[#E7F8EE] text-[#00B074] px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  {fullJob.isRemote ? "Remote" : "On-site"}
                </span>
                <span className="bg-[#EAEAEA] text-[#4B5563] px-2 py-1 rounded text-[10px] font-bold">
                  {fullJob.jobType?.join(", ") || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Overview Section */}
          <div className="mb-6">
            <h4 className="text-[15px] font-bold text-gray-800 mb-2">Overview</h4>
            <p className="text-sm text-gray-500 leading-relaxed text-justify whitespace-pre-wrap">
              {fullJob.description || "No description provided for this job."}
            </p>
          </div>

          {/* Requirements Section */}
          <div className="mb-6">
            <h4 className="text-[15px] font-bold text-gray-800 mb-2">Requirements</h4>
            <div className="mb-3 flex justify-between border-b border-gray-50 pb-2">
              <p className="text-sm font-semibold text-gray-700">Experience Level:</p>
              <p className="text-sm text-gray-600">
                {fullJob.experienceLevel || "N/A"} {fullJob.minExperience ? `(${fullJob.minExperience}+ Years)` : ""}
              </p>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <p className="text-sm font-semibold text-gray-700">Education Level:</p>
              <p className="text-sm text-gray-600">{fullJob.educationLevel || "N/A"}</p>
            </div>
          </div>

          {/* Job Category */}
          <div className="mb-6">
            <h4 className="text-[15px] font-bold text-gray-800 mb-2">Job Category</h4>
            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-1">
              <li>{fullJob.category?.name || "N/A"}</li>
            </ul>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:pl-4">

          {/* Top Extra Info Row */}
          <div className="flex justify-between items-center mb-8 bg-[#F9FAFB] p-4 rounded-lg border border-gray-100">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Applications</span>
              <span className="text-2xl font-bold text-[#00B074]">{totalApplications}</span>
            </div>

            <button
              onClick={() => navigate(`/jobs/${fullJob.id}/applicants`)}
              disabled={totalApplications === 0}
              className={`px-6 py-2 shadow-sm rounded-full text-sm font-medium transition ${totalApplications === 0
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
            >
              View Applicants
            </button>
          </div>

          {/* Responsibilities */}
          <div className="mb-6">
            <h4 className="text-[15px] font-bold text-gray-800 mb-3">Responsibilities</h4>
            {fullJob.responsibilities && fullJob.responsibilities.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1.5 marker:text-[#00B074]">
                {fullJob.responsibilities.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">N/A</p>
            )}
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h4 className="text-[15px] font-bold text-gray-800 mb-3">Benefits</h4>
            {fullJob.benefits && fullJob.benefits.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1.5 marker:text-[#00B074]">
                {fullJob.benefits.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">N/A</p>
            )}
          </div>

          {/* Salary details */}
          <div className="mb-6">
            <h4 className="text-[15px] font-bold text-gray-800 mb-2">Salary Details</h4>
            <div className="bg-green-50/50 p-4 rounded border border-green-100">
              <p className="text-lg font-bold text-gray-800">
                {fullJob.salaryAmount ? `$${fullJob.salaryAmount}` : "Negotiable"}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  {fullJob.salaryFrequency ? `/ ${fullJob.salaryFrequency.toLowerCase()}` : ""}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                Type: {fullJob.salaryType || "N/A"}
              </p>
            </div>
          </div>

          {/* Deadline */}
          <div className="mb-6">
            <h4 className="text-[15px] font-bold text-gray-800 mb-2">Application Deadline</h4>
            <p className="text-sm font-medium text-red-500 bg-red-50 border border-red-100 inline-block px-4 py-1.5 rounded-full">
              ⏳ {formatDate(fullJob.deadline)}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobDetails;