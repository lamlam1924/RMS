# Interview Flow — Vấn đề nghiệp vụ

## 1. Participant — Ai có thể là interviewer?

- Interviewer có thể là **bất kỳ User nào** trong hệ thống (EMPLOYEE, MANAGER, DIRECTOR, HR...)
- Với vị trí cấp cao (Senior, Manager, Director), phỏng vấn có thể cần có người cấp cao hơn tham gia
- Hiện tại hệ thống đã hỗ trợ điều này thông qua `InterviewParticipants.UserId` gắn tự do, không bị ràng buộc system role
- **Cần lưu ý:** HR khi tạo interview chưa có API assign participant (bị bỏ qua trong `CreateInterviewAsync`)

---

## 2. Status cho Interview — Có nên tạo StatusType riêng?

**Hiện tại:** Interview không có StatusType riêng, dùng chung Status với Application (StatusTypeId = 3).

**Đề xuất thêm StatusType cho Interview:**

| Code | Tên | Ghi chú |
|------|-----|---------|
| `SCHEDULED` | Đã lên lịch | Vừa tạo |
| `CONFIRMED` | Candidate xác nhận | Candidate đồng ý |
| `DECLINED` | Candidate từ chối | Candidate từ chối lịch này |
| `RESCHEDULED` | Đã dời lịch | HR đổi lịch mới |
| `COMPLETED` | Hoàn thành | Đã diễn ra |
| `CANCELLED` | Huỷ | Có thể huỷ bất kỳ lúc nào |

Lý do cần tách: Application status (`INTERVIEWING`, `PASSED`, `REJECTED`) mô tả trạng thái **hồ sơ**, còn Interview status mô tả trạng thái **buổi phỏng vấn cụ thể** — hai khái niệm khác nhau.

---

## 3. Candidate từ chối lịch phỏng vấn

- Hiện tại không có cơ chế candidate phản hồi lịch phỏng vấn
- Cần thêm flow: HR gửi lịch → Candidate xác nhận / từ chối → nếu từ chối có thể đề xuất lịch khác
- **Tác động:** Cần thêm endpoint cho Candidate module và cập nhật `Interview.StatusId`

---

## 4. Candidate ứng tuyển nhiều vị trí — Conflict lịch phỏng vấn

- Một candidate có thể có nhiều Application → nhiều Interview cùng lúc
- Cần kiểm tra trùng lịch khi HR tạo interview mới cho candidate:
  - Query: `Interview` của cùng `CandidateId` có `StartTime–EndTime` giao nhau không
  - Nếu trùng: cảnh báo HR hoặc block tạo
- **Hiện tại:** Không có validation này

---

## 5. Decision của 1 người → đổi luôn Application status

- Bất kỳ participant nào submit feedback với `PASS/REJECT` đều ngay lập tức thay đổi `Application.StatusId`
- Nếu có 3 interviewer mà người đầu `REJECT`, 2 người còn lại không còn ý nghĩa
- **Đề xuất:** HR hoặc MANAGER mới có quyền chốt kết quả, hoặc cần đủ N feedback mới tổng hợp

---

## 6. RoundNo hardcode = 1

- Khi tạo interview qua API, `RoundNo` luôn = 1
- Không hỗ trợ phỏng vấn nhiều vòng dù entity có field `RoundNo`
- **Đề xuất:** Tự động lấy `MAX(RoundNo) + 1` theo `ApplicationId`

---

## 7. EvaluationCriteria không gắn với Position

- Hiện trả về toàn bộ criteria của mọi template cho mọi interview
- Cần mapping: `EvaluationTemplate` → `Position` (thêm `PositionId` vào `EvaluationTemplates`)

---

## 8. HR thiếu endpoint assign participants

- `CreateInterviewDto` có `List<int>? InterviewerIds` nhưng repository bỏ qua
- Participants hiện chỉ có thể insert thủ công qua DB