import { Button, Input } from "antd";
import { Form } from "antd";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import logo from "../../assets/images/logo.svg";
// we'll call the reset endpoint directly to ensure Authorization header is sent

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp } = location.state || {};

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const onFinish = async (values: any) => {
    try {
      if (values.password !== values.confirmPassword) {
        throw new Error("Passwords do not match!");
      }

      const resetToken = location.state?.resetToken || sessionStorage.getItem("resetToken") || sessionStorage.getItem("tempToken");

      if (!resetToken) throw new Error("Missing reset token");

      setIsLoading(true);
      const base = import.meta.env.VITE_SERVER_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${base}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(resetToken ? { Authorization: `Bearer ${resetToken}` } : {}),
        },
        body: JSON.stringify({ newPassword: values.password }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) throw new Error(data?.message || "Failed to reset password");

      sessionStorage.removeItem("resetToken");
      sessionStorage.removeItem("tempToken");
      sessionStorage.removeItem("otpExpire");
      setShowSuccess(true);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Failed !!",
        text: error?.data?.message || error?.message || "Something went wrong. Please try again.",
      });
    }
  };

  const handleContinue = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-[#D6F8D6]">
      <div
        className="bg-white rounded-[20px] flex flex-col items-center"
        style={{
          width: '630px',
          paddingTop: '60px',
          paddingBottom: '60px',
          paddingLeft: '54px',
          paddingRight: '54px',
        }}
      >
        <div className="mb-6">
          <img
            src={logo}
            alt="HireHubJA"
            className="h-[150px] mx-auto object-contain"
          />
        </div>

        {!showSuccess ? (
          /* ==================== FORM VIEW ==================== */
          <>
            <div className="text-center w-full mb-8">
              <h2 className="text-[30px] font-bold text-gray-900 mb-2">
                Set a new password
              </h2>
              <p className="text-[#6B7280] text-[15px] max-w-md mx-auto leading-relaxed">
                Create a new password. Ensure it differs from <br /> previous ones for security.
              </p>
            </div>

            <Form
              name="reset_password"
              layout="vertical"
              requiredMark={false}
              onFinish={onFinish}
              className="w-full"
            >
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">New Password</label>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: "Password is required!" }]}
                  className="mb-0"
                >
                  <Input.Password
                    placeholder="**********"
                    className="bg-[#F3F4F6] border-none hover:bg-[#F3F4F6] focus:bg-white focus:ring-1 focus:ring-green-500 h-[50px] rounded-lg text-gray-700 px-4"
                  />
                </Form.Item>
              </div>

              <div className="mb-8">
                <label className="block text-gray-700 font-medium mb-2">Confirm Password</label>
                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: "Please confirm your password!" },
                  ]}
                  className="mb-0"
                >
                  <Input.Password
                    placeholder="**********"
                    className="bg-[#F3F4F6] border-none hover:bg-[#F3F4F6] focus:bg-white focus:ring-1 focus:ring-green-500 h-[50px] rounded-lg text-gray-700 px-4"
                  />
                </Form.Item>
              </div>

              <Form.Item className="mb-0">
                <Button
                  htmlType="submit"
                  block
                  loading={isLoading}
                  className="bg-[#4CAF50] hover:bg-[#43a047] text-white font-bold border-none rounded-lg h-[50px] text-[16px]"
                >
                  Update Password
                </Button>
              </Form.Item>
            </Form>
          </>
        ) : (
          /* ==================== SUCCESS VIEW ==================== */
          <>
            <div className="text-center w-full mb-8">
              <h2 className="text-[30px] font-bold text-gray-900 mb-4">
                Successfully
              </h2>
              <p className="text-[#6B7280] text-[15px] max-w-lg mx-auto leading-relaxed">
                Your password has been updated, please change your password regularly to avoid this happening
              </p>
            </div>

            <div className="w-full">
              <Button
                onClick={handleContinue}
                block
                className="bg-[#4CAF50] hover:bg-[#43a047] text-white font-bold border-none rounded-lg h-[50px] text-[16px]"
              >
                Continue
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;