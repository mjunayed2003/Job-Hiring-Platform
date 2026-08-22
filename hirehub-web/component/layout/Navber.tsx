"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Bell, ChevronDown, Menu, X, User, Settings, LogOut } from "lucide-react";

import { RootState } from "@/redux/store";
import { logout as clearAuth } from "@/redux/authSlice";
import { useLogoutMutation } from "@/redux/services/authApi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBadge } from "./NotificationBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const GUEST_LINKS = [
  { label: "Home", href: "/" },
  { label: "Jobs", href: "/jobs" },
  { label: "Inbox", href: "/inbox" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Support", href: "/support" },
];

const COMPANY_LINKS = [
  { label: "Home", href: "/" },
  { label: "Jobs", href: "/company/jobs" },
  { label: "Inbox", href: "/inbox" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Support", href: "/support" },
];

const EMPLOYER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Jobs", href: "/employer/jobs" },
  { label: "Inbox", href: "/inbox" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Support", href: "/support" },
];

const JOB_SEEKER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Jobs", href: "/jobseeker/jobs" },
  { label: "Inbox", href: "/inbox" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Support", href: "/support" },
];

// ─────────────────────────────────────────────────────
// HELPER — Token decode + expiry check
// ─────────────────────────────────────────────────────
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null; // ms-এ convert
  } catch {
    return null;
  }
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hash, setHash] = useState("");

  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.companyName ||
    "User";

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  const toAbsoluteMediaUrl = (value?: string) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/")) return API_BASE ? `${API_BASE}${value}` : value;
    return API_BASE ? `${API_BASE}/${value}` : `/${value}`;
  };

  const rawAvatar = user?.profilePic || user?.avatar || "";
  const displayAvatar = toAbsoluteMediaUrl(rawAvatar);
  const normalizedRole = String(user?.role || "").toUpperCase();
  const isCompanyRole = normalizedRole === "COMPANY";

  // ─────────────────────────────────────────────────────
  //  TOKEN EXPIRY CHECK

  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const msUntilExpiry = expiry - Date.now();

    if (msUntilExpiry <= 0) {
      // ইতোমধ্যে expired
      dispatch(clearAuth());
      document.cookie = "auth-token=; path=/; max-age=0";
      document.cookie = "user-role=; path=/; max-age=0";
      window.location.href = "/auth/signin";
      return;
    }

    const timer = setTimeout(() => {
      dispatch(clearAuth());
      document.cookie = "auth-token=; path=/; max-age=0";
      document.cookie = "user-role=; path=/; max-age=0";
      window.location.href = "/auth/signin";
    }, msUntilExpiry);

    return () => clearTimeout(timer);
  }, [isAuthenticated, token, dispatch]);

  const navLinks = useMemo(() => {
    if (!isAuthenticated || !normalizedRole) return GUEST_LINKS;

    switch (normalizedRole) {
      case "COMPANY":
        return COMPANY_LINKS;
      case "EMPLOYER":
        return EMPLOYER_LINKS;
      case "JOB_SEEKER":
      case "JOB-SEEKER":
        return JOB_SEEKER_LINKS;
      default:
        return GUEST_LINKS;
    }
  }, [isAuthenticated, normalizedRole]);

  const profilePath = useMemo(() => {
    switch (normalizedRole) {
      case "COMPANY":
        return "/company/profile";
      case "EMPLOYER":
        return "/profile";
      default:
        return "/profile";
    }
  }, [normalizedRole]);

  useEffect(() => {
    setHash(window.location.hash);

    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);

  const toggleMenu = () => setIsMobileMenuOpen((prev) => !prev);

  const handleLinkClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (href.includes("#")) {
      const newHash = href.substring(href.indexOf("#"));
      setHash(newHash);
    } else {
      setHash("");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
    } finally {
      dispatch(clearAuth());
      document.cookie = "auth-token=; path=/; max-age=0";
      document.cookie = "user-role=; path=/; max-age=0";
      sessionStorage.removeItem("signup_email");
      setIsMobileMenuOpen(false);
      window.location.href = "/auth/signin";
    }
  };

  return (
    <header className="w-full bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="mx-auto flex h-[110px] w-full max-w-[1393px] items-center justify-between px-4 md:px-6">
        <div className="flex-shrink-0 cursor-pointer z-50">
          <Link href="/" onClick={() => handleLinkClick("/")}>
            <Image
              src="/image/logo.svg"
              alt="HireHubJA Logo"
              width={200}
              height={100}
              className="object-contain h-[75px] md:h-[90px] w-auto"
              priority
            />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 lg:gap-12">
          {navLinks.map((link) => {
            let isActive = false;
            if (link.href === "/") {
              isActive = pathname === "/" && !hash;
            } else if (link.href.includes("#")) {
              const targetHash = link.href.substring(link.href.indexOf("#"));
              isActive = pathname === "/" && hash === targetHash;
            } else {
              isActive = pathname === link.href;
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => handleLinkClick(link.href)}
                className={`text-base font-medium transition-all duration-200 ${isActive
                  ? "text-[#3FAE2A] border-b-2 border-[#3FAE2A] pb-1"
                  : "text-gray-600 hover:text-[#3FAE2A]"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}

          {isCompanyRole && (
            <Link
              href="/company/jobs/subcription"
              className={`text-base font-medium transition-all duration-200 ${pathname === '/company/jobs/subcription' ? 'text-[#3FAE2A] border-b-2 border-[#3FAE2A] pb-1' : 'text-gray-600 hover:text-[#3FAE2A]'}`}
            >
              Subscription
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-gray-600 hover:text-[#3FAE2A] font-semibold text-base">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-[#3FAE2A] hover:bg-[#359624] text-white font-semibold rounded-full px-6 h-11 text-base shadow-md">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 md:gap-6">
              <Link href="/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full bg-gray-50 text-gray-500 hover:text-[#3FAE2A] hover:bg-green-50 h-9 w-9 md:h-10 md:w-10 transition"
                >
                  <Bell className="h-5 w-5" />
                  <NotificationBadge />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-3 cursor-pointer group p-1 rounded-full hover:bg-gray-50 transition"
                  >
                    <Avatar className="h-9 w-9 md:h-10 md:w-10 border-2 border-transparent group-hover:border-[#3FAE2A] transition">
                      <AvatarImage src={displayAvatar || "https://github.com/shadcn.png"} alt={displayName} />
                      <AvatarFallback className="bg-green-100 text-green-700 font-bold">
                        {displayName?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-bold text-gray-800 leading-tight">
                        {displayName}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(profilePath)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-500 hover:!text-red-600 focus:!text-red-600"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-600"
            onClick={toggleMenu}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[100px] left-0 w-full bg-white border-b shadow-lg p-4 flex flex-col gap-4 z-40">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => {
              let isActive = false;
              if (link.href === "/") {
                isActive = pathname === "/" && !hash;
              } else if (link.href.includes("#")) {
                const targetHash = link.href.substring(link.href.indexOf("#"));
                isActive = pathname === "/" && hash === targetHash;
              } else {
                isActive = pathname === link.href;
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={`text-base font-medium transition-all duration-200 ${isActive
                    ? "text-[#3FAE2A] pl-2 border-l-4 border-[#3FAE2A]"
                    : "text-gray-600 hover:text-[#3FAE2A] pl-2"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {!isAuthenticated ? (
            <div className="flex flex-col gap-4 mt-6 border-t pt-6 pb-4">
              <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full py-6 text-gray-600 hover:text-[#3FAE2A] font-semibold px-5">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full py-6 bg-[#3FAE2A] hover:bg-[#359624] text-white font-semibold px-5">
                  Get Started
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {isCompanyRole && (
                <div className="mt-6">
                  <Link
                    href="/company/jobs/subcription"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-base font-medium ${pathname === '/company/jobs/subcription' ? 'text-[#3FAE2A] pl-2 border-l-4 border-[#3FAE2A]' : 'text-gray-600 hover:text-[#3FAE2A] pl-2'}`}
                  >
                    Subscription
                  </Link>
                </div>
              )}
              <div className="flex flex-col gap-4 mt-6 border-t pt-6 pb-4">
                <Button
                  variant="outline"
                  className="w-full py-5 text-red-500 border-red-200 hover:bg-red-50 font-semibold"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? "Logging out..." : "Log Out"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}