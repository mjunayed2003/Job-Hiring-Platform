import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Main = () => {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Fixed Sidebar with exactly 300px width */}
      <div className="w-[345px] flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Header wrapper with proper spacing */}
        <div className="py-2 px-2 sticky top-0 z-40 bg-[#F8F9FA]/80 backdrop-blur-sm">
          <Header />
        </div>
        
        {/* Page Content */}
        <div className="px-8 pb-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Main;