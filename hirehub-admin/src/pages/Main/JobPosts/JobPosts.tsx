import React, { useState } from "react";
import {
  useGetJobsQuery,
  useBlockJobMutation,
  useUnblockJobMutation,
} from "../../../redux/features/jobsApi/JobsApi";
import JobDetails from "./JobDetails";

const JobPosts = () => {
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const itemsPerPage = 12;

  const { data, isLoading, isError, refetch } = useGetJobsQuery({
    page: currentPage,
    limit: itemsPerPage,
    role: roleFilter,
  });

  const [blockJob] = useBlockJobMutation();
  const [unblockJob] = useUnblockJobMutation();

  const allJobs = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  // ─── Client-side status filter ───────────────────────────────
  const jobList = statusFilter
    ? allJobs.filter((job) => {
        const s = job?.status?.toUpperCase() || "";
        if (statusFilter === "BLOCKED") return s === "BLOCKED_BY_ADMIN";
        if (statusFilter === "UNBLOCKED") return s !== "BLOCKED_BY_ADMIN";
        return true;
      })
    : allJobs;

  const toggleBlockStatus = async (id, isCurrentlyBlocked) => {
    try {
      if (isCurrentlyBlocked) {
        await unblockJob(id).unwrap();
      } else {
        await blockJob(id).unwrap();
      }
      refetch();
    } catch (error) {
      alert("Something went wrong! Please check the console.");
    }
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const formatPageNumber = (num) => (num < 10 ? `0${num}` : num);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[700px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[700px] flex items-center justify-center">
        <p className="text-red-500 font-medium">Failed to load jobs.</p>
      </div>
    );
  }

  if (selectedJob) {
    return <JobDetails job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full min-h-[700px] flex flex-col justify-between p-6">
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-dashed border-gray-200 pb-4">
          <h2 className="text-xl font-bold text-gray-800">Job Posts</h2>

          <div className="flex items-center gap-3 flex-wrap">

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="BLOCKED">Blocked</option>
              <option value="UNBLOCKED">Unblocked</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-gray-500 text-xs border-b border-gray-200">
              <tr>
                <th className="py-4 px-4 font-medium">Name</th>
                <th className="py-4 px-4 font-medium">Email</th>
                <th className="py-4 px-4 font-medium">Registration Date</th>
                <th className="py-4 px-4 font-medium">Category</th>
                <th className="py-4 px-4 font-medium text-center">Status</th>
                <th className="py-4 px-4 font-medium text-center">View Details</th>
                <th className="py-4 px-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
              {jobList.length > 0 ? (
                jobList.map((row) => {
                  const currentStatus = row?.status?.toUpperCase() || "";
                  const isBlocked = currentStatus === "BLOCKED_BY_ADMIN";

                  // ─── Name: multiple fallback ──────────────────
                  const employerName =
                    row?.employerProfile?.fullName ||
                    row?.companyProfile?.companyName ||
                    row?.employer?.fullName ||
                    row?.company?.companyName ||
                    row?.employerName ||
                    row?.companyName ||
                    row?.postedBy?.fullName ||
                    "N/A";

                  // ─── Email: multiple fallback ─────────────────
                  const employerEmail =
                    row?.employerProfile?.email ||
                    row?.companyProfile?.email ||
                    row?.employer?.email ||
                    row?.company?.email ||
                    row?.employerEmail ||
                    row?.postedBy?.email ||
                    "N/A";

                  // ─── Category: multiple fallback ──────────────
                  const categoryName =
                    row?.category?.name ||
                    row?.categoryName ||
                    row?.jobCategory?.name ||
                    row?.jobCategory ||
                    "N/A";

                  return (
                    <tr key={row.id} className="hover:bg-[#FAFAFA] transition">
                      <td className="py-4 px-4 font-medium text-gray-700">
                        {employerName}
                      </td>
                      <td className="py-4 px-4 text-gray-600">{employerEmail}</td>
                      <td className="py-4 px-4 text-gray-600">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString("en-GB")
                          : "N/A"}
                      </td>
                      <td className="py-4 px-4 text-gray-600">{categoryName}</td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                            isBlocked
                              ? "bg-[#FFEEEE] text-[#FF5B5B]"
                              : "bg-[#E7F8EE] text-[#00B074]"
                          }`}
                        >
                          {isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => setSelectedJob(row)}
                          className="bg-[#EAEAEA] text-[#4B5563] px-6 py-1.5 rounded-full text-xs font-bold hover:bg-gray-300 transition shadow-sm"
                        >
                          View
                        </button>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => toggleBlockStatus(row.id, isBlocked)}
                          className={`px-6 py-1.5 rounded-full text-xs font-bold transition min-w-[80px] shadow-sm ${
                            isBlocked
                              ? "bg-[#EAEAEA] text-[#4B5563] hover:bg-gray-300"
                              : "bg-[#FFEEEE] text-[#FF5B5B] hover:bg-red-200"
                          }`}
                        >
                          {isBlocked ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No jobs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="pt-6 border-t border-gray-100 flex items-center justify-center gap-8 bg-white mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-6 py-2 bg-[#E7F8EE] text-gray-600 text-sm font-medium rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          ← Previous
        </button>

        <div className="flex gap-4 text-sm font-medium">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`${
                currentPage === number
                  ? "text-[#43B948] font-bold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {formatPageNumber(number)}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-2 px-6 py-2 bg-[#43B948] text-white text-sm font-medium rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        >
          Next Page →
        </button>
      </div>
    </div>
  );
};

export default JobPosts;