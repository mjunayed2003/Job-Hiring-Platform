"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Info, FileText, Shield, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteAccountModal from "@/component/profile/DeleteAccountModal";
import { useState } from "react";

const settingsItems = [
  { id: 'password', label: 'Change Password', icon: Lock, color: 'bg-green-600', path: '/settings/change-password' },
  { id: 'about', label: 'About Us', icon: Info, color: 'bg-green-500', path: '/about-us' },
  { id: 'terms', label: 'Terms & Conditions', icon: FileText, color: 'bg-green-600', path: '/terms' },
  { id: 'privacy', label: 'Privacy Policy', icon: Shield, color: 'bg-green-600', path: '/privacy' },
  { id: 'delete', label: 'Delete Account', icon: Trash2, color: 'bg-red-500', path: 'modal' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-10">
      <div className="flex items-center gap-6 mb-12">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full border">
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {settingsItems.map((item) => (
          <button
            key={item.id}
            onClick={() => item.id === 'delete' ? setShowDelete(true) : router.push(item.path)}
            className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>
                <item.icon className="text-white" size={16} />
              </div>
              <span className="text-sm font-medium text-gray-600">{item.label}</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        ))}
      </div>

      <DeleteAccountModal open={showDelete} onOpenChange={setShowDelete} />
    </div>
  );
}