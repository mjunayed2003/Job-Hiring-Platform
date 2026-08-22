"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { ArrowLeft, ArrowDownToLine, TrendingUp, Clock } from "lucide-react";
import WithdrawModal from "./WithdrawModal";

interface Transaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  note: string;
  createdAt: string;
}

interface WithdrawRequest {
  id: string;
  amount: number;
  accountHolderName: string;
  bankName: string;
  branch: string;
  accountType: string;
  accountNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: string;
}

interface WalletData {
  balance: number;
  currency: string;
  recentHistory: Transaction[];
}

const STATUS_STYLE = {
  PENDING:  { label: "Pending",  cls: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  APPROVED: { label: "Approved", cls: "bg-green-50 text-green-600 border-green-200"   },
  REJECTED: { label: "Rejected", cls: "bg-red-50 text-red-500 border-red-200"         },
};

export default function WalletPage() {
  const router = useRouter();
  const { token } = useSelector((state: RootState) => state.auth);
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "withdrawals">("history");

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_BASE}/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setWallet(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/wallet/withdraw-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setRequests(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchWallet(), fetchRequests()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      "  " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 py-5">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Wallet</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#3FAE2A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Balance Card */}
          <div className="bg-[#19252F] rounded-2xl p-6 flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Main balance</p>
              <p className="text-[#3FAE2A] text-3xl font-bold">
                {wallet?.currency}{" "}
                {wallet?.balance.toLocaleString() ?? "0"}
              </p>
            </div>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 bg-[#3FAE2A]/20 border-2 border-[#3FAE2A] rounded-xl flex items-center justify-center">
                <ArrowDownToLine size={22} className="text-[#3FAE2A]" />
              </div>
              <span className="text-xs text-gray-400">Withdraw</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "history"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Transaction History
            </button>
            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "withdrawals"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Withdraw Requests
            </button>
          </div>

          {/* Transaction History Tab */}
          {activeTab === "history" && (
            <div>
              {wallet?.recentHistory.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
                  <Clock size={40} className="text-gray-200" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                <div>
                  {wallet?.recentHistory.map((t, i) => (
                    <div key={t.id}>
                      <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              t.type === "CREDIT" ? "bg-green-50" : "bg-red-50"
                            }`}
                          >
                            <TrendingUp
                              size={18}
                              className={
                                t.type === "CREDIT"
                                  ? "text-green-500"
                                  : "text-red-500 rotate-180"
                              }
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {t.type === "CREDIT" ? "Salary Received" : "Withdraw"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(t.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-semibold text-sm ${
                            t.type === "CREDIT" ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {t.type === "CREDIT" ? "+" : "-"}
                          {wallet.currency} {t.amount.toLocaleString()}
                        </span>
                      </div>
                      {i < (wallet?.recentHistory.length ?? 0) - 1 && (
                        <div className="h-[1px] bg-gray-100" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Withdraw Requests Tab */}
          {activeTab === "withdrawals" && (
            <div>
              {requests.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
                  <Clock size={40} className="text-gray-200" />
                  <p className="text-sm">No withdraw requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((r) => {
                    const s = STATUS_STYLE[r.status];
                    return (
                      <div
                        key={r.id}
                        className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-base font-bold text-gray-800">
                            {wallet?.currency} {r.amount.toLocaleString()}
                          </p>
                          <span
                            className={`text-xs font-medium px-3 py-1 rounded-full border ${s.cls}`}
                          >
                            {s.label}
                          </span>
                        </div>
                        {r.status === "PENDING" && (
                          <p className="mb-2 text-xs font-medium text-gray-500">
                            Waiting for admin approval
                          </p>
                        )}
                        <div className="space-y-1 text-xs text-gray-500">
                          <p>
                            <span className="text-gray-400">Bank:</span>{" "}
                            <span className="text-gray-700">{r.bankName}</span>
                          </p>
                          <p>
                            <span className="text-gray-400">Branch:</span>{" "}
                            <span className="text-gray-700">{r.branch}</span>
                          </p>
                          <p>
                            <span className="text-gray-400">Account:</span>{" "}
                            <span className="text-gray-700">
                              {r.accountNumber} ({r.accountType})
                            </span>
                          </p>
                          <p>
                            <span className="text-gray-400">Holder:</span>{" "}
                            <span className="text-gray-700">{r.accountHolderName}</span>
                          </p>
                          <p className="text-gray-400">{formatDate(r.createdAt)}</p>
                        </div>
                        {r.adminNote && (
                          <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                            <span className="font-medium">Admin note:</span> {r.adminNote}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <WithdrawModal
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => {
            setShowWithdraw(false);
            fetchWallet();
            fetchRequests();
          }}
          currency={wallet?.currency ?? "JMD"}
          balance={wallet?.balance ?? 0}
        />
      )}
    </div>
  );
}
