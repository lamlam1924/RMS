import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../../styles/candidate/layout.css"; // We will create this
import { authService } from "../../services/authService";

export default function CandidateLayout() {
    const navigate = useNavigate();
    const user = authService.getUserInfo();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="candidate-shell">
            <header className="c-header">
                <div className="c-container header-inner">
                    <div className="c-brand">
                        <span className="c-logo">RMS</span>
                        <span className="c-sub">Careers</span>
                    </div>

                    <nav className="c-nav">
                        <NavLink to="/app/jobs" className={({ isActive }) => `c-nav-item ${isActive ? 'active' : ''}`}>Việc làm</NavLink>
                        <NavLink to="/app/applications" className={({ isActive }) => `c-nav-item ${isActive ? 'active' : ''}`}>Hồ sơ ứng tuyển</NavLink>
                        <NavLink to="/app/profile" className={({ isActive }) => `c-nav-item ${isActive ? 'active' : ''}`}>CV của tôi</NavLink>
                    </nav>

                    <div className="c-user">
                        <span>Chào, {user?.fullName || 'Ứng viên'}</span>
                        <button onClick={handleLogout} className="c-logout-btn">Đăng xuất</button>
                    </div>
                </div>
            </header>

            <main className="c-main c-container">
                <Outlet />
            </main>

            <footer className="c-footer">
                <div className="c-container">
                    <p>&copy; 2026 RMS Recruitment System. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
