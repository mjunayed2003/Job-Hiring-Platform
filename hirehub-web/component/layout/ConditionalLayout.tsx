"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("@/component/layout/Navber"));
const Footer = dynamic(() => import("@/component/layout/Footer"));

const noLayoutRoutes = ["/privacy", "/terms", "/about-us", "/deleteinstructions"];

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showLayout = !noLayoutRoutes.includes(pathname);

  return (
    <>
      {showLayout && <Navbar />}
      <main className="min-h-screen">{children}</main>
      {showLayout && <Footer />}
    </>
  );
}