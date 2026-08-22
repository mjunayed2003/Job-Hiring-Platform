"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import JobCard from "@/component/card/JobCard";
import FilterSheet, { FilterState } from "@/component/job/FilterSheet";
import {
  useGetJobsQuery,
  useGetMyApplicationsQuery,
  useGetMyBookmarksQuery,
  useBookmarkJobMutation,
  useGetJobSeekerProfileQuery,
} from "@/redux/services/jobsApi";
import { useMarkHireCompletedMutation } from "@/redux/services/featuresApi";
import { useGetCategoriesQuery } from "@/redux/services/featuresApi";
import { useDebounce } from "@/lib/useDebounce";
import GuestAccessAlert from "@/components/auth/guest-access-alert";
import { isJobSeekerUser } from "@/lib/clientAuth";

function fmtType(raw: string): string {
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapJobToCard(job: any) {
  const rawTypes: string[] = Array.isArray(job.type)
    ? job.type
    : Array.isArray(job.jobType)
      ? job.jobType
      : job.jobType
        ? [job.jobType]
        : [];

  const expTag = job.experienceLevel ? `${job.experienceLevel} Level` : null;
  const typeTags = [
    ...(rawTypes.length ? rawTypes.map(fmtType) : ["Full Time"]),
    ...(expTag ? [expTag] : []),
  ];

  const freq = job.salaryFrequency
    ? job.salaryFrequency.charAt(0) + job.salaryFrequency.slice(1).toLowerCase()
    : "Month";
  const amount = job.salary ?? job.salaryAmount;
  const salaryStr = amount ? `JMD ${Number(amount).toLocaleString()}/${freq}` : "Negotiable";

  const deadlineStr = job.deadline
    ? new Date(job.deadline).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : job.createdAt
      ? new Date(job.createdAt).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        })
      : job.date || "";

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  const rawPic = job.employer?.profilePic ?? null;
  const logo = (() => {
    if (!rawPic) return null;
    if (/^https?:\/\//i.test(rawPic)) return rawPic;
    if (rawPic.startsWith("/")) return `${API_BASE}${rawPic}`;
    return null;
  })();

  const company = job.employer?.fullName ?? "Unknown";

  return {
    id: job.id,
    title: job.title,
    company,
    logo,
    date: deadlineStr,
    salary: salaryStr,
    location: job.location || "N/A",
    type: typeTags,
  };
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-500 text-sm font-medium">{message}</p>
    </div>
  );
}

