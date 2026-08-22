"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSetupCompanyBasicMutation } from "@/redux/services/authApi";

export default function CompanyStep3Business() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    phone: "",
    location: "",
    about: "",
    businessRegCertId: "",
    taxId: "",
    authorizedRepId: "",
  });

  const [setupCompanyBasic, { isLoading }] = useSetupCompanyBasicMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    setError("");

    if (!formData.phone || !formData.location || !formData.about || !formData.businessRegCertId) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const data = new FormData();
      data.append("phone", formData.phone);
      data.append("location", formData.location);
      data.append("about", formData.about);
      data.append("businessRegCertId", formData.businessRegCertId);
      data.append("taxId", formData.taxId);
      data.append("authorizedRepId", formData.authorizedRepId);
      if (profilePic) {
        data.append("profilePic", profilePic);
      }

      await setupCompanyBasic(data).unwrap();
      router.push("/auth/signup/company/step-4");
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save company information.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[800px]">

        {/* Left Side */}
        <div className="relative w-full md:w-1/2 hidden md:block">
          <Image src="/image/jaimica7.webp" alt="Office" fill className="object-cover" priority />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] bg-white/30 backdrop-blur-md p-6 rounded-2xl text-center text-white shadow-lg">
            <h3 className="text-2xl font-bold">Welcome to HireHubJA</h3>
            <p className="text-sm opacity-90 mt-1">Login to explore more</p>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === 3 ? "bg-[#3FAE2A] ring-2 ring-green-900/50 w-4" : "bg-white/50"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col p-6 md:p-12 relative overflow-y-auto custom-scrollbar">

          <div className="w-full max-w-md mx-auto relative mb-6 flex items-center justify-center">
            <button className="absolute left-0 w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">Business Verification</h2>
          </div>

          <div className="flex-1 flex flex-col items-center justify-start w-full max-w-md mx-auto">
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4">

              <div className="text-left mb-2">
                <h3 className="text-base font-bold text-gray-800">Profile Information</h3>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm w-full rounded">
                  {error}
                </div>
              )}

              {/* Profile Picture Upload */}
              <div className="flex flex-col gap-3">
                <Label className="text-gray-700 text-sm font-medium">Upload Company Logo</Label>
                <div className="flex items-center gap-6">
                  <div className="w-[100px] h-[100px] rounded-full border border-gray-100 bg-gray-50 flex items-center justify-center shadow-sm overflow-hidden">
                    {profilePicPreview ? (
                      <img src={profilePicPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-20 h-20 text-gray-200 mt-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <label className="bg-white text-gray-600 rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors">
                    Choose Company Logo
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-gray-700 text-sm font-medium">Phone Number</Label>
                  <Input name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="Enter your phone number" className="h-12 bg-white border border-gray-100 rounded-xl focus-visible:ring-[#3FAE2A] placeholder:text-gray-400" />
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-700 text-sm font-medium">Business Registration Certificate ID</Label>
                  <Input name="businessRegCertId" value={formData.businessRegCertId} onChange={handleInputChange} type="text" placeholder="Enter your Business Registration Certificate ID" className="h-12 bg-white border border-gray-100 rounded-xl focus-visible:ring-[#3FAE2A] placeholder:text-gray-400" />
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-700 text-sm font-medium">Tax ID <span className="text-gray-400 font-normal">(if applicable)</span></Label>
                  <Input name="taxId" value={formData.taxId} onChange={handleInputChange} type="text" placeholder="Enter your Tax ID" className="h-12 bg-white border border-gray-100 rounded-xl focus-visible:ring-[#3FAE2A] placeholder:text-gray-400" />
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-700 text-sm font-medium">Authorized Representative Name</Label>
                  <Input name="authorizedRepId" value={formData.authorizedRepId} onChange={handleInputChange} type="text" placeholder="Enter your Authorized Representative Name" className="h-12 bg-white border border-gray-100 rounded-xl focus-visible:ring-[#3FAE2A] placeholder:text-gray-400" />
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-700 text-sm font-medium">Location (Country, City)</Label>
                  <div className="relative">
                    <Input name="location" value={formData.location} onChange={handleInputChange} placeholder="Add Address" className="h-12 bg-white border border-gray-100 pr-10 rounded-xl focus-visible:ring-[#3FAE2A] placeholder:text-gray-400" />
                    <MapPin className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1 relative">
                  <Label className="text-gray-700 text-sm font-medium">Overview (Tell me about your company.)</Label>
                  <Textarea name="about" value={formData.about} onChange={handleInputChange} placeholder="Tell me about your company." className="border border-gray-100 resize-none min-h-[140px] bg-white rounded-xl focus-visible:ring-[#3FAE2A] p-4 placeholder:text-gray-400" />
                  <span className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">{formData.about.length}/150</span>
                </div>

                <Button onClick={handleNext} disabled={isLoading} className="w-full h-14 bg-[#3FAE2A] hover:bg-[#359624] text-white rounded-full text-[17px] font-semibold mt-4 shadow-sm">
                  {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Next
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
