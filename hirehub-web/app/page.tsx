import KeyFeatures from "@/component/home/Features";
import HeroPage from "@/component/home/Hero";
import JobOpportunities from "@/component/home/JobOpportunities";
import JournyAndApp from "@/component/home/JournyAndApp";
import Works from "@/component/home/Works";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <HeroPage />
      <JobOpportunities />
      <Works />
      <KeyFeatures />
      <JournyAndApp />
    </div>
  );
}
