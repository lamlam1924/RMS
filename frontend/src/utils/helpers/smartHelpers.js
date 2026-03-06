/**
 * Smart Helpers & Suggestions
 * Provides intelligent suggestions and helpers for job request creation
 */

/**
 * Budget Suggestions Database
 * Average budget ranges by position level (VND/month)
 */
const BUDGET_RANGES = {
  // Technical Roles
  'junior-developer': { min: 8000000, max: 15000000, avg: 12000000 },
  'developer': { min: 15000000, max: 25000000, avg: 20000000 },
  'senior-developer': { min: 25000000, max: 40000000, avg: 32000000 },
  'tech-lead': { min: 35000000, max: 55000000, avg: 45000000 },
  
  // Design Roles
  'junior-designer': { min: 7000000, max: 12000000, avg: 9500000 },
  'designer': { min: 12000000, max: 20000000, avg: 16000000 },
  'senior-designer': { min: 20000000, max: 35000000, avg: 27000000 },
  
  // Marketing Roles
  'marketing-staff': { min: 8000000, max: 15000000, avg: 11500000 },
  'marketing-specialist': { min: 15000000, max: 25000000, avg: 20000000 },
  'marketing-manager': { min: 25000000, max: 40000000, avg: 32000000 },
  
  // Sales Roles
  'sales-staff': { min: 7000000, max: 12000000, avg: 9500000 },
  'sales-specialist': { min: 12000000, max: 20000000, avg: 16000000 },
  'sales-manager': { min: 20000000, max: 35000000, avg: 27000000 },
  
  // HR Roles
  'hr-staff': { min: 8000000, max: 14000000, avg: 11000000 },
  'hr-specialist': { min: 14000000, max: 22000000, avg: 18000000 },
  'hr-manager': { min: 22000000, max: 35000000, avg: 28000000 },
  
  // Management Roles
  'team-lead': { min: 25000000, max: 40000000, avg: 32000000 },
  'department-manager': { min: 35000000, max: 55000000, avg: 45000000 },
  'director': { min: 50000000, max: 80000000, avg: 65000000 },
  
  // Default fallback
  'default': { min: 10000000, max: 30000000, avg: 20000000 }
};

/**
 * Get budget suggestion based on position title
 * @param {string} positionTitle - Position title
 * @returns {Object} Budget range and suggestion
 */
export function getBudgetSuggestion(positionTitle) {
  if (!positionTitle) {
    return BUDGET_RANGES.default;
  }

  const title = positionTitle.toLowerCase();
  
  // Try to match position keywords
  for (const [key, range] of Object.entries(BUDGET_RANGES)) {
    if (key === 'default') continue;
    
    const keywords = key.split('-');
    const matchesAll = keywords.every(keyword => title.includes(keyword));
    
    if (matchesAll) {
      return range;
    }
  }
  
  // Fallback: Check for seniority level
  if (title.includes('senior') || title.includes('lead')) {
    return {
      min: 25000000,
      max: 45000000,
      avg: 35000000
    };
  } else if (title.includes('junior') || title.includes('fresher')) {
    return {
      min: 7000000,
      max: 15000000,
      avg: 11000000
    };
  }
  
  return BUDGET_RANGES.default;
}

/**
 * Analyze budget competitiveness
 * @param {number} budget - Proposed budget
 * @param {string} positionTitle - Position title
 * @returns {Object} Competitiveness analysis
 */
export function analyzeBudgetCompetitiveness(budget, positionTitle) {
  const suggestion = getBudgetSuggestion(positionTitle);
  const budgetNum = parseInt(budget) || 0;
  
  if (budgetNum === 0) {
    return {
      level: 'none',
      message: 'Chưa nhập ngân sách',
      color: 'gray'
    };
  }
  
  if (budgetNum < suggestion.min) {
    const diff = ((suggestion.min - budgetNum) / suggestion.min * 100).toFixed(0);
    return {
      level: 'low',
      message: `Thấp hơn mức thị trường ${diff}%. Có thể khó tìm ứng viên phù hợp.`,
      color: 'red',
      suggestion: `Đề xuất: ${formatVND(suggestion.min)} - ${formatVND(suggestion.max)}`
    };
  } else if (budgetNum > suggestion.max) {
    const diff = ((budgetNum - suggestion.max) / suggestion.max * 100).toFixed(0);
    return {
      level: 'high',
      message: `Cao hơn mức thị trường ${diff}%. Cân nhắc tối ưu.`,
      color: 'orange',
      suggestion: `Đề xuất: ${formatVND(suggestion.min)} - ${formatVND(suggestion.max)}`
    };
  } else if (budgetNum >= suggestion.avg * 0.9 && budgetNum <= suggestion.avg * 1.1) {
    return {
      level: 'optimal',
      message: '✓ Mức ngân sách cạnh tranh tốt',
      color: 'green'
    };
  } else {
    return {
      level: 'acceptable',
      message: 'Mức ngân sách chấp nhận được',
      color: 'blue'
    };
  }
}

