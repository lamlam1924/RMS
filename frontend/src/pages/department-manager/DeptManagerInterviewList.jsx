import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import deptManagerService from '../../services/deptManagerService';
import SimpleInterviewListPage from '../../components/shared/interviews/SimpleInterviewListPage';
import { formatDateTime, formatTime } from '../../utils/formatters/display';

export default function DeptManagerInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    loadInterviews();
  }, [filter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      let data = [];
      
      if (filter === 'upcoming') {
        data = await deptManagerService.interviews.getUpcoming();
      } else {
        data = await deptManagerService.interviews.getAll();
        
        if (filter === 'past') {
          const now = new Date();
          data = data.filter(i => new Date(i.startTime) < now);
        }
      }
      
      setInterviews(data);
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimpleInterviewListPage
      title="Phỏng vấn của tôi"
      description="Danh sách buổi phỏng vấn bạn tham gia với vai trò trưởng phòng"
      filters={[
        { id: 'upcoming', label: 'Sắp diễn ra' },
        { id: 'past', label: 'Đã qua' },
        { id: 'all', label: 'Tất cả' }
      ]}
      filter={filter}
      onFilterChange={setFilter}
      loading={loading}
      items={interviews}
      emptyTitle="Không có buổi phỏng vấn"
      emptyDescription={filter === 'upcoming' ? 'Không có lịch phỏng vấn sắp diễn ra' : `Không có dữ liệu ${filter}`}
      onItemClick={(interview) => navigate(`/staff/dept-manager/interviews/${interview.id}`)}
      getCardData={(interview) => ({
        title: interview.candidateName,
        subtitle: `Phỏng vấn #${interview.id} • Vòng ${interview.roundNo}`,
        statusCode: interview.statusCode,
        infoRows: [
          { label: 'Vị trí', value: interview.positionTitle },
          { label: 'Thời gian', value: formatDateTime(interview.startTime, 'vi-VN') },
          { label: 'Khung giờ', value: `${formatTime(interview.startTime, 'vi-VN')} - ${formatTime(interview.endTime, 'vi-VN')}` },
          { label: 'Địa điểm', value: interview.location || interview.meetingLink || 'Chưa cập nhật' }
        ],
        chips: (interview.participants || []).map((p) => `${p.name} (${p.role})`),
        note: new Date(interview.startTime) > new Date() ? 'Buổi phỏng vấn sắp diễn ra, vui lòng chuẩn bị trước.' : ''
      })}
    />
  );
}
