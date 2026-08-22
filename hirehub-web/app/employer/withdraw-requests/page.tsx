"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Clock,
  HandCoins,
  Loader2,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { RootState } from "@/redux/store";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
type TabKey = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

interface WithdrawRequest {
  id: string;
  amount: number;
  status: RequestStatus;
  createdAt: string;
  job?: {
    id: string;
    title: string;
    location?: string | null;
    salaryType?: string | null;
    salaryFrequency?: string | null;
    salaryAmount?: string | null;
  } | null;
  jobSeeker?: {
    id: string;
    fullName: string;
    profilePic?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  payment?: {
    paymentId: string;
    paidAt?: string | null;
    amount: number;
    platformFee: number;
    netAmount: number;
  } | null;
}

interface RequestsPayload {
  data?: WithdrawRequest[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const STATUS_STYLE: Record<RequestStatus, string> = {
  PENDING: "border-yellow-200 bg-yellow-50 text-yellow-700",
  APPROVED: "border-green-200 bg-green-50 text-green-700",
  REJECTED: "border-red-200 bg-red-50 text-red-600",
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export default function EmployerWithdrawRequestsPage() {
  const router = useRouter();
  const { token } = useSelector((state: RootState) => state.auth);
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/employer/wallet/withdraw-requests?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const payload: RequestsPayload | WithdrawRequest[] = json?.data ?? json;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      setRequests(list);
      setSelectedId((current) => current ?? list[0]?.id ?? null);
    } catch (error) {
      console.error("Failed to fetch employer withdraw requests", error);
      alert("Failed to load withdraw requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, [token]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (activeTab === "ALL") return true;
      return request.status === activeTab;
    });
  }, [activeTab, requests]);

  const selectedRequest =
    filteredRequests.find((request) => request.id === selectedId) ??
    filteredRequests[0] ??
    null;

  const totalPendingPayout = requests
    .filter((request) => request.status === "PENDING")
    .reduce((sum, request) => sum + Number(request.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-10">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-[#3FAE2A] hover:text-[#3FAE2A]"
            aria-label="Go back"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-950">Withdrawal Requests</h1>
            <p className="text-sm text-gray-500">Admin now handles withdrawal approval directly</p>
          </div>
        </div>

        <div className="overflow-hidden border border-gray-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Withdrawal Requests</h2>
              <p className="text-xs text-gray-500">This view is read-only now. Admin approval happens in the admin panel.</p>
            </div>
            <div className="w-fit rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
              Total pending payout{" "}
              <span className="ml-1 font-bold text-yellow-800">
                JMD {totalPendingPayout.toLocaleString()}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center text-[#3FAE2A]">
              <Loader2 className="animate-spin" size={30} />
            </div>
          ) : (
            <div className="grid min-h-[620px] grid-cols-1 md:grid-cols-[420px_1fr]">
              <aside className="border-b border-gray-200 md:border-b-0 md:border-r">
                <div className="grid grid-cols-4 gap-1 border-b border-gray-100 p-3">
                  {TABS.map((tab) => {
                    const count = countByTab(requests, tab.key);
                    return (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setSelectedId(null);
                        }}
                        className={`rounded-md px-2 py-2 text-xs font-medium transition ${
                          activeTab === tab.key
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {tab.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {filteredRequests.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
                    <Clock size={36} className="text-gray-300" />
                    <p className="text-sm">No requests found</p>
                  </div>
                ) : (
                  <div>
                    {filteredRequests.map((request) => (
                      <button
                        key={request.id}
                        onClick={() => setSelectedId(request.id)}
                        className={`w-full border-b border-gray-100 px-4 py-4 text-left transition hover:bg-blue-50/50 ${
                          selectedRequest?.id === request.id
                            ? "border-l-2 border-l-blue-500 bg-blue-50"
                            : "border-l-2 border-l-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AvatarName name={request.jobSeeker?.fullName || "JS"} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {request.jobSeeker?.fullName || "Unknown jobseeker"}
                              </p>
                              <StatusBadge request={request} />
                            </div>
                            <p className="mt-1 truncate text-xs text-gray-500">
                              {request.job?.title || "Job details unavailable"}
                            </p>
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className="text-gray-400">{formatDate(request.createdAt)}</span>
                              <span className="font-bold text-[#00A651]">
                                JMD {Number(request.amount || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </aside>

              <main className="p-5 md:p-8">
                {selectedRequest ? (
                  <RequestDetails request={selectedRequest} />
                ) : (
                  <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 text-gray-400">
                    <HandCoins size={42} className="text-gray-300" />
                    <p className="text-sm">Select a request to view details</p>
                  </div>
                )}
              </main>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestDetails({
  request,
}: {
  request: WithdrawRequest;
}) {
  return (
    <div className="max-w-xl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-400">{request.id.slice(0, 8)}...</p>
          <h3 className="text-xl font-bold text-gray-950">
            {request.jobSeeker?.fullName || "Unknown jobseeker"}
          </h3>
          <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
        </div>
        <StatusBadge request={request} />
      </div>

      <InfoCard title="Jobseeker Info">
        <InfoRow icon={<Mail size={15} />} label="Email" value={request.jobSeeker?.email || "N/A"} />
        <InfoRow icon={<Phone size={15} />} label="Phone" value={request.jobSeeker?.phone || "N/A"} />
        <InfoRow icon={<UserRound size={15} />} label="Name" value={request.jobSeeker?.fullName || "N/A"} />
      </InfoCard>

      <InfoCard title="Job Details">
        <InfoRow icon={<BriefcaseBusiness size={15} />} label="Job Title" value={request.job?.title || "N/A"} />
        <InfoRow label="Location" value={request.job?.location || "N/A"} />
        <InfoRow label="Salary" value={formatSalary(request.job)} />
      </InfoCard>

      <InfoCard title="Withdraw Amount">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">To transfer</span>
          <span className="text-2xl font-bold text-[#00A651]">
            JMD {Number(request.amount || 0).toLocaleString()}
          </span>
        </div>
      </InfoCard>

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700">
        Admin approval is handled separately. No employer action is required.
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4">
      <p className="mb-4 text-xs font-medium uppercase text-gray-400">{title}</p>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[150px_1fr] sm:gap-3">
      <span className="flex items-center gap-2 text-gray-500">
        {icon}
        {label}
      </span>
      <span className="font-medium text-gray-900 sm:text-right">{value}</span>
    </div>
  );
}

function AvatarName({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
      {initials || "JS"}
    </div>
  );
}

function StatusBadge({ request }: { request: WithdrawRequest }) {
  const label = titleCase(request.status);
  const cls = STATUS_STYLE[request.status];

  return (
    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function countByTab(requests: WithdrawRequest[], tab: TabKey) {
  if (tab === "ALL") return requests.length;
  return requests.filter((request) => request.status === tab).length;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSalary(job?: WithdrawRequest["job"]) {
  if (!job) return "N/A";
  const parts = [job.salaryAmount, job.salaryFrequency, job.salaryType].filter(Boolean);
  return parts.length ? parts.join(" / ") : "N/A";
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
