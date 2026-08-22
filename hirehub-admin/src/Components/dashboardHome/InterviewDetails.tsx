import React, { useState } from "react";
import Picture from "../../assets/images/profile.png";

const candidateData = {
  name: "Sowrove Bepary",
  email: "sowrovebepary@gmail.com",
  phone: "+1 (876) 555-3421",
  dob: "08.08.2003",
  gender: "Male",
  location: "Lorem ipsum dolor sit amet,",
  preferredJob: "Lorem ipsum dolor sit amet,",
  employmentType: "Lorem ipsum dolor sit amet,",
  overview: "Lorem ipsum dolor sit amet,Lorem ipsum dolor sit amet,Lorem ipsum dolor sit amet,",
  image: Picture, 
  
  // Education
  qualification: "Diploma",
  institution: "HEART Trust / NTA",
  eduStart: "2022",
  eduEnd: "2026",

  // Professional
  designation: "Customer Service Representative",
  company: "Digicel Jamaica",
  expStart: "2022",
  expEnd: "2026",
  level: "Mid Level Experiences",
  skills: ["Python", "C++", "Java"],
  
  resumeUrl: "#", // PDF Link here
};

const InterviewDetails = ({ interview, onBack }) => {
  // Resume Modal State (Optional feature)
  const [showResume, setShowResume] = useState(false);

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 font-sans w-full mx-auto my-6 relative min-h-[600px]">
      
      {/* ─── Header Section ─── */}
      <div className="flex justify-between items-center mb-10 border-b border-dashed border-gray-200 pb-5">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition text-gray-600"
          >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <h3 className="text-xl font-bold text-gray-800">Interview Details</h3>
        </div>
        
        {/* Top Right Tag */}
        <span className="px-6 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white">
            Job seeker
        </span>
      </div>

      {/* ─── 3 Column Grid Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* ─── Column 1: Profile Information ─── */}
        <div className="lg:border-r border-dashed border-gray-200 lg:pr-6">
          <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-xl">•</span> Profile Information
          </h4>
          
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-3 font-medium">Profile Picture</p>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-50">
                <img src={candidateData.image} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="space-y-4">
            <InfoRow label="Full Name" value={candidateData.name} />
            <InfoRow label="Email" value={candidateData.email} />
            <InfoRow label="Phone Number" value={candidateData.phone} />
            <InfoRow label="Date Of Birth" value={candidateData.dob} />
            <InfoRow label="Gender" value={candidateData.gender} />
            <InfoRow label="Location" value={candidateData.location} />
            <InfoRow label="Preferred Job Categories" value={candidateData.preferredJob} />
            <InfoRow label="Employment Type" value={candidateData.employmentType} />
            
            <div className="pt-2">
                <span className="text-gray-400 font-medium text-sm block mb-1">Overview:</span>
                <p className="text-gray-600 text-sm leading-relaxed">
                   {candidateData.overview}
                </p>
            </div>
          </div>
        </div>

        {/* ─── Column 2: Educational & Professional ─── */}
        <div className="lg:border-r border-dashed border-gray-200 lg:pr-6">
          
          {/* Educational Details */}
          <div className="mb-8">
            <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-xl">•</span> Educational Details
            </h4>
            <div className="space-y-3">
              <InfoRow label="Qualification" value={candidateData.qualification} />
              <InfoRow label="Institution" value={candidateData.institution} />
              <InfoRow label="Started Year" value={candidateData.eduStart} />
              <InfoRow label="Completion Year" value={candidateData.eduEnd} />
            </div>
          </div>

          {/* Professional Details */}
          <div>
            <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-xl">•</span> Professional Details (Mandatory)
            </h4>
            
            <div className="flex items-center justify-between mb-6">
               <span className="text-sm text-gray-500 font-medium">Upload CV / Resume:</span>
               <button className="px-6 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 bg-white">
                 View Resume
               </button>
            </div>

            <div className="mb-6">
                <p className="text-sm font-semibold text-gray-600 mb-3">Experience</p>
                <div className="space-y-3">
                    <InfoRow label="Designation" value={candidateData.designation} />
                    <InfoRow label="Company Name" value={candidateData.company} />
                    <InfoRow label="Started Year" value={candidateData.expStart} />
                    <InfoRow label="Completion Year" value={candidateData.expEnd} />
                    <InfoRow label="Experience Level" value={candidateData.level} />
                </div>
            </div>

            <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">Skills</p>
                <div className="flex flex-wrap gap-3">
                   {candidateData.skills.map((skill, i) => (
                     <span key={i} className="bg-[#F8F9FA] text-gray-700 px-6 py-2 rounded-lg text-sm font-medium">
                        {skill}
                     </span>
                   ))}
                </div>
            </div>
          </div>
        </div>

        {/* ─── Column 3: Verification & Buttons ─── */}
        <div className="flex flex-col h-full relative">
          <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
             <span className="text-xl">•</span> Verification
          </h4>
          
          <div className="space-y-6">
            <VerificationItem label="Government Id card(Front) :" btnText="View Front" />
            <VerificationItem label="Government Id card(Back) :" btnText="View Back" />
            <VerificationItem label="Captured selfie :" btnText="View Selfie" />
          </div>

          {/* Bottom Actions (Floating at bottom right like the image) */}
          <div className="mt-auto pt-16 flex justify-end gap-4">
             <button className="bg-[#E7F8EE] text-[#00B074] px-10 py-3 rounded-full text-base font-bold hover:bg-green-100 transition shadow-sm">
                Approve
             </button>
             <button className="bg-[#FFEEEE] text-[#FF5B5B] px-10 py-3 rounded-full text-base font-bold hover:bg-red-100 transition shadow-sm">
                Decline
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Helper Components (For cleaner code) ───

// Row for Label: Value
const InfoRow = ({ label, value }) => (
    <div className="flex flex-wrap items-baseline gap-2 mb-2">
        <span className="text-gray-400 font-medium text-sm min-w-[100px]">{label}:</span> 
        <span className="text-gray-800 font-medium text-sm flex-1">{value}</span>
    </div>
);

// Row for Verification Items
const VerificationItem = ({ label, btnText }) => (
    <div className="flex items-center justify-between">
       <span className="text-sm text-gray-500 font-medium">{label}</span>
       <button className="px-6 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 bg-white min-w-[120px]">
          {btnText}
       </button>
    </div>
);

export default InterviewDetails;