/**
 * Get priority suggestion based on urgency indicators
 * @param {string} reason - Job request reason
 * @param {string} startDate - Expected start date
 * @returns {number} Suggested priority (1-3)
 */
export function getPrioritySuggestion(reason, startDate) {
  const urgentKeywords = ['urgent', 'gấp', 'khẩn cấp', 'ngay lập tức', 'asap', 'critical', 'khẩn'];
  const highKeywords = ['important', 'quan trọng', 'cần thiết', 'ưu tiên', 'sớm'];
  
  const reasonLower = (reason || '').toLowerCase();
  const hasUrgentKeyword = urgentKeywords.some(kw => reasonLower.includes(kw));
  const hasHighKeyword = highKeywords.some(kw => reasonLower.includes(kw));
  
  // Check start date urgency (3 levels)
  let dateUrgency = 3; // default normal
  if (startDate) {
    const start = new Date(startDate);
    const today = new Date();
    const daysUntilStart = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilStart <= 7) {
      dateUrgency = 1; // khẩn cấp: ≤ 1 tuần
    } else if (daysUntilStart <= 30) {
      dateUrgency = 2; // cao: ≤ 1 tháng
    } else {
      dateUrgency = 3; // bình thường: > 1 tháng
    }
  }
  
  // Combine factors
  if (hasUrgentKeyword || dateUrgency === 1) return 1;
  if (hasHighKeyword || dateUrgency === 2) return 2;
  return 3; // default
}

/**
 * Validate quantity based on position and priority
 * @param {number} quantity - Requested quantity
 * @param {number} priority - Priority level
 * @returns {Object} Validation result
 */
export function validateQuantity(quantity, priority) {
  const qty = parseInt(quantity) || 0;
  
  if (qty === 0) {
    return {
      valid: false,
      message: 'Số lượng phải lớn hơn 0',
      type: 'error'
    };
  }
  
  if (qty > 50) {
    return {
      valid: false,
      message: 'Số lượng tối đa là 50. Hãy tạo nhiều yêu cầu riêng lẻ.',
      type: 'error'
    };
  }
  
  // High priority with many positions warning
  if (priority <= 2 && qty > 5) {
    return {
      valid: true,
      message: '⚠️ Ưu tiên cao + số lượng lớn có thể khó xử lý. Cân nhắc chia nhỏ.',
      type: 'warning'
    };
  }
  
  if (qty > 10) {
    return {
      valid: true,
      message: 'ℹ️ Số lượng lớn. Đảm bảo có đủ budget và thời gian tuyển dụng.',
      type: 'info'
    };
  }
  
  return {
    valid: true,
    message: null,
    type: 'success'
  };
}

/**
 * Get example job descriptions by position type
 * @param {string} positionTitle - Position title
 * @returns {Object} Example JD
 */
export function getExampleJD(positionTitle) {
  const title = (positionTitle || '').toLowerCase();
  
  if (title.includes('developer') || title.includes('backend') || title.includes('frontend')) {
    return {
      responsibilities: [
        'Phát triển và maintain các tính năng mới',
        'Viết clean code, tuân thủ coding standards',
        'Tham gia code review và technical discussions',
        'Làm việc với team để tối ưu performance',
        'Debug và fix các issues trong production'
      ],
      requirements: [
        'Kinh nghiệm 2+ năm với [technology stack]',
        'Thành thạo Git, CI/CD workflows',
        'Hiểu biết về design patterns và best practices',
        'Khả năng làm việc nhóm và độc lập',
        'Tiếng Anh giao tiếp tốt'
      ],
      benefits: [
        'Lương cạnh tranh, review 6 tháng/lần',
        'Thưởng theo performance và dự án',
        'Bảo hiểm đầy đủ',
        'Đào tạo và phát triển kỹ năng',
        'Môi trường năng động, technology-driven'
      ]
    };
  }
  
  if (title.includes('designer') || title.includes('ui') || title.includes('ux')) {
    return {
      responsibilities: [
        'Thiết kế UI/UX cho các sản phẩm digital',
        'Tạo wireframes, mockups, prototypes',
        'Làm việc với developers để implement designs',
        'Nghiên cứu user behavior và trends',
        'Maintain design system và brand guidelines'
      ],
      requirements: [
        'Kinh nghiệm 2+ năm về UI/UX design',
        'Thành thạo Figma, Adobe Creative Suite',
        'Hiểu biết về responsive design và accessibility',
        'Portfolio thể hiện các dự án thực tế',
        'Tư duy sáng tạo và attention to detail'
      ],
      benefits: [
        'Lương cạnh tranh theo năng lực',
        'Thưởng dự án và performance',
        'Công cụ thiết kế chuyên nghiệp',
        'Học hỏi từ senior designers',
        'Tham gia các dự án đa dạng'
      ]
    };
  }
  
  // Default template
  return {
    responsibilities: [
      'Thực hiện các công việc theo chức danh',
      'Phối hợp với team và các bộ phận khác',
      'Báo cáo tiến độ và kết quả công việc',
      'Đề xuất cải tiến quy trình làm việc',
      'Các công việc khác theo yêu cầu'
    ],
    requirements: [
      'Tốt nghiệp Đại học chuyên ngành liên quan',
      'Kinh nghiệm tối thiểu [X] năm',
      'Kỹ năng giao tiếp và làm việc nhóm tốt',
      'Chủ động, có trách nhiệm với công việc',
      'Tiếng Anh cơ bản'
    ],
    benefits: [
      'Lương thỏa thuận theo năng lực',
      'Thưởng theo performance',
      'Bảo hiểm theo quy định',
      'Đào tạo và phát triển',
      'Môi trường làm việc chuyên nghiệp'
    ]
  };
}

