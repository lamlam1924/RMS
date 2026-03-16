import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import directorService from '../../services/directorService';
import notify from '../../utils/notification';
import InterviewListPage from '../../components/shared/interviews/InterviewListPage';
import { formatDateTime } from '../../utils/formatters/display';

export default function DirectorInterviewList() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => { loadInterviews(); }, [filter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = filter === 'upcoming'
        ? await directorService.interviews.getUpcoming()
        : await directorService.interviews.getAll();
      setInterviews(data || []);
    } catch {
      notify.error('Không thể tải danh sách phỏng vấn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <InterviewListPage
      title="Phỏng vấn của tôi"
      description="Các buổi phỏng vấn bạn tham gia với tư cách người phỏng vấn"
      filters={[
        { id: 'upcoming', label: 'Sắp diễn ra' },
        { id: 'all', label: 'Tất cả' }
      ]}
      filter={filter}
      onFilterChange={setFilter}
      loading={loading}
      items={interviews}
      emptyTitle="Không có cuộc phỏng vấn nào"
      emptyDescription={filter === 'upcoming' ? 'Không có cuộc phỏng vấn nào sắp diễn ra' : 'Chưa có cuộc phỏng vấn nào'}
      onItemClick={(interview) => navigate(`/staff/director/my-interviews/${interview.id}`)}
      getCardData={(interview) => ({
        title: interview.candidateName,
        subtitle: `${interview.positionTitle} — ${interview.departmentName}`,
        statusCode: interview.statusCode,
        infoRows: [{ label: 'Thời gian', value: formatDateTime(interview.startTime) }]
      })}
    />
  );
}
