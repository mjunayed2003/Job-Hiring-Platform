
// ─── Standard Imports ──────────────────────────────────
import DashboardHome from "../pages/Main/DashboardHome/DashboardHome";
import JobSeekerApprovals from "../pages/Main/UserApprovels/JobSeekerApprovals";
import EmployeeApprovals from "../pages/Main/UserApprovels/EmployeeApprovals";
import CompanyApprovals from "../pages/Main/UserApprovels/CompanyApprovals";
import UserManagement from "../pages/Main/Users/UserManagement";
import JobPosts from "../pages/Main/JobPosts/JobPosts";
import Interviews from "../pages/Main/Interviews/Interviews";
import PaymentsEscrow from "../pages/Main/PaymentsEscrow/PaymentsEscrow";
import CategoriesPage from "../pages/Main/CategoriesPage/CategoriesPage";
import Subscriptions from "../pages/Main/Subscriptions/Subscriptions";
import Reports from "../pages/Main/Reports";
import ProfilePage from "../pages/Main/Setting/ProfilePage";
import TermsAndCondition from "../pages/Main/Setting/TermsAndCondition";
import PrivacyPolicy from "../pages/Main/Setting/PrivacyPolicy";
import AboutUs from "../pages/Main/Setting/AboutUs";
import AdminSupportPage from "../pages/Main/Support/SupportPage";
import MessagePage from "../pages/Main/Message/MessagePage";
import AdminWithdrawRequests from "../pages/Main/withdraw-requests/withdraw-requests";

// ─── Route Config ─────────────────────────────────────────────────────────────
export const dashboardItems = [
  {
    name: "Dashboard",
    path: "/",
    element: <DashboardHome />
  },
  {
    name: "User Approvals",
    rootPath: "user-approvals",
    children: [
      { name: "Job Seekers", path: "/user-approvals/job-seekers", element: <JobSeekerApprovals /> },
      { name: "Employers", path: "/user-approvals/employers", element: <EmployeeApprovals /> },
      { name: "Companies", path: "/user-approvals/companies", element: <CompanyApprovals /> },
    ],
  },
  {
    name: "User",
    path: "/user",
    element: <UserManagement />,
  },
  {
    name: "Job Posts",
    path: "/job-posts",
    element: <JobPosts />,
  },
  {
    name: "Message",
    path: "/message",
    element: <MessagePage />,
  },
  
  {
    name: "Interviews",
    path: "/interviews",
    element: <Interviews />,
  },
  {
    name: "Payments & Escrow",
    path: "/payments",
    element: <PaymentsEscrow />,
  },
  {
    name: "withdraw-requests",
    path: "/withdraw-requests",
    element: <AdminWithdrawRequests />,
  },
  {
    name: "Categories",
    path: "/categories",
    element: <CategoriesPage />,
  },
  {
    name: "Subscriptions",
    path: "/subscriptions",
    element: <Subscriptions />,
  },
  {
    name: "Reviews & Reports",
    path: "/reviews",
    element: <Reports />,
  },
  {
    name: "Support",
    path: "/support",
    element: <AdminSupportPage />,
  },
  {
    name: "Settings",
    rootPath: "settings",
    children: [
      { name: "Profile", path: "/settings/profile", element: <ProfilePage /> },
      { name: "Terms & Condition", path: "/settings/terms-condition", element: <TermsAndCondition /> },
      { name: "Privacy Policy", path: "/settings/privacy-policy", element: <PrivacyPolicy /> },
      { name: "About Us", path: "/settings/about-us", element: <AboutUs /> },
    ],
  },

];