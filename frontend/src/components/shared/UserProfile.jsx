import { useState, useEffect } from "react";
import { authService } from "../../services/authService";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const userInfo = authService.getUserInfo();
    setUser(userInfo);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = "/login";
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold text-base shadow-sm">
          {user.fullName?.charAt(0)?.toUpperCase()}
        </div>
        <div className="hidden md:block flex-1 text-left min-w-[150px]">
          <div className="text-sm font-semibold text-gray-800 leading-tight mb-0.5">
            {user.fullName}
          </div>
          <div className="text-xs text-gray-500 truncate max-w-[150px]">
            {user.email}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
        >
          <path d="M5 7l5 5 5-5H5z" fill="currentColor" />
        </svg>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
              <div className="font-semibold text-gray-900 mb-1">{user.fullName}</div>
              <div className="text-xs text-gray-500 mb-3">{user.email}</div>
              <div className="flex flex-wrap gap-2">
                {user.authProvider === "Google" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-600 shadow-sm">
                    Google
                  </span>
                )}
                {user.roles?.map((role) => (
                  <span key={role} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {user.departments && user.departments.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Phòng ban
                </div>
                {user.departments.map((dept) => (
                  <div key={dept} className="px-3 py-1 text-sm text-gray-600">
                    {dept}
                  </div>
                ))}
              </div>
            )}

            <div className="h-px bg-gray-100 my-1" />

            <div className="p-1">
              <button
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                onClick={() => (window.location.href = "/profile")}
              >
                <svg
                  className="text-gray-400 group-hover:text-blue-600 transition-colors"
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2 2H6a5 5 0 00-5 5v1h12v-1a5 5 0 00-5-5z" />
                </svg>
                Thông tin cá nhân
              </button>

              <button
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                onClick={() => (window.location.href = "/settings")}
              >
                <svg
                  className="text-gray-400 group-hover:text-blue-600 transition-colors"
                  width="18"
                   height="18"
                   viewBox="0 0 16 16"
                   fill="currentColor"
                 >
                   <path fillRule="evenodd" d="M8 13.5a5.5 5.5 0 100-11 5.5 5.5 0 000 11zm0 .5A6 6 0 108 2a6 6 0 000 12z" clipRule="evenodd" />
                 </svg>
                 Cài đặt
              </button>
            </div>

            <div className="h-px bg-gray-100 my-1" />

            <div className="p-1">
              <button
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onClick={handleLogout}
              >
                <svg
                  className="text-red-500"
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 00-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z" clipRule="evenodd" />
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
