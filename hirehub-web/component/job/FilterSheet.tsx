"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// ─────────────────────────────────────────────────────
// TYPES — API-র সাথে match করা
// ─────────────────────────────────────────────────────
export interface FilterState {
  workplaceType: string;   // API param: workplaceType=Remote
  employmentType: string;  // API param: employmentType=Full-Time
  minSalary: number;       // API param: minSalary=500
  maxSalary: number;       // API param: maxSalary=25000
}

interface FilterSheetProps {
  onApply: (filters: FilterState) => void;
  activeCount?: number;
}

// API-র সাথে exact match
const WORK_TYPES = ["On-Site", "Remote", "Hybrid", "Contract"];
const JOB_TYPES  = ["Full-Time", "Part-Time"];

// ─────────────────────────────────────────────────────
// RADIO CHIP
// ─────────────────────────────────────────────────────
function FilterChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
        selected
          ? "border-[#3FAE2A] bg-white text-gray-800"
          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          selected ? "border-[#3FAE2A]" : "border-gray-300"
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-[#3FAE2A]" />}
      </span>
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────
export default function FilterSheet({ onApply, activeCount = 0 }: FilterSheetProps) {
  const [open, setOpen] = useState(false);

  // single select — API একটাই value নেয়
  const [workplaceType, setWorkplaceType] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 25000]);

  const handleApply = () => {
    onApply({
      workplaceType,
      employmentType,
      minSalary: salaryRange[0],
      maxSalary: salaryRange[1],
    });
    setOpen(false);
  };

  const handleReset = () => {
    setWorkplaceType("");
    setEmploymentType("");
    setSalaryRange([0, 25000]);
    // reset করলে parent-কেও জানাও
    onApply({ workplaceType: "", employmentType: "", minSalary: 0, maxSalary: 25000 });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2.5 md:p-3 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition">
          <SlidersHorizontal size={16} className="text-gray-600 md:w-[18px] md:h-[18px]" />
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#3FAE2A] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-3xl px-6 pt-4 pb-8 max-w-lg mx-auto">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

        <SheetHeader className="mb-6">
          <SheetTitle className="text-center text-lg font-bold text-gray-900">Filter</SheetTitle>
        </SheetHeader>

        <div className="space-y-7">
          {/* Work Type */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">Work Type</p>
            <div className="flex flex-wrap gap-2.5">
              {WORK_TYPES.map((type) => (
                <FilterChip
                  key={type}
                  label={type}
                  selected={workplaceType === type}
                  onToggle={() => setWorkplaceType(workplaceType === type ? "" : type)}
                />
              ))}
            </div>
          </div>

          {/* Job Type */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">Job Type</p>
            <div className="flex flex-wrap gap-2.5">
              {JOB_TYPES.map((type) => (
                <FilterChip
                  key={type}
                  label={type}
                  selected={employmentType === type}
                  onToggle={() => setEmploymentType(employmentType === type ? "" : type)}
                />
              ))}
            </div>
          </div>

          {/* Salary Range */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-4">Salary Range</p>
            <div className="flex justify-between mb-3">
              <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1">
                ${salaryRange[0].toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1">
                ${salaryRange[1].toLocaleString()}
              </span>
            </div>
            <Slider
              min={0}
              max={25000}
              step={500}
              value={salaryRange}
              onValueChange={(val) => setSalaryRange(val as [number, number])}
              className="[&_[role=slider]]:bg-[#3FAE2A] [&_[role=slider]]:border-[#3FAE2A] [&_[role=slider]]:shadow-md [&_.range]:bg-[#3FAE2A]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>$0</span>
              <span>$25,000</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 space-y-3">
          <Button
            onClick={handleApply}
            className="w-full bg-[#3FAE2A] hover:bg-[#359624] text-white font-bold text-base rounded-full py-6 shadow-md"
          >
            Apply Filter
          </Button>
          <button
            onClick={handleReset}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition font-medium py-1"
          >
            Reset filters
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}