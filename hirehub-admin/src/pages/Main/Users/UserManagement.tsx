import React, { useState } from "react";
import {
  useGetUsersQuery,
  useBlockUserMutation,
  usePendingUserMutation
} from "../../../redux/features/users/UsersApi.js";
import UserDetails from "./UserDetails";
import toast from "react-hot-toast";

const UserManagement = () => {
  const [status, setStatus] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [role, setRole] = useState("JOB_SEEKER");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const itemsPerPage = 10;

  // ─── API Calls ───────────────────────────────────────────────
  const { data, isLoading, refetch } = useGetUsersQuery({
    role,
    search,
    status,
    page: currentPage,
    limit: itemsPerPage,
  });

  const [blockUser] = useBlockUserMutation();
  const [pendingUser] = usePendingUserMutation();

  const users = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / itemsPerPage) || 1;


  // ─── Handlers ────────────────────────────────────────────────
  const handleToggleBlock = async (id, currentStatus) => {
    try {
      if (currentStatus === "BLOCKED") {
        await pendingUser(id).unwrap();
        toast.success("User unblocked and moved to Pending status!");
      } else {
        await blockUser(id).unwrap();
        toast.success("User blocked successfully!");
      }
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Action failed. Check API endpoint.");
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  // ─── Detail View ─────────────────────────────────────────────
  if (selectedUser) {
    return (
      <UserDetails
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onActionDone={refetch}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[700px] flex flex-col justify-between">

      {/* Header */}
      <div>
        <div className="p-6 border-b border-dashed border-gray-200 flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-gray-800">User Management</h2>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <input
                type="text"
                placeholder="Search by name..."
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

            {/* Role Filter */}
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none cursor-pointer"
            >
              <option value="JOB_SEEKER">Job Seeker</option>
              <option value="EMPLOYER">Employer</option>
              <option value="COMPANY">Company</option>
            </select>

            {/* Status Filter ← নতুন */}
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="BLOCKED">Blocked</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-gray-500 text-xs border-b border-gray-200">
                <tr>
                  <th className="py-4 px-6 font-medium">Name</th>
                  <th className="py-4 px-6 font-medium">Email</th>
                  <th className="py-4 px-6 font-medium">Registration Date</th>
                  <th className="py-4 px-6 font-medium">Role</th>
                  <th className="py-4 px-6 font-medium text-center">Verification Status</th>
                  <th className="py-4 px-6 font-medium text-center">View Details</th>
                  <th className="py-4 px-6 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
                {users.length > 0 ? users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#FAFAFA] transition">
                    <td className="py-4 px-6 font-medium">
                      {user.fullName || user.jobSeekerProfile?.fullName || user.employerProfile?.fullName || user.companyProfile?.companyName || "-"}
                    </td>
                    <td className="py-4 px-6 text-gray-600">{user.email}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "-"}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.role || "-"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-4 py-1 rounded-full text-xs font-semibold ${user.status === "ACTIVE" ? "bg-[#E7F8EE] text-[#00B074]" :
                        user.status === "PENDING" ? "bg-[#FFF4E3] text-[#F39C12]" :
                          user.status === "BLOCKED" ? "bg-[#FFEEEE] text-[#FF5B5B]" :
                            user.status === "REJECTED" ? "bg-[#FFEEEE] text-[#FF5B5B]" :
                              "bg-gray-100 text-gray-500"
                        }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="bg-[#EAEAEA] text-[#4B5563] px-6 py-1.5 rounded-full text-xs font-bold hover:bg-gray-300 transition"
                      >
                        View
                      </button>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleBlock(user.id, user.status)}
                        className={`px-6 py-1.5 rounded-full text-xs font-bold transition min-w-[80px] ${user.status === "BLOCKED"
                          ? "bg-[#EAEAEA] text-[#4B5563] hover:bg-gray-300"
                          : "bg-[#FFEEEE] text-[#FF5B5B] hover:bg-red-200"
                          }`}
                      >
                        {user.status === "BLOCKED" ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-8 bg-white">
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
              className={`${currentPage === number ? "text-[#43B948] font-bold" : "text-gray-500 hover:text-gray-700"}`}
            >
              {number < 10 ? `0${number}` : number}
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

export default UserManagement;