"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import { RootState } from "@/redux/store";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  // Determine role for logged-in users
  const normalizedRole = user?.role?.toUpperCase();
  const isHiringRole = normalizedRole === "EMPLOYER" || normalizedRole === "COMPANY";

  const handleHeroAction = () => {
    if (normalizedRole === "COMPANY") {
      router.push("/company/job-post");
    } else if (normalizedRole === "EMPLOYER") {
      router.push("/employer/job-post");
    } else if (normalizedRole === "JOB_SEEKER") {
      router.push("/jobseeker/jobs");
    } else {
      router.push("/jobs");
    }
  };


  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1a1a] overflow-x-hidden">

      {/* ---------------- HERO SECTION ---------------- */}
      <section className="relative pt-10 pb-20 lg:pt-[60px]">
        <div className="w-full mx-auto px-4 max-w-[1393px]">

          <div className="flex flex-col xl:flex-row justify-center items-start gap-10 xl:gap-[80px]">

            {/* ---------------- LEFT SIDE ---------------- */}
            <div className="flex flex-col gap-[36px] w-full max-w-[822px] relative z-20 mt-10">

              {/* HEADLINE */}
              <div className="w-full">
                <h1 className="text-5xl md:text-[80px] font-bold leading-[120%] tracking-tight text-gray-900">
                  <span className="text-[#3FAE2A]">Hire</span> Smarter. <span className="text-[#3FAE2A]">Find</span> <br />
                  Jobs Faster.
                </h1>

                <p className="text-gray-500 text-lg mt-6 max-w-[600px] leading-relaxed">
                  A trusted job marketplace that connects verified employers with skilled professionals — securely, efficiently, and transparently.
                </p>

                {/* ---------------- BUTTON SECTION (MODIFIED) ---------------- */}
                <div className="flex flex-wrap gap-5 mt-8">

                  {!user ? (
                    <>
                      {/* Button 1: Find a Job (Guest) */}
                      <Button
                        onClick={() => router.push("/auth/signin")}
                        className="font-bold rounded-full h-[60px] px-10 text-lg min-w-[180px] bg-[#3FAE2A] hover:bg-[#369624] text-white shadow-lg shadow-green-100 transition-all"
                      >
                        Find a Job
                      </Button>

                      {/* Button 2: Post a Job (Guest) */}
                      <Button
                        onClick={() => router.push("/auth/signin")}
                        className="font-bold rounded-full h-[60px] px-10 text-lg min-w-[180px] bg-white hover:bg-green-50 text-[#3FAE2A] border border-[#3FAE2A] transition-all"
                      >
                        Post a Job
                      </Button>
                    </>
                  ) : (

                    <Button
                      onClick={handleHeroAction}
                      className={`font-bold rounded-full h-[60px] px-10 text-lg w-[200px] transition-all
        ${isHiringRole
                          ? "bg-white hover:bg-green-50 text-[#3FAE2A] border border-[#3FAE2A]"
                          : "bg-[#3FAE2A] hover:bg-[#369624] text-white shadow-lg shadow-green-100"
                        }`}
                    >
                      {isHiringRole ? "Post a Job" : "Find a Job"}
                    </Button>
                  )}
                </div>
                {/* ---------------- END BUTTON SECTION ---------------- */}

              </div>

              {/* TRUST SECTION */}
              <div className="relative w-full max-w-[500px] mt-8">
                <div className="flex items-end gap-4 mb-5 relative">
                  <h3 className="text-[#3FAE2A] font-bold text-xl">Why People Trust Us</h3>

                  {/* Curly Arrow SVG */}
                  <div className="absolute left-[360px] -top-[40px] w-[100px] h-[110px] hidden md:block pointer-events-none">
                    <Image
                      src="/image/arrow-mark.svg"
                      alt="Arrow"
                      fill
                      priority
                      className="object-contain"
                    />
                  </div>
                </div>

                <ul className="flex flex-col gap-[18px]">
                  {[
                    "Verified Employers & Job Seekers",
                    "Secure Document Uploads",
                    "Transparent Hiring Flow",
                    "Real-Time Status Tracking"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <Check strokeWidth={4} className="w-6 h-6 text-[#3FAE2A]" />
                      </div>
                      <span className="text-gray-600 font-semibold text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ---------------- RIGHT SIDE ---------------- */}
            <div className="relative w-full lg:w-auto flex flex-col items-center">

              {/* Top Stats */}
              <div className="flex justify-between w-full max-w-[400px] mt-25 relative z-20">
                <div className="text-center">
                  <h4 className="text-[#3FAE2A] font-bold text-4xl">500+</h4>
                  <p className="text-gray-600 font-bold text-sm">Jobs</p>
                </div>
                <div className="text-center">
                  <h4 className="text-[#3FAE2A] font-bold text-4xl">500+</h4>
                  <p className="text-gray-600 font-bold text-sm">Companies</p>
                </div>
              </div>

              {/* Background Glow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-[535px] rounded-full bg-gradient-to-t from-[#EBFDF2] to-transparent blur-3xl opacity-80 pointer-events-none -z-10"></div>

              {/* Hero Image */}
              <div className="relative z-10 w-[500px] h-[500px]">
                <Image
                  src="/image/hero-mobileframe.svg"
                  alt="Mobile App Frame"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------- BOTTOM BANNER ---------------- */}
      <section className="pb-20 flex justify-center w-full px-4">
        <div className="relative w-full max-w-[1621px] h-[312px] rounded-[18px] overflow-hidden shadow-2xl group">
          <Image src="/image/jaimica4.avif" alt="Meeting" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-linear-to-r from-[#1a3d16]/80 via-[#2d5c26]/80 to-[#3FAE2A]/40 mix-blend-multiply"></div>

          <div className="relative z-10 h-full flex flex-col md:flex-row items-center justify-evenly text-center text-white">
            <div className="flex flex-col items-center">
              <h2 className="text-5xl md:text-[64px] font-bold mb-2">10K+</h2>
              <p className="text-xl md:text-2xl font-semibold opacity-90">Jobs Posted</p>
            </div>
            <div className="hidden md:block w-px h-24 bg-white/40"></div>
            <div className="flex flex-col items-center">
              <h2 className="text-5xl md:text-[64px] font-bold mb-2">50K+</h2>
              <p className="text-xl md:text-2xl font-semibold opacity-90">Job Seekers</p>
            </div>
            <div className="hidden md:block w-px h-24 bg-white/40"></div>
            <div className="flex flex-col items-center">
              <h2 className="text-5xl md:text-[64px] font-bold mb-2">95%</h2>
              <p className="text-xl md:text-2xl font-semibold opacity-90">Verified Employers</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}