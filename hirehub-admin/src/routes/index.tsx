// src/routes/index.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Main from "../layouts/Main/Main";
import Auth from "../layouts/Auth/Auth";
import SignIn from "../pages/Auth/SignIn";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import VerifyEmail from "../pages/Auth/VerifyEmail";
import ResetPassword from "../pages/Auth/ResetPassword";
import AdminRoutes from "./AdminRoutes";
import NotFound from "../pages/NotFound/NotFound";
import NotificationPage from "../pages/Main/Notification/NotificationPage";
import AdminSupportPage from "../pages/Main/Support/SupportPage";
import SupportPage from "../pages/Main/Support/SupportPage";
import MessagePage from "../pages/Main/Message/MessagePage";

const DashboardHome = lazy(() => import("../pages/Main/DashboardHome/DashboardHome"));
const JobSeekerApprovals = lazy(() => import("../pages/Main/UserApprovels/JobSeekerApprovals"));
const EmployeeApprovals = lazy(() => import("../pages/Main/UserApprovels/EmployeeApprovals"));
const CompanyApprovals = lazy(() => import("../pages/Main/UserApprovels/CompanyApprovals"));
const UserManagement = lazy(() => import("../pages/Main/Users/UserManagement"));
const JobPosts = lazy(() => import("../pages/Main/JobPosts/JobPosts"));
const ApplicantsPage = lazy(() => import("../pages/Main/JobPosts/Applicants"));
const Interviews = lazy(() => import("../pages/Main/Interviews/Interviews"));
const PaymentsEscrow = lazy(() => import("../pages/Main/PaymentsEscrow/PaymentsEscrow"));
const WithdrawRequests = lazy(() => import("../pages/Main/withdraw-requests/withdraw-requests"));
const CategoriesPage = lazy(() => import("../pages/Main/CategoriesPage/CategoriesPage"));
const Subscriptions = lazy(() => import("../pages/Main/Subscriptions/Subscriptions"));
const Reports = lazy(() => import("../pages/Main/Reports"));
const ProfilePage = lazy(() => import("../pages/Main/Setting/ProfilePage"));
const TermsAndCondition = lazy(() => import("../pages/Main/Setting/TermsAndCondition"));
const PrivacyPolicy = lazy(() => import("../pages/Main/Setting/PrivacyPolicy"));
const AboutUs = lazy(() => import("../pages/Main/Setting/AboutUs"));

const Loader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-[#44B12C] border-t-transparent rounded-full animate-spin" />
  </div>
);

// ✅ Helper function
const S = (Component) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AdminRoutes>
        <Main />
      </AdminRoutes>
    ),
    children: [
      { path: "/", element: S(DashboardHome) },
      { path: "/notifications", element: S(NotificationPage) },
      { path: "/user-approvals/job-seekers", element: S(JobSeekerApprovals) },
      { path: "/user-approvals/employers", element: S(EmployeeApprovals) },
      { path: "/user-approvals/companies", element: S(CompanyApprovals) },
      { path: "/user", element: S(UserManagement) },
      { path: "/job-posts", element: S(JobPosts) },
      { path: "/message", element: S(MessagePage) },
      { path: "/jobs/:id/applicants", element: S(ApplicantsPage) },
      { path: "/interviews", element: S(Interviews) },
      { path: "/payments", element: S(PaymentsEscrow) },
      { path: "/withdraw-requests", element: S(WithdrawRequests) },
      { path: "/categories", element: S(CategoriesPage) },
      { path: "/subscriptions", element: S(Subscriptions) },
      { path: "/reviews", element: S(Reports) },
      { path: "/settings/profile", element: S(ProfilePage) },
      { path: "/settings/terms-condition", element: S(TermsAndCondition) },
      { path: "/settings/privacy-policy", element: S(PrivacyPolicy) },
      { path: "/settings/about-us", element: S(AboutUs) },
      { path: "/support", element: S(SupportPage) },
    ],
  },
  {
    path: "/auth",
    element: <Auth />,
    children: [
      { path: "/auth", element: <Navigate to="/auth/sign-in" /> },
      { path: "/auth/sign-in", element: <SignIn /> },
      { path: "/auth/forgot-password", element: <ForgotPassword /> },
      { path: "/auth/verify-email/:id", element: <VerifyEmail /> },
      { path: "/auth/reset-password", element: <ResetPassword /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

export default router;