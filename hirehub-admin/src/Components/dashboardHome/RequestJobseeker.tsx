import { useState, useEffect } from "react";
import { useGetApprovalRequestsQuery } from "../../redux/features/dashboard/DashboardApi.js";
import { 
  useApproveUserMutation, 
  useRejectUserMutation,
  useSendMailMutation 
} from "../../redux/features/users/UsersApi.js";
import toast from "react-hot-toast";

// Map frontend labels to backend roles
const TYPE_MAP = {
  "All": "ALL",
  "Job Seeker": "JOB_SEEKER",
  "Employee": "EMPLOYER", // Adjust if your backend expects EMPLOYER for Employee
  "Company": "COMPANY"
};

// ─── Mail Modal Component ─────────────────────────────────────────
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
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Notice regarding your application"
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

// ─── Main Component ─────────────────────────────────────────────
export default function RegistrationApprovalRequests({ onView }) {
  const [filterLabel, setFilterLabel] = useState("All");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mailTarget, setMailTarget] = useState(null); // ← মেইলের জন্য স্টেট
  
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Single API call that reacts to state changes
  const { data: apiResponse, isLoading, refetch } = useGetApprovalRequestsQuery({ 
    type: TYPE_MAP[filterLabel], 
    limit, 
    page: currentPage 
  });

  // Extract data and meta from the modified baseApi response
  const currentTableData = apiResponse?.data?.data || apiResponse?.data || [];
  const meta = apiResponse?.data?.meta || apiResponse?.meta || { totalPages: 1, total: 0 };
  const totalPages = meta.totalPages || 1;

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterLabel]);

  const [approveUser] = useApproveUserMutation();
  const [rejectUser] = useRejectUserMutation();
  const [sendMail, { isLoading: isSending }] = useSendMailMutation(); // ← মেইল এপিআই

  const handleApprove = async (userId) => {
    try {
      await approveUser(userId).unwrap();
      toast.success("User approved!");
      refetch();
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleDecline = async (userId) => {
    try {
      await rejectUser(userId).unwrap();
      toast.success("User rejected!");
      refetch();
    } catch {
      toast.error("Failed to reject");
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

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

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

      <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#fff", borderRadius: 14, padding: "24px 28px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0", minHeight: 500, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingBottom: 16, borderBottom: "1.5px dashed #e5e7eb" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
            New Registration Approval Requests
          </h3>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDropdown((v) => !v)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, minWidth: 130, justifyContent: "space-between" }}
            >
              {filterLabel} <span style={{ fontSize: 10, color: "#6b7280" }}>▼</span>
            </button>
            {showDropdown && (
              <div style={{ position: "absolute", right: 0, top: 38, width: 150, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", zIndex: 99, padding: "6px 0" }}>
                {Object.keys(TYPE_MAP).map((type) => (
                  <button key={type} onClick={() => { setFilterLabel(type); setShowDropdown(false); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 16px", fontSize: 13, background: filterLabel === type ? "#f0fdf4" : "transparent", color: filterLabel === type ? "#16a34a" : "#374151", fontWeight: filterLabel === type ? 700 : 400, border: "none", cursor: "pointer" }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table Area */}
        <div style={{ flex: 1, overflowX: "auto" }}>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "#9ca3af", fontSize: 12 }}>
                  {["Name", "Email", "Registration Date", "Category", "Verification Status", "View Details", "Action"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", fontWeight: 500, textAlign: ["Action", "Verification Status", "View Details"].includes(h) ? "center" : "left", borderBottom: "1.5px dashed #e5e7eb", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTableData.length > 0 ? currentTableData.map((row, idx) => (
                  <tr key={row.userId || idx} style={{ borderBottom: "1px solid #f3f4f6" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 12px", fontWeight: 500, color: "#111827" }}>{row.fullName || "-"}</td>
                    <td style={{ padding: "14px 12px", color: "#6b7280" }}>{row.email}</td>
                    <td style={{ padding: "14px 12px", color: "#6b7280" }}>
                      {row.registrationDate ? new Date(row.registrationDate).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "14px 12px", color: "#6b7280" }}>{row.category || "-"}</td>
                    <td style={{ padding: "14px 12px", textAlign: "center" }}>
                      <span style={{
                        padding: "5px 18px", borderRadius: 999, fontSize: 12, fontWeight: 600, display: "inline-block",
                        background: row.verificationStatus === "PENDING" ? "#FFF4E3" : row.verificationStatus === "ACTIVE" ? "#E7F8EE" : "#FFEEEE",
                        color: row.verificationStatus === "PENDING" ? "#F39C12" : row.verificationStatus === "ACTIVE" ? "#00B074" : "#FF5B5B",
                      }}>
                        {row.verificationStatus}
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px", textAlign: "center" }}>
                      <button onClick={() => onView && onView(row)}
                        style={{ background: "#EAEAEA", color: "#4B5563", border: "none", borderRadius: 999, padding: "6px 22px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#d1d5db")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#EAEAEA")}
                      >
                        View
                      </button>
                    </td>
                    
                    {/* ── Action Cell ── */}
                    <td style={{ padding: "14px 12px", textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                        
                        {/* Mail Button */}
                        <button
                          onClick={() => setMailTarget(row)}
                          title="Send Mail"
                          style={{ background: "#EEF4FF", color: "#3B82F6", border: "none", borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#3B82F6"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#EEF4FF"; e.currentTarget.style.color = "#3B82F6"; }}
                        >
                          Mail
                        </button>

                        {row.verificationStatus === "PENDING" ? (
                          <>
                            <button onClick={() => handleApprove(row.userId)}
                              style={{ background: "#E7F8EE", color: "#00B074", border: "none", borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#00B074"; e.currentTarget.style.color = "#fff"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#E7F8EE"; e.currentTarget.style.color = "#00B074"; }}
                            >
                              Approve
                            </button>
                            <button onClick={() => handleDecline(row.userId)}
                              style={{ background: "#FFEEEE", color: "#FF5B5B", border: "none", borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#FF5B5B"; e.currentTarget.style.color = "#fff"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#FFEEEE"; e.currentTarget.style.color = "#FF5B5B"; }}
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>Action Taken</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                      No requests found for {filterLabel}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Server-Side Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: "1.5px dashed #e5e7eb" }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, meta.total)} of {meta.total} entries
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 6, background: currentPage === 1 ? "#f9fafb" : "#fff", color: currentPage === 1 ? "#d1d5db" : "#374151", fontSize: 13, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
              >
                Prev
              </button>
              
              {pageNumbers.map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  style={{ padding: "6px 12px", border: "1px solid", borderColor: currentPage === num ? "#16a34a" : "#e5e7eb", borderRadius: 6, background: currentPage === num ? "#16a34a" : "#fff", color: currentPage === num ? "#fff" : "#374151", fontSize: 13, fontWeight: currentPage === num ? 600 : 400, cursor: "pointer" }}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 6, background: currentPage === totalPages ? "#f9fafb" : "#fff", color: currentPage === totalPages ? "#d1d5db" : "#374151", fontSize: 13, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}