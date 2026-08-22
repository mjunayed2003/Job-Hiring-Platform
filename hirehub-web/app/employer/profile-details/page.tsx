"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Upload, BadgeCheck, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import {
  useGetEmployerProfileQuery,
  useUpdateEmployerProfileMutation,
} from "@/redux/services/employerApi";

interface EmployerProfile {
  id?: string;
  userId?: string;
  companyName?: string;
  fullName?: string;
  phone?: string;
  profilePic?: string | null;
  location?: string;
  about?: string;
  website?: string;
  businessRegCertId?: string;
  taxId?: string;
  authorizedRepId?: string;
  licenseFile?: string | null;
  idCardFront?: string | null;
  idCardBack?: string | null;
  selfieImage?: string | null;
  isVerified?: boolean;
}

export default function EmployerProfessionalDetails() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const { data, isLoading, error, refetch } = useGetEmployerProfileQuery();
  const [updateEmployerProfile] = useUpdateEmployerProfileMutation();

  const profileData: EmployerProfile = useMemo(() => {
    return (data?.data ?? data ?? {}) as EmployerProfile;
  }, [data]);

  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    location: "",
    image: "",
    overview: "",
  });

  useEffect(() => {
    setProfile({
      name: profileData.fullName || "",
      phone: profileData.phone || "",
      location: profileData.location || "",
      image: profileData.profilePic || "",
      overview: profileData.about || "",
    });
  }, [profileData]);

  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const buildImageUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    return `${apiUrl}${path}`;
  };

  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      const formData = new FormData();

      if (profile.name && profile.name !== (profileData.fullName || "")) {
        formData.append("fullName", profile.name);
      }

      if (profile.phone && profile.phone !== (profileData.phone || "")) {
        formData.append("phone", profile.phone);
      }

      if (profile.location && profile.location !== (profileData.location || "")) {
        formData.append("location", profile.location);
      }

      if (profile.overview && profile.overview !== (profileData.about || "")) {
        formData.append("about", profile.overview);
      }

      if (formData.entries().next().done) {
        setIsEditing(false);
        return;
      }

      await updateEmployerProfile(formData).unwrap();
      await refetch();
      setIsEditing(false);
    } catch (saveError) {
      console.error("Failed to update employer profile:", saveError);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <Loader className="h-8 w-8 animate-spin text-[#3FAE2A]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 text-red-500 text-center">
        Failed to load employer profile.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full border" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Professional Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-0">
        
        {/* LEFT COLUMN: Personal Info & Overview */}
        <div className="mx-auto w-full max-w-4xl space-y-8 text-left">
          
          {/* User Info Block */}
          <div className="flex flex-col items-start gap-6">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-gray-50 shadow-sm">
                <AvatarImage src={buildImageUrl(profile.image)} className="object-cover" />    
                <AvatarFallback>{(profile.name || profileData.companyName || "E").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer text-white">
                   <Upload size={20} />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-2 text-left w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <Input 
                    value={profile.name} 
                    onChange={(e) => handleChange("name", e.target.value)} 
                    placeholder="Full Name" 
                    className="font-bold" 
                  />
                  <Input 
                    value={profile.phone} 
                    onChange={(e) => handleChange("phone", e.target.value)} 
                    placeholder="Phone" 
                  />
                  <Input 
                    value={profile.location} 
                    onChange={(e) => handleChange("location", e.target.value)} 
                    placeholder="Location" 
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name || profileData.fullName || "N/A"}</h2>
                  {/* <p className="text-gray-500">Company Name: <span className="text-gray-800">{profileData.companyName || "N/A"}</span></p> */}
                  <p className="text-gray-500">Phone Number: <span className="text-gray-800">{profile.phone}</span></p>
                  <p className="text-gray-500">Location: <span className="text-gray-800">{profile.location}</span></p>
                  
                  <div className="flex items-center justify-start mt-2 gap-2 flex-wrap">
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-500 text-xs px-2 py-1 rounded-sm font-medium">
                      <BadgeCheck size={14} fill="#3b82f6" className="text-white" /> Id Verified
                    </span>
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-500 text-xs px-2 py-1 rounded-sm font-medium">
                      <BadgeCheck size={14} fill="#3b82f6" className="text-white" /> Face Verified
                    </span>
                    {profileData.isVerified ? (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs px-2 py-1 rounded-sm font-medium">
                        <BadgeCheck size={14} fill="#10b981" className="text-white" /> Profile Verified
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Overview Section */}
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Overview</h3>
            {isEditing ? (
              <Textarea 
                value={profile.overview} 
                onChange={(e) => handleChange("overview", e.target.value)} 
                className="h-40"
              />
            ) : (
              <p className="text-gray-600 text-sm leading-relaxed text-left">
                {profile.overview || "No overview available."}
              </p>
            )}
          </div>
          <div className="pt-4 flex justify-start">
            <Button
                onClick={handleSave}
                className={`w-full max-w-md px-8 py-6 rounded-full font-bold text-base shadow-lg transition-all ${
                  isEditing 
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-[#3FAE2A] hover:bg-green-700 text-white"
                }`}
              >
                {isEditing ? "Save Details" : "Edit Professional Details"}
              </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
