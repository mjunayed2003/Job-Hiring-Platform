// src/layouts/Main/Sidebar.jsx


import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sidebarItems } from "../../constants/sidebar.constants";
import { MdArrowRight } from "react-icons/md";
import { MdLogout } from "react-icons/md";
import { cn } from "../../lib/utils";
import logo from '../../assets/images/logo.svg';
import { logout, selectCurrentUser } from "../../redux/features/Auth/AuthSlice";
import { baseApi } from "../../redux/api/BaseApi";
import toast from "react-hot-toast";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [openMenu, setOpenMenu] = useState("");

  useEffect(() => {
    const activeItem = sidebarItems.find(item =>
      item.rootPath && location.pathname.includes(item.rootPath)
    );
    if (activeItem) {
      setOpenMenu(activeItem.name);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    toast.success("Logged out successfully");
    navigate("/auth/sign-in");
  };

  return (
    <div className="fixed top-0 left-0 w-[345px] h-screen bg-white shadow-[2px_0_10px_rgba(0,0,0,0.03)] flex flex-col z-50">
      {/* Logo Area */}
      <div className="h-[160px] flex items-center justify-center mt-4">
        <img src={logo} alt="HireHubJA" className="w-36 h-auto object-contain" />
      </div>

      {/* Nav Items Container */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-4">
        <ul className="space-y-0.5">
          {sidebarItems.filter(item => item.name).map((item, indx) => {

            const hasChildren = item.children && item.children.length > 0;

            const isActive = item.rootPath
              ? location.pathname.includes(item.rootPath)
              : location.pathname === item.path;

            const isOpen = openMenu === item.name;

            return hasChildren ? (
              <li key={indx} className="relative flex flex-col">
                <button
                  onClick={() => setOpenMenu(isOpen ? "" : item.name)}
                  className={cn(
                    "w-[calc(100%-20px)] ml-5 pl-4 pr-3 py-3 flex items-center justify-between text-[15px] transition-all rounded-md relative group",
                    isActive
                      ? "text-[#44B12C] font-semibold bg-gradient-to-r from-[#EAF6E9] to-transparent"
                      : "text-[#333333] font-medium hover:text-[#44B12C] hover:bg-gradient-to-r hover:from-[#EAF6E9] hover:to-transparent"
                  )}
                >
                  <div className={cn(
                    "absolute -left-5 top-1.5 bottom-1.5 w-[5px] bg-[#44B12C] rounded-r-[4px] transition-all duration-200",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )} />
                  <span>{item.name}</span>
                  <MdArrowRight
                    className={cn("transition-transform text-[22px]", {
                      "rotate-90 text-[#44B12C]": isOpen,
                      "text-[#666] group-hover:text-[#44B12C]": !isOpen
                    })}
                  />
                </button>

                <div className={cn("overflow-hidden transition-all duration-300 w-full",
                  isOpen ? "max-h-[500px]" : "max-h-0")}>
                  <div className="flex flex-col gap-0.5 mt-1 mb-2">
                    {item.children.map((child, inx) => (
                      <NavLink
                        key={inx}
                        to={child.path}
                        className={({ isActive: isChildActive }) =>
                          cn("block w-full pl-16 py-3 text-[14.5px] transition-all",
                            isChildActive
                              ? "bg-[#EAF6E9] text-[#1A1A1A] font-medium"
                              : "text-[#555555] hover:bg-[#F2F9F1] hover:text-[#1A1A1A]")
                        }
                      >
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </li>
            ) : (
              <li key={indx} className="relative">
                <NavLink
                  to={item.path}
                  className={({ isActive: isLinkActive }) =>
                    cn("flex items-center w-[calc(100%-20px)] ml-5 pl-4 py-3 text-[15px] transition-all rounded-md relative group",
                      isLinkActive
                        ? "text-[#44B12C] font-semibold bg-gradient-to-r from-[#EAF6E9] to-transparent"
                        : "text-[#333333] font-medium hover:text-[#44B12C] hover:bg-gradient-to-r hover:from-[#EAF6E9] hover:to-transparent")
                  }
                >
                  {({ isActive: isLinkActive }) => (
                    <>
                      <div className={cn(
                        "absolute -left-5 top-1.5 bottom-1.5 w-[5px] bg-[#44B12C] rounded-r-[4px] transition-all duration-200",
                        isLinkActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )} />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Logout Button */}
      <div className="px-5 pb-8 pt-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 pl-4 py-3 rounded-md text-[15px] font-medium text-red-500 hover:bg-red-50 transition-all group relative"
        >
          <div className="absolute -left-5 top-1.5 bottom-1.5 w-[5px] bg-red-400 rounded-r-[4px] opacity-0 group-hover:opacity-100 transition-all duration-200" />
          <MdLogout size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;