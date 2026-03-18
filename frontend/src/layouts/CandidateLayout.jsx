import React, { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";

export default function CandidateLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getUserInfo());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Sync user info if it changes in other tabs or components
    const handleStorageChange = () => {
      setUser(authService.getUserInfo());
    };
    window.addEventListener("storage", handleStorageChange);

    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const closeDropdown = () => setIsDropdownOpen(false);

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
                `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
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
                `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
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
                `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              CV của tôi
            </NavLink>
            <NavLink
              to="/app/interviews"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              Phỏng vấn
            </NavLink>
          </nav>

          <div className="flex items-center gap-4 text-sm relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 hover:bg-gray-100 p-1.5 pr-3 rounded-full transition-colors focus:outline-none"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                  {user?.fullName?.charAt(0) || "U"}
                </div>
              )}
              <span className="hidden sm:inline font-medium text-gray-700">
                {user?.fullName || "Ứng viên"}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>

                <Link to="/app/profile#info" onClick={closeDropdown} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  Hồ sơ cá nhân
                </Link>
                <Link to="/app/profile#cv-upload" onClick={closeDropdown} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  Tài liệu CV
                </Link>
                <Link to="/app/profile#change-password" onClick={closeDropdown} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  Đổi mật khẩu
                </Link>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => { closeDropdown(); handleLogout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
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
