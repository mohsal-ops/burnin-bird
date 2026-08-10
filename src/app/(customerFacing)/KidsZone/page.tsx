import GamesSection from "./components/sections/GamesSection";
import { buildMetadata } from "@/lib/seo";
import HeroSection from "./components/sections/HeroSection";

export const metadata = buildMetadata("kidsZone");

const Index = () => {
  return (
    <div className="min-h-screen bg-black w-full">
      <main>
        <HeroSection />
        <GamesSection />
      </main>
    </div>
  );
};

export default Index;
