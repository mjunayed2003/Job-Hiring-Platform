import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────
type FilterType = "ALL" | "EMPLOYER_JOBSEEKER" | "COMPANY_JOBSEEKER";

interface UserProfile {
  fullName: string;
  profilePic: string | null;
  companyName?: string;
}

interface ParticipantUser {
  id: string;
  role: "ADMIN" | "JOB_SEEKER" | "EMPLOYER" | "COMPANY";
  status: "PENDING" | "ACTIVE" | "BLOCKED" | "REJECTED";
  onlineAt: string | null;
  lastSeenAt: string | null;
  jobSeekerProfile: UserProfile | null;
  employerProfile: UserProfile | null;
}

interface Participant {
  id: string;
  userId: string;
  conversationId: string;
  user: ParticipantUser;
}

interface LastMessage {
  id: string;
  content: string | null;
  createdAt: string;
  senderId: string;
}

interface Conversation {
  id: string;
  updatedAt: string;
  participants: Participant[];
  messages: LastMessage[];
}

interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  attachmentUrl: string | null;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender: ParticipantUser;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// ─── Config ───────────────────────────────────────────────
const API_BASE = `${import.meta.env.VITE_SERVER_URL}/admin/messages`;
const getToken = () => localStorage.getItem("token") ?? "";

const authFetch = (url: string, options: RequestInit = {}) =>
  fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  });

