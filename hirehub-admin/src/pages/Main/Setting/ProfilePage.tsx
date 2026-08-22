import React, { useState, useRef, useEffect } from "react";
import { FaCamera, FaArrowLeft, FaEye, FaEyeSlash, FaLock, FaRegEnvelope, FaTrash, FaUserCircle } from "react-icons/fa";
import { MdEdit, MdCheck } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentUser, selectCurrentToken, setLogin,
  useGetProfileQuery, useUpdateProfileMutation,
  useChangePasswordMutation, useForgotPasswordMutation,
  useResetPasswordMutation, useVerifyOtpMutation, useResendOtpMutation,
} from "../../../redux/features/Auth/AuthSlice";
import toast from "react-hot-toast";
import profile from "../../../assets/images/profile.png";
import { useCreateAdminMutation, useGetAllAdminsQuery, useDeleteAdminMutation } from "../../../redux/features/adminSlice/adminSlice";
import { useGetPlatformFeeQuery, useSetPlatformFeeMutation } from "../../../redux/features/settingsApi/settingsApi";

const UserProfileSettings = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);

  const [isEditing, setIsEditing] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [profileImage, setProfileImage] = useState(profile);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", location: "",
  });

  const { data: profileData, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPass }] = useChangePasswordMutation();
  const [forgotPassword, { isLoading: isSendingOtp }] = useForgotPasswordMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResendingOtp }] = useResendOtpMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  // Admin mutations
  const [createAdmin, { isLoading: isCreatingAdmin }] = useCreateAdminMutation();
  const { data: adminsData, refetch: refetchAdmins } = useGetAllAdminsQuery(undefined);
  const [deleteAdmin, { isLoading: isDeletingAdmin }] = useDeleteAdminMutation();
  const [imageError, setImageError] = useState(false);

  // Platform Fee settings state & queries
  const [platformFeePercent, setPlatformFeePercent] = useState("");
  const { data: platformFeeData, refetch: refetchPlatformFee } = useGetPlatformFeeQuery(undefined);
  const [setPlatformFee, { isLoading: isSettingFee }] = useSetPlatformFeeMutation();

  useEffect(() => {
    if (platformFeeData?.data?.percent !== undefined) {
      setPlatformFeePercent(String(platformFeeData.data.percent));
    }
  }, [platformFeeData]);

  const handleSavePlatformFee = async () => {
    const feeNum = parseFloat(platformFeePercent);
    if (isNaN(feeNum) || feeNum < 0 || feeNum > 100) {
      toast.error("Please enter a valid percentage between 0 and 100");
      return;
    }
    try {
      await setPlatformFee(feeNum).unwrap();
      toast.success("Platform fee updated successfully!");
      refetchPlatformFee();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update platform fee");
    }
  };

  useEffect(() => {
    const data = profileData?.data || user;
    if (data) {
      setFormData({
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
      });
      if (data.profilePic && !data.profilePic.includes("undefined")) {
        const base = (import.meta.env.VITE_SERVER_URL || import.meta.env.NEXT_PUBLIC_API_URL)?.replace(/\/$/, "");
        setProfileImage(`${base}${data.profilePic}`);
      }
    }
  }, [profileData, user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setProfileImage(URL.createObjectURL(file));
      setImageError(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const fd = new FormData();
      fd.append("fullName", formData.fullName);
      fd.append("phone", formData.phone);
      fd.append("location", formData.location);
      if (imageFile) fd.append("profilePic", imageFile);

      const res = await updateProfile(fd).unwrap();
      const updatedUser = res?.data ? { ...user, ...res.data } : { ...user, fullName: formData.fullName };
      dispatch(setLogin({ user: updatedUser, token }));
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setImageFile(null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update profile");
    }
  };



  const closeModal = () => setActiveModal(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mt-4">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Profile</h2>
          <div className="border-b border-dashed border-gray-300 mb-10"></div>

          <div className="flex flex-col md:flex-row gap-10">
            {/* LEFT */}
            <div className="w-full md:w-[350px] bg-[#F9FAFB] rounded-2xl p-8 flex flex-col items-center h-fit">
              <div className="relative mb-4 group">
                {(!profileImage || imageError) ? (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-sm bg-gray-100 flex items-center justify-center">
                    <FaUserCircle size={80} className="text-gray-300" />
                  </div>
                ) : (
                  <img
                    src={profileImage}
                    alt="Profile"
                    onError={() => setImageError(true)}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-sm"
                  />
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow text-gray-500 hover:text-green-600 hover:scale-110 transition cursor-pointer"
                  >
                    <FaCamera size={14} />
                  </button>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{formData.fullName || "Admin"}</h3>
              <p className="text-gray-400 text-sm mb-6">Administrator</p>
              <div className="flex gap-3 w-full flex-col">
                <button onClick={() => setActiveModal('changePass')} className="w-full bg-[#43B948] hover:bg-green-600 text-white py-2.5 rounded-lg text-xs font-bold transition">
                  Change password
                </button>
                <button
                  onClick={() => { setIsEditing(!isEditing); setImageFile(null); }}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-2 ${isEditing ? "bg-red-50 text-red-500 border border-red-200" : "bg-[#EAEAEA] hover:bg-gray-300 text-gray-600"}`}
                >
                  {isEditing ? "Cancel" : <><MdEdit size={14} /> Edit Profile</>}
                </button>
                {/* NEW BUTTONS */}
                <button onClick={() => { setActiveModal('addAdmin'); refetchAdmins(); }} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg text-xs font-bold transition">
                  Add Admin
                </button>
                <button onClick={() => { setActiveModal('deleteAdmin'); refetchAdmins(); }} className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-xs font-bold transition">
                  Delete Admin
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex-1 space-y-6">
              <ProfileInput label="Full Name" name="fullName" value={formData.fullName} isEditing={isEditing} onChange={handleInputChange} />
              <ProfileInput label="Email Address" name="email" value={formData.email} isEditing={false} onChange={handleInputChange} />
              <ProfileInput label="Phone Number" name="phone" value={formData.phone} placeholder="Enter your phone number" isEditing={isEditing} onChange={handleInputChange} />
              <ProfileInput label="Location" name="location" value={formData.location} placeholder="Enter your location" isEditing={isEditing} onChange={handleInputChange} />
              <div className="pt-2">
                {isEditing ? (
                  <button onClick={handleSaveChanges} disabled={isUpdating} className="flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold text-white bg-[#43B948] hover:bg-green-600 transition shadow-lg disabled:opacity-60">
                    {isUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MdCheck size={18} />}
                    Save Changes
                  </button>
                ) : (
                  <button className="opacity-0 cursor-default px-8 py-3">Placeholder</button>
                )}
              </div>

              {/* Platform Fee Setting Section */}
              <div className="mt-8 border-t border-dashed border-gray-200 pt-6">
                <h4 className="text-sm font-bold text-gray-800 mb-2">Platform Charge Setting</h4>
                <p className="text-xs text-gray-500 mb-4">Set the platform fee percentage applied to employer payments.</p>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-[200px]">
                    <input
                      type="number"
                      placeholder="e.g. 3"
                      value={platformFeePercent}
                      onChange={(e) => setPlatformFeePercent(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/10 shadow-sm"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                  </div>
                  <button
                    onClick={handleSavePlatformFee}
                    disabled={isSettingFee}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#43B948] hover:bg-green-600 transition shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {isSettingFee ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MdCheck size={18} />
                    )}
                    Update Fee
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto">

            {activeModal === 'changePass' && (
              <ChangePasswordModal
                onBack={closeModal}
                onForgot={() => setActiveModal({ name: 'forgot' })}
                changePassword={changePassword}
                isLoading={isChangingPass}
                onClose={closeModal}
              />
            )}

            {activeModal?.name === 'forgot' && (
              <ForgotPasswordModal
                onBack={() => setActiveModal('changePass')}
                forgotPassword={forgotPassword}
                isLoading={isSendingOtp}
                onNext={(email) => setActiveModal({ name: 'otp', email })}
              />
            )}

            {activeModal?.name === 'otp' && (
              <OtpModal
                onBack={() => setActiveModal({ name: 'forgot' })}
                email={activeModal.email}
                verifyOtp={verifyOtp}
                isLoading={isVerifying}
                onNext={(otp, resetToken) => {
                  // persist resetToken for standalone pages as well
                  if (resetToken) sessionStorage.setItem('resetToken', resetToken);
                  setActiveModal({ name: 'reset', email: activeModal.email, otp, resetToken });
                }}
              />
            )}

            {activeModal?.name === 'reset' && (
              <ResetPasswordModal
                onBack={() => setActiveModal({ name: 'otp', email: activeModal.email })}
                resetPassword={resetPassword}
                isLoading={isResetting}
                email={activeModal.email}
                otp={activeModal.otp}
                resetToken={activeModal.resetToken}
                onClose={closeModal}
              />
            )}

            {activeModal === 'addAdmin' && (
              <AddAdminModal
                onBack={closeModal}
                createAdmin={createAdmin}
                isLoading={isCreatingAdmin}
                onClose={closeModal}
                onSuccess={() => { refetchAdmins(); closeModal(); }}
              />
            )}

            {activeModal === 'deleteAdmin' && (
              <DeleteAdminModal
                onBack={closeModal}
                admins={adminsData?.data || []}
                deleteAdmin={deleteAdmin}
                isLoading={isDeletingAdmin}
                onSuccess={() => { refetchAdmins(); }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Change Password Modal ───────────────────────────────────────
const ChangePasswordModal = ({ onBack, onForgot, changePassword, isLoading, onClose }) => {
  const [passData, setPassData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const handleChange = (e) => setPassData({ ...passData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (passData.newPassword !== passData.confirmPassword) return toast.error("Passwords do not match!");
    try {
      await changePassword(passData).unwrap();
      toast.success("Password changed successfully!");
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to change password");
    }
  };

  return (
    <>
      <ModalHeader title="Change Password" onBack={onBack} />
      <p className="text-gray-500 text-sm mb-6">Your password must be 8+ characters long.</p>
      <div className="space-y-4">
        <PasswordInput label="Current password" placeholder="Enter current password" name="currentPassword" value={passData.currentPassword} onChange={handleChange} />
        <PasswordInput label="New password" placeholder="Set new password" name="newPassword" value={passData.newPassword} onChange={handleChange} />
        <PasswordInput label="Re-enter new password" placeholder="Re-enter new password" name="confirmPassword" value={passData.confirmPassword} onChange={handleChange} />
      </div>
      <div className="mt-4 mb-6 text-right">
        <button onClick={onForgot} className="text-[#43B948] text-sm hover:underline font-medium">Forget password?</button>
      </div>
      <ActionButton text={isLoading ? "Updating..." : "Update password"} onClick={handleSubmit} disabled={isLoading} />
    </>
  );
};

// ─── Forgot Password Modal ───────────────────────────────────────
const ForgotPasswordModal = ({ onBack, forgotPassword, isLoading, onNext }) => {
  const [email, setEmail] = useState("");

  const handleSend = async () => {
    if (!email) return toast.error("Please enter your email");
    try {
      await forgotPassword({ email }).unwrap();
      toast.success("OTP sent to your email!");
      onNext(email);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send OTP");
    }
  };

  return (
    <>
      <ModalHeader title="Forgot Password" onBack={onBack} />
      <p className="text-gray-500 text-sm mb-8">Please enter your email address to reset your password</p>
      <div className="relative mb-8">
        <FaRegEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
        <input
          type="email" placeholder="Enter your Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-[#F9FAFB] rounded-lg text-sm outline-none border border-transparent focus:border-[#43B948] transition"
        />
      </div>
      <ActionButton text={isLoading ? "Sending..." : "Send OTP"} onClick={handleSend} disabled={isLoading} />
    </>
  );
};

// ─── OTP Modal ───────────────────────────────────────────────────
const OtpModal = ({ onBack, email, verifyOtp, isLoading, onNext }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) return toast.error("Please enter complete OTP");
    try {
      const res = await verifyOtp({ otp: otpString, email }).unwrap();
      // extract token from various response shapes
      const token = res?.data?.tempToken || res?.data?.data?.tempToken || res?.tempToken || res?.token || res?.data?.token || res?.data?.otpToken;
      toast.success("OTP verified!");
      onNext(otpString, token);
    } catch (error) {
      toast.error(error?.data?.message || "Invalid OTP");
    }
  };

  return (
    <>
      <ModalHeader title="Verify Email" onBack={onBack} />
      <p className="text-gray-500 text-sm mb-2">OTP sent to <span className="font-semibold text-gray-700">{email}</span></p>
      <p className="text-gray-500 text-sm mb-8">Please enter the 6 digit OTP.</p>
      <div className="flex justify-between gap-3 mb-8">
        {otp.map((digit, i) => (
          <input
            key={i} id={`otp-${i}`} maxLength={1} value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            className="w-12 h-12 bg-[#F9FAFB] rounded-lg text-center text-lg font-bold text-gray-700 outline-none border border-transparent focus:border-[#43B948] transition"
          />
        ))}
      </div>
      <ActionButton text={isLoading ? "Verifying..." : "Verify"} onClick={handleVerify} disabled={isLoading} />
    </>
  );
};

// ─── Reset Password Modal ────────────────────────────────────────
const ResetPasswordModal = ({ onBack, resetPassword, isLoading, email, otp, resetToken, onClose }) => {
  const [passData, setPassData] = useState({ newPassword: "", confirmPassword: "" });

  const handleSubmit = async () => {
    if (!passData.newPassword) return toast.error("Please enter new password");
    if (passData.newPassword !== passData.confirmPassword) return toast.error("Passwords do not match!");
    try {
      const tokenToUse = resetToken || sessionStorage.getItem('resetToken');
      if (!tokenToUse) return toast.error("Missing reset token");
      await resetPassword({ resetToken: tokenToUse, newPassword: passData.newPassword }).unwrap();
      // clear persisted token
      sessionStorage.removeItem('resetToken');
      toast.success("Password reset successfully!");
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to reset password");
    }
  };

  return (
    <>
      <ModalHeader title="Reset Password" onBack={onBack} />
      <p className="text-gray-500 text-sm mb-6">Your password must be 8+ characters long.</p>
      <div className="space-y-6 mb-8">
        <PasswordInput placeholder="Set your password" label="New password" name="newPassword" value={passData.newPassword} onChange={(e) => setPassData({ ...passData, [e.target.name]: e.target.value })} />
        <PasswordInput placeholder="Re-enter password" label="Re-enter password" name="confirmPassword" value={passData.confirmPassword} onChange={(e) => setPassData({ ...passData, [e.target.name]: e.target.value })} />
      </div>
      <ActionButton text={isLoading ? "Resetting..." : "Reset Password"} onClick={handleSubmit} disabled={isLoading} />
    </>
  );
};

// ─── Add Admin Modal ──────────────────────────────────────────────
const AddAdminModal = ({ onBack, createAdmin, isLoading, onClose, onSuccess }) => {
  const [adminData, setAdminData] = useState({ fullName: "", email: "", password: "" });

  const handleChange = (e) => {
    setAdminData({ ...adminData, [e.target.name]: e.target.value });
  };

  const handleBack = () => onBack();

  const handleSubmit = async () => {
    if (!adminData.fullName) return toast.error("Please enter full name");
    if (!adminData.email) return toast.error("Please enter email");
    if (!adminData.password) return toast.error("Please enter password");

    try {
      await createAdmin(adminData).unwrap();
      toast.success("Admin created successfully!");
      onSuccess();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create admin");
    }
  };
  return (
    <>
      <ModalHeader title="Add Admin" onBack={handleBack} />

      <>
        <>
          <p className="text-gray-500 text-sm mb-6">Create a new admin account</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Full Name</label>
              <input
                type="text" name="fullName" value={adminData.fullName} onChange={handleChange} placeholder="Enter full name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#43B948] focus:ring-2 focus:ring-[#43B948]/20 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Email Address</label>
              <input
                type="email" name="email" value={adminData.email} onChange={handleChange} placeholder="Enter email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#43B948] focus:ring-2 focus:ring-[#43B948]/20 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Password</label>
              <input
                type="password" name="password" value={adminData.password} onChange={handleChange} placeholder="Enter password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#43B948] focus:ring-2 focus:ring-[#43B948]/20 transition"
              />
            </div>
          </div>
          <div className="mt-6">
            <ActionButton text={isLoading ? "Creating..." : "Create Admin"} onClick={handleSubmit} disabled={isLoading} />
          </div>
        </>
      </>
    </>
  );
};

// ─── Delete Admin Modal ───────────────────────────────────────────
const DeleteAdminModal = ({ onBack, admins, deleteAdmin, isLoading, onSuccess }) => {
  const [selectedAdminId, setSelectedAdminId] = useState(null);

  const handleDelete = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;

    try {
      await deleteAdmin(adminId).unwrap();
      toast.success("Admin deleted successfully!");
      onSuccess();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete admin");
    }
  };

  return (
    <>
      <ModalHeader title="Delete Admin" onBack={onBack} />
      <p className="text-gray-500 text-sm mb-6">Select an admin to delete</p>

      {admins && admins.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{admin.fullName}</p>
                <p className="text-sm text-gray-600">{admin.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className={`px-2 py-1 rounded text-white text-xs ${admin.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {admin.status}
                  </span>
                </p>
              </div>
              <button
                onClick={() => handleDelete(admin.id)}
                disabled={isLoading}
                className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-60"
              >
                <FaTrash size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No admins found</p>
        </div>
      )}
    </>
  );
};

// ─── Helper Components ───────────────────────────────────────────
const ProfileInput = ({ label, name, value, isEditing, onChange, placeholder }: any) => (
  <div>
    <label className="block text-sm font-bold text-gray-800 mb-2">{label}</label>
    <input
      type="text" name={name} value={value} onChange={onChange} readOnly={!isEditing} placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl border text-sm transition outline-none ${isEditing ? "bg-white border-green-500 text-gray-800 focus:ring-4 focus:ring-green-500/10 shadow-sm" : "bg-white border-gray-200 text-gray-500 cursor-default"}`}
    />
  </div>
);

const PasswordInput = ({ placeholder, label, name, value, onChange }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && <label className="block text-gray-800 text-sm font-medium mb-2">{label}</label>}
      <div className="relative">
        <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={show ? "text" : "password"} placeholder={placeholder} name={name} value={value} onChange={onChange}
          className="w-full pl-10 pr-10 py-3.5 bg-[#F9FAFB] rounded-lg text-sm outline-none border border-transparent focus:border-[#43B948] transition"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
};

const ModalHeader = ({ title, onBack }: any) => (
  <div className="flex items-center gap-4 mb-4">
    <button onClick={onBack} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition">
      <FaArrowLeft size={18} />
    </button>
    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
  </div>
);

const ActionButton = ({ text, onClick, disabled }: any) => (
  <button onClick={onClick} disabled={disabled}
    className="w-full bg-[#43B948] hover:bg-green-600 text-white py-3.5 rounded-lg font-bold text-sm transition shadow-md active:scale-[0.99] disabled:opacity-60">
    {text}
  </button>
);

export default UserProfileSettings;