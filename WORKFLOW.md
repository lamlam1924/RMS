# Recruitment Management System – Status & Workflow

## Nguyên tắc
- Status = trạng thái nghiệp vụ
- Multi-level approval = nhiều hành động trên **cùng status**
- Ai duyệt gì → xác định bằng WorkflowTransition + Role

---

## 1. Recruitment Request

### Status
- DRAFT
- SUBMITTED
- IN_REVIEW
- APPROVED
- REJECTED

### Workflow
| From | To | Role |
|----|----|----|
| DRAFT | SUBMITTED | Department Manager |
| SUBMITTED | IN_REVIEW | HR Manager |
| IN_REVIEW | IN_REVIEW | HR Manager |
| IN_REVIEW | APPROVED | Director |
| IN_REVIEW | REJECTED | HR Manager / Director |

> **Note**
> - `SUBMITTED → IN_REVIEW`: HR Manager tiếp nhận và bắt đầu quy trình duyệt
> - `IN_REVIEW → IN_REVIEW`: HR Manager duyệt nghiệp vụ (approval trung gian), không phải duyệt cuối
> - Trạng thái chỉ đổi sang `APPROVED` khi cấp cuối (Director) duyệt
> - Lịch sử duyệt được lưu qua `StatusHistory`

---

## 2. Job Posting

### Status
- DRAFT
- PUBLISHED
- CLOSED

### Workflow
| From | To | Role |
|----|----|----|
| DRAFT | PUBLISHED | HR Staff |
| PUBLISHED | CLOSED | HR Manager |

---

## 3. Candidate Application

### Status
- APPLIED
- SCREENING
- INTERVIEWING
- PASSED
- REJECTED

### Workflow
| From | To | Role |
|----|----|----|
| APPLIED | SCREENING | HR Staff |
| SCREENING | INTERVIEWING | HR Staff |
| INTERVIEWING | PASSED | Interviewer |
| INTERVIEWING | REJECTED | Interviewer / HR |

---

## 4. Offer

### Status
- DRAFT
- IN_REVIEW
- APPROVED
- REJECTED
- SENT
- ACCEPTED
- DECLINED

### Workflow
| From | To | Role |
|----|----|----|
| DRAFT | IN_REVIEW | HR Staff |
| IN_REVIEW | IN_REVIEW | HR Manager |
| IN_REVIEW | APPROVED | Director |
| IN_REVIEW | REJECTED | HR Manager / Director |
| APPROVED | SENT | HR Staff |
| SENT | ACCEPTED | Candidate |
| SENT | DECLINED | Candidate |

---

## Vai trò & Quyền duyệt

| Role | Duyệt |
|----|----|
| Department Manager | Recruitment Request |
| HR Manager | Recruitment Request, Offer |
| Director | Recruitment Request, Offer |
| HR Staff | Thao tác nghiệp vụ |
| Interviewer | Đánh giá ứng viên |
| Candidate | Accept / Decline Offer |

---

## Ghi chú thiết kế
- Không tách status cho từng cấp duyệt
- Lịch sử duyệt truy vết qua StatusHistory
- Workflow mở rộng không cần đổi schema