// ─── Helpers ─────────────────────────────────────────────
function getDisplayName(user: ParticipantUser): string {
  if (user.role === "JOB_SEEKER") return user.jobSeekerProfile?.fullName ?? "Job Seeker";
  if (user.role === "EMPLOYER") return user.employerProfile?.fullName ?? "Employer";
  if (user.role === "COMPANY") return user.employerProfile?.companyName ?? user.employerProfile?.fullName ?? "Company";
  return "Unknown";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getConvParticipants(conv: Conversation): { seeker: Participant | null; employer: Participant | null } {
  const seeker = conv.participants.find((p) => p.user.role === "JOB_SEEKER") ?? null;
  const employer = conv.participants.find((p) => p.user.role === "EMPLOYER" || p.user.role === "COMPANY") ?? null;
  return { seeker, employer };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatLastSeen(iso: string | null): string {
  if (!iso) return "Online";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────
const Avatar = ({ initials, color = "dark", size = "md" }: { initials: string; color?: "dark" | "green"; size?: "sm" | "md" }) => {
  const s = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  const c = color === "green" ? "bg-[#00B074] text-white" : "bg-gray-800 text-white";
  return (
    <div className={`${s} ${c} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
};

const StackedAvatars = ({ a, b }: { a: string; b: string }) => (
  <div className="relative w-10 h-9 flex-shrink-0">
    <div className="absolute top-0 left-0 w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center text-[10px] font-semibold text-gray-700 border-2 border-white z-10">
      {a}
    </div>
    <div className="absolute bottom-0 right-0 w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center text-[10px] font-semibold text-white border-2 border-white">
      {b}
    </div>
  </div>
);

const Spinner = ({ small = false }: { small?: boolean }) => (
  <div className={`${small ? "w-4 h-4" : "w-8 h-8"} border-2 border-gray-200 border-t-[#00B074] rounded-full animate-spin`} />
);

// ─── Filter labels ────────────────────────────────────────
const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All Conversations", value: "ALL" },
  { label: "Employer & Job Seeker", value: "EMPLOYER_JOBSEEKER" },
  { label: "Company & Job Seeker", value: "COMPANY_JOBSEEKER" },
];

// ─── Main Component ───────────────────────────────────────
export default function AdminMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [totalConvs, setTotalConvs] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load conversations ──
  const loadConversations = useCallback(async (f: FilterType = filter) => {
    setLoadingConvs(true);
    try {
      const res = await authFetch(`${API_BASE}/conversations?filter=${f}&limit=50`);
      if (!res.ok) throw new Error("Failed to load conversations");
      const data: PaginatedResponse<Conversation> = await res.json();
      setConversations(data.data);
      setTotalConvs(data.meta.total);
      if (data.data.length > 0 && !selected) {
        setSelected(data.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConvs(false);
    }
  }, [filter]);

  // ── Load messages ──
  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const res = await authFetch(`${API_BASE}/conversations/${conversationId}/messages?limit=100`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data: PaginatedResponse<ApiMessage> = await res.json();
      setMessages(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (selected) loadMessages(selected.id);
  }, [selected?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selected && conversations.length) {
      const refreshed = conversations.find((c) => c.id === selected.id);
      if (refreshed) setSelected(refreshed);
    }
  }, [conversations]);

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setSelected(null);
    setMessages([]);
    setDropdownOpen(false);
    loadConversations(f);
  };

  // ── Derived state ──
  const filterLabel = FILTERS.find((f) => f.value === filter)?.label ?? "All";

  const { seeker: selSeeker, employer: selEmployer } = selected
    ? getConvParticipants(selected)
    : { seeker: null, employer: null };

  const seekerName = selSeeker ? getDisplayName(selSeeker.user) : "—";
  const employerName = selEmployer ? getDisplayName(selEmployer.user) : "—";
  const seekerInitials = getInitials(seekerName);
  const employerInitials = getInitials(employerName);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">

      {/* ── Page Header ── */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Messages</h1>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
          >
            {filterLabel}
            <svg
              className={`w-4 h-4 text-[#00B074] transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="currentColor" viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-52 py-1">
              {FILTERS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFilterChange(opt.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${filter === opt.value ? "text-[#00B074] font-medium" : "text-gray-700"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Conversations</span>
              <span className="bg-[#00B074] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">LIVE</span>
              {!loadingConvs && (
                <span className="text-[10px] font-semibold text-gray-500">{totalConvs} TOTAL</span>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loadingConvs ? (
              <div className="flex items-center justify-center h-32">
                <Spinner />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-xs text-gray-400">No conversations found</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const { seeker, employer } = getConvParticipants(conv);
                const sName = seeker ? getDisplayName(seeker.user) : "—";
                const eName = employer ? getDisplayName(employer.user) : "—";
                const sInit = getInitials(sName);
                const eInit = getInitials(eName);
                const lastMsg = conv.messages[0];
                const lastSeen = seeker?.user.lastSeenAt ?? employer?.user.lastSeenAt ?? null;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelected(conv)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition border-l-2 ${
                      selected?.id === conv.id
                        ? "bg-gray-50 border-l-[#00B074]"
                        : "border-l-transparent hover:bg-gray-50"
                    }`}
                  >
                    <StackedAvatars a={sInit} b={eInit} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                          {sName}
                        </p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatLastSeen(lastSeen)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{eName}</p>
                      {lastMsg?.content && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{lastMsg.content}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Chat Area ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-4 flex-shrink-0">
                <StackedAvatars a={seekerInitials} b={employerInitials} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-gray-900 leading-tight truncate">
                    {seekerName} & {employerName}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full inline-block bg-[#00B074]" />
                    <p className="text-xs text-gray-500">
                      {selEmployer?.user.role === "COMPANY" ? "Company" : "Employer"} · Job Seeker Conversation
                    </p>
                  </div>
                </div>

                {/* Participant pills */}
                <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                  {selSeeker && (
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${selSeeker.user.onlineAt ? "bg-[#00B074]" : "bg-gray-300"}`} />
                      <span className="text-xs text-gray-600">{seekerName}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">JS</span>
                    </div>
                  )}
                  {selEmployer && (
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${selEmployer.user.onlineAt ? "bg-[#00B074]" : "bg-gray-300"}`} />
                      <span className="text-xs text-gray-600">{employerName}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {selEmployer.user.role === "COMPANY" ? "CO" : "EM"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-32">
                    <Spinner />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-xs text-gray-400">No messages yet</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                        Conversation started {new Date(selected.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    {messages.map((msg) => {
                      const isSeeker = msg.sender.role === "JOB_SEEKER";
                      const senderName = getDisplayName(msg.sender);
                      const initials = getInitials(senderName);

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-3 ${isSeeker ? "flex-row" : "flex-row-reverse"}`}
                        >
                          <Avatar initials={initials} size="md" color={isSeeker ? "dark" : "green"} />
                          <div className={`max-w-[55%] flex flex-col gap-1 ${isSeeker ? "items-start" : "items-end"}`}>
                            <span className={`text-[10px] font-semibold text-gray-400 tracking-wider ${isSeeker ? "text-left" : "text-right"}`}>
                              {senderName.toUpperCase()} · {formatTime(msg.createdAt)}
                            </span>
                            {msg.content && (
                              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                isSeeker
                                  ? "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                                  : "bg-[#00B074] text-white rounded-br-sm"
                              }`}>
                                {msg.content}
                              </div>
                            )}
                            {msg.attachmentUrl && (
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-xl text-xs text-gray-600 hover:bg-gray-200 transition"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                Attachment
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Read-only Footer */}
              <div className="px-6 py-4 bg-white border-t border-dashed border-gray-200 flex items-center justify-center gap-2 flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Admin View is Read-Only · Messages Cannot be Edited or Sent
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}