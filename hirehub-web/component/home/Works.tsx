import React from 'react'
import { Card, CardContent } from "@/components/ui/card"

const steps = [
  {
    step: "Step 1",
    title: "Create Your Profile",
    description: "Verified identity ensures trust on both sides.",
    number: "1"
  },
  {
    step: "Step 2",
    title: "Match & Connect",
    description: "Smart categories, filters, and location-based discovery.",
    number: "2"
  },
  {
    step: "Step 3",
    title: "Interview & Hire",
    description: "Schedule interviews, chat securely, and hire faster.",
    number: "3"
  }
]

const Works = () => {
  return (
    <section id="how-it-works" className="py-16 bg-white scroll-mt-24">
      {/* Container with fixed width as per request (max-width used for responsiveness) */}
      <div className=" max-w-[1251px] w-full mx-auto px-4">
        
        {/* Title Section */}
        <div className="text-center mb-[60px]">
          <h2 className="text-[40px] md:text-[56px] font-bold text-[#3FAE2A]">
            How It Works
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <div key={index} className="relative">
              <Card className="h-full border border-[#3FAE2A] bg-white shadow-sm rounded-lg overflow-visible relative z-10">
                <CardContent className="p-8 pt-10 pb-16 flex flex-col h-full">
                  {/* Step Label */}
                  <span className="text-[#3FAE2A] font-bold text-lg mb-3 block">
                    {item.step}
                  </span>
                  
                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>

              {/* Large Number Overlay */}
              {/* Positioned absolute relative to the wrapper div to hang off the card */}
              <div 
                className="absolute -bottom-10 left-6 z-20 bg-white px-2 select-none pointer-events-none"
                style={{ lineHeight: '0.8' }}
              >
                <span className="text-[100px] md:text-[120px] font-black italic text-[#3FAE2A]" 
                      style={{ fontFamily: 'sans-serif' }}>
                  {item.number}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Works