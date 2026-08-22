// components/CompanyApprovals.jsx
import React, { useState } from "react";
import RegistrationDetails from "../../../Components/dashboardHome/RegistrationDetails";
import {
  useGetUsersQuery,
  useApproveUserMutation,
  useRejectUserMutation,
  useSendMailMutation,
} from "../../../redux/features/users/UsersApi.js";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["All", "PENDING", "ACTIVE", "REJECTED", "BLOCKED"];
const ITEMS_PER_PAGE = 12;

// ─── Mail Modal ───────────────────────────────────────────────
const MailModal = ({ user, onClose, onSend, isSending }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    onSend({ to: user.email, subject, message });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-800">Send Message</h3>
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Notice regarding your company registration"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Write your message here..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-400 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="bg-[#43B948] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Mail"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────
const CompanyApprovals = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [mailTarget, setMailTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // ─── API Calls ───────────────────────────────────────────────
  const queryParams = {
    role: "COMPANY",
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    ...(statusFilter !== "All" && { status: statusFilter }),
    ...(search && { search }),
  };

  const { data, isLoading, isFetching } = useGetUsersQuery(queryParams);
  const [approveUser, { isLoading: isApproving }] = useApproveUserMutation();
  const [rejectUser,  { isLoading: isRejecting }] = useRejectUserMutation();
  const [sendMail,    { isLoading: isSending   }] = useSendMailMutation();

  const users      = data?.data       || [];
  const total      = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;

  // ─── Handlers ────────────────────────────────────────────────
  const handleApprove = async (userId, e) => {
    e.stopPropagation();
    try {
      await approveUser(userId).unwrap();
      toast.success("Company approved successfully!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to approve");
    }
  };

  const handleDecline = async (userId, e) => {
    e.stopPropagation();
    try {
      await rejectUser(userId).unwrap();
      toast.success("Company rejected!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to reject");
    }
  };

  const handleSendMail = async ({ to, subject, message }) => {
    try {
      await sendMail({ to, subject, message }).unwrap();
      toast.success("Mail sent successfully!");
      setMailTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to send mail");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // ─── Detail View ─────────────────────────────────────────────
  if (selectedUser) {
    return (
      <RegistrationDetails
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onActionDone={() => setSelectedUser(null)}
      />
    );
  }

  // ─── Status Badge Helper ─────────────────────────────────────
  const statusStyle = (status) => {
    const map = {
      PENDING:  { bg: "#FFF4E3", color: "#F39C12" },
      ACTIVE:   { bg: "#E7F8EE", color: "#00B074" },
      REJECTED: { bg: "#FFEEEE", color: "#FF5B5B" },
      BLOCKED:  { bg: "#F3F4F6", color: "#6B7280" },
    };
    return map[status] || { bg: "#F3F4F6", color: "#6B7280" };
  };

  return (
    <>
      {/* ── Mail Modal ── */}
      {mailTarget && (
        <MailModal
          user={mailTarget}
          onClose={() => setMailTarget(null)}
          onSend={handleSendMail}
          isSending={isSending}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col justify-between">

        {/* ── Header ── */}
        <div>
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Company Registration Requests
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search company..."
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-green-400 w-44"
                />
                <button
                  type="submit"
                  className="bg-[#43B948] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-600 transition"
                >
                  Search
                </button>
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setSearchInput(""); setCurrentPage(1); }}
                    className="text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    ✕ Clear
                  </button>
                )}
              </form>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-green-400 bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All Status" : s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="overflow-x-auto relative">
            {(isLoading || isFetching) && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-gray-500 text-xs border-b border-gray-200">
                <tr>
                  <th className="py-4 px-6 font-medium">Company Name</th>
                  <th className="py-4 px-6 font-medium">Official Email</th>
                  <th className="py-4 px-6 font-medium">Applied Date</th>
                  <th className="py-4 px-6 font-medium">Industry</th>
                  <th className="py-4 px-6 font-medium text-center">Status</th>
                  <th className="py-4 px-6 font-medium text-center">Verify</th>
                  <th className="py-4 px-6 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
                {!isLoading && users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm italic">
                      No companies found.
                    </td>
                  </tr>
                ) : (
                  users.map((row) => {
                    const { bg, color } = statusStyle(row.status);
                    const createdAt = row.createdAt
                      ? new Date(row.createdAt).toLocaleDateString("en-GB")
                      : "—";

                    return (
                      <tr key={row.id} className="hover:bg-[#FAFAFA] transition">
                        <td className="py-4 px-6 font-medium">
                          {row.companyProfile?.companyName || row.fullName || "—"}
                        </td>
                        <td className="py-4 px-6 text-gray-600">{row.email}</td>
                        <td className="py-4 px-6 text-gray-600">{createdAt}</td>
                        <td className="py-4 px-6 text-gray-600">
                          {row.companyProfile?.industry || "—"}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className="px-4 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: bg, color }}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => setSelectedUser(row)}
                            className="bg-[#EAEAEA] text-[#4B5563] px-6 py-1.5 rounded text-xs font-bold hover:bg-gray-300 transition"
                          >
                            View
                          </button>
                        </td>

                        {/* ── Action Cell ── */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center items-center gap-2">
                            {/* Mail Button — সব user-এর জন্য */}
                            <button
                              onClick={() => setMailTarget(row)}
                              title="Send Mail"
                              className="bg-[#EEF4FF] text-[#3B82F6] px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-500 hover:text-white transition"
                            >
                              ✉ Mail
                            </button>

                            {/* Approve / Decline — শুধু PENDING */}
                            {row.status === "PENDING" ? (
                              <>
                                <button
                                  onClick={(e) => handleApprove(row.id, e)}
                                  disabled={isApproving || isRejecting}
                                  className="bg-[#E7F8EE] text-[#00B074] px-4 py-1.5 rounded text-xs font-bold hover:bg-green-600 hover:text-white transition shadow-sm disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={(e) => handleDecline(row.id, e)}
                                  disabled={isApproving || isRejecting}
                                  className="bg-[#FFEEEE] text-[#FF5B5B] px-4 py-1.5 rounded text-xs font-bold hover:bg-red-500 hover:text-white transition shadow-sm disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Completed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pagination Footer ── */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white flex-wrap gap-3">
          <span className="text-xs text-gray-400">
            {total > 0
              ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, total)} of ${total}`
              : "No results"}
          </span>
          <div className="flex items-center gap-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-6 py-2 bg-[#E7F8EE] text-gray-600 text-sm font-medium rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ← Previous
            </button>
            <div className="flex gap-4 text-sm font-medium text-gray-500">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={
                    currentPage === number
                      ? "text-[#43B948] font-bold"
                      : "text-gray-500 hover:text-gray-700"
                  }
                >
                  {number < 10 ? `0${number}` : number}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-6 py-2 bg-[#43B948] text-white text-sm font-medium rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              Next Page →
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default CompanyApprovals;