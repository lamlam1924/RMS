# Hide Sent Offers from HR Staff - Implementation

## Vấn đề
Khi HR Staff gửi offers (đã chấp nhận hoặc từ chối) cho HR Manager, những offers đó vẫn hiển thị trong danh sách của HR Staff.

## Giải pháp
Cập nhật logic để filter offers dựa trên field `SentToManagerAt`:
- Offers chưa gửi (`SentToManagerAt == null`) → Hiển thị cho HR Staff
- Offers đã gửi (`SentToManagerAt != null`) → Ẩn khỏi HR Staff, hiển thị cho HR Manager

## Thay đổi Backend

### 1. Repository - `RMS/Backend/Repository/HROffersRepository.cs`

#### Cập nhật `MarkAcceptedOffersSentToManagerAsync`
Cho phép mark cả StatusId 19 (accepted) và 20 (declined):
```csharp
public async Task<bool> MarkAcceptedOffersSentToManagerAsync(List<int> offerIds, int userId)
{
    var offers = await _context.Offers
        .Where(o => offerIdsSet.Contains(o.Id) 
            && o.IsDeleted == false 
            && (o.StatusId == 19 || o.StatusId == 20)  // Cả accepted và declined
            && o.SentToManagerAt == null)
        .ToListAsync();
    // ... set SentToManagerAt
}
```

#### Thêm method mới `GetDeclinedForStaffAsync`
```csharp
public async Task<List<OfferListDto>> GetDeclinedForStaffAsync()
{
    return await _context.Offers
        .Where(o => o.IsDeleted == false 
            && o.StatusId == 20 
            && o.SentToManagerAt == null)  // Chỉ lấy chưa gửi
        .OrderByDescending(o => o.CreatedAt)
        .Select(...)
        .ToListAsync();
}
```

### 2. Repository Interface - `RMS/Backend/Repository/Interface/IHROffersRepository.cs`
```csharp
Task<List<OfferListDto>> GetDeclinedForStaffAsync();
```

### 3. Service Interface - `RMS/Backend/Service/Interface/IHROffersService.cs`
```csharp
Task<List<OfferListDto>> GetDeclinedForStaffAsync();
```

### 4. Service - `RMS/Backend/Service/HROffersService.cs`
```csharp
public async Task<List<OfferListDto>> GetDeclinedForStaffAsync()
{
    return await _repository.GetDeclinedForStaffAsync();
}
```

### 5. Controller - `RMS/Backend/Controller/HROffersController.cs`
Cập nhật endpoint `/api/hr/offers/declined`:
```csharp
[HttpGet("declined")]
public async Task<ActionResult<List<OfferListDto>>> GetDeclinedOffers()
{
    var offers = await _hrOffersService.GetDeclinedForStaffAsync();
    return Ok(offers);
}
```

## Logic Flow

### Trước khi gửi
```
HR Staff View:
- Tab "Đã chấp nhận": Offers với StatusId=19 và SentToManagerAt=null
- Tab "Đã từ chối": Offers với StatusId=20 và SentToManagerAt=null

HR Manager View:
- Tab "Đã chấp nhận": Offers với StatusId=19 và SentToManagerAt!=null
```

### Sau khi gửi
```
1. HR Staff chọn offers và click "Gửi cho HR Manager"
2. Backend mark offers: SentToManagerAt = DateTime.Now
3. Offers biến mất khỏi danh sách HR Staff
4. Offers xuất hiện trong danh sách HR Manager
```

## Database Schema

### Table: Offers
```sql
- Id (int, PK)
- StatusId (int, FK)
  - 19 = ACCEPTED (Đã chấp nhận)
  - 20 = DECLINED (Đã từ chối)
- SentToManagerAt (DateTime?, nullable)
  - null = Chưa gửi cho Manager (hiển thị cho Staff)
  - not null = Đã gửi cho Manager (hiển thị cho Manager)
- IsDeleted (bool)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
- UpdatedBy (int)
```

## API Endpoints

### GET /api/hr/offers/accepted-for-staff
Lấy offers đã chấp nhận chưa gửi cho Manager
```sql
WHERE StatusId = 19 AND SentToManagerAt IS NULL
```

### GET /api/hr/offers/declined
Lấy offers đã từ chối chưa gửi cho Manager
```sql
WHERE StatusId = 20 AND SentToManagerAt IS NULL
```

### GET /api/hr/offers/accepted-for-manager
Lấy offers đã chấp nhận đã gửi cho Manager
```sql
WHERE StatusId = 19 AND SentToManagerAt IS NOT NULL
```

### POST /api/hr/offers/send-to-manager
Gửi offers cho Manager
```json
{
  "offerIds": [1, 2, 3],
  "type": "accepted" // or "declined"
}
```

## Testing

### Test Case 1: Gửi offers đã chấp nhận
1. HR Staff có 3 offers đã chấp nhận
2. Chọn 2 offers và gửi cho Manager
3. ✅ 2 offers biến mất khỏi tab "Đã chấp nhận" của Staff
4. ✅ 1 offer còn lại vẫn hiển thị
5. ✅ HR Manager thấy 2 offers trong tab "Đã chấp nhận"

### Test Case 2: Gửi offers đã từ chối
1. HR Staff có 2 offers đã từ chối
2. Chọn 1 offer và gửi cho Manager
3. ✅ 1 offer biến mất khỏi tab "Đã từ chối" của Staff
4. ✅ 1 offer còn lại vẫn hiển thị
5. ✅ HR Manager thấy 1 offer đã từ chối

### Test Case 3: Gửi hỗn hợp
1. HR Staff chọn offers từ tab "Đã chấp nhận"
2. Gửi cho Manager
3. ✅ Chỉ offers có StatusId=19 được gửi
4. ✅ Offers biến mất khỏi danh sách Staff

## Restart Required

### Backend: ✅ CẦN RESTART
Đã thay đổi:
- Repository methods
- Service methods
- Controller endpoints

### Frontend: ❌ KHÔNG CẦN
Không có thay đổi frontend, chỉ cần reload trang

## Kết luận

Sau khi restart backend:
- ✅ Offers đã gửi sẽ biến mất khỏi danh sách HR Staff
- ✅ Offers đã gửi sẽ xuất hiện trong danh sách HR Manager
- ✅ Logic hoạt động cho cả "accepted" và "declined" offers
- ✅ Không có duplicate offers giữa Staff và Manager
