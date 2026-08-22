import { Button, Checkbox, Input, Form } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLoginMutation, setLogin } from "../../redux/features/Auth/AuthSlice";
import toast from "react-hot-toast";
import logo from "../../assets/images/logo.svg";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  // Redirect path after login
  const from = location.state?.from || "/";

  const onFinish = async (values) => {
    try {
      const res = await login(values).unwrap();
      const token = res?.access_token || res?.data?.access_token;
      const user = res?.user || res?.data?.user;

      if (!token || !user) {
        toast.error("Invalid response from server");
        console.log("Failed Response:", res);
        return;
      }

      // Save in Redux
      dispatch(setLogin({ user, token }));

      // Redirect
      navigate(from, { replace: true });
      toast.success("Login successful");
      
    } catch (error) {
      // Handle network or validation errors
      toast.error(error?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-[#D6F8D6]">
      <div
        className="bg-white rounded-[20px] flex flex-col items-center box-border"
        style={{
          width: "630px",
          paddingTop: "80px",
          paddingBottom: "80px",
          paddingLeft: "54px",
          paddingRight: "54px",
        }}
      >
        {/* Logo and header */}
        <div className="text-center w-full mb-8">
          <img src={logo} alt="HireHubJA" className="h-[150px] mx-auto mb-4 object-contain" />
          <h2 className="text-[30px] font-bold text-gray-900 mb-2">Login to Account</h2>
          <p className="text-[#6B7280] text-[15px]">Please enter your email and password to continue</p>
        </div>

        {/* Form */}
        <Form
          name="login_form"
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
          className="w-full"
        >
          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Email address</label>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Invalid email format" },
              ]}
              className="mb-0"
            >
              <Input
                placeholder="admin@admin.com"
                className="bg-[#F3F4F6] border-none h-[50px] rounded-lg px-4 text-black"
              />
            </Form.Item>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <Form.Item
              name="password"
              rules={[{ required: true, message: "Password is required" }]}
              className="mb-0"
            >
              <Input.Password
                placeholder="**********"
                className="bg-[#F3F4F6] border-none h-[50px] rounded-lg px-4 text-black"
              />
            </Form.Item>
          </div>

          {/* Remember me */}
          <div className="flex justify-between items-center mb-10 mt-6">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className="text-gray-500">Remember Password</Checkbox>
            </Form.Item>
            <a className="text-[#4CAF50] hover:text-[#43a047] text-sm font-medium" href="/auth/forgot-password">
              Forgot Password?
            </a>
          </div>

          {/* Submit */}
          <Form.Item className="mb-0">
            <Button
              htmlType="submit"
              block
              loading={isLoading}
              className="bg-[#4CAF50] hover:bg-[#43a047] text-white font-bold border-none rounded-lg h-[50px] text-[16px]"
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default SignIn;