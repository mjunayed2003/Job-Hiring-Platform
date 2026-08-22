import { Button } from "antd";
import { Form } from "antd";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OTPInput from "react-otp-input";
import Swal from "sweetalert2";
import logo from "../../assets/images/logo.svg";
import {
  useVerifyForgotPasswordOtpMutation,
  useResendForgotPasswordOtpMutation,
} from "../../redux/features/Auth/AuthSlice";

const getStoredExpire = () => {
  const stored = sessionStorage.getItem("otpExpire");
  if (stored) return parseInt(stored, 10);
  const newExpire = Date.now() + 60 * 1000;
  sessionStorage.setItem("otpExpire", newExpire.toString());
  return newExpire;
};

const getRemainingSeconds = (expireAt: number) => {
  const remaining = Math.floor((expireAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
};

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ← id = email (URL থেকে আসছে)
  const [otp, setOtp] = useState("");

  const [verifyOtp, { isLoading }] = useVerifyForgotPasswordOtpMutation();
  const [resendOtp, { isLoading: resendLoading }] = useResendForgotPasswordOtpMutation();

  // ── tempToken এর কোনো দরকার নেই আর ──

  const [expireAt, setExpireAt] = useState<number>(getStoredExpire);
  const [timer, setTimer] = useState<number>(() => getRemainingSeconds(getStoredExpire()));

  useEffect(() => {
    setTimer(getRemainingSeconds(expireAt));
    const interval = setInterval(() => {
      const remaining = getRemainingSeconds(expireAt);
      setTimer(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        sessionStorage.removeItem("otpExpire");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expireAt]);

  // ─── Resend OTP ───
  const handleResend = async () => {
    if (resendLoading) return;
    try {
      await resendOtp({ email: id }).unwrap(); // ← email পাঠাচ্ছি

      // শুধু timer reset, নতুন token দরকার নেই
      const newExpire = Date.now() + 60 * 1000;
      sessionStorage.setItem("otpExpire", newExpire.toString());
      setExpireAt(newExpire);

      Swal.fire({
        icon: "success",
        title: "OTP Resent!",
        text: "Please check your email for the new code.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Failed to resend OTP",
        text: error?.data?.message || "Something went wrong.",
      });
    }
  };

  // ─── Verify OTP ───
  const onFinish = async () => {
    if (!otp || otp.length < 6) {
      Swal.fire({ icon: "error", title: "Invalid OTP", text: "Please enter a valid 6-digit OTP." });
      return;
    }

    try {
      const res: any = await verifyOtp({
        otp,
        email: id  // ← token এর বদলে email পাঠাচ্ছি
      }).unwrap();

      const resetToken = res?.resetToken;
      const mainToken = res?.token;

      if (resetToken) sessionStorage.setItem("resetToken", resetToken);
      if (mainToken) sessionStorage.setItem("token", mainToken);

      sessionStorage.removeItem("otpExpire");

      Swal.fire({
        icon: "success",
        title: "OTP Verified!",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/auth/reset-password", { state: { resetToken } });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: error?.data?.message || "Invalid or expired OTP.",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-[#D6F8D6]">
      <div
        className="bg-white rounded-[20px] flex flex-col items-center"
        style={{
          width: "630px",
          paddingTop: "60px",
          paddingBottom: "60px",
          paddingLeft: "54px",
          paddingRight: "54px",
        }}
      >
        <div className="text-center w-full mb-8">
          <img src={logo} alt="HireHubJA" className="h-[150px] mx-auto mb-4 object-contain" />
          <h2 className="text-[30px] font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-[#6B7280] text-[15px] leading-relaxed">
            We sent a reset code to <b>{id}</b> <br />
            Enter the 6-digit code mentioned in the email.
          </p>
        </div>

        <Form
          name="verify_email"
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
          className="w-full flex flex-col items-center"
        >
          <div className="mb-8 w-full flex justify-center">
            <OTPInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              renderSeparator={<span className="w-4"></span>}
              renderInput={(props) => <input {...props} />}
              inputStyle={{
                width: "60px",
                height: "70px",
                margin: "0 10px",
                fontSize: "24px",
                borderRadius: "12px",
                border: "2px solid #E5E7EB",
                backgroundColor: "#F9FAFB",
                color: "#1A1A1A",
                fontWeight: "600",
                outline: "none",
              }}
            />
          </div>

          <div className="w-full mb-6">
            <Button
              htmlType="submit"
              block
              loading={isLoading}
              className="bg-[#4CAF50] hover:bg-[#43a047] text-white font-bold border-none rounded-lg h-[50px] text-[16px] w-full"
            >
              Verify Code
            </Button>
          </div>

          <div className="text-gray-500 text-sm">
            You have not received the email?{" "}
            {timer > 0 ? (
              <span className="text-gray-400 cursor-not-allowed">
                Resend in {timer}s
              </span>
            ) : (
              <span
                onClick={handleResend}
                className="text-[#4CAF50] font-medium underline cursor-pointer hover:text-green-700"
              >
                {resendLoading ? "Sending..." : "Resend"}
              </span>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
};

export default VerifyEmail;