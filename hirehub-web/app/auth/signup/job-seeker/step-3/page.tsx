"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin, ChevronDown, ChevronUp, Check,
  User, Loader2, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSetupJobSeekerBasicMutation } from "@/redux/services/authApi";
import { useGetCategoriesQuery } from "@/redux/services/featuresApi";

// ✅ Employment type: UI label → API value mapping
const EMPLOYMENT_TYPES = [
  { label: "Full-time", value: "FULL_TIME" },
  { label: "Part-time", value: "PART_TIME" },
  { label: "Contract", value: "CONTRACT" },
];

export default function Step3ProfileInfo() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState(""); // ✅ "overview" → "about"
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([]); // ✅ Array, multi-select
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]); // ✅ IDs store
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [setupBasic, { isLoading }] = useSetupJobSeekerBasicMutation();

  // ✅ API থেকে categories fetch করো
  const { data: categoriesData, isLoading: isCategoriesLoading } = useGetCategoriesQuery();

  // Categories list — backend response structure অনুযায়ী adjust করো
  // সাধারণত: { data: [ { id, name }, ... ] } বা [ { id, name }, ... ]
  const categories: { id: string; name: string }[] =
    categoriesData?.data || categoriesData || [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Category ID toggle
  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // ✅ Employment type multi-select toggle
  const toggleEmploymentType = (value: string) => {
    setSelectedEmploymentTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  // Helper: selected category names (UI display এর জন্য)
  const selectedCategoryNames = categories
    .filter((c) => selectedCategoryIds.includes(c.id))
    .map((c) => c.name);

  const formatBackendError = (err: any) => {
    const message = err?.data?.message;
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    if (typeof message === "string") return message;
    if (typeof err?.error === "string") return err.error;
    return "Failed to save profile. Please try again.";
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleNext = async () => {
    setError("");
    setFieldErrors({});

    const missingFields: string[] = [];
    const nextFieldErrors: Record<string, string> = {};

    if (!profilePic) {
      missingFields.push("profile picture");
      nextFieldErrors.profilePic = "Profile picture is required.";
    }
    if (!phone.trim()) {
      missingFields.push("phone number");
      nextFieldErrors.phone = "Phone number is required.";
    }
    if (!about.trim()) {
      missingFields.push("about yourself");
      nextFieldErrors.about = "About yourself is required.";
    }
    if (!location.trim()) {
      missingFields.push("location");
      nextFieldErrors.location = "Location is required.";
    }
    if (!gender.trim()) {
      missingFields.push("gender");
      nextFieldErrors.gender = "Gender is required.";
    }
    if (selectedEmploymentTypes.length === 0) {
      missingFields.push("employment type");
      nextFieldErrors.employmentType = "Select at least one employment type.";
    }
    if (selectedCategoryIds.length === 0) {
      missingFields.push("preferred job categories");
      nextFieldErrors.categories = "Select at least one preferred job category.";
    }

    if (missingFields.length > 0) {
      setFieldErrors(nextFieldErrors);
      setError("Please fix the highlighted fields.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("profilePic", profilePic as File);
      formData.append("phone", phone);
      formData.append("about", about);                                               // ✅ "about"
      formData.append("location", location);
      formData.append("gender", gender);
      if (dob.trim()) formData.append("dob", dob);
      formData.append("employmentType", JSON.stringify(selectedEmploymentTypes));    // ✅ Array: ["FULL_TIME","PART_TIME"]
      formData.append("preferredJobCategoryIds", JSON.stringify(selectedCategoryIds)); // ✅ IDs array

      await setupBasic(formData).unwrap();
      router.push("/auth/signup/job-seeker/step-4");
    } catch (err: any) {
      const backendMessage = formatBackendError(err);
      const normalized = backendMessage.toLowerCase();
      const nextErrors: Record<string, string> = {};

      if (normalized.includes("profile picture")) nextErrors.profilePic = backendMessage;
      if (normalized.includes("phone")) nextErrors.phone = backendMessage;
      if (normalized.includes("about")) nextErrors.about = backendMessage;
      if (normalized.includes("location")) nextErrors.location = backendMessage;
      if (normalized.includes("gender")) nextErrors.gender = backendMessage;
      if (normalized.includes("employment")) nextErrors.employmentType = backendMessage;
      if (normalized.includes("category")) nextErrors.categories = backendMessage;

      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        setError("Please fix the highlighted fields.");
      } else {
        setError(backendMessage);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">

        {/* LEFT SIDE */}
        <div className="relative w-full md:w-1/2 hidden md:block">
          <Image src="/image/jaimica7.webp" alt="Office" fill className="object-cover" priority />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] bg-white/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center text-white shadow-lg">
            <h3 className="text-lg font-bold">Welcome to the <span className="underline decoration-2 underline-offset-4">HireHubJA</span></h3>
            <p className="text-sm opacity-90 mt-1">Login to explore more</p>
            <div className="flex justify-center gap-2 mt-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === 3 ? "bg-[#3FAE2A] ring-2 ring-green-900/50 w-4" : "bg-white/50"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col justify-start p-6 md:p-12 relative overflow-y-auto max-h-[900px] custom-scrollbar">

          <div className="flex items-center mb-8 relative">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 transition">
              <ArrowLeft size={18} className="text-gray-700" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 absolute left-1/2 -translate-x-1/2">Profile Information</h2>
          </div>

          <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-4 pb-10">
            <h3 className="text-base font-bold text-gray-800 mb-6">Profile Information</h3>

            {error && !Object.keys(fieldErrors).length && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-red-500 shadow-sm">
                    !
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-900">Please fix the issue below</p>
                    <p className="mt-1 text-sm text-red-800 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full space-y-6">

              {/* Upload Picture */}
              <div>
                <Label className="text-sm font-medium text-gray-700 block mb-3">Upload Picture</Label>
                <div className="flex items-center gap-6">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-[100px] h-[100px] rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:opacity-90 transition"
                  >
                    {profilePicPreview ? (
                      <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-gray-200 w-12 h-12" />
                    )}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-[#E2E8F0] hover:bg-gray-300 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-lg transition">
                    Choose Picture
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                </div>
                {fieldErrors.profilePic && <p className="mt-2 text-xs font-medium text-red-600">{fieldErrors.profilePic}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFieldError("phone");
                  }}
                  placeholder="Enter your phone number"
                  className={`rounded-xl bg-white py-6 text-sm placeholder:text-gray-400 focus-visible:ring-[#3FAE2A] ${fieldErrors.phone ? "border-red-400" : "border-gray-200"}`}
                />
                {fieldErrors.phone && <p className="text-xs font-medium text-red-600">{fieldErrors.phone}</p>}
              </div>

              {/* About (Overview) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">About (About yourself)</Label>
                <div className="relative">
                  <textarea
                    value={about}
                    onChange={(e) => {
                      setAbout(e.target.value.slice(0, 150));
                      clearFieldError("about");
                    }}
                    placeholder="About yourself"
                    className={`w-full min-h-[120px] rounded-xl bg-white p-4 text-sm placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#3FAE2A] ${fieldErrors.about ? "border border-red-400" : "border border-gray-200"}`}
                  />
                  <span className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">{about.length}/150</span>
                </div>
                {fieldErrors.about && <p className="text-xs font-medium text-red-600">{fieldErrors.about}</p>}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Location (Town, Parish)</Label>
                <div className="relative">
                  <Input
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      clearFieldError("location");
                    }}
                    placeholder="Add Address"
                    className={`rounded-xl bg-white py-6 pr-10 text-sm placeholder:text-gray-400 focus-visible:ring-[#3FAE2A] ${fieldErrors.location ? "border-red-400" : "border-gray-200"}`}
                  />
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
                {fieldErrors.location && <p className="text-xs font-medium text-red-600">{fieldErrors.location}</p>}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Date of Birth <span className="text-gray-400">(Optional)</span></Label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="rounded-xl bg-white border-gray-200 py-6 text-sm placeholder:text-gray-400 focus-visible:ring-[#3FAE2A]"
                />
              </div>

              {/* ✅ Preferred Job Categories — API থেকে fetch, ID পাঠাবে */}
              <div className="space-y-2" ref={dropdownRef}>
                <Label className="text-sm font-medium text-gray-700">Preferred Job Categories</Label>
                <div className="relative">
                  <div
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className={`w-full bg-white rounded-xl border ${isCategoryOpen ? "border-gray-300" : "border-gray-200"} min-h-[52px] p-3 flex items-center justify-between cursor-pointer transition`}
                  >
                    <div className="flex flex-wrap gap-2 items-center">
                      {selectedCategoryNames.length === 0 ? (
                        <span className="text-gray-500 text-sm pl-1">
                          {isCategoriesLoading ? "Loading categories..." : "Select Categories"}
                        </span>
                      ) : (
                        <>
                          {selectedCategoryNames.slice(0, 2).map((name) => (
                            <span key={name} className="bg-white border border-gray-200 text-gray-600 text-[11px] px-3 py-1 rounded-full whitespace-nowrap">{name}</span>
                          ))}
                          {selectedCategoryNames.length > 2 && (
                            <span className="bg-white border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-full">+{selectedCategoryNames.length - 2}</span>
                          )}
                        </>
                      )}
                    </div>
                    {isCategoryOpen ? <ChevronUp className="text-gray-500 w-5 h-5 ml-2 flex-shrink-0" /> : <ChevronDown className="text-gray-500 w-5 h-5 ml-2 flex-shrink-0" />}
                  </div>

                  {isCategoryOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-[250px] overflow-y-auto">
                      {isCategoriesLoading ? (
                        <div className="flex items-center justify-center p-6">
                          <Loader2 size={20} className="animate-spin text-[#3FAE2A]" />
                          <span className="text-sm text-gray-500 ml-2">Loading...</span>
                        </div>
                      ) : categories.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-400">No categories found</div>
                      ) : (
                        <div className="p-2">
                          {categories.map((category) => {
                            const isSelected = selectedCategoryIds.includes(category.id);
                            return (
                              <div key={category.id} onClick={() => toggleCategory(category.id)} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <span className="text-sm text-gray-700">{category.name}</span>
                                <div className="w-5 h-5 rounded border border-gray-400 bg-white flex items-center justify-center transition">
                                  {isSelected && <Check size={14} className="text-gray-600" strokeWidth={3} />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {fieldErrors.categories && <p className="text-xs font-medium text-red-600">{fieldErrors.categories}</p>}
              </div>

              {/* Gender */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-medium text-gray-700">Gender:</Label>
                <div className="flex gap-4">
                  {["Male", "Female"].map((type) => (
                    <div key={type} onClick={() => setGender(type)} className={`flex-1 flex items-center gap-3 bg-white px-4 py-3.5 rounded-xl border cursor-pointer transition ${gender === type ? "border-gray-200" : "border-gray-100 hover:border-gray-200"}`}>
                      <div className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center ${gender === type ? "border-gray-500" : "border-gray-300"}`}>
                        {gender === type && <div className="w-[10px] h-[10px] rounded-full bg-gray-500"></div>}
                      </div>
                      <span className="text-sm text-gray-600">{type}</span>
                    </div>
                  ))}
                </div>
                {fieldErrors.gender && <p className="text-xs font-medium text-red-600">{fieldErrors.gender}</p>}
              </div>

              {/* ✅ Employment Type — Multi-select, API value uppercase */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-medium text-gray-700">Employment Type:</Label>
                <div className="flex flex-wrap md:flex-nowrap gap-3">
                  {EMPLOYMENT_TYPES.map(({ label, value }) => {
                    const isSelected = selectedEmploymentTypes.includes(value);
                    return (
                      <div
                        key={value}
                        onClick={() => toggleEmploymentType(value)}
                        className={`flex-1 flex items-center gap-2 bg-white px-3 py-3.5 rounded-xl border cursor-pointer transition ${isSelected ? "border-[#3FAE2A]" : "border-gray-100 hover:border-gray-200"}`}
                      >
                        <div className={`w-[18px] h-[18px] flex-shrink-0 rounded border flex items-center justify-center transition ${isSelected ? "border-[#3FAE2A] bg-[#3FAE2A]" : "border-gray-300"}`}>
                          {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-sm text-gray-600 truncate">{label}</span>
                      </div>
                    );
                  })}
                </div>
                {fieldErrors.employmentType && <p className="text-xs font-medium text-red-600">{fieldErrors.employmentType}</p>}
              </div>

              <Button onClick={handleNext} disabled={isLoading} className="w-full bg-[#3FAE2A] hover:bg-[#359624] text-white font-bold rounded-full py-6 mt-8 shadow-lg shadow-green-100 text-base">
                {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