/**
 * Generate smart suggestions for reason field
 * @param {Object} formData - Current form data
 * @returns {string[]} Suggestion templates
 */
export function getReasonSuggestions(formData) {
  const suggestions = [
    `Mở rộng team ${formData.positionTitle || '[vị trí]'} để đáp ứng nhu cầu dự án mới`,
    `Thay thế nhân sự nghỉ việc, đảm bảo hoạt động liên tục của bộ phận`,
    `Tăng cường năng lực team trước mùa cao điểm kinh doanh Q${Math.ceil((new Date().getMonth() + 1) / 3) + 1}`,
    `Bổ sung nhân sự cho dự án [tên dự án] với deadline ${formData.expectedStartDate || '[ngày]'}`,
    `Nâng cao chất lượng sản phẩm/dịch vụ bằng việc mở rộng đội ngũ chuyên môn`
  ];
  
  return suggestions;
}

/**
 * Calculate hiring timeline estimation
 * @param {number} priority - Priority level (1-3)
 * @param {number} quantity - Quantity needed
 * @returns {Object} Timeline estimation
 */
export function estimateHiringTimeline(priority, quantity) {
  // Base days by priority (3 levels)
  const baseDays = {
    1: 21,  // Khẩn cấp: 3 tuần
    2: 45,  // Cao: 1.5 tháng
    3: 60   // Bình thường: 2 tháng
  };
  
  const base = baseDays[priority] || 60;
  const qty = parseInt(quantity) || 1;
  
  // Add extra time for bulk hiring
  const extraDays = qty > 5 ? Math.min((qty - 5) * 5, 30) : 0;
  const totalDays = base + extraDays;
  
  const weeks = Math.ceil(totalDays / 7);
  const months = Math.ceil(totalDays / 30);
  
  return {
    days: totalDays,
    weeks,
    months,
    displayText: months > 1 
      ? `Khoảng ${months} tháng` 
      : weeks > 1 
        ? `Khoảng ${weeks} tuần` 
        : `Khoảng ${totalDays} ngày`,
    breakdown: {
      screening: Math.ceil(totalDays * 0.3),
      interview: Math.ceil(totalDays * 0.4),
      offer: Math.ceil(totalDays * 0.3)
    }
  };
}

/**
 * Helper function to format VND
 */
function formatVND(value) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

/**
 * Get smart validation messages
 * @param {Object} formData - Complete form data
 * @returns {Object} Validation insights
 */
export function getSmartValidationInsights(formData) {
  const insights = [];
  
  // Budget vs Position check
  if (formData.budget && formData.positionTitle) {
    const analysis = analyzeBudgetCompetitiveness(formData.budget, formData.positionTitle);
    if (analysis.level !== 'none') {
      insights.push({
        field: 'budget',
        type: analysis.level === 'optimal' ? 'success' : 'warning',
        message: analysis.message,
        suggestion: analysis.suggestion
      });
    }
  }
  
  // Quantity vs Priority check
  if (formData.quantity && formData.priority) {
    const qtyValidation = validateQuantity(formData.quantity, formData.priority);
    if (qtyValidation.message) {
      insights.push({
        field: 'quantity',
        type: qtyValidation.type,
        message: qtyValidation.message
      });
    }
  }
  
  // Timeline estimation
  if (formData.priority && formData.quantity) {
    const timeline = estimateHiringTimeline(formData.priority, formData.quantity);
    insights.push({
      field: 'timeline',
      type: 'info',
      message: `Thời gian tuyển dụng dự kiến: ${timeline.displayText}`,
      details: timeline.breakdown
    });
  }
  
  return insights;
}
