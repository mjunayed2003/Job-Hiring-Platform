import React, { useState } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useGetEarningsQuery } from "../../redux/features/dashboard/DashboardApi";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-gray-50 text-center min-w-[100px]">
        <p className="text-[#1A1A1A] font-bold text-lg">{payload[0].value} JMD</p>
        <p className="text-gray-400 text-xs mt-1">{label}</p>
      </div>
    );
  }
  return null;
};

const EarningsChart = () => {
  const [period, setPeriod] = useState("weekly");

  const { data: response, isLoading, isError } = useGetEarningsQuery(period);

  // FIXED: Added .data before .chart
  const currentData = response?.data?.chart || [];

  return (
    <div className="w-full h-full bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-[20px] font-bold text-[#1A1A1A]">Earning</h2>
          <p className="text-[#9ea0a5] text-xs mt-1">Earning graph preview from the platform</p>
        </div>

        <div className="relative">
          <select
            className="appearance-none bg-white border border-gray-200 text-gray-500 text-sm rounded px-4 py-1.5 pr-8 focus:outline-none cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            disabled={isLoading}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
            <svg className="fill-current h-3 w-3 text-green-500" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <div className="border-b border-dashed border-gray-200 mb-6 mt-2 w-full"></div>

      <div className="flex-1 w-full min-h-[250px] relative">
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-white/50 z-10">
            <span className="text-gray-500 text-sm font-medium">Loading data...</span>
          </div>
        )}
        
        {isError && !isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-white/50 z-10">
            <span className="text-red-500 text-sm font-medium">Failed to load earnings data.</span>
          </div>
        )}

        {currentData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#43B948" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#43B948" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip 
                 content={<CustomTooltip />} 
                 cursor={{ stroke: '#43B948', strokeWidth: 1, strokeDasharray: '4 4' }} 
              />
              <XAxis 
                 dataKey="label" 
                 axisLine={false} 
                 tickLine={false} 
                 tick={{ fill: '#6c757d', fontSize: 12 }} 
                 dy={10} 
                 interval={0} 
              />
              <Area 
                 type="monotone" 
                 dataKey="amount" 
                 stroke="#43B948" 
                 strokeWidth={3} 
                 fill="url(#colorEarnings)" 
                 activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff', fill: '#43B948' }} 
                 animationDuration={1000} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : !isLoading ? (
           <div className="absolute inset-0 flex justify-center items-center">
              <span className="text-gray-400 text-sm font-medium">No data available</span>
           </div>
        ) : null}
      </div>
    </div>
  );
};

export default EarningsChart;