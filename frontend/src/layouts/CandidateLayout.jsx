import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export default function CandidateLayout() {
  const navigate = useNavigate();
  const user = authService.getUserInfo();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-slate-800">
      <header className="bg-white border-b border-gray-200 h-16 flex items-center sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-2xl text-blue-700 tracking-tight">RMS</span>
            <span className="text-gray-500 font-medium text-sm">Careers</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/app/jobs"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              Việc làm
            </NavLink>
            <NavLink
              to="/app/applications"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              Hồ sơ ứng tuyển
            </NavLink>
            <NavLink
              to="/app/offers"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              Thư mời
            </NavLink>
            <NavLink
              to="/app/profile"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              CV của tôi
            </NavLink>
          </nav>

          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:inline text-gray-700 font-medium">
              Chào, {user?.fullName || "Ứng viên"}
            </span>
            <button 
              onClick={handleLogout} 
              className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all font-medium text-xs"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">&copy; 2026 RMS Recruitment System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
