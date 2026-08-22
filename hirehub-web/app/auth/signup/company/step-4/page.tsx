"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CloudUpload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetupCompanyVerificationMutation } from "@/redux/services/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { setTempToken } from "@/redux/authSlice";

export default function CompanyStep4Verification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const [setupCompanyVerification, { isLoading }] = useSetupCompanyVerificationMutation();

  useEffect(() => {
    const backupToken = searchParams.get("backupToken");
    if (!backupToken) return;

    dispatch(setTempToken(backupToken));
    if (typeof window !== "undefined") {
      sessionStorage.setItem("tempToken", backupToken);
    }
  }, [dispatch, searchParams]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicenseFile(file);
      setFileName(file.name);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (!licenseFile) {
      setError("Please upload a license file.");
      return;
    }

    try {
      // ✅ Create FormData for file upload
      const data = new FormData();
      data.append("licenseFile", licenseFile);

      await setupCompanyVerification(data).unwrap();

      // ✅ Success - redirect to pending approval or dashboard
      router.push("/auth/signup/company/pending-approval");
    } catch (err: any) {
      setError(err?.data?.message || "Failed to upload verification document.");
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
                <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === 4 ? "bg-[#3FAE2A] ring-2 ring-green-900/50 w-4" : "bg-white/50"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col p-6 md:p-12 relative overflow-y-auto custom-scrollbar">

          <div className="w-full max-w-md mx-auto relative mb-8 flex items-center justify-center">
            <button className="absolute left-0 w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">Verification</h2>
          </div>

          <div className="flex-1 flex flex-col items-center justify-start w-full max-w-md mx-auto">
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4">

              <div className="text-left mb-4">
                <h3 className="text-base font-bold text-gray-800">Verification <span className="text-gray-500 font-normal">(Mandatory)</span></h3>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm w-full rounded">
                  {error}
                </div>
              )}

              <div className="space-y-4">

                {/* License File Upload Box */}
                <div className="space-y-2">
                  <label className="text-gray-800 text-sm font-medium">Business License / Registration Document</label>
                  {/* Label থেকে onClick সরাও */}
                  <label
                    htmlFor="license-upload"
                    className="w-full bg-white rounded-xl border border-dashed border-gray-300 p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors block"
                  >
                    <CloudUpload className="w-10 h-10 text-gray-500 mb-3 mx-auto" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-gray-700">Choose a file</p>
                    <p className="text-[13px] text-gray-400 mt-1 mb-5">PNG, JPG, JPEG, PDF formats, up to 50MB</p>

                    {fileName ? (
                      <div className="inline-block px-5 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 font-medium">
                        ✓ {fileName}
                      </div>
                    ) : (
                      <div className="inline-block px-5 py-2 border border-gray-200 rounded-md text-sm text-gray-600 font-medium bg-white hover:bg-gray-50 transition-colors">
                        Browse File
                      </div>
                    )}

                    <input
                      id="license-upload"
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/jpg, application/pdf"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>

              </div>

              <div className="pt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !licenseFile}
                  className="w-full h-14 bg-[#3FAE2A] hover:bg-[#359624] text-white rounded-full text-[17px] font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Complete Registration
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
