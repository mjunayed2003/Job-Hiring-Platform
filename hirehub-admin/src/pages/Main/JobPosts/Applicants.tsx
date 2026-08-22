import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetJobApplicationsQuery } from "../../../redux/features/jobsApi/JobsApi";

// ==========================================
// Types / Interfaces
// ==========================================
interface IApplication {
  id: string;
  status: string;
  createdAt: string;
  shortMessage?: string;
  resumeUrl?: string;
  availableFrom?: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhoto?: string;
  location: string;
  experienceLevel: string;
  skills: string[];
}

interface IMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ApplicantsPage: React.FC = () => {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL"); // ফিল্টারের জন্য স্টেট

  const { data: applicationsData, isLoading, isError } = useGetJobApplicationsQuery(
    { jobId, page: currentPage, limit: 10 },
    { skip: !jobId }
  );

  const applications: IApplication[] = applicationsData?.data || [];
  const meta: IMeta = applicationsData?.meta || { total: 0, page: 1, totalPages: 1, limit: 10 };

  // ==========================================
  // Utilities
  // ==========================================
  const baseUrl = import.meta.env.VITE_SERVER_URL?.replace(/\/$/, "") || "http://localhost:5000";
  const imgUrl = (path?: string) => (path && !path.includes("undefined") ? `${baseUrl}${path}` : null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // Filtering Logic
  // ==========================================
  const filteredApplications = applications.filter((app) => {
    if (selectedStatus === "ALL") return true;
    return app.status === selectedStatus;
  });

  // ==========================================
  // Loading & Error States
  // ==========================================
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center items-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading Applications...</p>
        </div>
      </div>
    );
  }

  if (isError || !jobId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col justify-center items-center min-h-[500px]">
        <p className="text-red-500 font-medium mb-4">Failed to load applications or Job ID missing.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition shadow-sm"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Back to Job Details</h1>
      </div>

      {/* Stats Card Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Job Applicants</h2>
            <p className="text-sm text-gray-500 mt-1">
              Total Applications: <span className="font-semibold text-[#00B074]">{meta.total}</span>
            </p>
          </div>

          {/* Stats Cards (Applied, Viewed, Interview, Hired) */}
          <div className="flex flex-wrap gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center min-w-[90px]">
              <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Applied</p>
              <p className="text-xl font-bold text-blue-700 mt-1">
                {applications.filter((a) => a.status === "APPLIED").length}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center min-w-[90px]">
              <p className="text-[11px] text-gray-600 font-bold uppercase tracking-wider">Viewed</p>
              <p className="text-xl font-bold text-gray-700 mt-1">
                {applications.filter((a) => a.status === "VIEWED").length}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-center min-w-[90px]">
              <p className="text-[11px] text-purple-600 font-bold uppercase tracking-wider">Interview</p>
              <p className="text-xl font-bold text-purple-700 mt-1">
                {applications.filter((a) => a.status === "INTERVIEW").length}
              </p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center min-w-[90px]">
              <p className="text-[11px] text-green-600 font-bold uppercase tracking-wider">Hired</p>
              <p className="text-xl font-bold text-green-700 mt-1">
                {applications.filter((a) => a.status === "HIRED").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Applications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        
        {/* Dropdown Filter */}
        <div className="flex justify-end mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Filter by Status:</label>
            <select
              value={selectedStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="ALL">All Applicants</option>
              <option value="APPLIED">Applied</option>
              <option value="VIEWED">Viewed</option>
              <option value="INTERVIEW">Interview</option>
              <option value="HIRED">Hired</option>
            </select>
          </div>
        </div>

        {filteredApplications.length > 0 ? (
          <>
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="border border-gray-200 rounded-lg p-5 hover:border-green-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Applicant Photo */}
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                      <img
                        src={imgUrl(app.applicantPhoto) || "https://via.placeholder.com/150"}
                        alt={app.applicantName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "https://via.placeholder.com/150";
                        }}
                      />
                    </div>

                    {/* Applicant Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{app.applicantName}</h3>
                          <p className="text-sm text-gray-500">{app.applicantEmail}</p>
                        </div>
                        
                        {/* Application Status Badge */}
                        <span
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                            app.status === "APPLIED"
                              ? "bg-blue-100 text-blue-700"
                              : app.status === "VIEWED"
                              ? "bg-gray-100 text-gray-700"
                              : app.status === "INTERVIEW"
                              ? "bg-purple-100 text-purple-700"
                              : app.status === "HIRED"
                              ? "bg-green-100 text-green-700"
                              : app.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      {/* Details Row */}
                      <div className="flex flex-wrap gap-3 mb-3">
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                          </svg>
                          {app.location}
                        </span>
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"></path>
                            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"></path>
                          </svg>
                          {app.experienceLevel}
                        </span>
                        {app.skills?.map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Message */}
                      {app.shortMessage && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700 italic">"{app.shortMessage}"</p>
                        </div>
                      )}

                      {/* Bottom Info & Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                            </svg>
                            Applied: {formatDateTime(app.createdAt)}
                          </span>
                          {app.availableFrom && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                              </svg>
                              Available: {formatDate(app.availableFrom)}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons (Only Resume) */}
                        <div className="flex items-center gap-2">
                          {app.resumeUrl && (
                            <a
                              href={`${baseUrl}${app.resumeUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-[#00B074] text-white rounded-lg text-sm font-medium hover:bg-[#009060] transition flex items-center gap-1 shadow-sm"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                              </svg>
                              View Resume
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing Page {meta.page} of {meta.totalPages} (Total {meta.total} applicants)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                          currentPage === page
                            ? "bg-[#00B074] text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={currentPage === meta.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="text-gray-500 font-medium">No applicants found for this status.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantsPage;