"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppSelector } from "@/redux/hooks";
import { messagesSocket } from "@/redux/services/messagesSocket";
import {
  useSearchMessageUsersQuery,
  useGetOrCreateConversationMutation,
  useUploadAttachmentMutation,
} from "@/redux/services/messagesApi";
import {
  Paperclip,
  SendHorizontal,
  MoreVertical,
  ArrowLeft,
  Loader2,
  Download,
  File,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  participants: Array<{
    userId: string;
    user: {
      id: string;
      role: string;
      onlineAt?: string | null;
      lastSeenAt?: string | null;
      jobSeekerProfile?: { fullName: string; profilePic: string | null };
      employerProfile?: { fullName: string; profilePic: string | null };
    };
  }>;
  messages: Array<any>;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    role: string;
    onlineAt?: string | null;
    lastSeenAt?: string | null;
    jobSeekerProfile?: { fullName: string; profilePic: string | null };
    employerProfile?: { fullName: string; profilePic: string | null };
  };
  createdAt: string;
  attachmentUrl?: string;
  isDeleted: boolean;
}

interface SearchUser {
  id: string;
  role?: string;
  isOnline?: boolean;
  onlineAt?: string | null;
  lastSeenAt?: string | null;
  fullName?: string;
  profilePic?: string | null;
  jobSeekerProfile?: { fullName: string; profilePic: string | null };
  employerProfile?: { fullName: string; profilePic: string | null };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getTokenFromCookie = (): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match ? match[1] : null;
};

const normalizeConversations = (payload: unknown): Conversation[] => {
  const isConversationArray = (v: unknown): v is Conversation[] =>
    Array.isArray(v) &&
    v.every((item) => !!item && typeof item === "object" && "id" in (item as object));

  if (isConversationArray(payload)) return payload;

  const stack: unknown[] = payload && typeof payload === "object" ? [payload] : [];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    const rec = cur as Record<string, unknown>;
    for (const key of ["data", "conversations", "items", "results"]) {
      const val = rec[key];
      if (isConversationArray(val)) return val;
      if (val && typeof val === "object") stack.push(val);
    }
  }
  return [];
};

const getMessageConversationId = (payload: any): string | null =>
  payload?.conversationId ||
  payload?.conversation?.id ||
  payload?.conversation?.conversationId ||
  null;

// ── Component ──────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reduxToken = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);

  // Cookie fallback — works even before redux-persist rehydrates
  const effectiveToken = reduxToken || getTokenFromCookie();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOpeningConversationRef = useRef(false);
  const failedTargetRef = useRef<string | null>(null);
  const selectedChatRef = useRef<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMsgPageLoading, setIsMsgPageLoading] = useState(false);
  const [msgPage, setMsgPage] = useState(1);
  const [msgHasMore, setMsgHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activeParticipantOverride, setActiveParticipantOverride] = useState<SearchUser | null>(null);
  const [warningCount, setWarningCount] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const targetUserId = searchParams.get("targetUserId");

  useEffect(() => {
    if (!blockedUntil) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = blockedUntil.getTime() - now.getTime();
      if (diff <= 0) {
        setBlockedUntil(null);
        setWarningCount(0);
        setRemainingTime("");
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setRemainingTime(`${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  const containsContactInfo = (text: string): boolean => {
    const phoneRegex = /(\+?[\d\s\-().]{7,15})/g;
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    return emailRegex.test(text) || phoneRegex.test(text);
  };

  const rawSearchTerm = userSearchTerm.trim();

  const { data: searchedUsersData, isFetching: isSearchingUsers } =
    useSearchMessageUsersQuery(debouncedSearchTerm.trim(), {
      skip: debouncedSearchTerm.trim().length === 0,
    });

  const [getOrCreateConversation] = useGetOrCreateConversationMutation();
  const [uploadAttachment] = useUploadAttachmentMutation();

  // ── Debounce search ───────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(userSearchTerm), 350);
    return () => window.clearTimeout(timer);
  }, [userSearchTerm]);

  // ── REST: initial conversations load ─────────────────────────────────────────
  useEffect(() => {
    if (!effectiveToken) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/messages/conversations`, {
          headers: { Authorization: `Bearer ${effectiveToken}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        const normalized = normalizeConversations(json?.response ?? json?.data ?? json);
        if (normalized.length > 0) setConversations(normalized);
      } catch (err) {
        console.error("REST conversations load failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [effectiveToken]);

  // ── REST: load messages for selected conversation ─────────────────────────────
  const loadMessagesRest = useCallback(
    async (conversationId: string, page = 1) => {
      if (!effectiveToken) return;
      setIsMsgPageLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/messages/conversation/${conversationId}?page=${page}&limit=10`,
          { headers: { Authorization: `Bearer ${effectiveToken}` }, cache: "no-store" }
        );
        if (!res.ok) return;
        const json = await res.json();
        const rawData = json?.response ?? json?.data ?? json;

        let msgs: Message[] = [];
        if (Array.isArray(rawData)) msgs = rawData;
        else if (Array.isArray(rawData?.data)) msgs = rawData.data;
        else if (Array.isArray(rawData?.messages)) msgs = rawData.messages;

        const hasMore =
          rawData?.pagination?.hasNextPage ?? rawData?.hasNextPage ?? false;
        setMsgHasMore(hasMore);
        setMsgPage(page);
        setMessages((prev) => (page === 1 ? msgs : [...msgs, ...prev]));
      } catch (err) {
        console.error("REST messages load failed:", err);
      } finally {
        setIsMsgPageLoading(false);
      }
    },
    [effectiveToken]
  );

  const markConversationAsRead = useCallback((conversationId: string) => {
    setUnreadByConversation((prev) => {
      if (!prev[conversationId]) return prev;
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  }, []);

  // ── Socket: single connect + all event listeners ──────────────────────────────
  useEffect(() => {
    if (!effectiveToken) return;

    messagesSocket.connect(effectiveToken);
    messagesSocket.getConversations();

    const offConnect = messagesSocket.onConnect(() => {
      messagesSocket.getConversations();
    });

    const offConversations = messagesSocket.onConversations((data) => {
      const normalized = normalizeConversations(data);
      setConversations(normalized);
      setUnreadByConversation((prev) => {
        const validIds = new Set(normalized.map((c) => c.id));
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([id, count]) => {
          if (validIds.has(id) && count > 0) next[id] = count;
        });
        return next;
      });
    });

    const offConversationsPage = messagesSocket.onConversationsPage((data) => {
      const normalized = normalizeConversations(data);
      if (normalized.length > 0) setConversations(normalized);
    });

    const offUnreadCount = messagesSocket.onUnreadCount((data) => {
      setUnreadCount(data.unreadCount);
    });

    const offConversationDeleted = messagesSocket.onConversationDeleted(
      ({ conversationId }) => {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        setUnreadByConversation((prev) => {
          if (!prev[conversationId]) return prev;
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
        if (selectedChatRef.current === conversationId) {
          setSelectedChat(null);
          setMessages([]);
          setActiveParticipantOverride(null);
        }
      }
    );

    const offNewMessage = messagesSocket.onNewMessage((newMsg) => {
      const conversationId = getMessageConversationId(newMsg);
      if (!conversationId) return;

      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === conversationId);
        if (index === -1) return prev;
        const matched = prev[index];
        return [
          {
            ...matched,
            updatedAt: newMsg?.createdAt || new Date().toISOString(),
            messages: [newMsg],
          },
          ...prev.filter((c) => c.id !== conversationId),
        ];
      });

      if (selectedChatRef.current === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        markConversationAsRead(conversationId);
        return;
      }

      if (newMsg?.senderId !== user?.id) {
        setUnreadByConversation((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }
    });

    const offError = messagesSocket.onError((error) => {
      console.error("Chat socket error:", error);
    });

    return () => {
      offConnect();
      offConversations();
      offConversationsPage();
      offUnreadCount();
      offConversationDeleted();
      offNewMessage();
      offError();
      messagesSocket.disconnect();
    };
  }, [effectiveToken, user?.id, markConversationAsRead]);

  // ── Socket: join conversation room + per-conversation listeners ───────────────
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    void loadMessagesRest(selectedChat, 1);
    messagesSocket.joinConversation(selectedChat);

    const offMessages = messagesSocket.onConversationMessages((data) => {
      let msgs: Message[] = [];
      if (Array.isArray(data)) msgs = data;
      else if (Array.isArray((data as any)?.data)) msgs = (data as any).data;
      else if (Array.isArray((data as any)?.messages)) msgs = (data as any).messages;
      if (msgs.length > 0) setMessages(msgs);
    });

    const offMessageDeleted = messagesSocket.onMessageDeleted(({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    return () => {
      offMessages();
      offMessageDeleted();
    };
  }, [selectedChat, loadMessagesRest]);

  // ── Keep selectedChat ref in sync ─────────────────────────────────────────────
  useEffect(() => {
    selectedChatRef.current = selectedChat;
    if (selectedChat) markConversationAsRead(selectedChat);
    else setActiveParticipantOverride(null);
  }, [selectedChat, markConversationAsRead]);

  // ── Reset per-conversation unread when global count drops to 0 ───────────────
  useEffect(() => {
    if (unreadCount === 0) setUnreadByConversation({});
  }, [unreadCount]);

  // ── Auto-open conversation from URL deep-link ─────────────────────────────────
  useEffect(() => {
    if (!effectiveToken || !user?.id || !targetUserId || targetUserId === user.id) return;

    const existing = conversations.find((conv) =>
      conv.participants.some((p) => p.userId === targetUserId || p.user?.id === targetUserId)
    );

    if (existing) {
      if (selectedChat !== existing.id) {
        setSelectedChat(existing.id);
        router.replace("/inbox", { scroll: false });
      }
      return;
    }

    if (isOpeningConversationRef.current || failedTargetRef.current === targetUserId) return;
    isOpeningConversationRef.current = true;

    const open = async () => {
      try {
        const response = await getOrCreateConversation({
          targetUserId,
          receiverId: targetUserId,
          participantId: targetUserId,
        }).unwrap();

        const conversationId =
          response?.id ||
          response?.conversationId ||
          response?.conversation?.id ||
          response?.data?.id ||
          response?.data?.conversationId ||
          response?.data?.conversation?.id;

        if (conversationId) {
          failedTargetRef.current = null;
          setSelectedChat(conversationId);
          router.replace("/inbox", { scroll: false });
        }
      } catch (error) {
        console.error("Failed to open conversation:", error);
        failedTargetRef.current = targetUserId;
      } finally {
        isOpeningConversationRef.current = false;
      }
    };

    void open();
  }, [effectiveToken, user?.id, targetUserId, conversations, selectedChat, getOrCreateConversation, router]);

  // ── Fallback: pick matching conversation once list is populated ───────────────
  useEffect(() => {
    if (!targetUserId || selectedChat) return;
    const matched = conversations.find((conv) =>
      conv.participants.some((p) => p.userId === targetUserId || p.user?.id === targetUserId)
    );
    if (matched) {
      setSelectedChat(matched.id);
      router.replace("/inbox", { scroll: false });
    }
  }, [targetUserId, conversations, selectedChat, router]);

  // ── Message actions ───────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(() => {
    const trimmedMessage = inputValue.trim();
    if ((!trimmedMessage && !attachmentUrl) || !selectedChat) return;

    if (blockedUntil && new Date() < blockedUntil) {
      setShowBlockedModal(true);
      return;
    }

    if (trimmedMessage && containsContactInfo(trimmedMessage)) {
      const newCount = warningCount + 1;
      if (newCount >= 3) {
        const blockTime = new Date(Date.now() + 10 * 60 * 1000);
        setBlockedUntil(blockTime);
        setWarningCount(0);
        setShowBlockedModal(true);
      } else {
        setWarningCount(newCount);
        setShowWarningModal(true);
      }
      return;
    }

    messagesSocket.sendMessage({
      conversationId: selectedChat,
      content: trimmedMessage,
      attachmentUrl: attachmentUrl || undefined,
    });
    setInputValue("");
    setAttachmentUrl(null);
  }, [inputValue, selectedChat, attachmentUrl, blockedUntil, warningCount]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await uploadAttachment(formData).unwrap();
        setAttachmentUrl(response.url);
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [uploadAttachment]
  );

  const handleDeleteMessage = (messageId: string) => {
    messagesSocket.deleteMessage(messageId);
  };

  const handleDeleteConversation = () => {
    if (!selectedChat) return;
    if (!window.confirm("Delete this conversation from your inbox?")) return;
    messagesSocket.deleteConversation(selectedChat);
    setConversations((prev) => prev.filter((c) => c.id !== selectedChat));
    setSelectedChat(null);
    setMessages([]);
    setActiveParticipantOverride(null);
  };

  // ── Display helpers ───────────────────────────────────────────────────────────

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find((p) => p.userId !== user?.id)?.user;

  const getDisplayName = (participant: any) =>
    participant?.jobSeekerProfile?.fullName ||
    participant?.employerProfile?.fullName ||
    participant?.fullName ||
    "Unknown User";

  const getDisplayPic = (participant: any) => {
    const pic =
      participant?.jobSeekerProfile?.profilePic ||
      participant?.employerProfile?.profilePic ||
      participant?.profilePic;
    if (!pic) return undefined;
    if (pic.startsWith("http://") || pic.startsWith("https://")) return pic;
    if (pic.startsWith("/")) return `${API_URL}${pic}`;
    return undefined;
  };

  const formatLastSeen = (d: Date) => {
    const now = new Date();
    if (now.toDateString() === d.toDateString()) {
      return `today at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const getPresenceInfo = (participant: any) => {
    const onlineAt = participant?.onlineAt ? new Date(participant.onlineAt) : null;
    const lastSeenAt = participant?.lastSeenAt ? new Date(participant.lastSeenAt) : null;
    const validOnline = !!onlineAt && !Number.isNaN(onlineAt.getTime());
    const validLastSeen = !!lastSeenAt && !Number.isNaN(lastSeenAt.getTime());
    const isOnline =
      (validOnline && (!validLastSeen || onlineAt!.getTime() >= lastSeenAt!.getTime())) ||
      participant?.isOnline === true;

    if (isOnline) return { text: "Online", className: "text-green-600" };
    if (validLastSeen) return { text: `Last seen ${formatLastSeen(lastSeenAt!)}`, className: "text-gray-500" };
    return { text: "Offline", className: "text-gray-500" };
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const getFileNameFromUrl = (url: string) => {
    try {
      return new URL(url, "http://localhost").pathname.split("/").pop()?.split("?")[0] || "File";
    } catch {
      return "File";
    }
  };

  const getAttachmentFullUrl = (url: string) =>
    url.startsWith("/") ? `${API_URL}${url}` : url;

  const isImageAttachment = (url: string) =>
    [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].some((ext) =>
      url.toLowerCase().endsWith(ext)
    );

  const handleOpenAttachment = (url: string) =>
    window.open(getAttachmentFullUrl(url), "_blank", "noopener,noreferrer");

  const handleDownloadAttachment = (url: string) => {
    const fullUrl = getAttachmentFullUrl(url);
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = getFileNameFromUrl(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Search users ──────────────────────────────────────────────────────────────

  const searchedUsers: SearchUser[] = useMemo(() => {
    const raw = searchedUsersData as any;
    const candidates = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.users) ? raw.users
        : Array.isArray(raw?.data) ? raw.data
          : Array.isArray(raw?.data?.users) ? raw.data.users
            : Array.isArray(raw?.data?.data) ? raw.data.data
              : [];
    return candidates
      .map((item: any) => (item?.user ? item.user : item))
      .filter((item: any) => !!item?.id && item.id !== user?.id);
  }, [searchedUsersData, user?.id]);

  const filteredConversations = useMemo(() => {
    if (!rawSearchTerm) return conversations;
    const keyword = rawSearchTerm.toLowerCase();
    return conversations.filter((conv) =>
      getDisplayName(getOtherParticipant(conv)).toLowerCase().includes(keyword)
    );
  }, [rawSearchTerm, conversations, user?.id]);

  const getConversationUnread = useCallback(
    (conversation: Conversation) => {
      const local = unreadByConversation[conversation.id] || 0;
      if (local > 0) return local;
      if (unreadCount > 0 && conversations[0]?.id === conversation.id) return unreadCount;
      return 0;
    },
    [unreadByConversation, unreadCount, conversations]
  );

  const handleSelectSearchedUser = async (searchedUser: SearchUser) => {
    const targetId = searchedUser?.id;
    if (!targetId) return;

    setActiveParticipantOverride(searchedUser);

    const existing = conversations.find((conv) =>
      conv.participants.some((p) => p.userId === targetId || p.user?.id === targetId)
    );

    if (existing) {
      setSelectedChat(existing.id);
      setUserSearchTerm("");
      return;
    }

    try {
      const response = await getOrCreateConversation({
        targetUserId: targetId,
        receiverId: targetId,
        participantId: targetId,
      }).unwrap();

      const conversationId =
        response?.id ||
        response?.conversationId ||
        response?.conversation?.id ||
        response?.data?.id ||
        response?.data?.conversationId ||
        response?.data?.conversation?.id;

      if (conversationId) {
        setSelectedChat(conversationId);
        setUserSearchTerm("");
      }
    } catch (error) {
      console.error("Failed to open searched user conversation:", error);
    }
  };

  // ── Derived render values ─────────────────────────────────────────────────────

  const selectedConversation = conversations.find((c) => c.id === selectedChat);
  const otherParticipant = selectedConversation
    ? getOtherParticipant(selectedConversation)
    : activeParticipantOverride;
  const presenceInfo = getPresenceInfo(otherParticipant);

  // ── Conversation list item ────────────────────────────────────────────────────

  const renderConversationItem = (chat: Conversation) => {
    const otherUser = getOtherParticipant(chat);
    const lastMsg = chat.messages?.[0];
    const unreadForChat = getConversationUnread(chat);
    const hasUnread = unreadForChat > 0;

    return (
      <div
        key={chat.id}
        onClick={() => setSelectedChat(chat.id)}
        className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition rounded-lg mx-1 ${selectedChat === chat.id
          ? "bg-blue-50"
          : hasUnread
            ? "bg-green-50 hover:bg-green-100"
            : "hover:bg-gray-100"
          }`}
      >
        <Avatar className="h-11 w-11 border border-gray-300 flex-shrink-0">
          <AvatarImage src={getDisplayPic(otherUser)} alt={getDisplayName(otherUser)} />
          <AvatarFallback className="bg-blue-100 text-blue-700">
            {getDisplayName(otherUser)?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex justify-between items-baseline gap-2">
            <h3 className={`text-sm truncate ${hasUnread ? "font-extrabold text-black" : "font-semibold text-gray-800"}`}>
              {getDisplayName(otherUser)}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] text-gray-400">
                {chat.updatedAt
                  ? new Date(chat.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : ""}
              </span>
              {hasUnread && (
                <span className="min-w-5 h-5 px-1 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadForChat > 9 ? "9+" : unreadForChat}
                </span>
              )}
            </div>
          </div>
          <p className={`text-xs truncate ${hasUnread ? "text-gray-900 font-bold" : "text-gray-500"}`}>
            {lastMsg?.content || "No messages yet"}
          </p>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex justify-center">
      <div className="w-full max-w-[1300px] h-full flex overflow-hidden">

        {/* ── Left Sidebar ── */}
        <div className={`w-full sm:w-72 md:w-80 border-r border-gray-200 flex flex-col overflow-hidden ${selectedChat ? "hidden sm:flex" : "flex"}`}>
          <div className="px-4 py-5 border-b border-gray-200 flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-800">
              Messages{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </h1>
            <div className="mt-3">
              <Input
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="h-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 overflow-hidden">
            <div className="w-full space-y-1 px-2 py-2">
              {isLoading && conversations.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : rawSearchTerm ? (
                isSearchingUsers && searchedUsers.length === 0 && filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">Searching users...</div>
                ) : searchedUsers.length > 0 ? (
                  searchedUsers.map((su) => (
                    <div
                      key={su.id}
                      onClick={() => void handleSelectSearchedUser(su)}
                      className="flex items-center gap-3 px-3 py-3 cursor-pointer transition rounded-lg mx-1 hover:bg-gray-100"
                    >
                      <Avatar className="h-11 w-11 border border-gray-300 flex-shrink-0">
                        <AvatarImage src={getDisplayPic(su)} alt={getDisplayName(su)} />
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {getDisplayName(su)?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">{getDisplayName(su)}</h3>
                        <p className="text-xs text-gray-500 truncate">{su.role || "User"}</p>
                      </div>
                    </div>
                  ))
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map(renderConversationItem)
                ) : (
                  <div className="p-6 text-center text-gray-500">No users found</div>
                )
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No conversations yet</div>
              ) : (
                conversations.map(renderConversationItem)
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ── Chat Area ── */}
        <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${!selectedChat ? "hidden sm:flex" : "flex"}`}>

          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden -ml-2 text-gray-600 flex-shrink-0"
                onClick={() => setSelectedChat(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              {otherParticipant ? (
                <>
                  <Avatar className="h-10 w-10 border border-gray-300 flex-shrink-0">
                    <AvatarImage src={getDisplayPic(otherParticipant)} alt={getDisplayName(otherParticipant)} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getDisplayName(otherParticipant)?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-sm text-gray-800 truncate">
                      {getDisplayName(otherParticipant)}
                    </h2>
                    <p className={`text-[11px] ${presenceInfo.className}`}>{presenceInfo.text}</p>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Select a conversation</div>
              )}
            </div>

            {selectedChat && otherParticipant && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreVertical className="h-5 w-5 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDeleteConversation}>
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 bg-green-50 overflow-hidden">
            <div className="w-full h-full px-3 sm:px-4 md:px-6 py-4 overflow-y-auto">
              {selectedChat ? (
                <div className="space-y-6 pb-4 w-full">
                  {msgHasMore && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMsgPageLoading}
                        onClick={() => void loadMessagesRest(selectedChat, msgPage + 1)}
                        className="text-xs"
                      >
                        {isMsgPageLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                        Load older messages
                      </Button>
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      {isMsgPageLoading
                        ? <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        : "No messages yet"}
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isSent = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex w-full ${isSent ? "justify-end" : "justify-start"}`}>
                          <div className={`flex items-end gap-2 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg ${isSent ? "ml-auto flex-row-reverse" : "flex-row"}`}>
                            {!isSent && (
                              <Avatar className="h-8 w-8 border border-gray-300 flex-shrink-0">
                                <AvatarImage src={getDisplayPic(msg.sender)} alt={getDisplayName(msg.sender)} />
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                  {getDisplayName(msg.sender)?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`flex flex-col ${isSent ? "items-end" : "items-start"}`}>
                              <div className={`px-3 sm:px-4 py-2 rounded-2xl text-sm break-words ${isSent ? "bg-gray-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none shadow-sm"}`}>
                                {msg.content && <p className="leading-relaxed">{msg.content}</p>}

                                {msg.attachmentUrl && (
                                  <div className="mt-2 pt-2 border-t border-gray-400 border-opacity-30">
                                    {isImageAttachment(msg.attachmentUrl) ? (
                                      <div className="space-y-2">
                                        <img
                                          src={getAttachmentFullUrl(msg.attachmentUrl)}
                                          alt={getFileNameFromUrl(msg.attachmentUrl)}
                                          className="max-h-56 w-auto rounded-lg border border-gray-300"
                                        />
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleOpenAttachment(msg.attachmentUrl!)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${isSent ? "bg-gray-700 text-white hover:bg-gray-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                          >
                                            <Eye className="h-3.5 w-3.5" /> View
                                          </button>
                                          <button
                                            onClick={() => handleDownloadAttachment(msg.attachmentUrl!)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${isSent ? "bg-gray-700 text-white hover:bg-gray-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                          >
                                            <Download className="h-3.5 w-3.5" /> Download
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenAttachment(msg.attachmentUrl!)}
                                        className={`flex w-full items-center gap-2 p-2 rounded transition ${isSent ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                                      >
                                        <File className="h-5 w-5" />
                                        <div className="flex-1 text-left">
                                          <p className="text-xs font-medium truncate">{getFileNameFromUrl(msg.attachmentUrl)}</p>
                                          <p className={`text-[10px] ${isSent ? "text-blue-100" : "text-blue-600"}`}>Open file</p>
                                        </div>
                                        <Download className="h-4 w-4 flex-shrink-0" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-500">{formatTime(msg.createdAt)}</span>
                                {isSent && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1.5 opacity-0 hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500"
                                    onClick={() => handleDeleteMessage(msg.id)}
                                  >
                                    x
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Select a conversation to view messages
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-green-50 border-t border-gray-200 flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />

            {attachmentUrl && (
              <div className="mb-2 p-2 bg-white rounded-lg border border-gray-300 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600 truncate">Attachment added</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-red-500 hover:text-red-600"
                  onClick={() => setAttachmentUrl(null)}
                >
                  x
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-white rounded-full px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm border border-gray-300">
              <Input
                placeholder={selectedChat ? "Type a message ..." : "Select a conversation to message ..."}
                className="border-none focus-visible:ring-0 text-sm shadow-none h-8 sm:h-9 px-2 sm:px-0"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={!selectedChat || isMsgPageLoading || isUploading}
                autoFocus={!!selectedChat}
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-600 h-8 w-8 flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedChat || isUploading}
              >
                {isUploading
                  ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  : <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-600 rounded-full h-8 w-8 sm:h-9 sm:w-9 p-0 shadow-lg flex-shrink-0"
                onClick={handleSendMessage}
                disabled={!selectedChat || (!inputValue.trim() && !attachmentUrl) || isMsgPageLoading || isUploading}
              >
                <SendHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </Button>
            </div>
          </div>
          {/* Warning Modal */}
          {showWarningModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 mx-6 max-w-sm w-full shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-orange-400 text-2xl">⚠️</span>
                  <h2 className="text-orange-400 font-bold text-xl">Not Allowed</h2>
                </div>
                <p className="text-gray-700 text-sm mb-3">
                  Sharing phone numbers or email addresses in chat is not permitted.
                </p>
                <p className="text-gray-700 text-sm mb-6">
                  Warning: <strong>{3 - warningCount}</strong> more attempt(s) will block you for 10 minutes.
                </p>
                <div className="flex justify-end">
                  <button onClick={() => setShowWarningModal(false)} className="text-green-500 font-bold text-base">
                    Understood
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Blocked Modal */}
          {showBlockedModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 mx-6 max-w-sm w-full shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-red-500 text-2xl">🚫</span>
                  <h2 className="text-red-500 font-bold text-xl">Account Blocked</h2>
                </div>
                <p className="text-gray-700 text-sm mb-3">
                  You have been blocked from sending messages for 10 minutes due to repeated attempts to share contact information.
                </p>
                <p className="text-gray-700 text-sm mb-6">
                  Remaining time: <strong>{remainingTime}</strong>
                </p>
                <div className="flex justify-end">
                  <button onClick={() => setShowBlockedModal(false)} className="text-green-500 font-bold text-base">
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}