import React, { useEffect, useState } from "react";
import {
  useGetUserByIdQuery,
  useSendVerificationBackupLinkMutation,
  useUploadVerificationBackupMutation,
} from "../../../redux/features/users/UsersApi.js";
import {
  useGetPlansQuery,
  useAssignCompanySubscriptionMutation,
  useActivateCompanySubscriptionMutation,
  useExtendCompanySubscriptionMutation,
  useModifyCompanySubscriptionMutation,
  useCancelCompanySubscriptionMutation,
} from "../../../redux/features/subscriptionsApi/subscriptionsApi.js";
import toast from "react-hot-toast";

type BackupKey = "idCardFront" | "idCardBack" | "selfieImage";
type CompanyBackupKey = "licenseFile";
const BACKUP_FIELDS: { key: BackupKey; label: string }[] = [
  { key: "idCardFront", label: "Government ID Front" },
  { key: "idCardBack", label: "Government ID Back" },
  { key: "selfieImage", label: "Selfie (optional)" },
];

const getTodayDateString = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

// ─── Image/File Modal ─────────────────────────────────────────────────
const FileModal = ({ url, title, onClose }) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-3xl rounded-xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl leading-none">&times;</button>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-gray-100 flex justify-center p-6">
        {url?.toLowerCase().endsWith(".pdf") ? (
          <iframe src={url} className="w-full min-h-[60vh]" title={title} />
        ) : (
          <img src={url} alt={title} className="max-w-full h-auto max-h-[70vh] object-contain shadow-lg" />
        )}
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end shrink-0">
        <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-300 transition">
          Close
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────
const UserDetails = ({ user: rowData, onBack, onActionDone }) => {
  const userId = rowData?.userId || rowData?.id;
  const { data, isLoading } = useGetUserByIdQuery(userId, { skip: !userId });
  const user = data?.data || {};
  const [modalData, setModalData] = useState(null);
  const [backupFiles, setBackupFiles] = useState<Record<string, File | null>>({
    idCardFront: null,
    idCardBack: null,
    selfieImage: null,
    licenseFile: null,
  });
  const baseUrl = import.meta.env.VITE_SERVER_URL?.replace(/\/$/, "");
  const profile = user?.jobSeekerProfile || user?.employerProfile || {};
  const currentSubscription = profile?.subscription || null;
  const { data: plansData } = useGetPlansQuery();
  const [sendVerificationBackupLink, { isLoading: isSendingBackupLink }] = useSendVerificationBackupLinkMutation();
  const [uploadVerificationBackup, { isLoading: isUploadingBackup }] = useUploadVerificationBackupMutation();
  const [assignCompanySubscription, { isLoading: isAssigningSubscription }] = useAssignCompanySubscriptionMutation();
  const [activateCompanySubscription, { isLoading: isActivatingSubscription }] = useActivateCompanySubscriptionMutation();
  const [extendCompanySubscription, { isLoading: isExtendingSubscription }] = useExtendCompanySubscriptionMutation();
  const [modifyCompanySubscription, { isLoading: isModifyingSubscription }] = useModifyCompanySubscriptionMutation();
  const [cancelCompanySubscription, { isLoading: isCancellingSubscription }] = useCancelCompanySubscriptionMutation();

  const isJobSeeker = user?.role === "JOB_SEEKER";
  const isEmployer  = user?.role === "EMPLOYER";
  const isCompany   = user?.role === "COMPANY";
  const availablePlans = plansData?.data || [];
  const backupFieldDefs =
    isCompany
      ? [{ key: "licenseFile" as CompanyBackupKey, label: "Business License / Registration File" }]
      : BACKUP_FIELDS;

  const [subscriptionForm, setSubscriptionForm] = useState({
    planId: "",
    startDate: getTodayDateString(),
    expiryDate: "",
    slotsOverride: "",
    amount: "",
    currency: "JMD",
    transactionId: "",
    reason: "",
    isActive: true,
  });

  useEffect(() => {
    if (!currentSubscription) return;

    setSubscriptionForm((prev) => ({
      ...prev,
      planId: currentSubscription.planId || "",
      startDate: currentSubscription.startDate
        ? String(currentSubscription.startDate).slice(0, 10)
        : getTodayDateString(),
      expiryDate: currentSubscription.expiryDate
        ? String(currentSubscription.expiryDate).slice(0, 10)
        : "",
      slotsOverride: currentSubscription.slotsOverride ? String(currentSubscription.slotsOverride) : "",
      isActive: currentSubscription.isActive ?? true,
    }));
  }, [currentSubscription]);

  const imgUrl = (path) =>
    path && !path.includes("undefined") ? `${baseUrl}${path}` : null;

  const profilePic = imgUrl(profile?.profilePic) || "https://via.placeholder.com/150";

  const handleSendBackupLink = async () => {
    try {
      await sendVerificationBackupLink(userId).unwrap();
      toast.success("Backup link sent to user email.");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send backup link");
    }
  };

  const handleUploadBackup = async () => {
    try {
      const hasAnyFile =
        backupFiles.idCardFront ||
        backupFiles.idCardBack ||
        backupFiles.selfieImage ||
        backupFiles.licenseFile;

      if (!hasAnyFile) {
        toast.error("Please choose at least one file.");
        return;
      }

      const formData = new FormData();
      Object.entries(backupFiles).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      await uploadVerificationBackup({ id: userId, formData }).unwrap();
      toast.success("Emergency verification files uploaded.");
      setBackupFiles({ idCardFront: null, idCardBack: null, selfieImage: null, licenseFile: null });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to upload emergency files");
    }
  };

  const handleSubscriptionFieldChange = (field, value) => {
    setSubscriptionForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildSubscriptionPayload = () => {
    const payload: Record<string, any> = {};
    if (subscriptionForm.planId) payload.planId = subscriptionForm.planId;
    payload.startDate = subscriptionForm.startDate || getTodayDateString();
    if (subscriptionForm.expiryDate) payload.expiryDate = subscriptionForm.expiryDate;
    if (subscriptionForm.slotsOverride) payload.slotsOverride = subscriptionForm.slotsOverride;
    if (subscriptionForm.amount) payload.amount = subscriptionForm.amount;
    if (subscriptionForm.currency) payload.currency = subscriptionForm.currency;
    if (subscriptionForm.transactionId) payload.transactionId = subscriptionForm.transactionId;
    if (subscriptionForm.reason) payload.reason = subscriptionForm.reason;
    payload.isActive = subscriptionForm.isActive;
    return payload;
  };

  const handleAssignSubscription = async () => {
    if (!subscriptionForm.planId) {
      toast.error("Please select a plan first.");
      return;
    }
    if (!subscriptionForm.expiryDate) {
      toast.error("Please select an expiry date.");
      return;
    }
    try {
      await assignCompanySubscription({ userId, body: buildSubscriptionPayload() }).unwrap();
      toast.success("Company subscription assigned.");
      onActionDone?.();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to assign subscription");
    }
  };

  const handleActivateSubscription = async () => {
    if (!subscriptionForm.expiryDate) {
      toast.error("Please select an expiry date.");
      return;
    }
    try {
      await activateCompanySubscription({ userId, body: buildSubscriptionPayload() }).unwrap();
      toast.success("Company subscription activated.");
      onActionDone?.();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to activate subscription");
    }
  };

  const handleExtendSubscription = async () => {
    if (!subscriptionForm.expiryDate) {
      toast.error("Please select an expiry date.");
      return;
    }
    try {
      await extendCompanySubscription({
        userId,
        body: {
          expiryDate: subscriptionForm.expiryDate,
          transactionId: subscriptionForm.transactionId || undefined,
          amount: subscriptionForm.amount || undefined,
          currency: subscriptionForm.currency || undefined,
          slotsOverride: subscriptionForm.slotsOverride || undefined,
        },
      }).unwrap();
      toast.success("Company subscription extended.");
      onActionDone?.();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to extend subscription");
    }
  };

  const handleModifySubscription = async () => {
    if (!subscriptionForm.planId) {
      toast.error("Please select a plan first.");
      return;
    }
    if (!subscriptionForm.expiryDate) {
      toast.error("Please select an expiry date.");
      return;
    }
    try {
      await modifyCompanySubscription({ userId, body: buildSubscriptionPayload() }).unwrap();
      toast.success("Company subscription updated.");
      onActionDone?.();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update subscription");
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelCompanySubscription({
        userId,
        body: { reason: subscriptionForm.reason || undefined },
      }).unwrap();
      toast.success("Company subscription cancelled.");
      onActionDone?.();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to cancel subscription");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // যদি প্রোফাইল ডেটা একেবারেই না থাকে
  if (!user?.email && !profile?.fullName) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center">
        <div className="bg-[#FFF4E3] text-[#F39C12] px-6 py-3 rounded-lg text-sm font-semibold mb-4">
          ⚠️ This user hasn't completed their detailed profile yet.
        </div>
        <button onClick={onBack} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 font-sans w-full mx-auto my-2">

      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-dashed border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <h3 className="text-xl font-bold text-gray-800">Profile Details</h3>
        </div>
        <span className="px-4 py-1.5 border border-gray-200 rounded text-sm text-gray-600 bg-white shadow-sm capitalize">
          {user?.role?.replace("_", " ") || "User"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Column 1: Profile Info ── */}
        <div className="lg:col-span-4 space-y-5 lg:border-r border-dashed border-gray-200 lg:pr-8">
          <h4 className="font-bold text-gray-800 text-sm">• Profile Information</h4>

          <div>
            <p className="text-xs text-gray-500 mb-2">Profile Picture</p>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-50 shadow-sm">
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <InfoRow label="Full Name" value={profile?.fullName || user?.fullName} />
            <InfoRow label="Email"     value={user?.email} />
            <InfoRow label="Phone"     value={profile?.phone} />
            <InfoRow label="Location"  value={profile?.location} />

            {/* Job Seeker specific */}
            {isJobSeeker && (
              <>
                <InfoRow label="Gender"          value={profile?.gender} />
                <InfoRow label="Experience Level" value={profile?.experienceLevel} />
                <InfoRow label="Preferred Categories" value={profile?.preferredJobCategories?.map(c => c.name).join(", ")} />
              </>
            )}

            {/* Company specific */}
            {isCompany && (
              <>
                <InfoRow label="Business Reg Cert ID" value={profile?.businessRegCertId} />
                <InfoRow label="Tax ID"               value={profile?.taxId} />
                <InfoRow label="Authorized Rep Name"    value={profile?.authorizedRepId} />
              </>
            )}

            {/* About text for all roles if it exists */}
            {profile?.about && (
              <div className="pt-1">
                <span className="text-gray-400 block text-xs mb-1">About:</span>
                <p className="text-gray-700 leading-relaxed text-justify">{profile.about}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Column 2: Professional / Education / Experience / About ── */}
        <div className="lg:col-span-4 space-y-6 lg:border-r border-dashed border-gray-200 lg:pr-8">

          {/* Job Seeker */}
          {isJobSeeker && (
            <>
              {profile?.education?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 text-sm">• Educational Details</h4>
                  {profile.education.map((edu, i) => (
                    <div key={i} className="space-y-2 text-sm mb-4 pb-4 border-b border-gray-100 last:border-0">
                      <InfoRow label="Qualification"   value={edu.degreeName} />
                      <InfoRow label="Institution"     value={edu.institution} />
                      <InfoRow label="Started Year"    value={edu.startDate    ? new Date(edu.startDate).getFullYear()    : null} />
                      <InfoRow label="Completion Year" value={edu.completionYear ? new Date(edu.completionYear).getFullYear() : null} />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-800 mb-3 text-sm">• Professional Details</h4>

                {profile?.resumeUrl && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 mb-4 shadow-sm">
                    <span className="text-xs text-gray-500 font-medium">CV / Resume:</span>
                    <button
                      onClick={() => setModalData({ url: imgUrl(profile.resumeUrl), title: "Resume" })}
                      className="px-5 py-1.5 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      View Resume
                    </button>
                  </div>
                )}

                {profile?.experience?.length > 0 && (
                  <>
                    <p className="text-sm text-gray-700 font-semibold mb-2">Experience</p>
                    {profile.experience.map((exp, i) => (
                      <div key={i} className="space-y-2 text-sm mb-4 pb-4 border-b border-gray-100 last:border-0">
                        <InfoRow label="Designation"    value={exp.designation} />
                        <InfoRow label="Company"        value={exp.companyName} />
                        <InfoRow label="Started"        value={exp.startDate ? new Date(exp.startDate).getFullYear() : null} />
                        <InfoRow label="Ended"          value={exp.isCurrent ? "Present" : exp.endDate ? new Date(exp.endDate).getFullYear() : null} />
                      </div>
                    ))}
                  </>
                )}

                {profile?.skills?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 font-semibold mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, i) => (
                        <span key={i} className="bg-[#F3F4F6] text-gray-600 px-4 py-1.5 rounded-md text-xs font-medium">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Employer / Company Additional Details */}
          {(isEmployer || isCompany) && (
             <div>
                <h4 className="font-bold text-gray-800 mb-3 text-sm">• Additional Details</h4>
                <p className="text-sm text-gray-500">
                  {isCompany ? "Company information is listed in the profile section." : "Employer information is listed in the profile section."}
                </p>

                {isCompany && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-4">
                    <div>
                      <h5 className="text-sm font-bold text-emerald-900">Company Subscription</h5>
                      <p className="text-xs text-emerald-800/80">
                        Manual assign, activate, extend, modify or cancel subscription when payment happens outside the app.
                      </p>
                    </div>

                    {currentSubscription ? (
                      <div className="rounded-xl bg-white border border-emerald-100 p-3 text-xs text-gray-600 space-y-1">
                        <p><span className="font-semibold text-gray-700">Plan:</span> {currentSubscription.plan?.name || "N/A"}</p>
                        <p><span className="font-semibold text-gray-700">Status:</span> {currentSubscription.isActive ? "Active" : "Inactive"}</p>
                        <p><span className="font-semibold text-gray-700">Start:</span> {currentSubscription.startDate ? new Date(currentSubscription.startDate).toLocaleDateString() : "N/A"}</p>
                        <p><span className="font-semibold text-gray-700">Expiry:</span> {currentSubscription.expiryDate ? new Date(currentSubscription.expiryDate).toLocaleDateString() : "N/A"}</p>
                        <p><span className="font-semibold text-gray-700">Slots:</span> {currentSubscription.plan?.slotsAvailable ?? "N/A"}</p>
                        <p><span className="font-semibold text-gray-700">Override Slots:</span> {currentSubscription.slotsOverride ?? "None"}</p>
                        <p><span className="font-semibold text-gray-700">Effective Slots:</span> {currentSubscription.effectiveSlotsAvailable ?? currentSubscription.plan?.slotsAvailable ?? "N/A"}</p>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-white border border-dashed border-emerald-200 p-3 text-xs text-gray-500">
                        No active subscription assigned yet.
                      </div>
                    )}

                    {!currentSubscription && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Subscription Plan</label>
                            <select
                              value={subscriptionForm.planId}
                              onChange={(e) => handleSubscriptionFieldChange("planId", e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            >
                              <option value="">Select plan</option>
                              {availablePlans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.name} - JMD {plan.price}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Start Date</label>
                            <input
                              type="date"
                              value={subscriptionForm.startDate}
                              onChange={(e) => handleSubscriptionFieldChange("startDate", e.target.value)}
                              readOnly={Boolean(currentSubscription)}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Expiry Date</label>
                            <input
                              type="date"
                              value={subscriptionForm.expiryDate}
                              onChange={(e) => handleSubscriptionFieldChange("expiryDate", e.target.value)}
                              min={subscriptionForm.startDate || undefined}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div className="md:col-span-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                            {currentSubscription
                              ? "Current start date is locked. The selected expiry date will replace the existing one."
                              : "Expiry date will be saved exactly as selected. Start date defaults to today if left blank."}
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Payment Amount</label>
                            <input
                              type="number"
                              value={subscriptionForm.amount}
                              onChange={(e) => handleSubscriptionFieldChange("amount", e.target.value)}
                              placeholder="Payment amount"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Bank / Cash Reference</label>
                            <input
                              type="text"
                              value={subscriptionForm.transactionId}
                              onChange={(e) => handleSubscriptionFieldChange("transactionId", e.target.value)}
                              placeholder="Bank/cash reference"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Reason</label>
                            <input
                              type="text"
                              value={subscriptionForm.reason}
                              onChange={(e) => handleSubscriptionFieldChange("reason", e.target.value)}
                              placeholder="Reason for cancel/modify"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Currency</label>
                            <select
                              value={subscriptionForm.currency}
                              onChange={(e) => handleSubscriptionFieldChange("currency", e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            >
                              <option value="JMD">JMD</option>
                              <option value="USD">USD</option>
                            </select>
                          </div>

                          <label className="flex items-center gap-2 text-xs text-gray-600 px-1">
                            <input
                              type="checkbox"
                              checked={subscriptionForm.isActive}
                              onChange={(e) => handleSubscriptionFieldChange("isActive", e.target.checked)}
                            />
                            Active subscription
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleAssignSubscription}
                            disabled={isAssigningSubscription}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {isAssigningSubscription ? "Assigning..." : "Assign & Pay"}
                          </button>
                          <button
                            type="button"
                            onClick={handleActivateSubscription}
                            disabled={isActivatingSubscription}
                            className="rounded-xl bg-[#3FAE2A] px-3 py-2 text-xs font-bold text-white hover:bg-[#359624] disabled:opacity-60"
                          >
                            {isActivatingSubscription ? "Activating..." : "Activate"}
                          </button>
                        </div>
                      </>
                    )}

                    {currentSubscription && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Subscription Plan</label>
                            <select
                              value={subscriptionForm.planId}
                              onChange={(e) => handleSubscriptionFieldChange("planId", e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            >
                              <option value="">Switch plan</option>
                              {availablePlans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.name} - JMD {plan.price}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Start Date</label>
                            <input
                              type="date"
                              value={subscriptionForm.startDate}
                              onChange={(e) => handleSubscriptionFieldChange("startDate", e.target.value)}
                              readOnly={Boolean(currentSubscription)}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Expiry Date</label>
                            <input
                              type="date"
                              value={subscriptionForm.expiryDate}
                              onChange={(e) => handleSubscriptionFieldChange("expiryDate", e.target.value)}
                              min={subscriptionForm.startDate || undefined}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div className="md:col-span-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                            {currentSubscription
                              ? "Current start date is locked. Only expiry date will be updated."
                              : "Expiry date will be saved exactly as selected. Start date defaults to today if left blank."}
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Override Job Limit</label>
                            <input
                              type="number"
                              min="1"
                              value={subscriptionForm.slotsOverride}
                              onChange={(e) => handleSubscriptionFieldChange("slotsOverride", e.target.value)}
                              placeholder="Override job limit"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Payment Amount</label>
                            <input
                              type="number"
                              value={subscriptionForm.amount}
                              onChange={(e) => handleSubscriptionFieldChange("amount", e.target.value)}
                              placeholder="Payment amount"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Bank / Cash Reference</label>
                            <input
                              type="text"
                              value={subscriptionForm.transactionId}
                              onChange={(e) => handleSubscriptionFieldChange("transactionId", e.target.value)}
                              placeholder="Bank/cash reference"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Reason</label>
                            <input
                              type="text"
                              value={subscriptionForm.reason}
                              onChange={(e) => handleSubscriptionFieldChange("reason", e.target.value)}
                              placeholder="Reason for cancel/modify"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-700">Currency</label>
                            <select
                              value={subscriptionForm.currency}
                              onChange={(e) => handleSubscriptionFieldChange("currency", e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            >
                              <option value="JMD">JMD</option>
                              <option value="USD">USD</option>
                            </select>
                          </div>

                          <label className="flex items-center gap-2 text-xs text-gray-600 px-1">
                            <input
                              type="checkbox"
                              checked={subscriptionForm.isActive}
                              onChange={(e) => handleSubscriptionFieldChange("isActive", e.target.checked)}
                            />
                            Active subscription
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleExtendSubscription}
                            disabled={isExtendingSubscription}
                            className="rounded-xl bg-white border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                          >
                            {isExtendingSubscription ? "Extending..." : "Extend"}
                          </button>
                          <button
                            type="button"
                            onClick={handleModifySubscription}
                            disabled={isModifyingSubscription}
                            className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
                          >
                            {isModifyingSubscription ? "Saving..." : "Switch / Modify"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleCancelSubscription}
                          disabled={isCancellingSubscription}
                          className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
                        >
                          {isCancellingSubscription ? "Cancelling..." : "Cancel Subscription"}
                        </button>
                      </>
                    )}
                  </div>
                )}
             </div>
          )}
        </div>

        {/* ── Column 3: Verification & Status ── */}
        <div className="lg:col-span-4 flex flex-col">
          <h4 className="font-bold text-gray-800 mb-4 text-sm">• Verification & Documents</h4>

          <div className="space-y-4 flex-1">

            {/* Job Seeker verification docs */}
            {isJobSeeker && (
              <>
                <VerificationItem label="Government ID (Front):" btnText="View Front"  url={imgUrl(profile?.idCardFront)} onView={(url) => setModalData({ url, title: "ID Card Front" })} />
                <VerificationItem label="Government ID (Back):"  btnText="View Back"   url={imgUrl(profile?.idCardBack)}  onView={(url) => setModalData({ url, title: "ID Card Back" })} />
                <VerificationItem label="Captured Selfie:"       btnText="View Selfie" url={imgUrl(profile?.selfieImage)} onView={(url) => setModalData({ url, title: "Selfie" })} />
              </>
            )}

            {/* Employer verification docs */}
            {isEmployer && (
              <>
                <VerificationItem label="Government ID (Front):" btnText="View Front"  url={imgUrl(profile?.idCardFront)} onView={(url) => setModalData({ url, title: "ID Card Front" })} />
                <VerificationItem label="Government ID (Back):"  btnText="View Back"   url={imgUrl(profile?.idCardBack)}  onView={(url) => setModalData({ url, title: "ID Card Back" })} />
                <VerificationItem label="Selfie Image:"          btnText="View Selfie" url={imgUrl(profile?.selfieImage)} onView={(url) => setModalData({ url, title: "Selfie" })} />
              </>
            )}

            {/* Company verification docs */}
            {isCompany && (
              <>
                <VerificationItem label="License File:" btnText="View License" url={imgUrl(profile?.licenseFile)} onView={(url) => setModalData({ url, title: "License File" })} />
              </>
            )}
          </div>

          {/* User Status Badge (Instead of action buttons) */}
          {user?.status && (
            <div className="flex justify-end mt-10 pt-6 border-t border-dashed border-gray-200">
              <span className={`px-6 py-2 rounded-full text-sm font-bold ${
                user.status === "ACTIVE"   ? "bg-[#E7F8EE] text-[#00B074]" :
                user.status === "PENDING"  ? "bg-[#FFF4E3] text-[#F39C12]" :
                user.status === "BLOCKED" || user.status === "REJECTED" ? "bg-[#FFEEEE] text-[#FF5B5B]" :
                "bg-gray-100 text-gray-500"
              }`}>
                Status: {user.status}
              </span>
            </div>
          )}

          {(isJobSeeker || isEmployer || isCompany) && user?.status === "PENDING" && (
            <div className="mt-6 p-4 rounded-2xl border border-amber-200 bg-amber-50/60">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h5 className="text-sm font-bold text-amber-900">Emergency Backup</h5>
                  <p className="text-xs text-amber-800/80">
                    Send a secure link or upload the missing verification files from admin.
                  </p>
                </div>
                <button
                  onClick={handleSendBackupLink}
                  disabled={isSendingBackupLink}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition disabled:opacity-60"
                >
                  {isSendingBackupLink ? "Sending..." : "Send Link"}
                </button>
              </div>

              <div className="space-y-3">
                {backupFieldDefs.map((field) => (
                  <label
                    key={field.key}
                    className="block border border-dashed border-amber-300 rounded-xl bg-white p-3 text-xs text-gray-600 cursor-pointer"
                  >
                    <div className="font-semibold text-gray-700 mb-1">{field.label}</div>
                    <div className="text-amber-700">
                      {backupFiles[field.key] ? backupFiles[field.key].name : "Click to choose file"}
                    </div>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        setBackupFiles((prev) => ({
                          ...prev,
                          [field.key]: e.target.files?.[0] || null,
                        }))
                      }
                    />
                  </label>
                ))}

                <button
                  onClick={handleUploadBackup}
                  disabled={isUploadingBackup}
                  className="w-full px-4 py-2.5 rounded-full text-sm font-bold bg-[#3FAE2A] text-white hover:bg-[#359624] transition disabled:opacity-60"
                >
                  {isUploadingBackup ? "Uploading..." : "Upload Emergency Files"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File/Image Modal */}
      {modalData && (
        <FileModal url={modalData.url} title={modalData.title} onClose={() => setModalData(null)} />
      )}
    </div>
  );
};

// ─── Helper Components ────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <p className="text-gray-800">
    <span className="text-gray-400 block text-xs mb-0.5">{label}:</span>
    {value || <span className="text-gray-300 italic text-xs">Not provided</span>}
  </p>
);

const VerificationItem = ({ label, btnText, url, onView }) => (
  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    {url ? (
      <button onClick={() => onView(url)}
        className="px-4 py-1.5 border border-gray-200 bg-white rounded text-xs font-medium text-gray-700 hover:bg-gray-50 transition">
        {btnText}
      </button>
    ) : (
      <span className="text-xs text-gray-300 italic">Not uploaded</span>
    )}
  </div>
);

export default UserDetails;
