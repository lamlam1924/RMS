import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import employeeService from '../../services/employeeService';
import SimpleInterviewListPage from '../../components/shared/interviews/SimpleInterviewListPage';
import { formatDateTime } from '../../utils/formatters/display';

export default function EmployeeInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadInterviews();
  }, [filter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = filter === 'upcoming' 
        ? await employeeService.interviews.getUpcoming()
        : await employeeService.interviews.getAll();
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
      description="Danh sách buổi phỏng vấn bạn tham gia với vai trò interviewer"
      filters={[
        { id: 'all', label: 'Tất cả' },
        { id: 'upcoming', label: 'Sắp diễn ra' }
      ]}
      filter={filter}
      onFilterChange={setFilter}
      loading={loading}
      items={interviews}
      emptyTitle="Không có buổi phỏng vấn"
      emptyDescription={filter === 'upcoming' ? 'Hiện chưa có buổi phỏng vấn sắp diễn ra' : 'Bạn chưa được phân công buổi phỏng vấn nào'}
      onItemClick={(interview) => navigate(`/staff/employee/interviews/${interview.id}`)}
      getCardData={(interview) => ({
        title: interview.candidateName,
        subtitle: `Phỏng vấn #${interview.id} • Vòng ${interview.roundNo}`,
        statusCode: interview.statusCode,
        infoRows: [
          { label: 'Vị trí', value: interview.positionTitle },
          { label: 'Phòng ban', value: interview.departmentName },
          { label: 'Thời gian', value: formatDateTime(interview.startTime, 'vi-VN') },
          { label: 'Địa điểm', value: interview.location || '—' }
        ],
        note: interview.hasMyFeedback ? '✓ Bạn đã nộp đánh giá' : ''
      })}
    />
  );
}
