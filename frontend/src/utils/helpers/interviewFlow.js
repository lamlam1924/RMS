export const getInterviewFlowMeta = (interview) => {
  const status = interview?.statusCode;
  const participantCount = interview?.participantCount || interview?.participants?.length || 0;
  const feedbackCount = interview?.feedbackCount || interview?.feedbacks?.length || 0;
  const pendingFeedback = Math.max(participantCount - feedbackCount, 0);

  const base = {
    title: 'Theo dõi buổi phỏng vấn',
    summary: 'Kiểm tra lịch, người tham gia và tiến độ đánh giá.',
    tone: 'info',
    checklist: [
      `Người tham gia: ${participantCount}`,
      `Đánh giá đã nộp: ${feedbackCount}${pendingFeedback > 0 ? `, còn thiếu ${pendingFeedback}` : ''}`
    ]
  };

  if (status === 'SCHEDULED' || status === 'RESCHEDULED') {
    return {
      ...base,
      title: 'Bước hiện tại: chốt lịch phỏng vấn',
      summary: 'Kiểm tra lại thời gian, người tham gia và xử lý conflict nếu có trước khi buổi phỏng vấn diễn ra.',
      tone: 'info',
      checklist: [
        'Xác nhận lịch hoặc cập nhật nếu cần',
        `Người tham gia hiện có: ${participantCount}`,
        'Nếu thiếu người phỏng vấn, gửi yêu cầu đề cử'
      ]
    };
  }

  if (status === 'CONFIRMED') {
    return {
      ...base,
      title: 'Bước hiện tại: chờ diễn ra phỏng vấn',
      summary: 'Ứng viên đã xác nhận. Bạn chủ yếu cần theo dõi buổi phỏng vấn và xử lý sự cố nếu phát sinh.',
      tone: 'info',
      checklist: [
        'Theo dõi người tham gia trước giờ phỏng vấn',
        'Nếu ứng viên hoặc interviewer vắng mặt, xử lý ở khối thao tác nhanh',
        `Đánh giá đã nộp: ${feedbackCount}`
      ]
    };
  }

  if (status === 'COMPLETED_PENDING_FEEDBACK') {
    return {
      ...base,
      title: 'Bước hiện tại: chờ đủ feedback',
      summary: 'Buổi phỏng vấn đã xong nhưng chưa đủ đánh giá. Ưu tiên nhắc interviewer còn thiếu feedback.',
      tone: 'warning',
      checklist: [
        `Đã nộp ${feedbackCount}/${participantCount} feedback`,
        pendingFeedback > 0 ? `Còn thiếu ${pendingFeedback} feedback` : 'Đã đủ feedback',
        'Sau khi đủ feedback, kiểm tra điều kiện vòng tiếp theo'
      ]
    };
  }

  if (status === 'COMPLETED') {
    return {
      ...base,
      title: 'Bước hiện tại: chốt kết quả vòng phỏng vấn',
      summary: 'Buổi phỏng vấn đã hoàn thành. Kiểm tra feedback, sau đó quyết định có tạo vòng tiếp theo hay không.',
      tone: 'default',
      checklist: [
        `Đã nộp ${feedbackCount}/${participantCount} feedback`,
        'Kiểm tra điều kiện sang vòng tiếp theo',
        'Nếu đạt, lên lịch vòng tiếp theo ngay tại trang này'
      ]
    };
  }

  if (status === 'NO_SHOW' || status === 'INTERVIEWER_ABSENT') {
    return {
      ...base,
      title: 'Buổi phỏng vấn đã được đánh dấu sự cố',
      summary: 'Buổi phỏng vấn đã kết thúc theo trạng thái vắng mặt. Kiểm tra lại ghi chú và lịch sử xử lý nếu cần.',
      tone: 'warning',
      checklist: [
        'Xác nhận người vắng mặt đã được đánh dấu đúng',
        'Rà lại lịch sử và thống kê no-show',
        'Tạo lịch mới nếu cần phỏng vấn lại'
      ]
    };
  }

  if (status === 'CANCELLED') {
    return {
      ...base,
      title: 'Buổi phỏng vấn đã hủy',
      summary: 'Buổi phỏng vấn không còn hiệu lực. Bạn chỉ cần theo dõi thông tin đã lưu và quyết định có tạo lịch khác hay không.',
      tone: 'muted',
      checklist: ['Xem lại lý do hủy', 'Kiểm tra có cần tạo lịch mới cho ứng viên hay không']
    };
  }

  return base;
};