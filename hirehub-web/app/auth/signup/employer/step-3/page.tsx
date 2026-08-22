"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSetupEmployerBasicMutation } from "@/redux/services/authApi";

export default function EmployerStep3Profile() {
  const router = useRouter();
  
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [overview, setOverview] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const[error, setError] = useState("");

  const [setupProfile, { isLoading }] = useSetupEmployerBasicMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleNext = async () => {
    setError("");

    if (!phone || !location || !overview || !profilePic) {
      setError("Please fill in all fields and upload a profile picture.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("phone", phone);
      formData.append("location", location);
      formData.append("about", overview);
      formData.append("profilePic", profilePic);

      await setupProfile(formData).unwrap();
      
      router.push("/auth/signup/employer/step-4");
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[800px]">
        
        {/* Left Side */}
        <div className="relative w-full md:w-1/2 hidden md:block">
          <Image src="/image/jaimica7.webp" alt="Meeting" fill className="object-cover" priority />
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
          
          <Button variant="ghost" size="icon" className="absolute top-8 left-8 rounded-full bg-white shadow-sm hover:bg-gray-100 z-10" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4">
              
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm w-full rounded">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label className="text-gray-600 font-medium">Upload Picture</Label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-full border-2 border-gray-100 flex items-center justify-center">
                        <span className="text-4xl text-gray-200">👤</span>
                      </div>
                    )}
                  </div>
                  <label className="bg-white border-none shadow-sm text-gray-500 rounded-xl px-4 py-2.5 text-xs font-medium hover:bg-gray-50 cursor-pointer">
                    Choose Picture
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-gray-600 font-medium">Phone Number</Label>
                  <Input value={phone} onChange={(e)=>setPhone(e.target.value)} type="tel" placeholder="Enter your Phone number" className="h-12 bg-white border-none shadow-sm rounded-xl focus-visible:ring-[#3FAE2A]" />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-gray-600 font-medium">Location (Town, Parish)</Label>
                  <div className="relative">
                    <Input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Add Address" className="h-12 bg-white border-none shadow-sm pr-10 rounded-xl focus-visible:ring-[#3FAE2A]" />
                    <MapPin className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1 relative">
                  <Label className="text-gray-600 font-medium">Overview (About yourself)</Label>
                  <Textarea 
                    value={overview} 
                    onChange={(e)=>setOverview(e.target.value.slice(0, 150))} 
                    placeholder="About yourself" 
                    className="border-none shadow-sm resize-none min-h-[140px] bg-white rounded-xl focus-visible:ring-[#3FAE2A] p-4 custom-scrollbar" 
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">{overview.length}/150</span>
                </div>

                <Button onClick={handleNext} disabled={isLoading} className="w-full h-12 bg-[#3FAE2A] hover:bg-[#359624] rounded-full text-lg font-bold shadow-lg shadow-green-200/50 text-white">
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
