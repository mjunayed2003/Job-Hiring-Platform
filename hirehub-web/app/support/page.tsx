// src/app/support/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useSubmitSupportMutation } from "@/redux/services/supportApi";

export default function SupportPage() {
  const router = useRouter();
  const [submitSupport, { isLoading }] = useSubmitSupportMutation();

  const [form, setForm] = useState({
    title: "",
    email: "",
    phone: "",
    message: "",
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.email || !form.phone || !form.message) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      await submitSupport(form).unwrap();
      setSuccess(true);
      setForm({ title: "", email: "", phone: "", message: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="max-w-[1393px] mx-auto p-4 md:p-10 pb-20">
      {/* Header */}
      <div className="relative flex items-center justify-center md:justify-start mb-10 md:mb-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute left-0 rounded-full border border-gray-200"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold md:ml-20">Support</h1>
      </div>

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Illustration */}
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[400px]">
            <Image
              src="/image/support-image.svg"
              alt="Support Illustration"
              width={400}
              height={300}
              className="object-contain w-full h-auto"
              priority
            />
          </div>
        </div>

        {/* Form */}
        <div className="w-full max-w-[500px] mx-auto md:ml-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#3FAE2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Message Sent!</h2>
              <p className="text-sm text-gray-500">We'll get back to you as soon as possible.</p>
              <Button
                onClick={() => setSuccess(false)}
                className="mt-2 bg-[#3FAE2A] hover:bg-green-700 text-white rounded-lg px-8"
              >
                Send Another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-bold text-gray-900">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-transparent focus:border-[#3FAE2A] focus:bg-white focus:outline-none rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 transition-all"
                  placeholder="Enter a title"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-bold text-gray-900">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-transparent focus:border-[#3FAE2A] focus:bg-white focus:outline-none rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-bold text-gray-900">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-transparent focus:border-[#3FAE2A] focus:bg-white focus:outline-none rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 transition-all"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-bold text-gray-900">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-transparent focus:border-[#3FAE2A] focus:bg-white focus:outline-none rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 resize-none transition-all"
                  placeholder="Write here..."
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#3FAE2A] hover:bg-green-700 text-white font-bold h-12 rounded-lg text-base shadow-none disabled:opacity-60"
              >
                {isLoading ? "Sending..." : "Send"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}