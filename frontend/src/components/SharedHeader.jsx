import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SharedHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-[10px] transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ${isScrolled ? 'bg-white/98 shadow-[0_4px_20px_rgba(0,0,0,0.08)]' : ''}`}>
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer transition-transform duration-300 hover:scale-105" onClick={() => navigate('/')}>
            <div className="w-10 h-10 flex items-center justify-center filter drop-shadow-[0_4px_6px_rgba(102,126,234,0.3)]">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#gradient1)" />
                <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="url(#gradient2)" />
                <defs>
                  <linearGradient id="gradient1" x1="2" y1="2" x2="22" y2="12">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="2" y1="12" x2="22" y2="22">
                    <stop offset="0%" stopColor="#f093fb" />
                    <stop offset="100%" stopColor="#f5576c" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-[#667eea] to-[#f5576c] bg-clip-text text-transparent transform -skew-x-[10deg] tracking-tight">RMS</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {['features', 'how-it-works', 'testimonials', 'contact'].map((section) => (
               <button 
                  key={section}
                  className="px-4 py-2 text-[#4a5568] font-medium text-[15px] rounded-lg transition-all duration-200 hover:text-[#667eea] hover:bg-[#ebf4ff] relative overflow-hidden"
                  onClick={() => scrollToSection(section)}
                >
                  {section === 'features' ? 'Tính năng' : section === 'how-it-works' ? 'Cách hoạt động' : section === 'testimonials' ? 'Đánh giá' : 'Liên hệ'}
                </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              className={`px-5 py-2.5 bg-transparent border-[1.5px] border-[#e2e8f0] text-[#4a5568] text-[15px] font-semibold rounded-xl cursor-pointer transition-all duration-200 hover:border-[#667eea] hover:text-[#667eea] hover:-translate-y-[1px] ${isActive('/login') ? 'border-[#667eea] text-[#667eea] bg-[#ebf4ff]' : ''}`}
              onClick={() => navigate('/login')}
            >
              Đăng nhập
            </button>
            <button 
              className={`px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-[15px] font-bold rounded-xl cursor-pointer transition-all duration-200 shadow-[0_4px_6px_rgba(118,75,162,0.25)] hover:from-[#5a67d8] hover:to-[#6b46c1] hover:shadow-[0_6px_8px_rgba(118,75,162,0.3)] hover:-translate-y-[1px] ${isActive('/register') ? 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]' : ''}`}
              onClick={() => navigate('/register')}
            >
              Đăng ký ngay
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-[#2d3748]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="relative w-6 h-[18px]">
              <span className={`absolute left-0 w-full h-0.5 bg-current rounded transition-all duration-300 ${isMobileMenuOpen ? 'top-[9px] rotate-45' : 'top-0'}`}></span>
              <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-current rounded transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`absolute left-0 w-full h-0.5 bg-current rounded transition-all duration-300 ${isMobileMenuOpen ? 'top-[9px] -rotate-45' : 'bottom-0'}`}></span>
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-[72px] left-0 right-0 bg-white border-t border-[#f7fafc] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] p-6 z-[999] transition-all duration-300 ease-in-out origin-top ${isMobileMenuOpen ? 'opacity-100 scale-y-100 max-h-[500px]' : 'opacity-0 scale-y-0 max-h-0 overflow-hidden'}`}>
          <nav className="flex flex-col gap-2 mb-6">
            {['features', 'how-it-works', 'testimonials', 'contact'].map((section) => (
                <button 
                  key={section}
                  className="p-3 text-left text-[#4a5568] font-medium text-base rounded-lg transition-colors duration-200 hover:bg-[#f7fafc] hover:text-[#667eea]"
                  onClick={() => scrollToSection(section)}
                >
                  {section === 'features' ? 'Tính năng' : section === 'how-it-works' ? 'Cách hoạt động' : section === 'testimonials' ? 'Đánh giá' : 'Liên hệ'}
                </button>
            ))}
          </nav>
          
          <div className="flex flex-col gap-3 py-4 border-t border-[#edf2f7]">
            <button 
              className={`w-full py-3 px-4 bg-transparent border border-[#e2e8f0] text-[#4a5568] font-semibold rounded-xl transition-all duration-200 hover:bg-[#f7fafc] ${isActive('/login') ? 'bg-[#ebf4ff] border-[#667eea] text-[#667eea]' : ''}`}
              onClick={() => navigate('/login')}
            >
              Đăng nhập
            </button>
            <button 
              className={`w-full py-3 px-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-bold rounded-xl transition-all duration-200 shadow-[0_4px_6px_rgba(118,75,162,0.25)] hover:shadow-[0_6px_8px_rgba(118,75,162,0.3)] ${isActive('/register') ? 'opacity-90' : ''}`}
              onClick={() => navigate('/register')}
            >
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SharedHeader;
