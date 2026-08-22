"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  currency: string;
  balance: number;
}

export default function WithdrawModal({ onClose, onSuccess, currency, balance }: Props) {
  const { token } = useSelector((state: RootState) => state.auth);
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  const [form, setForm] = useState({
    amount: "",
    accountHolderName: "",
    bankName: "",
    branch: "",
    accountType: "Savings",
    accountNumber: "",
    confirmAccountNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!form.amount || !form.accountHolderName || !form.bankName || !form.branch || !form.accountNumber) {
      setError("Please fill in all fields");
      return;
    }
    if (form.accountNumber !== form.confirmAccountNumber) {
      setError("Account numbers do not match");
      return;
    }
    if (Number(form.amount) > balance) {
      setError(`Insufficient balance. Available: ${currency} ${balance.toLocaleString()}`);
      return;
    }
    if (Number(form.amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(form.amount),
          accountHolderName: form.accountHolderName,
          bankName: form.bankName,
          branch: form.branch,
          accountType: form.accountType,
          accountNumber: form.accountNumber,
        }),
      });
      const json = await res.json();
      if (json.success !== false && res.ok) {
        onSuccess();
      } else {
        setError(json.message || "Something went wrong");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">Withdraw</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Balance info */}
        <div className="bg-[#f0fdf4] border border-[#3FAE2A]/30 rounded-xl p-3 mb-5 text-sm text-gray-600">
          Available balance:{" "}
          <span className="font-bold text-[#3FAE2A]">
            {currency} {balance.toLocaleString()}
          </span>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Withdraw Amount
            </label>
            <input
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              placeholder={`Enter amount in ${currency}`}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3FAE2A] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Account Holder Name
            </label>
            <input
              name="accountHolderName"
              value={form.accountHolderName}
              onChange={handleChange}
              placeholder="Enter account holder name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3FAE2A] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Bank Name
            </label>
            <input
              name="bankName"
              value={form.bankName}
              onChange={handleChange}
              placeholder="Enter bank name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3FAE2A] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Branch
            </label>
            <input
              name="branch"
              value={form.branch}
              onChange={handleChange}
              placeholder="Enter branch name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3FAE2A] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Account Type
            </label>
            <select
              name="accountType"
              value={form.accountType}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3FAE2A] bg-gray-50"
            >
              <option value="Savings">Savings</option>
              <option value="Chequing">Chequing</option>
              <option value="Business">Business</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Account Number
            </label>
            <input
              name="accountNumber"
              value={form.accountNumber}
              onChange={handleChange}
              placeholder="Enter account number"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3FAE2A] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Confirm Account Number
            </label>
            <input
              name="confirmAccountNumber"
              value={form.confirmAccountNumber}
              onChange={handleChange}
              placeholder="Re-enter account number"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3FAE2A] bg-gray-50"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#3FAE2A] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#35a020] transition disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
