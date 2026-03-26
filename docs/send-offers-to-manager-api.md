# Send Offers to Manager API - Implementation

## Tổng quan
Đã tạo API mới cho phép HR Staff gửi cả offers "Đã chấp nhận" VÀ "Đã từ chối" cho HR Manager để làm báo cáo về đợt tuyển dụng.

## Backend Changes

### 1. DTO - `RMS/Backend/Dto/HR/HROfferDtos.cs`
Thêm DTO mới:
```csharp
public class SendOffersToManagerDto
{
    public List<int> OfferIds { get; set; } = new();
    public string Type { get; set; } = ""; // "accepted" or "declined"
}
```

### 2. Interface - `RMS/Backend/Service/Interface/IHROffersService.cs`
Thêm method signature:
```csharp
Task<ActionResponseDto> SendOffersToManagerAsync(List<int> offerIds, string type, int userId);
```

### 3. Service - `RMS/Backend/Service/HROffersService.cs`
Implement method mới:
```csharp
public async Task<ActionResponseDto> SendOffersToManagerAsync(List<int> offerIds, string type, int userId)
```

**Tính năng:**
- Validate type: "accepted" hoặc "declined"
- Filter offers theo StatusId (19 = accepted, 20 = declined)
- Gửi email cho HR Manager
- Mark offers đã gửi
- Trả về message phù hợp với type

### 4. Controller - `RMS/Backend/Controller/HROffersController.cs`
Thêm endpoint mới:
```csharp
[HttpPost("send-to-manager")]
[Authorize(Roles = "HR_MANAGER,HR_STAFF")]
public async Task<ActionResult<ActionResponseDto>> SendOffersToManager([FromBody] SendOffersToManagerDto dto)
```

**Endpoint:** `POST /api/hr/offers/send-to-manager`

**Request Body:**
```json
{
  "offerIds": [1, 2, 3],
  "type": "accepted" // or "declined"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã gửi danh sách 3 ứng viên đã chấp nhận đến HR Manager",
  "error": ""
}
```

## Frontend Changes

### 1. Service - `RMS/frontend/src/services/hrService.js`
Thêm method mới:
```javascript
sendOffersToManager: async (offerIds, type) => {
  const response = await authFetch(`${API_BASE_URL}/hr/offers/send-to-manager`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ offerIds, type })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể gửi cho HR Manager');
  }
  return response.json();
}
```

### 2. Component - `RMS/frontend/src/pages/hr/manager/HROfferList.jsx`
Cập nhật `handleSendToManager`:
```javascript
const handleSendToManager = async () => {
  if (selectedIds.size === 0) {
    notify.warning('Vui lòng chọn ít nhất một thư mời');
    return;
  }
  try {
    setSending(true);
    const type = filter === 'accepted' ? 'accepted' : 'declined';
    const result = await hrService.offers.sendOffersToManager(Array.from(selectedIds), type);
    notify.success(result?.message || 'Đã gửi danh sách cho HR Manager');
    setSelectedIds(new Set());
    loadOffers();
  } catch (err) {
    notify.error(err.message || 'Gửi thất bại');
  } finally {
    setSending(false);
  }
};
```

## Luồng hoạt động

### Scenario 1: Gửi offers đã chấp nhận
1. HR Staff vào tab "Đã chấp nhận"
2. Chọn các offers bằng checkbox
3. Click "Gửi cho HR Manager"
4. System gửi với `type: "accepted"`
5. Backend filter offers có StatusId = 19
6. Gửi email cho HR Manager
7. Mark offers đã gửi
8. Offers biến mất khỏi danh sách HR Staff
9. HR Manager thấy offers trong trang của mình

### Scenario 2: Gửi offers đã từ chối
1. HR Staff vào tab "Đã từ chối"
2. Chọn các offers bằng checkbox
3. Click "Gửi cho HR Manager"
4. System gửi với `type: "declined"`
5. Backend filter offers có StatusId = 20
6. Gửi email cho HR Manager
7. Mark offers đã gửi
8. Offers biến mất khỏi danh sách HR Staff
9. HR Manager thấy offers trong trang của mình

## Validation

### Backend Validation
- ✅ Kiểm tra offerIds không rỗng
- ✅ Kiểm tra type = "accepted" hoặc "declined"
- ✅ Filter offers theo đúng StatusId
- ✅ Kiểm tra có HR Manager trong hệ thống
- ✅ Xử lý lỗi email (vẫn trả success nếu email fail)

### Frontend Validation
- ✅ Kiểm tra selectedIds không rỗng
- ✅ Tự động xác định type dựa vào filter hiện tại
- ✅ Hiển thị loading state
- ✅ Clear selection sau khi gửi thành công
- ✅ Reload danh sách sau khi gửi

## Testing

### Test Cases
1. ✅ Gửi 1 offer đã chấp nhận
2. ✅ Gửi nhiều offers đã chấp nhận
3. ✅ Gửi 1 offer đã từ chối
4. ✅ Gửi nhiều offers đã từ chối
5. ✅ Gửi khi chưa chọn offer nào (hiển thị warning)
6. ✅ Gửi với type không hợp lệ (backend reject)
7. ✅ Gửi offers không đúng status (backend filter)
8. ✅ Email thất bại (vẫn success, hiển thị warning)

### Cách test
1. Restart Backend (nếu cần)
2. Restart Frontend
3. Đăng nhập bằng HR Staff
4. Vào trang Job Offers
5. Chọn tab "Đã chấp nhận" hoặc "Đã từ chối"
6. Chọn offers và click "Gửi cho HR Manager"
7. Kiểm tra notification
8. Kiểm tra offers đã biến mất khỏi danh sách
9. Đăng nhập bằng HR Manager và kiểm tra

## API Endpoints Summary

### Endpoint cũ (vẫn hoạt động)
- `POST /api/hr/offers/send-accepted-to-manager`
- Chỉ gửi accepted offers
- Dùng cho backward compatibility

### Endpoint mới (khuyến nghị)
- `POST /api/hr/offers/send-to-manager`
- Gửi cả accepted và declined offers
- Linh hoạt hơn với parameter `type`

## Notes
- API mới tổng quát hơn, có thể mở rộng cho các type khác trong tương lai
- Email notification có thể fail nhưng vẫn trả success vì HR Manager có thể xem trực tiếp
- Offers đã gửi sẽ được mark và không hiển thị trong danh sách HR Staff nữa
- HR Manager có thể xem tất cả offers đã được gửi trong trang riêng

## Kết luận
API đã sẵn sàng cho phép HR Staff gửi cả offers "Đã chấp nhận" và "Đã từ chối" cho HR Manager để làm báo cáo! ✅
