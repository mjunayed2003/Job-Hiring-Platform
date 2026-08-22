"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useGetAboutUsQuery } from "@/redux/services/featuresApi";

export default function AboutUsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useGetAboutUsQuery();

  const aboutUs = data?.data ?? data ?? {};
  const title = aboutUs?.title || "About Us";
  const content = aboutUs?.content || "";

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1a1a] p-6 md:p-10">
      

      {/* ---------------- CONTENT CARD ---------------- */}
      <div className="max-w-[819px] mx-auto">
        <div className="w-full bg-white border border-gray-100 rounded-[24px] p-8 md:p-12 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#3FAE2A]" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-500">
              Failed to load About Us content.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              </div>

              <div
                className="prose prose-gray max-w-none text-sm leading-[1.8] text-gray-600 prose-headings:text-gray-900 prose-headings:font-semibold prose-p:my-3 prose-ul:my-3 prose-li:my-1"
                dangerouslySetInnerHTML={{ __html: content }}
              />

              {!content ? (
                <p className="text-sm text-gray-500">No About Us content available.</p>
              ) : null}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}