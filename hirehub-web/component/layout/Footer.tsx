import React from "react";
import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="relative w-full overflow-hidden bg-[#e8f7e9] py-16 text-gray-700">

      {/* Background Pattern (Topographic Waves) */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path fill="none" stroke="#86efac" strokeWidth="2" d="M0,160 C120,200 240,100 360,120 C480,140 600,220 720,200 C840,180 960,80 1080,100 C1200,120 1320,200 1440,180" />
          <path fill="none" stroke="#86efac" strokeWidth="2" d="M0,220 C150,260 300,160 450,180 C600,200 750,280 900,260 C1050,240 1200,140 1350,160" />
          <path fill="none" stroke="#86efac" strokeWidth="2" d="M0,60 C200,120 400,20 600,60 C800,100 1000,40 1200,80 C1400,120 1600,20 1800,60" />
          <path fill="none" stroke="#86efac" strokeWidth="2" d="M-100,280 C100,320 300,220 500,240 C700,260 900,340 1100,320 C1300,300 1500,200 1700,220" />
        </svg>
      </div>

      <div className="container relative mx-auto px-6">
        <div className="flex flex-col gap-12 lg:flex-row">

          {/* LEFT SIDE — 40% — Logo & Description */}
          <div className="flex w-full flex-col space-y-4 -mt-5 lg:w-[40%]">
            {/* Logo — moved up with negative margin-top */}
            <div className="flex items-center gap-2 -mt-10">
              <Image
                src="/image/logo.svg"
                alt="Company Logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </div>

            <p className="text-sm leading-relaxed text-gray-600">
              Find Jobs and Hire Talent in Jamaica with HireHub JA

              HireHub JA is a leading job platform in Jamaica designed to connect job seekers with businesses, employers, and organizations looking to hire. Whether you're searching for jobs in Jamaica or need to find reliable talent, our platform makes the process fast, simple, and secure.

              HireHub JA provides a seamless experience for both job seekers and employers, offering real-time application tracking, verified profiles, and easy communication — all in one place. Our goal is to simplify hiring and job searching across Jamaica while creating more opportunities for everyone.

              Start your job search or begin hiring today with one of Jamaica's fastest-growing recruitment platforms.
            </p>
          </div>

          {/* RIGHT SIDE — 60% — 3 Columns */}
          <div className="grid w-full grid-cols-1 gap-10 sm:grid-cols-3 lg:w-[60%]">

            {/* Column 2: Explore */}
            <div className="flex flex-col space-y-4 lg:pl-10">
              <h3 className="text-lg font-semibold text-gray-900">Explore</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/" className="hover:text-green-600">Home</Link></li>
                <li><Link href="/" className="hover:text-green-600">Jobs</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-green-600">How It Works</Link></li>
                <li><Link href="/support" className="hover:text-green-600">Support</Link></li>
              </ul>
            </div>

            {/* Column 3: Unity Pages */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Unity Pages</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/about-us" className="hover:text-green-600">About Us</Link></li>
                <li><Link href="/privacy" className="hover:text-green-600">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-green-600">Terms & Condition</Link></li>
              </ul>
            </div>

            {/* Column 4: Get in Touch */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Get in Touch</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link href="mailto:info@hirehubja.com" className="hover:text-green-600">
                    info@hirehubja.com
                  </Link>
                </li>
                <li>
                  <Link href="tel:+1(876)408-7080" className="hover:text-green-600">
                    +1(876) 408-7080
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;