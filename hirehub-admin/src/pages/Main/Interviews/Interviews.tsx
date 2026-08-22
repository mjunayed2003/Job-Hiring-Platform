import React, { useState } from "react";
import { useGetInterviewsQuery } from "../../../redux/features/interviewsApi/InterviewsApi";

// ─── INTERVIEW DETAILS PAGE COMPONENT ─────────────────────────────
const InterviewDetails = ({ data, onBack }) => {
  const baseUrl = import.meta.env.VITE_SERVER_URL?.replace(/\/$/, "") || "http://localhost:5000";

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/150";
    if (path.startsWith("http")) return path;
    return `${baseUrl}${path}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusColor = (status) => {
    const s = status?.toUpperCase();
    if (s === "SCHEDULED") return "bg-[#FFF4E3] text-[#F39C12]";
    if (s === "COMPLETED") return "bg-[#E7F8EE] text-[#00B074]";
    if (s === "CANCELED" || s === "REJECTED") return "bg-[#FFEEEE] text-[#FF5B5B]";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[700px] p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-dashed border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-full transition text-gray-600"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Interview Details</h2>
        </div>
        <span className={`px-5 py-1.5 rounded-full text-xs font-bold ${getStatusColor(data.status)}`}>
          Status: {data.status}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Column: Job & Schedule Info */}
        <div className="space-y-8">
          <div>
            <h4 className="font-bold text-gray-800 text-lg mb-4 border-b pb-2">Schedule Information</h4>
            <div className="space-y-4">
              <InfoRow label="Job Title" value={data.jobTitle} />
              <InfoRow label="Location" value={data.jobLocation} />
              <InfoRow label="Interview Type" value={data.interviewType} />
              <InfoRow label="Date" value={formatDate(data.scheduleDate)} />
              <InfoRow label="Time" value={data.scheduleTime} />
              <InfoRow label="Duration" value={data.duration} />
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 text-lg mb-4 border-b pb-2">Meeting Details</h4>
            {data.meetingLink && (
              <div className="mb-4">
                <span className="text-gray-500 font-medium text-sm block mb-1">Meeting Link:</span>
                <a href={data.meetingLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline break-all">
                  {data.meetingLink}
                </a>
              </div>
            )}
            {data.notes && (
              <div>
                <span className="text-gray-500 font-medium text-sm block mb-1">Additional Notes:</span>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {data.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: User Profiles */}
        <div className="space-y-8">
          {/* Employer Profile */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Employer</h4>
            <div className="flex items-center gap-4">
              <img
                src={getImageUrl(data.employer?.profilePic)}
                alt="Employer"
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div>
                <p className="font-bold text-gray-800 text-lg">{data.employer?.fullName || "N/A"}</p>
                <p className="text-sm text-gray-500">{data.employer?.companyName || "Independent Employer"}</p>
                <p className="text-sm text-gray-500">{data.employer?.email}</p>
              </div>
            </div>
          </div>

          {/* Job Seeker Profile */}
          <div className="bg-[#F8FAF9] p-6 rounded-xl border border-[#E7F8EE]">
            <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Candidate (Job Seeker)</h4>
            <div className="flex items-center gap-4">
              <img
                src={getImageUrl(data.jobSeeker?.profilePic)}
                alt="Candidate"
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div>
                <p className="font-bold text-gray-800 text-lg">{data.jobSeeker?.fullName || "N/A"}</p>
                <p className="text-sm text-gray-500">{data.jobSeeker?.email}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper Component for Details Page
const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-50 pb-2">
    <span className="text-gray-500 font-medium text-sm">{label}:</span>
    <span className="text-gray-800 font-semibold text-sm text-right">{value || "N/A"}</span>
  </div>
);


// ─── MAIN COMPONENT (TABLE) ─────────────────────────────────────────
const Interviews = () => {
  const [selectedInterview, setSelectedInterview] = useState(null);
  
  // Filters & Pagination State
  const [filterType, setFilterType] = useState("employer"); // API parameter mapping
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Build API Query Parameters
  const queryParams = {
    page: currentPage,
    limit: itemsPerPage,
  };
  // ডায়নামিক ফিল্টার (Employer বা Candidate এর নাম দিয়ে সার্চ)
  if (appliedSearch) {
    queryParams[filterType] = appliedSearch;
  }

  // ─── API CALL ───
  const { data, isLoading, isError } = useGetInterviewsQuery(queryParams);

  const interviewList = data?.data ||[];
  const totalPages = data?.meta?.totalPages || 1;

  // ─── HANDLERS ───
  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const formatPageNumber = (num) => (num < 10 ? `0${num}` : num);

  const getStatusColor = (status) => {
    const s = status?.toUpperCase();
    if (s === "SCHEDULED") return "bg-[#FFF4E3] text-[#F39C12]";
    if (s === "COMPLETED") return "bg-[#E7F8EE] text-[#00B074]";
    if (s === "CANCELED" || s === "REJECTED") return "bg-[#FFEEEE] text-[#FF5B5B]";
    return "bg-gray-100 text-gray-600";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };


  // ─── RENDER DETAILS PAGE ───
  if (selectedInterview) {
    return (
      <InterviewDetails 
        data={selectedInterview} 
        onBack={() => setSelectedInterview(null)} 
      />
    );
  }

  // ─── RENDER TABLE PAGE ───
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full min-h-[700px] flex flex-col justify-between p-6">
      
      {/* --- HEADER & FILTERS --- */}
      <div>
        <div className="flex flex-wrap justify-between items-center mb-6 border-b border-dashed border-gray-200 pb-4 gap-4">
          <h2 className="text-xl font-bold text-gray-800 uppercase">INTERVIEW</h2>
          
          <div className="flex items-center gap-3">
            {/* Search Input Box */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
              <input
                type="text"
                placeholder={`Search by ${filterType}...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="px-3 py-1.5 text-sm outline-none w-48"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-1.5 bg-[#43B948] text-white text-sm hover:bg-green-600 transition"
              >
                🔍
              </button>
            </div>

            {/* Filter Dropdown */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setSearchInput("");
                setAppliedSearch("");
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none cursor-pointer bg-white"
            >
              <option value="employer">Employer</option>
              <option value="candidate">Candidate</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* --- TABLE --- */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500 font-medium">
            Failed to load interviews. Please try again.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-gray-500 text-xs border-b border-gray-200">
                <tr>
                  <th className="py-4 px-4 font-medium">Job Title</th>
                  <th className="py-4 px-4 font-medium">Employer</th>
                  <th className="py-4 px-4 font-medium">Candidate</th>
                  <th className="py-4 px-4 font-medium">Schedule (Date & Time)</th>
                  <th className="py-4 px-4 font-medium text-center">Status</th>
                  <th className="py-4 px-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
                {interviewList.length > 0 ? interviewList.map((row) => (
                  <tr key={row.id} className="hover:bg-[#FAFAFA] transition">
                    <td className="py-4 px-4 text-gray-800 font-medium">{row.jobTitle || "N/A"}</td>
                    <td className="py-4 px-4 text-gray-600">{row.employer?.fullName || "N/A"}</td>
                    <td className="py-4 px-4 text-gray-600">{row.jobSeeker?.fullName || "N/A"}</td>
                    <td className="py-4 px-4 text-gray-600">
                      {formatDate(row.scheduleDate)} <br/>
                      <span className="text-xs text-gray-400">{row.scheduleTime}</span>
                    </td>
                    
                    {/* Status Badge */}
                    <td className="py-4 px-4 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold ${getStatusColor(row.status)}`}>
                        {row.status}
                      </span>
                    </td>

                    {/* View Button */}
                    <td className="py-4 px-4 text-center">
                      <button 
                          onClick={() => setSelectedInterview(row)}
                          className="bg-[#EAEAEA] text-[#4B5563] px-6 py-1.5 rounded-full text-xs font-bold hover:bg-gray-300 transition shadow-sm"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      No interviews found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- PAGINATION --- */}
      <div className="pt-6 border-t border-gray-100 flex items-center justify-center gap-8 bg-white mt-4">
        <button 
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-6 py-2 bg-[#E7F8EE] text-gray-500 text-sm font-medium rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
            <span>←</span> Previous
        </button>

        <div className="flex gap-5 text-sm font-medium">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                    key={number}
                    onClick={() => paginate(number)}
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
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-2 px-6 py-2 bg-[#43B948] text-white text-sm font-medium rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        >
            Next Page <span>→</span>
        </button>
      </div>

    </div>
  );
};

export default Interviews;