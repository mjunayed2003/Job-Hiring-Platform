"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, Users, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RoleSelectionPage() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const roles = [
        {
            id: "company",
            title: "Company",
            description: "For businesses or organizations hiring multiple employees or recruiting regularly.",
            image: '/image/company.svg',
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            id: "employer",
            title: "Individual Employer",
            description: "For personal, household, small business, or one-time hiring needs.",
            image: '/image/employer.svg',
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        },
        {
            id: "job-seeker",
            title: "Job Seeker",
            description: "I'm looking for work opportunities.",
            image: '/image/job-seeker.svg',
            color: "text-orange-600",
            bgColor: "bg-orange-100",
        },
    ];

const handleNext = () => {
    if (!selectedRole) return;

    if (selectedRole === "company") {
        router.push("/auth/signup/company/step-1");
    } else if (selectedRole === "employer") {
        router.push("/auth/signup/employer/step-1");
    } else if (selectedRole === "job-seeker") {
        router.push("/auth/signup/job-seeker/step-1");
    }
};


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">

            {/* Main Card Container */}
            <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">

                {/* LEFT SIDE: Image & Overlay */}
                <div className="relative w-full md:w-1/2 hidden md:block">
                    <Image
                        src="/image/jaimica7.webp"
                        alt="Business Meeting"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Glassmorphism Overlay */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] bg-white/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center text-white shadow-lg">
                        <h3 className="text-lg font-bold">Welcome to HireHubJA</h3>
                        <p className="text-sm opacity-90 mt-1">Login to explore more</p>
                        <div className="flex justify-center gap-2 mt-3">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            <span className="w-2 h-2 bg-white/50 rounded-full"></span>
                            <span className="w-2 h-2 bg-white/50 rounded-full"></span>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Content */}
                <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col items-center justify-center p-8 md:p-12 relative">

                    {/* Logo */}
                    <div className="mb-4">
                        <div className="relative   flex items-center justify-center">
                            <Image
                                src="/image/logo.svg"
                                alt="LOGO"
                                width={200}
                                height={200}
                            />
                        </div>
                    </div>

                    {/* Headings */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-green-600">
                            Welcome to HireHubJA
                        </h1>
                        <p className="text-gray-500 text-sm mt-2">
                            Sign up by choosing how you want to use HireHubJA
                        </p>
                    </div>

                    {/* Role Selection Cards */}
                    <div className="w-full max-w-md space-y-4">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={`relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 bg-white shadow-sm hover:shadow-md
                  ${selectedRole === role.id
                                        ? "border-[#3FAE2A] ring-1 ring-[#3FAE2A]"
                                        : "border-transparent hover:border-green-200"
                                    }
                `}
                            >
                                {/* Icon Box */}
                                <div className={`p-3 rounded-lg ${role.bgColor}`}>
                                    <Image src={role.image} alt={role.title} width={24} height={24} />
                                </div>

                                {/* Text */}
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-gray-800">
                                        {role.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                        {role.description}
                                    </p>
                                </div>

                                {/* Checkmark Indicator (Optional for UX) */}
                                {selectedRole === role.id && (
                                    <div className="absolute top-2 right-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#3FAE2A]" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Next Button */}
                    <div className="w-full max-w-md mt-8">
                        <Button
                            onClick={handleNext}
                            disabled={!selectedRole}
                            className={`w-full font-bold rounded-full py-6 text-lg shadow-lg transition-all
                ${selectedRole
                                    ? "bg-[#3FAE2A] hover:bg-[#359624] text-white shadow-green-200"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }
              `}
                        >
                            Next
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