function JobCardSkeleton() {
  return (
    <div className="w-full sm:w-[260px] h-[220px] bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="h-5 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-200 rounded-full w-16" />
        <div className="h-5 bg-gray-200 rounded-full w-16" />
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Previous
      </button>

      <div className="flex gap-1">
        {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
              currentPage === page
                ? "bg-[#3FAE2A] text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {String(page).padStart(2, "0")}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Next
      </button>
    </div>
  );
}

const ITEMS_PER_PAGE = 15;

export default function JobSeekerDashboard() {
  const router = useRouter(); // ✅ add
  const [hasMounted, setHasMounted] = useState(false);
  const isJobSeeker = hasMounted && isJobSeekerUser();

  const [activeTab, setActiveTab] = useState("find");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [guestAlertOpen, setGuestAlertOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    workplaceType: "",
    employmentType: "",
    minSalary: 0,
    maxSalary: 25000,
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHasMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCurrentPage(1));
    return () => window.cancelAnimationFrame(frame);
  }, [debouncedSearch, selectedCategoryId, filters]);

  const jobQueryParams = useMemo(() => {
    const params: Record<string, any> = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedCategoryId) params.categoryId = selectedCategoryId;
    if (filters.workplaceType) params.workplaceType = filters.workplaceType;
    if (filters.employmentType) params.employmentType = filters.employmentType;
    if (filters.minSalary > 0) params.minSalary = filters.minSalary;
    if (filters.maxSalary < 25000) params.maxSalary = filters.maxSalary;
    return params;
  }, [debouncedSearch, selectedCategoryId, filters, currentPage]);

  const {
    data: jobsData,
    isLoading: jobsLoading,
    isError: jobsError,
    refetch: refetchJobs,
  } = useGetJobsQuery(jobQueryParams, {
    skip: activeTab !== "find",
  });

  const {
    data: applicationsData,
    isLoading: appsLoading,
    isError: appsError,
  } = useGetMyApplicationsQuery(undefined, { skip: !isJobSeeker });

  const {
    data: bookmarksData,
    isLoading: bookmarksLoading,
    isError: bookmarksError,
    refetch: refetchBookmarks,
  } = useGetMyBookmarksQuery(undefined, { skip: !isJobSeeker });

  const { data: categoriesData } = useGetCategoriesQuery();
  useGetJobSeekerProfileQuery(undefined, { skip: !isJobSeeker });
  const [bookmarkJob] = useBookmarkJobMutation();
  const [markHireCompleted] = useMarkHireCompletedMutation();

  const recommendedJobs = Array.isArray(jobsData?.recommended)
    ? jobsData.recommended
    : Array.isArray(jobsData?.data)
      ? jobsData.data
      : Array.isArray(jobsData)
        ? jobsData
        : [];

  const otherJobs = Array.isArray(jobsData?.other) ? jobsData.other : [];

  const totalPages: number =
    Math.max(
      Number(jobsData?.meta?.recommended?.totalPages ?? 1),
      Number(jobsData?.meta?.other?.totalPages ?? 1),
      Number(jobsData?.meta?.totalPages ?? 1),
      Number(jobsData?.pagination?.totalPages ?? 1),
      Number(jobsData?.totalPages ?? 1),
    ) || 1;

  const myApps = Array.isArray(applicationsData?.data)
    ? applicationsData.data
    : Array.isArray(applicationsData)
      ? applicationsData
      : [];

  const appliedJobIds = useMemo(() => {
    const ids = myApps
      .map((app: any) => app?.job?.id || app?.jobId)
      .filter((value: unknown): value is string => typeof value === "string" && value.length > 0);
    return new Set(ids);
  }, [myApps]);

  const myBookmarks = Array.isArray(bookmarksData?.data)
    ? bookmarksData.data
    : Array.isArray(bookmarksData)
      ? bookmarksData
      : [];

  const categories = Array.isArray(categoriesData?.data)
    ? categoriesData.data
    : Array.isArray(categoriesData)
      ? categoriesData
      : [];

  const filteredRecommendedJobs = recommendedJobs.filter((job: any) => !appliedJobIds.has(job?.id));
  const filteredOtherJobs = otherJobs.filter((job: any) => !appliedJobIds.has(job?.id));
  const allJobsArray = [...filteredRecommendedJobs, ...filteredOtherJobs];
  const showRecommendedSection = filteredRecommendedJobs.length > 0;

  useEffect(() => {
    const ids = myBookmarks
      .map((item: any) => item?.job?.id || item?.jobId || item?.id)
      .filter(Boolean);
    const frame = window.requestAnimationFrame(() => setBookmarkedIds(new Set(ids)));
    return () => window.cancelAnimationFrame(frame);
  }, [myBookmarks]);

  const showGuestAlert = () => setGuestAlertOpen(true);

  const handleMarkCompleted = async (interviewId?: string) => {
    if (!interviewId) return;

    try {
      await markHireCompleted({ interviewId }).unwrap();
      await Promise.allSettled([refetchJobs(), refetchBookmarks()]);
    } catch (error) {
      console.error("Failed to mark hire completed", error);
    }
  };

  const activeFilterCount =
    (filters.workplaceType ? 1 : 0) +
    (filters.employmentType ? 1 : 0) +
    (filters.minSalary > 0 || filters.maxSalary < 25000 ? 1 : 0);

  const handleBookmark = async (jobId: string) => {
    if (!isJobSeeker) {
      showGuestAlert();
      return;
    }

    const wasBookmarked = bookmarkedIds.has(jobId);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
    try {
      await bookmarkJob(jobId).unwrap();
      refetchBookmarks();
    } catch (err) {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) {
          next.add(jobId);
        } else {
          next.delete(jobId);
        }
        return next;
      });
      console.error("Bookmark error:", err);
    }
  };

  function getApplicationStatus(app: any): string {
    const status = String(app.status || "").toUpperCase();
    const interviewStatus = String(app.interview?.status || "").toUpperCase();
    const paymentStatus = String(app.interview?.payment?.status || "").toUpperCase();
    const candidateCompletedAt = app.interview?.payment?.candidateCompletedAt;

    if (interviewStatus === "HIRED") {
      if (paymentStatus === "PAID") {
        if (candidateCompletedAt) return "COMPLETED";
        return "HIRED";
      }
      if (paymentStatus === "FAILED") return "FAILED";
      return "PAYMENT PENDING";
    }

    if (interviewStatus === "COMPLETED") return "COMPLETED";
    if (status === "APPLIED" || status === "PENDING" || status === "SUBMITTED") return "APPLIED";
    if (status === "VIEWED") return "VIEWED";
    if (status === "COMPLETED") return "COMPLETED";
    if (status === "INTERVIEW_SCHEDULED" || status === "INTERVIEW") return "INTERVIEW";
    if (status === "HIRED" || status === "ACCEPTED") return "HIRED";
    if (status === "REJECTED") return "REJECTED";
    return "APPLIED";
  }

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 pb-20 font-sans">
      <GuestAccessAlert
        open={guestAlertOpen}
        onOpenChange={setGuestAlertOpen}
        fromPath="/jobseeker/jobs"
      />
      <div className="max-w-[1393px] mx-auto px-4 pt-4 md:pt-8">

        {/* ── Tabs ── */}
        <div className="flex justify-between md:justify-center border-b border-gray-200 mb-6 md:mb-10 bg-white md:bg-transparent sticky top-0 z-10 md:static overflow-x-auto scrollbar-hide">
          {[
            { label: "Find Job", value: "find" },
            { label: "Track My Job", value: "track" },
            { label: "Bookmark", value: "bookmark" },
          ].map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  if (!isJobSeeker && tab.value !== "find") {
                    showGuestAlert();
                    return;
                  }

                  setActiveTab(tab.value);
                }}
                className={`flex-1 md:flex-none px-2 md:px-10 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all relative whitespace-nowrap ${
                  isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#3FAE2A] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Find Job ── */}
        {activeTab === "find" && (
          <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 bg-white p-1.5 md:p-2 rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] max-w-2xl mx-auto border border-gray-100">
              <Search className="text-gray-400 ml-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none shadow-none focus-visible:ring-0 text-sm md:text-base h-10"
              />
              <FilterSheet onApply={(f) => setFilters(f)} activeCount={activeFilterCount} />
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 max-w-2xl mx-auto -mt-4">
                {filters.workplaceType && (
                  <span className="text-xs bg-green-50 text-[#3FAE2A] border border-green-200 rounded-full px-3 py-1 font-medium">
                    {filters.workplaceType}
                  </span>
                )}
                {filters.employmentType && (
                  <span className="text-xs bg-green-50 text-[#3FAE2A] border border-green-200 rounded-full px-3 py-1 font-medium">
                    {filters.employmentType}
                  </span>
                )}
                {(filters.minSalary > 0 || filters.maxSalary < 25000) && (
                  <span className="text-xs bg-green-50 text-[#3FAE2A] border border-green-200 rounded-full px-3 py-1 font-medium">
                    ${filters.minSalary.toLocaleString()} - ${filters.maxSalary.toLocaleString()}
                  </span>
                )}
              </div>
            )}

            <div>
              <h3 className="font-bold text-gray-800 mb-4 md:mb-5 ml-1 text-lg">Job Categories</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x px-1">
                <div
                  onClick={() => setSelectedCategoryId(null)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group snap-start"
                >
                  <div
                    className={`w-[120px] h-[80px] md:w-[140px] md:h-[90px] rounded-xl overflow-hidden border-2 transition-all shadow-sm flex items-center justify-center bg-gray-50 ${
                      !selectedCategoryId ? "border-[#3FAE2A]" : "border-transparent"
                    }`}
                  >
                    <span className="text-2xl">🌐</span>
                  </div>
                  <span
                    className={`text-xs font-semibold transition-colors text-center ${
                      !selectedCategoryId ? "text-[#3FAE2A]" : "text-gray-600 group-hover:text-[#3FAE2A]"
                    }`}
                  >
                    All
                  </span>
                </div>

                {categories.map((cat: any) => {
                  const isSelected = selectedCategoryId === cat.id;
                  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
                  const imgSrc = cat.image
                    ? cat.image.startsWith("http")
                      ? cat.image
                      : `${API_BASE}${cat.image}`
                    : "/image/education.jpg";
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                      className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group snap-start"
                    >
                      <div
                        className={`w-[120px] h-[80px] md:w-[140px] md:h-[90px] relative rounded-xl overflow-hidden border-2 transition-all shadow-sm ${
                          isSelected
                            ? "border-[#3FAE2A]"
                            : "border-transparent group-hover:border-[#3FAE2A]"
                        }`}
                      >
                        <Image src={imgSrc} alt={cat.name} fill className="object-cover" />
                      </div>
                      <span
                        className={`text-xs font-semibold transition-colors text-center ${
                          isSelected ? "text-[#3FAE2A]" : "text-gray-600 group-hover:text-[#3FAE2A]"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {jobsLoading ? (
              <div className="space-y-10">
                <div>
                  <div className="h-6 w-48 bg-gray-200 rounded mb-5 animate-pulse" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <JobCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              </div>
            ) : jobsError ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <p className="text-red-500 text-sm">Failed to load jobs.</p>
                <button
                  onClick={refetchJobs}
                  className="text-[#3FAE2A] text-sm font-semibold underline"
                >
                  Retry
                </button>
              </div>
            ) : allJobsArray.length === 0 ? (
              <EmptyState message="No jobs found. Try adjusting your search or filters." />
            ) : (
              <div className="space-y-10">
                {showRecommendedSection && (
                  <div>
                    <div className="flex items-center gap-3 mb-5 px-1">
                      <h3 className="font-bold text-gray-800 text-lg">Recommended Jobs For You</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
                      {filteredRecommendedJobs.map((job: any) => (
                        <div key={job.id} className="flex justify-center">
                          <JobCard
                            job={{
                              ...mapJobToCard(job),
                              status: null,
                              isBookmarked: bookmarkedIds.has(job.id) || job.isBookmarked,
                            }}
                            onBookmark={handleBookmark}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredOtherJobs.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-5 px-1 text-lg">Other Jobs</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
                      {filteredOtherJobs.map((job: any) => (
                        <div key={job.id} className="flex justify-center">
                          <JobCard
                            job={{
                              ...mapJobToCard(job),
                              status: null,
                              isBookmarked: bookmarkedIds.has(job.id) || job.isBookmarked,
                            }}
                            onBookmark={handleBookmark}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Track My Job ── */}
        {activeTab === "track" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">My Applied Jobs</h3>
              {appsLoading && <Loader2 className="w-4 h-4 animate-spin text-[#3FAE2A]" />}
            </div>

            {appsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : appsError ? (
              <EmptyState message="Failed to load applications." />
            ) : myApps.length === 0 ? (
              <EmptyState message="You haven't applied to any jobs yet." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
                {myApps.map((app: any) => {
                  const job = app.job || app;
                  const status = getApplicationStatus(app);
                  const paymentStatus = String(app.interview?.payment?.status || "").toUpperCase();
                  const candidateCompletedAt = app.interview?.payment?.candidateCompletedAt || null;
                  const employerCompletedAt = app.interview?.payment?.employerCompletedAt || null;
                  const isInterview =
                    status === "INTERVIEW" ||
                    status === "COMPLETED" ||
                    status === "FAILED" ||
                    status === "PAYMENT PENDING";
                  const isHired = status === "HIRED";
                  const isHireCompleted = Boolean(candidateCompletedAt);
                  const isEmployerConfirmed = Boolean(employerCompletedAt);
                  const showCompletionActions = paymentStatus === "PAID" || isHireCompleted;


                  const employerId =
                    job?.employer?.userId ||
                    job?.employer?.id ||
                    job?.employerId ||
                    app?.employerId ||
                    null;

                  return (
                    <div key={app.id} className="flex justify-center">
                      <JobCard
                        job={{
                          ...mapJobToCard(job),
                          id: isInterview ? app.id : job.id,
                          status,
                          showCompletionActions,
                          isHireCompleted,
                          isEmployerConfirmed,
                        }}
                        disableNavigation={isHireCompleted || (!isInterview && !isHired)}
                        onHiredClick={
                          isHired && employerId
                            ? () => router.push(`/inbox?targetUserId=${employerId}`)
                            : isHired
                              ? () => router.push("/inbox")
                              : undefined
                        }
                        onCompletedClick={
                          paymentStatus === "PAID" && !candidateCompletedAt
                            ? () => handleMarkCompleted(app.interview?.id || app.interviewId)
                            : undefined
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Bookmark ── */}
        {activeTab === "bookmark" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Bookmarked Jobs</h3>
              {bookmarksLoading && <Loader2 className="w-4 h-4 animate-spin text-[#3FAE2A]" />}
            </div>

            {bookmarksLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : bookmarksError ? (
              <EmptyState message="Failed to load bookmarks." />
            ) : myBookmarks.length === 0 ? (
              <EmptyState message="No bookmarked jobs yet." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
                {myBookmarks.map((item: any) => {
                  const job = item.job || item;
                  return (
                    <div key={item.id || job.id} className="flex justify-center">
                      <JobCard
                        job={{
                          ...mapJobToCard(job),
                          isBookmarked: true,
                          status: null,
                        }}
                        onBookmark={handleBookmark}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
