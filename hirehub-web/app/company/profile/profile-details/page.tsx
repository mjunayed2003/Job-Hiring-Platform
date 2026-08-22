"use client";

import React, { useState } from "react";
import { ArrowLeft, Upload, BadgeCheck, FileText, Loader, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  useGetEmployerProfileQuery,
  useUpdateEmployerProfileMutation,
} from "@/redux/services/employerApi";
import Link from "next/link";

type CompanyProfileResponse = {
  data?: {
    fullName?: string | null;
    companyName?: string | null;
    phone?: string | null;
    location?: string | null;
    profilePic?: string | null;
    businessRegCertId?: string | null;
    taxId?: string | null;
    authorizedRepId?: string | null;
    about?: string | null;
    website?: string | null;
    licenseFile?: string | null;
  };
  fullName?: string | null;
  companyName?: string | null;
  phone?: string | null;
  location?: string | null;
  profilePic?: string | null;
  businessRegCertId?: string | null;
  taxId?: string | null;
  authorizedRepId?: string | null;
  about?: string | null;
  website?: string | null;
  licenseFile?: string | null;
};

type ProfileForm = {
  name: string;
  phone: string;
  location: string;
  image: string;
  businessRegId: string;
  taxId: string;
  authRepId: string;
  overview: string;
  website: string;
  certificateUrl: string;
};

export default function CompanyProfessionalDetails() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: profileResponse,
    isLoading,
    error,
    refetch,
  } = useGetEmployerProfileQuery() as {
    data?: CompanyProfileResponse;
    isLoading: boolean;
    error?: unknown;
    refetch: () => Promise<unknown>;
  };

  const [updateProfile, { isLoading: isSaving }] = useUpdateEmployerProfileMutation();

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  const toAbsoluteUrl = (path?: string | null): string => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return API_BASE ? `${API_BASE}${path}` : path;
  };

  const profileData = profileResponse?.data ?? profileResponse ?? {};

  const baseProfile: ProfileForm = {
    name: profileData.companyName || profileData.fullName || "Company",
    phone: profileData.phone || "",
    location: profileData.location || "",
    image: toAbsoluteUrl(profileData.profilePic) || "/image/profile-picture.png",
    businessRegId: profileData.businessRegCertId || "",
    taxId: profileData.taxId || "",
    authRepId: profileData.authorizedRepId || "",
    overview: profileData.about || "",
    website: profileData.website || "",
    certificateUrl: toAbsoluteUrl(profileData.licenseFile),
  };

  const [profileEdits, setProfileEdits] = useState<ProfileForm | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const profile = profileEdits ?? baseProfile;

  const handleChange = (field: string, value: string) => {
    setProfileEdits((prev) => ({ ...(prev ?? baseProfile), [field]: value }));
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("fullName", profile.name);
    formData.append("companyName", profile.name);
    formData.append("phone", profile.phone);
    formData.append("location", profile.location);
    formData.append("businessRegCertId", profile.businessRegId);
    formData.append("taxId", profile.taxId);
    formData.append("authorizedRepId", profile.authRepId);
    formData.append("about", profile.overview);
    formData.append("website", profile.website);

    if (imageFile) {
      formData.append("profilePic", imageFile);
    }

    if (certificateFile) {
      formData.append("licenseFile", certificateFile);
    }

    await updateProfile(formData).unwrap();
    await refetch();
    setProfileEdits(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader className="animate-spin text-[#3FAE2A]" size={34} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Failed to load profile details</p>
            <p className="text-sm text-red-600">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full border" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Professional Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12 min-h-[600px]">
        <div className="space-y-8 lg:pr-12 lg:border-r border-gray-200">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <label className="relative group cursor-pointer">
              <Avatar className="w-32 h-32 border-4 border-gray-50 shadow-sm bg-white">
                <AvatarImage src={profile.image} className="object-contain" />
                <AvatarFallback className="bg-gray-100 text-2xl font-bold text-gray-400">
                  {profile.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setImageFile(file);
                      setProfileEdits((prev) => ({ ...(prev ?? baseProfile), image: URL.createObjectURL(file) }));
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                    <Upload size={20} />
                  </div>
                </>
              )}
            </label>

            <div className="flex-1 space-y-2 text-center md:text-left w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={profile.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Company Name"
                    className="font-bold"
                  />
                  <Input
                    value={profile.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="Phone"
                  />
                  <Input
                    value={profile.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="Website"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-gray-500">
                    Phone Number: <span className="text-gray-800">{profile.phone || "N/A"}</span>
                  </p>
                  <p className="text-gray-500">
                    Location: <span className="text-gray-800">{profile.location || "N/A"}</span>
                  </p>

                  <div className="flex items-center justify-center md:justify-start mt-2">
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-500 text-xs px-2 py-1 rounded-sm font-medium">
                      <BadgeCheck size={14} fill="#3b82f6" className="text-white" />
                      ID Verified
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-900 font-semibold mb-1">Business Registration Certificate ID</label>
              {isEditing ? (
                <Input value={profile.businessRegId} onChange={(e) => handleChange("businessRegId", e.target.value)} />
              ) : (
                <p className="text-gray-500 text-sm">{profile.businessRegId || "N/A"}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-900 font-semibold mb-1">Tax ID</label>
              {isEditing ? (
                <Input value={profile.taxId} onChange={(e) => handleChange("taxId", e.target.value)} />
              ) : (
                <p className="text-gray-500 text-sm">{profile.taxId || "N/A"}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-900 font-semibold mb-1">Authorized Representative ID</label>
              {isEditing ? (
                <Input value={profile.authRepId} onChange={(e) => handleChange("authRepId", e.target.value)} />
              ) : (
                <p className="text-gray-500 text-sm">{profile.authRepId || "N/A"}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Overview</h3>
            {isEditing ? (
              <Textarea
                value={profile.overview}
                onChange={(e) => handleChange("overview", e.target.value)}
                className="h-32 leading-relaxed"
              />
            ) : (
              <p className="text-gray-500 text-sm leading-relaxed text-justify">{profile.overview || "N/A"}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between pt-8 lg:pt-0 h-full">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Professional Details (Mandatory)</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500 text-sm font-medium">Business Registration Certificate</span>
                {isEditing ? (
                  <Input
                    type="file"
                    className="max-w-[220px]"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setCertificateFile(file);
                    }}
                  />
                ) : (
                  <ViewDocumentModal title="Business Registration Certificate" documentUrl={profile.certificateUrl} />
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-end">
            <Button
              onClick={() => {
                if (isEditing) {
                  void handleSave();
                  return;
                }
                setIsEditing(true);
              }}
              disabled={isSaving}
              className={`w-full md:w-auto px-8 py-6 rounded-full font-bold text-base shadow-lg transition-all ${isEditing ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-[#3FAE2A] hover:bg-green-700 text-white"
                }`}
            >
              {isSaving ? "Saving..." : isEditing ? "Save Professional Details" : "Edit Professional Details"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewDocumentModal({ title, documentUrl }: { title: string; documentUrl?: string }) {
  const hasDocument = Boolean(documentUrl);

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" className="rounded-full px-8 border-gray-100 bg-white text-gray-700 text-xs hover:bg-gray-50 h-9 font-medium shadow-sm">
          View Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <div className="flex flex-col items-center p-6">
          <h3 className="text-lg font-bold mb-4">{title}</h3>
          <div className="w-full h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400">
            <FileText size={48} className="mb-2" />
            {hasDocument && documentUrl ? (
              <Link
                href={documentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[#3FAE2A] font-semibold underline"
              >
                Open Uploaded Document
              </Link>
            ) : (
              <span>Document Not Uploaded</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
