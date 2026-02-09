/**
 * calculateDaysPending
 * Tính số ngày đã pending từ createdAt đến hiện tại
 */
export const calculateDaysPending = (createdAt) => {
  if (!createdAt) return 0;
  const now = new Date();
  const created = new Date(createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * getDaysPendingLabel
 * Trả về label dựa trên số ngày pending
 */
export const getDaysPendingLabel = (days) => {
  if (days === 0) return "Hôm nay";
  if (days === 1) return "1 ngày";
  if (days < 7) return `${days} ngày`;
  if (days < 30) return `${Math.floor(days / 7)} tuần`;
  return `${Math.floor(days / 30)} tháng`;
};

/**
 * isPendingUrgent
 * Kiểm tra xem request có pending quá lâu không
 */
export const isPendingUrgent = (days) => {
  return days > 7; // Quá 7 ngày
};

export default {
  calculateDaysPending,
  getDaysPendingLabel,
  isPendingUrgent
};
