// src/pages/admin/payments/PaymentsEscrow.tsx

import { useState } from "react";
import { FiSearch, FiEye, FiX, FiAlertTriangle } from "react-icons/fi";
import { HiOutlineBriefcase, HiOutlineCreditCard } from "react-icons/hi";
import {
  useGetAllPaymentsQuery,
  useMarkAsFailedMutation,
} from "../../../redux/features/PaymentApi/PaymentApi";
import ProfilePic from "../../../assets/images/profile.png";

const BASE_URL = import.meta.env.VITE_SERVER_URL?.replace(/\/$/, "") || "";

const FALLBACK_AVATAR = ProfilePic;

const avatar = (pic?: string | null) =>
  pic ? `${BASE_URL}${pic}` : FALLBACK_AVATAR;

// ── Status Badge ──────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    FAILED: "bg-red-50 text-red-600 border border-red-200",
    REFUNDED: "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

// ── Type Badge ────────────────────────────────────────────────
const TypeBadge = ({ type }: { type: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
    ${type === "JOB_PAYMENT"
      ? "bg-purple-50 text-purple-700 border border-purple-200"
      : "bg-sky-50 text-sky-700 border border-sky-200"
    }`}>
    {type === "JOB_PAYMENT"
      ? <><HiOutlineBriefcase size={12} /> Job Payment</>
      : <><HiOutlineCreditCard size={12} /> Subscription</>
    }
  </span>
);

// ── Details Modal ─────────────────────────────────────────────
const DetailsModal = ({ payment, onClose }: { payment: any; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      {/* Modal Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <TypeBadge type={payment.type} />
          <StatusBadge status={payment.status} />
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
          <FiX size={18} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Amount */}
        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
            <p className="text-2xl font-bold text-gray-800">
              {payment.currency} {Number(payment.totalAmount).toLocaleString()}
            </p>
            {payment.platformFee && (
              <p className="text-xs text-gray-400 mt-0.5">
                Platform fee: {payment.currency} {Number(payment.platformFee).toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">Order ID</p>
            <p className="text-xs font-mono text-gray-600 break-all">{payment.orderId}</p>
          </div>
        </div>

        {/* Paid By */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Paid By</p>
          <div className="flex items-center gap-3">
            <img
              src={avatar(payment.paidBy?.profilePic)}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
              onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }}
            />
            <div>
              <p className="font-semibold text-gray-800 text-sm">{payment.paidBy?.name}</p>
              <p className="text-xs text-gray-500">{payment.paidBy?.email}</p>
              <p className="text-xs text-gray-400">
                Registered: {payment.paidBy?.registrationDate
                  ? new Date(payment.paidBy.registrationDate).toLocaleDateString("en-GB")
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* JOB PAYMENT — Candidate & Job */}
        {payment.type === "JOB_PAYMENT" && payment.candidate && (
          <>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Hired Candidate</p>
              <div className="flex items-center gap-3">
                <img
                  src={avatar(payment.candidate?.profilePic)}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }}
                />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{payment.candidate?.name}</p>
                  <p className="text-xs text-gray-500">{payment.candidate?.email}</p>
                  <p className="text-xs text-gray-400">
                    Registered: {payment.candidate?.registrationDate
                      ? new Date(payment.candidate.registrationDate).toLocaleDateString("en-GB")
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Educations */}
              {payment.candidate?.educations?.length > 0 && (
                <div className="mt-3 space-y-1.5 pl-13">
                  {payment.candidate.educations.map((edu: any, i: number) => (
                    <div key={i} className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-purple-800">{edu.degree}</p>
                      <p className="text-xs text-purple-600">{edu.institution}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {payment.forJob && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Job Details</p>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-purple-900 text-sm">{payment.forJob.title}</p>
                      <p className="text-xs text-purple-600">{payment.forJob.location}</p>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {payment.forJob.interviewStatus}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-purple-600 pt-1 border-t border-purple-100">
                    <span>📹 {payment.forJob.interviewType}</span>
                    <span>📅 {payment.forJob.interviewDate
                      ? new Date(payment.forJob.interviewDate).toLocaleDateString("en-GB")
                      : "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* SUBSCRIPTION — Plan Details */}
        {payment.type === "SUBSCRIPTION" && payment.subscription && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subscription Plan</p>
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-bold text-sky-900">{payment.subscription.planName}</p>
                <p className="text-sm font-semibold text-sky-700">
                  {payment.currency} {Number(payment.subscription.price).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-4 text-xs text-sky-600">
                <span>⏱ {payment.subscription.duration} days</span>
                <span>🎯 {payment.subscription.slots} slots</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-sky-100">
                {payment.subscription.features?.map((f: string, i: number) => (
                  <span key={i} className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 border-t border-gray-100 pt-4">
          <div>
            <p className="font-medium text-gray-400 mb-0.5">Created</p>
            <p>{new Date(payment.createdAt).toLocaleString("en-GB")}</p>
          </div>
          {payment.paidAt && (
            <div>
              <p className="font-medium text-gray-400 mb-0.5">Paid At</p>
              <p>{new Date(payment.paidAt).toLocaleString("en-GB")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────
const PaymentsEscrow = () => {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "JOB_PAYMENT" | "SUBSCRIPTION">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [failConfirm, setFailConfirm] = useState<string | null>(null);
  const limit = 10;

  const { data, isLoading, isFetching } = useGetAllPaymentsQuery({
    search: search || undefined,
    type: typeFilter || undefined,
    page: currentPage,
    limit,
  });

  const [markAsFailed, { isLoading: isFailing }] = useMarkAsFailedMutation();

  const allPayments: any[] = data?.data ?? [];
  const payments = allPayments;

  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleFail = async (id: string) => {
    const payment = payments.find((p) => p.id === id);
    const type = payment?.type === "SUBSCRIPTION" ? "subscription" : "job";
    try {
      await markAsFailed({ id, type }).unwrap();
      setFailConfirm(null);
    } catch (err) {
      console.error("Failed to mark as failed:", err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full min-h-[700px] flex flex-col p-6 gap-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Payments & Escrow</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {data?.meta?.jobPaymentsCount ?? 0} job payments · {data?.meta?.subscriptionPaymentsCount ?? 0} subscriptions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <FiSearch size={14} className="text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search name or email..."
              className="bg-transparent text-sm outline-none w-48 text-gray-700 placeholder:text-gray-400"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(""); setSearch(""); setCurrentPage(1); }}>
                <FiX size={13} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(["", "JOB_PAYMENT", "SUBSCRIPTION"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${typeFilter === t
                    ? "bg-white shadow-sm text-gray-800"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {t === "" ? "All" : t === "JOB_PAYMENT" ? "Job Payment" : "Subscription"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="text-gray-400 text-xs border-b border-gray-100">
            <tr>
              <th className="py-3 px-4 font-medium">Paid By</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Reg. Date</th>
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 font-medium">Amount</th>
              <th className="py-3 px-4 font-medium text-center">Status</th>
              <th className="py-3 px-4 font-medium text-center">Details</th>
              <th className="py-3 px-4 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
            {isLoading || isFetching ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="py-4 px-4">
                      <div className="h-4 bg-gray-100 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-400 text-sm">
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/60 transition">
                  {/* Paid By */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={avatar(row.paidBy?.profilePic)}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                        onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }}
                      />
                      <span className="font-medium text-gray-800 text-sm">{row.paidBy?.name}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{row.paidBy?.email}</td>

                  {/* Reg Date */}
                  <td className="py-3.5 px-4 text-gray-500 text-xs">
                    {row.paidBy?.registrationDate
                      ? new Date(row.paidBy.registrationDate).toLocaleDateString("en-GB")
                      : "—"}
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-4">
                    <TypeBadge type={row.type} />
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 font-semibold text-gray-700 text-sm">
                    {row.currency} {Number(row.totalAmount).toLocaleString()}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={row.status} />
                  </td>

                  {/* View */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedPayment(row)}
                      className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-full text-xs font-semibold transition"
                    >
                      <FiEye size={12} /> View
                    </button>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-center">
                    {row.status === "PENDING" ? (
                      <button
                        onClick={() => setFailConfirm(row.id)}
                        className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-1.5 rounded-full text-xs font-semibold transition"
                      >
                        <FiAlertTriangle size={11} /> Fail
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed"
                      >
                        {row.status === "PAID" ? "Paid" : row.status}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-5 py-2 bg-[#E7F8EE] text-gray-600 text-sm font-medium rounded-lg hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>

          <div className="flex gap-3 text-sm font-medium">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`w-8 h-8 rounded-lg transition ${currentPage === n
                    ? "bg-[#43B948] text-white font-bold shadow-sm"
                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {n < 10 ? `0${n}` : n}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-5 py-2 bg-[#43B948] text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            Next Page →
          </button>
        </div>
      )}

      {/* ── Details Modal ── */}
      {selectedPayment && (
        <DetailsModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}

      {/* ── Fail Confirm Modal ── */}
      {failConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle size={28} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-2">Mark as Failed?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently mark the payment as failed. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setFailConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFail(failConfirm)}
                disabled={isFailing}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60"
              >
                {isFailing ? "Processing..." : "Confirm Fail"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsEscrow;