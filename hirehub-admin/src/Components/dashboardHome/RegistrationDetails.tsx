import React, { useEffect, useState } from "react";
import {
  useGetUserByIdQuery,
  useApproveUserMutation,
  useRejectUserMutation,
  useSendMailMutation,
  useSendVerificationBackupLinkMutation,
  useUploadVerificationBackupMutation,
} from "../../redux/features/users/UsersApi.js";
import toast from "react-hot-toast";
import { FaUserCircle } from "react-icons/fa";

const SIGNIN_URL = "https://hirehubja.com/auth/signin";
type BackupKey = "idCardFront" | "idCardBack" | "selfieImage";
type CompanyBackupKey = "licenseFile";
const BACKUP_FIELDS: { key: BackupKey; label: string }[] = [
  { key: "idCardFront", label: "Government ID Front" },
  { key: "idCardBack", label: "Government ID Back" },
  { key: "selfieImage", label: "Selfie (optional)" },
];

const getMissingVerificationItems = (user, profile) => {
  if (!user) return [];

  if (user.role === "JOB_SEEKER") {
    return [
      !profile?.idCardFront && "Government ID (Front)",
      !profile?.idCardBack && "Government ID (Back)",
      !profile?.selfieImage && "Captured Selfie",
    ].filter(Boolean);
  }

  if (user.role === "EMPLOYER") {
    return [
      !profile?.idCardFront && "Government ID (Front)",
      !profile?.idCardBack && "Government ID (Back)",
      !profile?.selfieImage && "Selfie Image",
    ].filter(Boolean);
  }

  if (user.role === "COMPANY") {
    return [
      !profile?.licenseFile && "License File",
    ].filter(Boolean);
  }

  return [];
};

// ─── Mail Modal ───────────────────────────────────────────────
const MailModal = ({ user, missingItems = [], onClose, onSend, isSending }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    const fullName =
      user?.jobSeekerProfile?.fullName ||
      user?.employerProfile?.companyName ||
      user?.fullName ||
      "User";

    const missingLine = missingItems.length
      ? `We noticed the following verification items are still missing: ${missingItems.join(", ")}.\n\nPlease log in to your account and complete your profile by uploading the required documents.`
      : "Your account registration has been approved. You can now sign in using the link below:";

    setSubject(
      missingItems.length
        ? "Action required: complete your Hire Hub JA verification"
        : "Your Hire Hub JA application update"
    );
    setMessage(
      `Hi ${fullName},\n\n${missingLine}\n\n${SIGNIN_URL}\n\nBest regards,\nHire Hub JA Team`
    );
  }, [user, missingItems]);

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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
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
              rows={7}
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

// ─── Image/File Modal ─────────────────────────────────────────────────
const FileModal = ({ url, title, onClose }) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    {/* max-h-[90vh] added to prevent the modal from exceeding the screen height */}
    <div className="bg-white w-full max-w-3xl rounded-xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl leading-none">&times;</button>
      </div>

      {/* overflow-y-auto added here for scrollability if the image is too tall */}
      <div className="flex-1 overflow-y-auto bg-gray-100 flex justify-center p-6">
        {url?.toLowerCase().endsWith(".pdf") ? (
          <iframe src={url} className="w-full min-h-[60vh]" title={title} />
        ) : (
          // max-h-[70vh] limits the image height to 70% of the viewport height
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
const RegistrationDetails = ({ user: rowData, onBack, onActionDone }) => {
  const [modalData, setModalData] = useState(null);
  const [mailTarget, setMailTarget] = useState(null);
  const [backupFiles, setBackupFiles] = useState<Record<string, File | null>>({
    idCardFront: null,
    idCardBack: null,
    selfieImage: null,
    licenseFile: null,
  });
  const baseUrl = import.meta.env.VITE_SERVER_URL?.replace(/\/$/, "");

  const userId = rowData?.userId || rowData?.id;
  const { data, isLoading } = useGetUserByIdQuery(userId, { skip: !userId });
  const [approveUser, { isLoading: isApproving }] = useApproveUserMutation();
  const [rejectUser, { isLoading: isRejecting }] = useRejectUserMutation();
  const [sendMail, { isLoading: isSending }] = useSendMailMutation();
  const [sendVerificationBackupLink, { isLoading: isSendingBackupLink }] = useSendVerificationBackupLinkMutation();
  const [uploadVerificationBackup, { isLoading: isUploadingBackup }] = useUploadVerificationBackupMutation();

  const user = data?.data || {};
  const profile = user?.jobSeekerProfile || user?.employerProfile || {};
  const missingVerificationItems = getMissingVerificationItems(user, profile);
  const canSendReminderMail = user?.status === "PENDING" && missingVerificationItems.length > 0;

  const isJobSeeker = user?.role === "JOB_SEEKER";
  const isEmployer = user?.role === "EMPLOYER";
  const isCompany = user?.role === "COMPANY";
  const backupFieldDefs =
    isCompany
      ? [{ key: "licenseFile" as CompanyBackupKey, label: "Business License / Registration File" }]
      : BACKUP_FIELDS;

  const imgUrl = (path) =>
    path && !path.includes("undefined") ? `${baseUrl}${path}` : null;

  const profilePic = imgUrl(profile?.profilePic) || null;

  const handleApprove = async () => {
    try {
      await approveUser(userId).unwrap();
      toast.success("User approved!");
      onBack();
      onActionDone?.();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to approve");
    }
  };

  const handleDecline = async () => {
    try {
      await rejectUser(userId).unwrap();
      toast.success("User rejected!");
      onBack();
      onActionDone?.();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to reject");
    }
  };

  const handleSendMail = async ({ to, subject, message }) => {
    try {
      await sendMail({ to, subject, message }).unwrap();
      toast.success("Mail sent successfully!");
      setMailTarget(null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send mail");
    }
  };

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
        Object.values(backupFiles).some(Boolean);

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
      onActionDone?.();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to upload emergency files");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 font-sans w-full max-w-[1400px] mx-auto my-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-dashed border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>
          <h3 className="text-xl font-bold text-gray-800">New Registration Approval Requests</h3>
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
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-50 shadow-sm bg-gray-100 flex items-center justify-center">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                    const next = e.currentTarget.nextSibling as HTMLElement | null;
                    if (next) next.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-full h-full items-center justify-center"
                style={{ display: profilePic ? "none" : "flex" }}
              >
                <FaUserCircle size={80} className="text-gray-300" />
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <InfoRow label="Full Name" value={profile?.fullName} />
            <InfoRow label="Email" value={user?.email} />
            <InfoRow label="Phone" value={profile?.phone} />
            <InfoRow label="Location" value={profile?.location} />

            {/* Job Seeker specific */}
            {isJobSeeker && (
              <>
                <InfoRow label="Gender" value={profile?.gender} />
                <InfoRow label="Experience Level" value={profile?.experienceLevel} />
                <InfoRow label="Preferred Categories" value={profile?.preferredJobCategories?.map(c => c.name).join(", ")} />
              </>
            )}

            {/* Company specific */}
            {isCompany && (
              <>
                <InfoRow label="Business Reg Cert ID" value={profile?.businessRegCertId} />
                <InfoRow label="Tax ID" value={profile?.taxId} />
                <InfoRow label="Authorized Rep Name" value={profile?.authorizedRepId} />
              </>
            )}

            {/* About text for all roles if it exists */}
            {profile?.about && (
              <div className="pt-1">
                <span className="text-gray-400 block text-xs mb-1">About:</span>
                <p className="text-gray-700 leading-relaxed">{profile.about}</p>
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
                      <InfoRow label="Qualification" value={edu.degreeName} />
                      <InfoRow label="Institution" value={edu.institution} />
                      <InfoRow label="Started Year" value={edu.startDate ? new Date(edu.startDate).getFullYear() : null} />
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
                        <InfoRow label="Designation" value={exp.designation} />
                        <InfoRow label="Company" value={exp.companyName} />
                        <InfoRow label="Started" value={exp.startDate ? new Date(exp.startDate).getFullYear() : null} />
                        <InfoRow label="Ended" value={exp.isCurrent ? "Present" : exp.endDate ? new Date(exp.endDate).getFullYear() : null} />
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

          {/* Employer / Company (If you want to show anything else in column 2, like expanded About or other details. Kept simple based on your design) */}
          {(isEmployer || isCompany) && (
            <div>
              <h4 className="font-bold text-gray-800 mb-3 text-sm">• Additional Details</h4>
              <p className="text-sm text-gray-500">
                {isCompany ? "Company information is listed in the profile section." : "Employer information is listed in the profile section."}
              </p>
            </div>
          )}
        </div>

        {/* ── Column 3: Verification ── */}
        <div className="lg:col-span-4 flex flex-col">
          <h4 className="font-bold text-gray-800 mb-4 text-sm">• Verification</h4>

          <div className="space-y-4 flex-1">

            {/* Job Seeker verification docs */}
            {isJobSeeker && (
              <>
                <VerificationItem label="Government ID (Front):" btnText="View Front" url={imgUrl(profile?.idCardFront)} onView={(url) => setModalData({ url, title: "ID Card Front" })} />
                <VerificationItem label="Government ID (Back):" btnText="View Back" url={imgUrl(profile?.idCardBack)} onView={(url) => setModalData({ url, title: "ID Card Back" })} />
                <VerificationItem label="Captured Selfie:" btnText="View Selfie" url={imgUrl(profile?.selfieImage)} onView={(url) => setModalData({ url, title: "Selfie" })} />
              </>
            )}

            {/* Employer verification docs */}
            {isEmployer && (
              <>
                <VerificationItem label="Government ID (Front):" btnText="View Front" url={imgUrl(profile?.idCardFront)} onView={(url) => setModalData({ url, title: "ID Card Front" })} />
                <VerificationItem label="Government ID (Back):" btnText="View Back" url={imgUrl(profile?.idCardBack)} onView={(url) => setModalData({ url, title: "ID Card Back" })} />
                <VerificationItem label="Selfie Image:" btnText="View Selfie" url={imgUrl(profile?.selfieImage)} onView={(url) => setModalData({ url, title: "Selfie" })} />
              </>
            )}

            {/* Company verification docs */}
            {isCompany && (
              <>
                <VerificationItem label="License File:" btnText="View License" url={imgUrl(profile?.licenseFile)} onView={(url) => setModalData({ url, title: "License File" })} />
              </>
            )}

            {(isJobSeeker || isEmployer || isCompany) && user?.status === "PENDING" && (
              <div className="mt-4 p-4 rounded-2xl border border-amber-200 bg-amber-50/60">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h5 className="text-sm font-bold text-amber-900">Emergency Backup</h5>
                    <p className="text-xs text-amber-800/80">
                      Use this only if the user cannot complete the required verification step.
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

          {/* Approve / Decline buttons */}
          {user?.status === "PENDING" && (
            <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-dashed border-gray-200">
              {canSendReminderMail && (
                <button
                  onClick={() => setMailTarget(user)}
                  className="bg-[#EEF4FF] text-[#3B82F6] px-8 py-2.5 rounded-full text-sm font-bold hover:bg-blue-500 hover:text-white transition"
                >
                  Mail
                </button>
              )}
              <button onClick={handleApprove} disabled={isApproving}
                className="bg-[#E6F6EC] text-[#28C76F] px-8 py-2.5 rounded-full text-sm font-bold hover:bg-green-100 transition disabled:opacity-60">
                {isApproving ? "Approving..." : "Approve"}
              </button>
              <button onClick={handleDecline} disabled={isRejecting}
                className="bg-[#FFEEEE] text-[#FF5B5B] px-8 py-2.5 rounded-full text-sm font-bold hover:bg-red-100 transition disabled:opacity-60">
                {isRejecting ? "Declining..." : "Decline"}
              </button>
            </div>
          )}

          {user?.status && user.status !== "PENDING" && (
            <div className="flex justify-end mt-10 pt-6 border-t border-dashed border-gray-200">
              <span className={`px-6 py-2 rounded-full text-sm font-bold ${user.status === "ACTIVE" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                }`}>
                {user.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* File/Image Modal */}
      {modalData && (
        <FileModal url={modalData.url} title={modalData.title} onClose={() => setModalData(null)} />
      )}

      {/* Mail Modal */}
      {mailTarget && (
        <MailModal
          user={mailTarget}
          missingItems={missingVerificationItems}
          onClose={() => setMailTarget(null)}
          onSend={handleSendMail}
          isSending={isSending}
        />
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

export default RegistrationDetails;
