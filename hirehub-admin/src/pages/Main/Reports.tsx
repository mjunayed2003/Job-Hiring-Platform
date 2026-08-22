import React, { useState } from "react";
import { FaEye, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import {
  useGetReportsQuery,
  useGetReportByIdQuery,
  useResolveReportMutation
} from "../../redux/features/reportsApi/ReportsApi";

// Report Details Modal Component
const ReportDetailsModal = ({ reportId, onClose, onResolve }) => {
  const { data: reportData, isLoading } = useGetReportByIdQuery(reportId);
  const report = reportData?.data;

  const serverUrl = import.meta.env.VITE_SERVER_URL || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FaExclamationTriangle className="text-orange-500" /> Report Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition p-1">
            <MdClose size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-10">Loading details...</div>
          ) : report ? (
            <>
              {/* Reason & Status */}
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-orange-800 mb-1">Reason for Report</h4>
                    <p className="text-gray-700 font-medium">{report.reason}</p>
                    <p className="text-sm text-gray-600 mt-2">{report.details}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {report.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reporter Info */}
                <div className="border border-gray-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Reporter Information</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={report.reporter.jobSeekerProfile?.profilePic ? `${serverUrl}${report.reporter.jobSeekerProfile.profilePic}` : "https://via.placeholder.com/50"}
                      alt="avatar"
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <p className="font-bold text-gray-800 text-sm">
                        {report.reporter.jobSeekerProfile?.fullName || report.reporter.employerProfile?.fullName || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{report.reporter.role.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-800">Email:</span> {report.reporter.email}</p>
                    <p><span className="font-medium text-gray-800">Phone:</span> {report.reporter.jobSeekerProfile?.phone || "N/A"}</p>
                  </div>
                </div>

                {/* Job Info */}
                {report.job && (
                  <div className="border border-gray-100 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Reported Job</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium text-gray-800">Job Title:</span> <span className="text-[#43B948] font-semibold">{report.job.title}</span></p>
                      <p><span className="font-medium text-gray-800">Company:</span> {report.job.employer?.companyName || report.job.employer?.fullName}</p>
                      <p><span className="font-medium text-gray-800">Location:</span> {report.job.location}</p>
                      <p><span className="font-medium text-gray-800">Status:</span> {report.job.status}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-10">Report not found</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition">
            Close
          </button>
          {report?.status === 'PENDING' && (
            <button
              onClick={() => onResolve(report.id)}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#43B948] hover:bg-green-600 shadow-sm transition flex items-center gap-2"
            >
              <FaCheckCircle /> Mark as Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
const Reports = () => {
  // Filters & Pagination State
  const [statusFilter, setStatusFilter] = useState(""); // "" = All, "PENDING", "RESOLVED"
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal State
  const [selectedReportId, setSelectedReportId] = useState(null);

  // API Hooks
  const { data, isLoading, isFetching } = useGetReportsQuery({ status: statusFilter, page, limit });
  const [resolveReport] = useResolveReportMutation();

  const reports = data?.data || [];
  const meta = data?.meta || { totalPages: 1 };
  const serverUrl = import.meta.env.VITE_SERVER_URL || "";

  // Handlers
  const handleResolve = async (id) => {
    if (window.confirm("Are you sure you want to mark this report as resolved?")) {
      try {
        await resolveReport(id).unwrap();
        if (selectedReportId) setSelectedReportId(null); // Close modal if open
      } catch (error) {
        console.error("Failed to resolve report:", error);
      }
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[700px] font-sans">

      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports & Reviews</h2>
          <p className="text-sm text-gray-500 mt-1">Manage user reports and flagged jobs.</p>
        </div>

        {/* Custom Tabs for Filtering */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {["All", "PENDING", "RESOLVED"].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status === "All" ? "" : status); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${(statusFilter === status) || (status === "All" && statusFilter === "")
                  ? "bg-white text-[#43B948] shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
            >
              {status === "All" ? "All Reports" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm font-bold border-b border-gray-100">
              <th className="p-4">Reporter</th>
              <th className="p-4">Reported Job</th>
              <th className="p-4">Reason</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {isLoading || isFetching ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">Loading reports...</td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No reports found.</td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-green-50/30 transition">
                  {/* Reporter Column */}
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={report.reporter?.profilePic ? `${serverUrl}${report.reporter.profilePic}` : "https://via.placeholder.com/40"}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{report.reporter?.fullName}</p>
                      <p className="text-xs text-gray-500 capitalize">{report.reporter?.role.replace("_", " ")}</p>
                    </div>
                  </td>

                  {/* Job Column */}
                  <td className="p-4">
                    {report.job ? (
                      <>
                        <p className="font-semibold text-gray-800 max-w-[180px] truncate" title={report.job.title}>{report.job.title}</p>
                        <p className="text-xs text-gray-500 truncate">{report.job.companyName}</p>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Job Removed</span>
                    )}
                  </td>

                  {/* Reason Column */}
                  <td className="p-4 text-gray-600 max-w-[200px] truncate" title={report.reason}>
                    {report.reason}
                  </td>

                  {/* Date Column */}
                  <td className="p-4 text-gray-500 text-xs">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>

                  {/* Status Column */}
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1.5 ${report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${report.status === 'RESOLVED' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      {report.status}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="p-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedReportId(report.id)}
                      className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-500 hover:text-white rounded-lg transition"
                      title="View Details"
                    >
                      <FaEye size={16} />
                    </button>
                    {report.status === 'PENDING' && (
                      <button
                        onClick={() => handleResolve(report.id)}
                        className="p-2 text-[#43B948] bg-green-50 hover:bg-[#43B948] hover:text-white rounded-lg transition"
                        title="Mark as Resolved"
                      >
                        <FaCheckCircle size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION --- */}
      {meta.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-500">
            Page <span className="font-bold text-gray-800">{page}</span> of <span className="font-bold text-gray-800">{meta.totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <button
              disabled={page === meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL --- */}
      {selectedReportId && (
        <ReportDetailsModal
          reportId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
};

export default Reports;