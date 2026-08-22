import React from "react";
import { useGetDashboardInterviewsQuery } from "../../redux/features/dashboard/DashboardApi";

export default function InterviewScheduled({ onView }) {
  const { data, isLoading } = useGetDashboardInterviewsQuery({ limit: 10 });
  const interviews = data?.data || [];

  return (
    <div className="bg-white rounded-[14px] p-6 shadow-sm border border-[#f0f0f0] font-sans mt-6 min-h-[400px]">

      {/* Header */}
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-dashed border-gray-200">
        <h3 className="text-base font-bold text-gray-900">Interview Scheduled</h3>
        <button className="px-4 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition">
          See all
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-gray-400 text-xs">
                {["Job Title", "Job Seeker Name", "Employer / Company", "Interview Date & Time", "Status", "View Details"].map((h) => (
                  <th key={h} className={`py-3 px-3 font-medium border-b border-dashed border-gray-200 whitespace-nowrap ${h === "Status" || h === "View Details" ? "text-center" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interviews.length > 0 ? interviews.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition duration-150">
                  <td className="py-3.5 px-3 font-medium text-gray-900">{row.jobTitle || row.title || "-"}</td>
                  <td className="py-3.5 px-3 text-gray-500">{row.jobSeeker || row.seeker || row.candidateName || "-"}</td>
                  <td className="py-3.5 px-3 text-gray-500">{row.employer || row.employerName || row.company || "-"}</td>
                  <td className="py-3.5 px-3 text-gray-500">
                    {row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : row.dateTime || row.date || "-"}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold inline-block min-w-[90px] ${
                      row.status === "SCHEDULED" || row.status === "Scheduled" ? "bg-[#FFF4E3] text-[#F39C12]"
                      : row.status === "COMPLETED" || row.status === "Completed" ? "bg-[#E7F8EE] text-[#00B074]"
                      : "bg-[#FFEEEE] text-[#FF5B5B]"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => onView && onView(row)}
                      className="bg-[#EAEAEA] text-[#4B5563] border-none rounded-full px-5 py-1.5 text-xs font-bold hover:bg-gray-300 transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">No interviews found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}