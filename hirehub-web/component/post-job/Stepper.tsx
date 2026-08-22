import { Check } from "lucide-react";

export default function Stepper({ currentStep }: { currentStep: number }) {
  const steps = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300
            ${
              step <= currentStep && currentStep !== 6 // Hide stepper on success screen
                ? "bg-[#3FAE2A] border-[#3FAE2A] text-white"
                : "bg-white border-green-200 text-green-200"
            }`}
          >
            {step < currentStep ? (
              <Check size={16} strokeWidth={3} />
            ) : (
              <div className={`w-2.5 h-2.5 rounded-full ${step === currentStep ? "bg-white" : "bg-transparent"}`} />
            )}
          </div>
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`w-8 md:w-16 h-[2px] mx-1
              ${step < currentStep ? "bg-[#3FAE2A]" : "bg-green-100"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}