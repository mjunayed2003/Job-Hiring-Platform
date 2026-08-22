"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Upload, BadgeCheck, ShieldCheck, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { 
  useGetJobSeekerProfileQuery, 
  useUpdateJobSeekerProfileMutation 
} from "../../../redux/services/jobsApi";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || ''; 

export default function ProfessionalDetails() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  // RTK Query Hooks
  const { data: apiResponse, isLoading, isError } = useGetJobSeekerProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateJobSeekerProfileMutation();

  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    experienceLevel: "",
    location: "",
    about: "",
    employmentType: [] as string[],
    skills: [] as string[],
    experience: [] as any[],
    education: [] as any[],
    profilePic: "",
    resumeUrl: ""
  });

  const [files, setFiles] = useState({
    profilePic: null as File | null,
    resume: null as File | null,
  });

  // Extract data from the API response
  useEffect(() => {
    if (apiResponse) {
      // Due to apiSlice custom unwrapping, apiResponse might directly be the data object
      const d = apiResponse.data ? apiResponse.data : apiResponse;
      
      setProfile({
        fullName: d.fullName || "",
        phone: d.phone || "",
        experienceLevel: d.experienceLevel || "",
        location: d.location || "",
        about: d.about || "",
        employmentType: d.employmentType || [],
        skills: d.skills || [],
        experience: d.experience || [],
        education: d.education || [],
        profilePic: d.profilePic || "",
        resumeUrl: d.resumeUrl || ""
      });
    }
  }, [apiResponse]);

  // Handlers
  const handleChange = (field: string, value: any) => setProfile({ ...profile, [field]: value });
  
  const handleArrayUpdate = (field: "skills" | "employmentType", index: number, value: string) => {
    const newArray = [...profile[field]];
    newArray[index] = value;
    setProfile({ ...profile, [field]: newArray });
  };
  
  const addItem = (field: "skills" | "employmentType") => setProfile({ ...profile, [field]: [...profile[field], ""] });
  
  const removeItem = (field: "skills" | "employmentType", index: number) => {
    const newArray = profile[field].filter((_, i) => i !== index);
    setProfile({ ...profile, [field]: newArray });
  };

  const updateComplexItem = (arrayName: "experience" | "education", id: string | number, field: string, value: string) => {
    const updatedList = profile[arrayName].map((item: any) => item.id === id ? { ...item, [field]: value } : item);
    setProfile({ ...profile, [arrayName]: updatedList });
  };

  const addComplexItem = (arrayName: "experience" | "education") => {
    const newItem = arrayName === "experience" 
      ? { id: Date.now().toString(), designation: "", companyName: "", startDate: "" } 
      : { id: Date.now().toString(), degree: "", university: "", year: "" };
    setProfile({ ...profile, [arrayName]: [...profile[arrayName], newItem] });
  };

  const removeComplexItem = (arrayName: "experience" | "education", id: string | number) => {
    setProfile({ ...profile, [arrayName]: profile[arrayName].filter((i: any) => i.id !== id) });
  };

  // Save handler
  const handleSave = async () => {
    const formData = new FormData();
    
    formData.append("fullName", profile.fullName);
    formData.append("phone", profile.phone);
    formData.append("experienceLevel", profile.experienceLevel);
    formData.append("location", profile.location);
    formData.append("about", profile.about);

    formData.append("skills", JSON.stringify(profile.skills));
    formData.append("employmentType", JSON.stringify(profile.employmentType));
    
    const cleanExperience = profile.experience.map(({id, ...rest}) => String(id).includes(Date.now().toString().slice(0,5)) ? rest : {id, ...rest});
    const cleanEducation = profile.education.map(({id, ...rest}) => String(id).includes(Date.now().toString().slice(0,5)) ? rest : {id, ...rest});
    
    formData.append("experience", JSON.stringify(cleanExperience));
    formData.append("education", JSON.stringify(cleanEducation));

    if (files.profilePic) formData.append("profilePic", files.profilePic);
    if (files.resume) formData.append("resumeUrl", files.resume);

    try {
      await updateProfile(formData).unwrap();
      setIsEditing(false);
      setFiles({ profilePic: null, resume: null });
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const getProfilePicUrl = () => {
    if (files.profilePic) return URL.createObjectURL(files.profilePic);
    if (profile.profilePic) return `${BASE_URL}${profile.profilePic}`;
    return "/image/profile-picture.png";
  };

  const getResumeUrl = () => {
    if (files.resume) return URL.createObjectURL(files.resume);
    if (profile.resumeUrl) return `${BASE_URL}${profile.resumeUrl}`;
    return "";
  };

  if (isLoading) return <div className="p-8 text-center">Loading Profile...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error loading profile data.</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full border" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Professional Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* LEFT COLUMN */}
        <div className="space-y-8 pr-0 lg:pr-10 lg:border-r border-gray-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-gray-100 shadow-sm">
                <AvatarImage src={getProfilePicUrl()} className="object-cover" />
                <AvatarFallback>{profile.fullName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-[#3FAE2A] p-2 rounded-full cursor-pointer text-white shadow-md">
                   <Upload size={16} />
                   <input 
                     type="file" 
                     className="hidden" 
                     accept="image/*"
                     onChange={(e) => {
                       if (e.target.files && e.target.files[0]) {
                         setFiles({ ...files, profilePic: e.target.files[0] });
                       }
                     }} 
                   />
                </label>
              )}
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
              {isEditing ? (
                <>
                  <Input value={profile.fullName} onChange={(e) => handleChange("fullName", e.target.value)} placeholder="Full Name" className="font-bold" />
                  <Input value={profile.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="Phone" />
                  <Input value={profile.experienceLevel} onChange={(e) => handleChange("experienceLevel", e.target.value)} placeholder="Level (e.g., Mid, Senior)" />
                  <Input value={profile.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="Location" />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.fullName || "N/A"}</h2>
                  <p className="text-gray-500">Phone: <span className="text-gray-800">{profile.phone || "N/A"}</span></p>
                  <p className="text-gray-500">Level: <span className="text-gray-800 font-medium">{profile.experienceLevel || "N/A"}</span></p>
                  <p className="text-gray-500">Location: <span className="text-gray-800 font-medium">{profile.location || "N/A"}</span></p>
                  <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-500 text-xs px-2 py-1 rounded-full font-medium"><ShieldCheck size={14} /> Id Verified</span>
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-500 text-xs px-2 py-1 rounded-full font-medium"><BadgeCheck size={14} /> Face Verified</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">About Me</h3>
            {isEditing ? (
              <Textarea value={profile.about} onChange={(e) => handleChange("about", e.target.value)} className="h-32"/>
            ) : (
              <p className="text-gray-600 text-sm leading-relaxed text-justify">{profile.about || "No details provided."}</p>
            )}
          </div>

          <div>
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-gray-900">Experience</h3>
               {isEditing && <Button size="sm" variant="outline" onClick={() => addComplexItem("experience")}><Plus size={14}/> Add</Button>}
             </div>
             <div className="space-y-6">
              {profile.experience.length > 0 ? profile.experience.map((exp: any) => (
                <div key={exp.id} className="relative group">
                  {isEditing ? (
                    <div className="p-4 border rounded-lg space-y-3 bg-gray-50">
                       <Input value={exp.designation} onChange={(e) => updateComplexItem("experience", exp.id, "designation", e.target.value)} placeholder="Job Title" />
                       <Input value={exp.companyName} onChange={(e) => updateComplexItem("experience", exp.id, "companyName", e.target.value)} placeholder="Company Name" />
                       <Input value={exp.startDate ? String(exp.startDate).substring(0, 10) : ""} type="date" onChange={(e) => updateComplexItem("experience", exp.id, "startDate", e.target.value)} placeholder="Start Date" />
                       <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeComplexItem("experience", exp.id)}><Trash2 size={12} /></Button>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-base font-bold text-gray-900">{exp.designation}</h4>
                      <p className="text-sm text-gray-600">{exp.companyName}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ""} {exp.endDate ? ` - ${new Date(exp.endDate).toLocaleDateString()}` : " - Present"}
                      </p>
                    </div>
                  )}
                </div>
              )) : <p className="text-sm text-gray-500">No experience added.</p>}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-gray-600 font-medium">Upload CV / Resume:</span>
            {isEditing ? (
               <div className="flex items-center gap-2">
                 <Input 
                   type="file" 
                   accept=".pdf,.doc,.docx"
                   onChange={(e) => {
                     if(e.target.files && e.target.files[0]){
                       setFiles({...files, resume: e.target.files[0]})
                     }
                   }} 
                   className="w-[200px] text-xs" 
                 />
               </div>
            ) : (
               profile.resumeUrl ? (
                 <Dialog>
                   <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <FileText size={16} /> View Resume
                      </Button>
                   </DialogTrigger>
                   <DialogContent className="max-w-4xl w-[90%] h-[85vh] flex flex-col p-0 overflow-hidden">
                      <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                        <DialogTitle>Resume Preview</DialogTitle>
                        <Link href={getResumeUrl()} download="Resume" target="_blank" rel="noreferrer">
                          <Button size="sm" className="bg-[#3FAE2A] hover:bg-green-700 mr-8">
                            <Download size={16} className="mr-2"/> Download
                          </Button>
                        </Link>
                      </DialogHeader>
                      
                      <div className="flex-1 bg-gray-100 overflow-y-auto flex items-center justify-center p-4">
                         <iframe 
                           src={`${getResumeUrl()}#toolbar=0`} 
                           className="w-full h-full rounded shadow-lg bg-white" 
                           title="Resume PDF"
                         />
                      </div>
                   </DialogContent>
                 </Dialog>
               ) : <span className="text-sm text-red-500">No Resume Uploaded</span>
            )}
          </div>

          <div>
             <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-900">Skills</h3>
              {isEditing && <Button size="sm" variant="ghost" onClick={() => addItem("skills")}><Plus size={16}/></Button>}
            </div>
            {profile.skills.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                {profile.skills.map((skill, idx) => (
                  isEditing ? (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input value={skill} onChange={(e) => handleArrayUpdate("skills", idx, e.target.value)} />
                      <Button size="icon" variant="ghost" onClick={() => removeItem("skills", idx)}>
                        <Trash2 size={16} className="text-red-500"/>
                      </Button>
                    </div>
                  ) : (
                    <li key={idx}>{skill}</li>
                  )
                ))}
              </ul>
            ) : <p className="text-sm text-gray-500">No skills added.</p>}
          </div>

           <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Educations</h3>
              {isEditing && <Button size="sm" variant="outline" onClick={() => addComplexItem("education")}><Plus size={14}/> Add</Button>}
            </div>
            <div className="space-y-6">
              {profile.education.length > 0 ? profile.education.map((edu: any) => (
                <div key={edu.id} className="relative group">
                  {isEditing ? (
                    <div className="p-4 border rounded-lg space-y-3 bg-gray-50">
                      <Input value={edu.degree || ""} onChange={(e) => updateComplexItem("education", edu.id, "degree", e.target.value)} placeholder="Degree" />
                      <Input value={edu.university || ""} onChange={(e) => updateComplexItem("education", edu.id, "university", e.target.value)} placeholder="University / Institution" />
                      <Input value={edu.year || ""} onChange={(e) => updateComplexItem("education", edu.id, "year", e.target.value)} placeholder="Passing Year" />
                      <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeComplexItem("education", edu.id)}><Trash2 size={12} /></Button>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-base font-bold text-gray-900">{edu.degree}</h4>
                      <p className="text-sm text-gray-600">{edu.university}</p>
                      <p className="text-xs text-gray-400 mt-1">{edu.year}</p>
                    </div>
                  )}
                </div>
              )) : <p className="text-sm text-gray-500">No education details added.</p>}
            </div>
          </div>

          <div className="pt-10">
            {isEditing ? (
              <div className="flex gap-4">
                <Button 
                  onClick={handleSave} 
                  disabled={isUpdating}
                  className="flex-1 h-12 rounded-full font-bold text-base shadow-lg bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsEditing(false)} 
                  className="h-12 px-8 rounded-full font-bold text-base shadow-lg"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setIsEditing(true)} 
                className="w-full md:w-auto h-12 px-8 rounded-full font-bold text-base shadow-lg bg-[#3FAE2A] hover:bg-green-700"
              >
                Edit Professional Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}