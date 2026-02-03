import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedHeader from '../components/SharedHeader';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('hr');
  const [openFaq, setOpenFaq] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Carousel slides data
  const carouselSlides = [
    {
      title: 'Dashboard Quản lý Tuyển dụng',
      description: 'Theo dõi toàn bộ quy trình tuyển dụng với dashboard trực quan',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
      bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'AI Sàng lọc Ứng viên',
      description: 'Công nghệ AI giúp sàng lọc và xếp hạng ứng viên tự động',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
      bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Phỏng vấn Trực tuyến',
      description: 'Tổ chức phỏng vấn online hiệu quả với công cụ tích hợp',
      image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop',
      bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 3000); // 3 giây

    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  const stats = [
    { 
      number: '10K+', 
      label: 'Ứng viên được tuyển',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2"/></svg>
    },
    { 
      number: '500+', 
      label: 'Doanh nghiệp tin dùng',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2"/><path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2"/></svg>
    },
    { 
      number: '98%', 
      label: 'Độ hài lòng',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    },
    { 
      number: '45%', 
      label: 'Tiết kiệm thời gian',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    }
  ];

  const features = [
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      title: 'AI Sàng lọc Ứng viên',
      description: 'Công nghệ AI tự động phân tích CV, đánh giá kỹ năng và xếp hạng ứng viên theo độ phù hợp với job description',
      details: ['Parse CV tự động', 'Đánh giá kỹ năng', 'Scoring system', 'Smart matching']
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/></svg>,
      title: 'Dashboard & Analytics',
      description: 'Theo dõi toàn bộ metrics tuyển dụng với dashboard trực quan, biểu đồ realtime và báo cáo chi tiết',
      details: ['Realtime dashboard', 'Custom reports', 'Export Excel/PDF', 'KPI tracking']
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      title: 'Quản lý Phỏng vấn',
      description: 'Lên lịch phỏng vấn thông minh, tổ chức video call và đánh giá ứng viên với template có sẵn',
      details: ['Smart scheduling', 'Video integration', 'Evaluation templates', 'Auto notifications']
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      title: 'Email Automation',
      description: 'Tự động hóa quy trình gửi email với templates đa dạng, personalization và tracking chi tiết',
      details: ['Template library', 'Bulk sending', 'Track engagement', 'A/B testing']
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>,
      title: 'Multi-Department',
      description: 'Quản lý tuyển dụng cho nhiều phòng ban với workflow riêng biệt và phân quyền linh hoạt',
      details: ['Role-based access', 'Custom workflows', 'Multi-level approval', 'Department analytics']
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      title: 'Mobile App',
      description: 'Ứng dụng mobile với đầy đủ tính năng, cho phép làm việc mọi lúc mọi nơi một cách tiện lợi',
      details: ['iOS & Android', 'Push notifications', 'Offline mode', 'Real-time sync']
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      title: 'Bảo mật Cao cấp',
      description: 'Đảm bảo an toàn tuyệt đối cho dữ liệu với mã hóa end-to-end và tuân thủ các chuẩn bảo mật quốc tế',
      details: ['End-to-end encryption', 'Auto backup', 'GDPR compliant', 'Audit logs']
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/><path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      title: 'Tích hợp Đa dạng',
      description: 'Kết nối liền mạch với các nền tảng tuyển dụng và công cụ phổ biến qua API và webhooks',
      details: ['LinkedIn, Indeed', 'Google Workspace', 'Slack, Teams', 'REST API']
    }
  ];

  const roleFeatures = {
    hr: {
      title: 'Dành cho HR',
      subtitle: 'Tối ưu hóa toàn bộ quy trình tuyển dụng từ đầu đến cuối',
      features: [
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7V11C2 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Đăng tin tuyển dụng', 
          desc: 'Đăng đồng thời trên nhiều kênh' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
          title: 'AI Sàng lọc', 
          desc: 'Tự động sàng lọc và xếp hạng CV' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Dashboard', 
          desc: 'Theo dõi metrics realtime' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/><path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Email Campaign', 
          desc: 'Gửi hàng loạt có personalization' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/><path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Reports', 
          desc: 'Báo cáo chi tiết xuất file' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2"/><path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Notifications', 
          desc: 'Thông báo mọi hoạt động' 
        }
      ]
    },
    manager: {
      title: 'Dành cho Manager',
      subtitle: 'Quản lý yêu cầu tuyển dụng và phê duyệt ứng viên hiệu quả',
      features: [
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/><path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Job Request', 
          desc: 'Tạo yêu cầu tuyển dụng nhanh' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
          title: 'Phê duyệt', 
          desc: 'Review và approve ứng viên' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Phỏng vấn', 
          desc: 'Tham gia phỏng vấn online' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Đánh giá', 
          desc: 'Rate và feedback chi tiết' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H21" stroke="currentColor" strokeWidth="2"/><path d="M18 9L13 14L9 10L3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
          title: 'Analytics', 
          desc: 'Báo cáo tuyển dụng phòng ban' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Team', 
          desc: 'Quản lý team interview' 
        }
      ]
    },
    candidate: {
      title: 'Dành cho Ứng viên',
      subtitle: 'Tìm việc làm phù hợp và theo dõi quá trình ứng tuyển',
      features: [
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
          title: 'Tìm việc', 
          desc: 'Search theo skills và location' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/><path d="M14 2V8H20M10 13H8M16 13H14M10 17H8M16 17H14" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Nộp hồ sơ', 
          desc: 'Apply nhanh chỉ vài click' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/><path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
          title: 'Theo dõi', 
          desc: 'Track trạng thái realtime' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Lịch PV', 
          desc: 'Nhận lịch tự động qua email' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Chat', 
          desc: 'Liên hệ trực tiếp HR' 
        },
        { 
          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>,
          title: 'Profile', 
          desc: 'Quản lý CV và portfolio' 
        }
      ]
    }
  };

  const steps = [
    {
      number: '01',
      title: 'Tạo Yêu cầu Tuyển dụng',
      description: 'Manager tạo job request với mô tả chi tiết, kỹ năng yêu cầu và gửi phê duyệt cho Director'
    },
    {
      number: '02',
      title: 'Phê duyệt & Đăng tin',
      description: 'Director xem xét và phê duyệt. HR đăng tin tuyển dụng lên nhiều kênh và bắt đầu nhận hồ sơ'
    },
    {
      number: '03',
      title: 'Sàng lọc & Chọn lựa',
      description: 'AI tự động sàng lọc và xếp hạng ứng viên. HR review và chọn những ứng viên phù hợp nhất'
    },
    {
      number: '04',
      title: 'Phỏng vấn & Tuyển dụng',
      description: 'Tổ chức phỏng vấn, đánh giá chi tiết, gửi offer và hoàn tất quy trình onboarding'
    }
  ];

  const testimonials = [
    {
      name: 'Nguyễn Minh Anh',
      role: 'HR Director',
      company: 'Tech Vietnam JSC',
      content: 'RMS đã thay đổi hoàn toàn cách chúng tôi tuyển dụng. Thời gian tuyển dụng giảm 50%, chất lượng ứng viên tăng đáng kể nhờ AI sàng lọc chính xác.',
      rating: 5
    },
    {
      name: 'Trần Đức Thắng',
      role: 'CEO & Founder',
      company: 'Startup Innovation Hub',
      content: 'Là startup, chúng tôi cần giải pháp nhanh và tiết kiệm. RMS hoàn hảo! Dashboard trực quan, dễ sử dụng, support team rất nhiệt tình.',
      rating: 5
    },
    {
      name: 'Lê Thị Hương',
      role: 'Recruitment Manager',
      company: 'Global Enterprise Co.',
      content: 'Tính năng multi-department và workflow tùy chỉnh giúp chúng tôi quản lý tuyển dụng cho 20+ phòng ban một cách hiệu quả. Highly recommended!',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'RMS có phù hợp với công ty nhỏ không?',
      answer: 'Hoàn toàn phù hợp! RMS có gói Starter miễn phí dành riêng cho các công ty nhỏ hoặc startup mới bắt đầu. Bạn có thể nâng cấp khi công ty phát triển mà không mất dữ liệu.'
    },
    {
      question: 'Tôi có thể import dữ liệu ứng viên hiện có không?',
      answer: 'Có, RMS hỗ trợ import dữ liệu từ Excel, CSV hoặc từ các hệ thống ATS khác. Team support của chúng tôi sẽ hỗ trợ bạn trong toàn bộ quá trình migration hoàn toàn miễn phí.'
    },
    {
      question: 'AI sàng lọc hoạt động như thế nào?',
      answer: 'AI của chúng tôi sử dụng Natural Language Processing để phân tích CV, so sánh với job description, đánh giá kỹ năng và kinh nghiệm, sau đó xếp hạng ứng viên theo độ phù hợp. Độ chính xác lên đến 95%.'
    },
    {
      question: 'Dữ liệu của tôi có an toàn không?',
      answer: 'Tuyệt đối! Chúng tôi sử dụng mã hóa end-to-end AES-256, backup tự động hàng ngày, lưu trữ trên cloud đạt chuẩn SOC 2, và tuân thủ đầy đủ GDPR cùng các quy định bảo vệ dữ liệu.'
    },
    {
      question: 'Có hỗ trợ tiếng Việt không?',
      answer: 'Có! RMS được thiết kế hoàn toàn bằng tiếng Việt với giao diện thân thiện và support team người Việt. Chúng tôi hiểu rõ thị trường và văn hóa tuyển dụng Việt Nam.'
    },
    {
      question: 'Tôi có thể hủy subscription bất cứ lúc nào không?',
      answer: 'Có, bạn có thể hủy bất cứ lúc nào mà không mất phí phạt. Dữ liệu của bạn sẽ được giữ trong 30 ngày để bạn có thể export nếu cần. Chúng tôi cam kết không ràng buộc hợp đồng dài hạn.'
    }
  ];

  return (
    <div className="font-sans text-gray-900 bg-white">
      <SharedHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-sm font-medium text-blue-800">AI-Powered Recruitment Platform</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
                Tuyển dụng thông minh với
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Công nghệ AI</span>
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                Tối ưu hóa toàn bộ quy trình tuyển dụng từ đăng tin, sàng lọc ứng viên,
                phỏng vấn đến gửi offer. Tiết kiệm đến 45% thời gian và chi phí tuyển dụng.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-white font-semibold bg-blue-600 rounded-xl hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-lg shadow-blue-200" onClick={() => navigate('/register')}>
                  Dùng thử miễn phí 30 ngày
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-gray-700 font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 hover:-translate-y-0.5 transition-all" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 5.5V8.5M8 10.5H8.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Tìm hiểu thêm
                </button>
              </div>
              
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-200`}></div>
                  ))}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-gray-100 text-[10px] font-bold text-gray-600">+500</div>
                </div>
                <p className="text-sm text-gray-500">
                  Được tin dùng bởi <strong className="text-gray-900">500+ doanh nghiệp</strong> tại Việt Nam
                </p>
              </div>
            </div>
            
            {/* Carousel */}
            <div className="lg:w-1/2 w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] group">
                <div className="flex transition-transform duration-500 ease-in-out h-full" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {carouselSlides.map((slide, index) => (
                    <div key={index} className="w-full flex-shrink-0 relative h-full">
                      <div className="absolute inset-0 z-10" style={{ background: slide.bgColor, opacity: 0.85 }}></div>
                      <img src={slide.image} alt={slide.title} className="w-full h-full object-cover grayscale mix-blend-multiply" />
                      <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 text-white">
                        <h3 className="text-2xl font-bold mb-2">{slide.title}</h3>
                        <p className="text-white/90 text-lg">{slide.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Carousel indicators */}
                <div className="absolute bottom-6 right-6 z-30 flex gap-2">
                  {carouselSlides.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === index ? 'w-6 bg-white' : 'bg-white/50 hover:bg-white/80'}`}
                      onClick={() => setCurrentSlide(index)}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm text-blue-600">{stat.icon}</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Features Section */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-blue-600 font-bold tracking-wider text-sm uppercase">Tính năng</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2 mb-4">Giải pháp cho mọi vai trò</h2>
            <p className="text-lg text-gray-600">
              Tối ưu hóa công việc cho từng đối tượng sử dụng
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {Object.keys(roleFeatures).map((role) => (
              <button
                key={role}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${activeRole === role ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                onClick={() => setActiveRole(role)}
              >
                {roleFeatures[role].title}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-8 lg:p-12 bg-gray-50 border-b border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{roleFeatures[activeRole].title}</h3>
              <p className="text-gray-600">{roleFeatures[activeRole].subtitle}</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 lg:p-12">
              {roleFeatures[activeRole].features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {feature.icon && <div className="w-6 h-6">{feature.icon}</div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
             <span className="text-indigo-600 font-bold tracking-wider text-sm uppercase">Đầy đủ tính năng</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2 mb-4">Mọi công cụ bạn cần</h2>
            <p className="text-lg text-gray-600">
              Từ AI sàng lọc đến quản lý phỏng vấn, chúng tôi có tất cả
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                        <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-gray-900 text-white">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-blue-400 font-bold tracking-wider text-sm uppercase">Quy trình</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold mt-2 mb-4">Cách hoạt động</h2>
            <p className="text-lg text-gray-400">
              4 bước đơn giản để hoàn thành tuyển dụng
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-black text-gray-800 absolute -top-8 -left-4 opacity-50 select-none">{step.number}</div>
                <div className="relative z-10">
                   <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                   <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-blue-600 font-bold tracking-wider text-sm uppercase">Đánh giá</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2 mb-4">Khách hàng nói gì</h2>
            <p className="text-lg text-gray-600">
              Câu chuyện thành công từ những người đã sử dụng RMS
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1L10 6L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 6L8 1Z"/>
                    </svg>
                  ))}
                </div>
                
                <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">{testimonial.name.charAt(0)}</div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-xs text-gray-500">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
           <div className="text-center mb-16">
            <span className="text-blue-600 font-bold tracking-wider text-sm uppercase">FAQ</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2 mb-4">Câu hỏi thường gặp</h2>
            <p className="text-lg text-gray-600">
              Giải đáp những thắc mắc phổ biến
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  className="flex items-center justify-between w-full p-6 text-left bg-white hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-bold text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className={`transition-all duration-300 ease-in-out border-t border-gray-100 ${openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="p-6 bg-gray-50 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-900 to-blue-900 rounded-3xl p-12 lg:p-20 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-5xl font-extrabold mb-6">Sẵn sàng bắt đầu?</h2>
            <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
              Tham gia cùng hàng trăm doanh nghiệp đang tối ưu hóa quy trình tuyển dụng với RMS
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-900 font-bold rounded-xl hover:bg-blue-50 hover:scale-105 transition-all shadow-lg" onClick={() => navigate('/register')}>
                Dùng thử miễn phí 30 ngày
                <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 bg-transparent border border-blue-400 text-white font-bold rounded-xl hover:bg-white/10 transition-all" onClick={() => navigate('/contact')}>
                Liên hệ Sales
              </button>
            </div>
            <p className="text-sm text-blue-200 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Không cần thẻ tín dụng • Hủy bất cứ lúc nào • Support 24/7
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 border-t border-gray-100">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Liên hệ với chúng tôi</h2>
              <p className="text-lg text-gray-600 mb-8">
                Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
                    <div className="text-sm">
                        <div className="font-bold text-gray-900 mb-1">Email</div>
                        <div className="text-gray-600">support@rms.vn</div>
                    </div>
                </div>
                
                 <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
                    <div className="text-sm">
                        <div className="font-bold text-gray-900 mb-1">Hotline</div>
                        <div className="text-gray-600">1900 xxxx</div>
                    </div>
                </div>
                
                 <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
                    <div className="text-sm">
                         <div className="font-bold text-gray-900 mb-1">Địa chỉ</div>
                        <div className="text-gray-600">Hà Nội, Việt Nam</div>
                    </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="Nguyễn Văn A" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="name@company.com" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                  <input type="tel" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="0123 456 789" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tin nhắn</label>
                  <textarea className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" rows="4" placeholder="Nội dung tin nhắn..."></textarea>
                </div>
                
                <button type="submit" className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                  Gửi tin nhắn
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 text-white mb-6">
                 <div className="w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fillOpacity="0.9" />
                    <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="currentColor" fillOpacity="0.6" />
                  </svg>
                </div>
                <span className="text-xl font-bold">RMS</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Hệ thống quản lý tuyển dụng thông minh cho doanh nghiệp hiện đại
              </p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors">Facebook</a>
                <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                <a href="#" className="hover:text-white transition-colors">Twitter</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Sản phẩm</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Tính năng</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Bảng giá</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">Cách hoạt động</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tích hợp</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Công ty</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tuyển dụng</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Liên hệ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Hỗ trợ</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tài liệu</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trạng thái hệ thống</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>&copy; 2026 RMS. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
              <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
