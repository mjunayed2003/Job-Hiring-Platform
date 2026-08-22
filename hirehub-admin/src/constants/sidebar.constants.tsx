// src/constants/sidebar.constants.js

export const sidebarItems = [
  {
    name: "Dashboard",
    path: "/",
    rootPath: null,
  },
  {
    name: "User Approvals",
    rootPath: "user-approvals",
    children: [
      { name: "Job Seekers", path: "/user-approvals/job-seekers" },
      { name: "Employers",   path: "/user-approvals/employers"   },
      { name: "Companies",   path: "/user-approvals/companies"   },
    ],
  },
  {
    name: "User",
    path: "/user",
    rootPath: null,
  },
  {
    name: "Job Posts",
    path: "/job-posts",
    rootPath: null,
  },
  {
    name: "Message",
    path: "/message",
    rootPath: null,
  },
  {
    name: "Interviews",
    path: "/interviews",
    rootPath: null,
  },
  {
    name: "Payments & Escrow",
    path: "/payments",
    rootPath: null,
  },
  {
    name: "withdraw-requests",
    path: "/withdraw-requests",
    rootPath: null,
  },
  {
    name: "Categories",
    path: "/categories",
    rootPath: null,
  },
  {
    name: "Subscriptions",
    path: "/subscriptions",
    rootPath: null,
  },
  {
    name: "Reviews & Reports",
    path: "/reviews",
    rootPath: null,
  },
  {
    name: "Settings",
    rootPath: "settings",
    children: [
      { name: "Profile",            path: "/settings/profile"         },
      { name: "Terms & Condition",  path: "/settings/terms-condition" },
      { name: "Privacy Policy",     path: "/settings/privacy-policy"  },
      { name: "About Us",           path: "/settings/about-us"        },
    ],
  },
  {
    name: "Support",
    path: "/support",
    rootPath: null,
  }
];