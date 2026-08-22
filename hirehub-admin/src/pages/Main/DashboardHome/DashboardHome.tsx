import React, { useState } from "react";
import EarningsChart from "../../../Components/dashboardHome/EarningsChart";
import userIcon from "../../../assets/images/total.svg";
import RegistrationDetails from "../../../Components/dashboardHome/RegistrationDetails";
import InterviewDetails from "../../../Components/dashboardHome/InterviewDetails";
import RegistrationApprovalRequests from "../../../Components/dashboardHome/RequestJobseeker";
import {
  useGetDashboardStatsQuery,
  useGetPieChartQuery,
  useGetEarningsQuery,
} from "../../../redux/features/dashboard/DashboardApi";

const DashboardHome = () => {
  const [earningPeriod, setEarningPeriod] = useState("yearly");
  const [viewData, setViewData] = useState(null);
  const [viewInterview, setViewInterview] = useState(null);

  const { data: statsData } = useGetDashboardStatsQuery();
  const { data: pieData } = useGetPieChartQuery();
  const { data: earningsData } = useGetEarningsQuery(earningPeriod);

  const stats = statsData?.data || {};
  const pieChart = pieData?.data || {};
  const earningChart = earningsData?.data?.chart || [];

  const homeStatus = [
    {
      title: stats.totalJobSeekers?.label || "Total Job Seekers",
      amount: stats.totalJobSeekers?.count ?? 0,
      icon: userIcon,
      percentage: `${stats.totalJobSeekers?.growthPercent ?? 0}% (30 days)`,
    },
    {
      title: stats.totalEmployers?.label || "Total Employers",
      amount: stats.totalEmployers?.count ?? 0,
      icon: userIcon,
      percentage: `${stats.totalEmployers?.growthPercent ?? 0}% (30 days)`,
    },
    {
      title: stats.totalCompanies?.label || "Total Companies",
      amount: stats.totalCompanies?.count ?? 0,
      icon: userIcon,
      percentage: `${stats.totalCompanies?.growthPercent ?? 0}% (30 days)`,
    },
    {
      title: stats.activeJobPosts?.label || "Active Job Posts",
      amount: stats.activeJobPosts?.count ?? 0,
      icon: userIcon,
      percentage: `${stats.activeJobPosts?.growthPercent ?? 0}% (30 days)`,
    },
  ];

  const PieRing = ({ percentage, color }) => (
    <div
      className="relative flex items-center justify-center w-32 h-32 rounded-full"
      style={{ background: `conic-gradient(${color} ${percentage}%, #F3F4F6 0)` }}
    >
      <div className="absolute w-16 h-16 bg-white rounded-full flex items-center justify-center">
        <span className="text-xl font-bold text-gray-800">{percentage}%</span>
      </div>
    </div>
  );

  if (viewData) {
    return (
      <div className="p-4 bg-[#F8F9FD] min-h-screen">
        <RegistrationDetails user={viewData} onBack={() => setViewData(null)} onActionDone={() => { }} />
      </div>
    );
  }

  if (viewInterview) {
    return (
      <div className="p-4 bg-[#F8F9FD] min-h-screen">
        <InterviewDetails interview={viewInterview} onBack={() => setViewInterview(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F8F9FD] p-4 font-sans text-[#1A1A1A]">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {homeStatus.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <img src={item.icon} alt="icon" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{item.amount}</h3>
              <p className="text-sm text-gray-500 font-medium">{item.title}</p>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <span className="mr-1">●</span> {item.percentage}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pie Chart & Earnings */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Pie Chart</h3>
          <div className="border-b border-dashed border-gray-200 mb-8"></div>
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col items-center gap-4">
              <PieRing percentage={pieChart.jobSeeker?.percentage ?? 0} color="#FF5B5B" />
              <span className="text-sm font-medium text-gray-600">{pieChart.jobSeeker?.label || "Job Seeker"}</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <PieRing percentage={pieChart.employer?.percentage ?? 0} color="#00B074" />
              <span className="text-sm font-medium text-gray-600">{pieChart.employer?.label || "Employer"}</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <PieRing percentage={pieChart.company?.percentage ?? 0} color="#2D9CDB" />
              <span className="text-sm font-medium text-gray-600">{pieChart.company?.label || "Companies"}</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7">
          <EarningsChart />
        </div>
      </div>

      {/* Registration Approval Requests */}
      <RegistrationApprovalRequests onView={(user) => setViewData(user)} />

    </div>
  );
};

export default DashboardHome;