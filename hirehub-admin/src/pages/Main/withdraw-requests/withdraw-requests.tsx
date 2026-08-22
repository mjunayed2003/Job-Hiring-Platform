import { useState } from "react";
import {
  useGetWithdrawRequestsQuery,
  useProcessWithdrawRequestMutation,
  WithdrawRequest,
} from "../../../redux/features/walletApi/WalletApi";

const STATUS_STYLES = {
  PENDING:  "bg-amber-50 text-amber-700 border border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border border-green-200",
  REJECTED: "bg-red-50 text-red-600 border border-red-200",
};

const STATUS_LABELS = {
  PENDING:  "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-orange-100 text-orange-700",
];

const fmt = (n: number) =>
  "JMD " + n.toLocaleString("en-US");

const formatDate = (str: string) => {
  const d = new Date(str);
  return d.toLocaleDateString("en-US", {
    day: "2-digit", month: "short", year: "numeric",
  }) + "  " + d.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
};

export default function AdminWithdrawRequests() {
  const [filterStatus, setFilterStatus] = useState<"" | "PENDING" | "APPROVED" | "REJECTED">("");
  const [selected, setSelected] = useState<WithdrawRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const { data, isLoading, refetch } = useGetWithdrawRequestsQuery({
    status: filterStatus || undefined,
    page: 1,
    limit: 50,
  });

  const [processRequest] = useProcessWithdrawRequestMutation();

  const requests = data?.data ?? [];

  const counts = {
    all: data?.meta?.total ?? requests.length,
    pending:  requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
  };

  const totalPendingAmount = requests
    .filter((r) => r.status === "PENDING")
    .reduce((a, r) => a + r.amount, 0);

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!selected) return;
    if (!adminNote.trim()) {
      alert("Please enter an admin note");
      return;
    }
    if (status === "APPROVED" && !selected.employer) {
      const ok = window.confirm(
        "Employer details are missing for this request. Do you want to approve it anyway?"
      );
      if (!ok) return;
    }
    setActionLoading(status);
    try {
      await processRequest({
        id: selected.id,
        status,
        adminNote: adminNote.trim(),
      }).unwrap();

      setSuccessMsg(
        status === "APPROVED"
          ? selected.employer
            ? "✓ Request approved successfully"
            : "✓ Approved without employer confirmation"
          : "✗ Request rejected"
      );
      setAdminNote("");
      setSelected(null);
      refetch();

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      alert(err?.data?.message || "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Withdrawal Requests</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Review and process jobseeker payment requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          {successMsg && (
            <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
              successMsg.startsWith("✓")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}>
              {successMsg}
            </span>
          )}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <span className="text-xs text-amber-600">Total pending payout</span>
            <span className="text-sm font-semibold text-amber-700">
              {fmt(totalPendingAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left panel */}
        <div className="w-[420px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
          {/* Filter tabs */}
          <div className="flex gap-1 p-3 border-b border-gray-100">
            {(["", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setSelected(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition capitalize
                  ${filterStatus === s
                    ? s === "PENDING"
                      ? "bg-amber-50 text-amber-700"
                      : s === "APPROVED"
                      ? "bg-green-50 text-green-700"
                      : s === "REJECTED"
                      ? "bg-red-50 text-red-700"
                      : "bg-blue-50 text-blue-700"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {s === "" ? `All (${counts.all})` : `${STATUS_LABELS[s]} (${counts[s.toLowerCase() as keyof typeof counts]})`}
              </button>
            ))}
          </div>

          {/* Request list */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#3FAE2A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No requests found</p>
              </div>
            ) : (
              requests.map((req, i) => (
                <button
                  key={req.id}
                  onClick={() => { setSelected(req); setAdminNote(""); }}
                  className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition
                    ${selected?.id === req.id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {req.jobSeeker.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {req.jobSeeker.fullName}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[req.status]}`}>
                          {STATUS_LABELS[req.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {req.jobSeeker.email}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-gray-500">🏦 Bank Transfer</span>
                        <span className="text-sm font-semibold text-green-600">
                          {fmt(req.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 mt-2 pl-12">{formatDate(req.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right detail panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
              <p className="text-sm">Select a request to review</p>
            </div>
          ) : (
            <div className="max-w-lg">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-gray-400 font-mono">{selected.id.slice(0, 8)}...</p>
                  <h2 className="text-lg font-semibold text-gray-900 mt-0.5">
                    {selected.jobSeeker.fullName}
                  </h2>
                  <p className="text-sm text-gray-400">{formatDate(selected.createdAt)}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[selected.status]}`}>
                  {STATUS_LABELS[selected.status]}
                </span>
              </div>

              {/* Jobseeker info */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">
                  Jobseeker Info
                </p>
                <div className="space-y-2">
                  {[
                    ["Email",   selected.jobSeeker.email],
                    ["Phone",   selected.jobSeeker.phone ?? "—"],
                    ["Wallet Balance", fmt(selected.jobSeeker.walletBalance)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">{label}</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selected.payment && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">
                    Payment Context
                  </p>
                  <div className="space-y-2">
                    {[
                      ["Order ID", selected.payment.orderId],
                      ["Payment ID", selected.payment.paymentId],
                      ["Paid At", selected.payment.paidAt ? formatDate(selected.payment.paidAt) : "—"],
                      ["Gross Amount", fmt(selected.payment.amount)],
                      ["Platform Fee", fmt(selected.payment.platformFee)],
                      ["Net Amount", fmt(selected.payment.netAmount)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-medium text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.payment?.job && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">
                    Job & Employer
                  </p>
                  <div className="space-y-2">
                    {[
                      ["Job Title", selected.payment.job.title],
                      ["Location", selected.payment.job.location ?? "—"],
                      ["Salary Type", selected.payment.job.salaryType ?? "—"],
                      ["Salary Frequency", selected.payment.job.salaryFrequency ?? "—"],
                      ["Salary Amount", selected.payment.job.salaryAmount ?? "—"],
                      ["Employer", selected.payment.employer?.fullName ?? "—"],
                      ["Employer Email", selected.payment.employer?.email ?? "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-medium text-gray-800 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.employer && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">
                    Employer Details
                  </p>
                  <div className="space-y-2">
                    {[
                      ["Name", selected.employer.fullName],
                      ["Company", selected.employer.companyName ?? "—"],
                      ["Email", selected.employer.email ?? "—"],
                      ["Phone", selected.employer.phone ?? "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-medium text-gray-800 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">
                  Withdraw Amount
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">To transfer</span>
                  <span className="font-bold text-green-600 text-xl">{fmt(selected.amount)}</span>
                </div>
              </div>

              {/* Bank details */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
                <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">
                  Bank Account Details
                </p>
                <div className="space-y-3">
                  {[
                    ["Account Holder", selected.accountHolderName],
                    ["Bank Name",      selected.bankName],
                    ["Branch",         selected.branch],
                    ["Account Type",   selected.accountType],
                    ["Account Number", selected.accountNumber],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="text-sm font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin note if already processed */}
              {selected.adminNote && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                  <p className="text-xs text-blue-500 font-medium mb-1">Admin Note</p>
                  <p className="text-sm text-blue-800">{selected.adminNote}</p>
                </div>
              )}

              {selected.status === "PENDING" && !selected.employer && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-amber-700 font-medium mb-1">
                    Employer details missing
                  </p>
                  <p className="text-sm text-amber-800">
                    You can still approve this request. The system will record that it was approved without employer details.
                  </p>
                </div>
              )}

              {/* Action */}
              {selected.status === "PENDING" ? (
                <div>
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Admin Note <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="e.g. Payment transferred via NCB on 04 Jun 2026"
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3FAE2A] bg-gray-50 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction("REJECTED")}
                      disabled={!!actionLoading}
                      className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition flex items-center justify-center gap-2"
                    >
                      {actionLoading === "REJECTED" ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction("APPROVED")}
                      disabled={!!actionLoading}
                      className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition flex items-center justify-center gap-2 ${
                        selected.employer
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-amber-600 hover:bg-amber-700"
                      }`}
                    >
                      {actionLoading === "APPROVED" ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {selected.employer ? "Approve & Transfer" : "Approve Anyway"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`rounded-xl p-4 text-sm text-center font-medium
                  ${selected.status === "APPROVED"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                  {selected.status === "APPROVED"
                    ? "✓ This request has been approved and payment transferred"
                    : "✗ This request has been rejected"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
