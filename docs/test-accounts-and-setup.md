# RMS Project - Test Accounts & Setup Guide

## 🚨 Lỗi hiện tại: ECONNREFUSED

**Nguyên nhân**: Backend chưa chạy hoặc chạy sai port.

**Giải pháp**: Khởi động Backend trước khi chạy Frontend.

---

## 📋 Các Tài Khoản Test

### **1. Admin Account**
```
Email: admin@company.com
Password: (Chưa set - cần đăng ký hoặc reset password)
Role: ADMIN
```

### **2. Director Account**
```
Email: hoangtran@company.com
Password: (Chưa set)
Role: DIRECTOR
Full Name: Trần Minh Hoàng
```

### **3. HR Manager Account**
```
Email: hanhle@company.com
Password: (Chưa set)
Role: HR_MANAGER
Full Name: Lê Thị Hạnh
Department: Phòng Nhân sự
```

### **4. HR Staff Account**
```
Email: tuanpham@company.com
Password: (Chưa set)
Role: HR_STAFF
Full Name: Phạm Quốc Tuấn
Department: Phòng Nhân sự
```

### **5. IT Department Manager**
```
Email: longnguyen@company.com
Password: (Chưa set)
Role: DEPARTMENT_MANAGER
Full Name: Nguyễn Văn Long
Department: Phòng Công nghệ thông tin
```

### **6. IT Employees**
```
Email: namvu@company.com
Role: EMPLOYEE
Full Name: Vũ Hoàng Nam

Email: minhphan@company.com
Role: EMPLOYEE
Full Name: Phan Đức Minh
```

### **7. Marketing Department Manager**
```
Email: trangdang@company.com
Password: (Chưa set)
Role: DEPARTMENT_MANAGER
Full Name: Đặng Thu Trang
Department: Phòng Marketing
```

### **8. Marketing Employee**
```
Email: khoabui@company.com
Role: EMPLOYEE
Full Name: Bùi Anh Khoa
```

### **9. Candidate Accounts**
```
Email: annguyen@gmail.com
Full Name: Nguyễn Văn An
Phone: 0901000001
Experience: Intern (0 years)

Email: binhtran@gmail.com
Full Name: Trần Thị Bình
Phone: 0901000002
Experience: Fresher (1 year)

Email: cuongle@gmail.com
Full Name: Lê Minh Cường
Phone: 0901000003
Experience: Junior (2 years)
```

---

## 🔧 Hướng Dẫn Khởi Động Dự Án

### **Bước 1: Khởi động Backend**

#### **Option 1: Sử dụng Visual Studio**
```bash
# Mở RMS/Backend/RMS.sln trong Visual Studio
# Nhấn F5 hoặc click "Run"
```

#### **Option 2: Sử dụng Command Line**
```bash
cd RMS/Backend
dotnet run
```

Backend sẽ chạy trên: **http://localhost:3000** (hoặc port được config trong launchSettings.json)

### **Bước 2: Khởi động Frontend**

```bash
cd RMS/Frontend
npm run dev
```

Frontend sẽ chạy trên: **http://localhost:5173**

---

## 🔍 Kiểm Tra Backend Đã Chạy

### **Windows PowerShell:**
```powershell
# Kiểm tra port 3000
netstat -ano | Select-String ":3000"

# Nếu có kết quả → Backend đang chạy
# Nếu không có kết quả → Backend chưa chạy
```

### **Test API trực tiếp:**
```bash
# Mở browser hoặc Postman
GET http://localhost:3000/api/auth/check-email?email=test@test.com
```

---

## 🗄️ Database Configuration

### **Connection String:**
```
Server: localhost\MSSQLSERVER02
Database: RecruitmentDB
User: sa
Password: 12345678
```

### **Khởi tạo Database:**

1. **Tạo Database:**
```sql
-- Chạy file: RMS/Backend/RMS_DB/01_CreateDatabase.sql
```

2. **Tạo Tables:**
```sql
-- Chạy file: RMS/Backend/RMS_DB/02_CreateTables.sql
```

3. **Seed Data:**
```sql
-- Chạy file: RMS/Backend/RMS_DB/03_SeedData.sql
```

---

## 🔐 Đăng Ký Tài Khoản Mới

### **Quy trình đăng ký:**

1. **Gửi OTP:**
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "admin@company.com"
}
```

2. **Xác thực OTP:**
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "admin@company.com",
  "otpCode": "123456"
}
```

3. **Đăng ký:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Nguyễn Văn Toàn",
  "email": "admin@company.com",
  "password": "Admin@123",
  "confirmPassword": "Admin@123"
}
```

**Lưu ý:** Email phải được xác thực OTP trước khi đăng ký.

---

## 🔑 Reset Password

### **Quy trình reset password:**

1. **Gửi OTP:**
```http
POST /api/auth/forgot-password/send-otp
Content-Type: application/json

{
  "email": "admin@company.com"
}
```

2. **Xác thực OTP:**
```http
POST /api/auth/forgot-password/verify-otp
Content-Type: application/json

{
  "email": "admin@company.com",
  "otpCode": "123456"
}
```

3. **Reset Password:**
```http
POST /api/auth/forgot-password/reset
Content-Type: application/json

{
  "email": "admin@company.com",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

---

## 🌐 Google OAuth Login

### **Google OAuth Configuration:**
```
Client ID: 32187435926-56kge5ab9q02ou9ic2uv658h6uf0e4ep.apps.googleusercontent.com
Client Secret: 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
Redirect URI: http://localhost:5173/login
```

### **Sử dụng Google Login:**
1. Click "Login with Google" trên trang login
2. Chọn tài khoản Google
3. Hệ thống tự động tạo tài khoản nếu chưa tồn tại

---

## 📧 Email Configuration

### **SMTP Settings:**
```
Host: smtp.gmail.com
Port: 587
User: lamle10092004@gmail.com
Password: smog tnmr hyrw wbqq
From: lamle10092004@gmail.com
```

**Lưu ý:** Email này được dùng để gửi OTP và thông báo.

---

## 🎯 Test Scenarios

### **Scenario 1: HR Staff tạo Offer**
1. Login với: `tuanpham@company.com`
2. Navigate to: `/staff/hr-manager/offers`
3. Click "Create Offer"
4. Fill form và submit

### **Scenario 2: HR Manager duyệt Offer**
1. Login với: `hanhle@company.com`
2. Navigate to: `/staff/hr-manager/offers`
3. Tab "Chờ duyệt"
4. Click "Approve" hoặc "Reject"

### **Scenario 3: Director duyệt Offer**
1. Login với: `hoangtran@company.com`
2. Navigate to: `/staff/director/offers`
3. Tab "Pending"
4. Click "Approve" hoặc "Reject"

### **Scenario 4: Candidate phản hồi Offer**
1. Login với: `cuongle@gmail.com`
2. Navigate to: `/candidate/offers`
3. Click vào offer
4. Click "Accept", "Negotiate", hoặc "Decline"

---

## 🐛 Troubleshooting

### **Lỗi: ECONNREFUSED**
- **Nguyên nhân**: Backend chưa chạy
- **Giải pháp**: Khởi động Backend trước

### **Lỗi: Database connection failed**
- **Nguyên nhân**: SQL Server chưa chạy hoặc connection string sai
- **Giải pháp**: 
  1. Kiểm tra SQL Server đang chạy
  2. Kiểm tra connection string trong `appsettings.json`

### **Lỗi: 401 Unauthorized**
- **Nguyên nhân**: Token hết hạn hoặc không hợp lệ
- **Giải pháp**: Đăng nhập lại

### **Lỗi: Email không gửi được**
- **Nguyên nhân**: SMTP configuration sai hoặc Gmail block
- **Giải pháp**: 
  1. Kiểm tra SMTP settings
  2. Enable "Less secure app access" trong Gmail
  3. Sử dụng App Password thay vì password thường

---

## 📝 Quick Start Commands

```bash
# 1. Start Backend
cd RMS/Backend
dotnet run

# 2. Start Frontend (terminal mới)
cd RMS/Frontend
npm run dev

# 3. Open Browser
http://localhost:5173
```

---

## 🔗 Important URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Swagger**: http://localhost:3000/swagger
- **Database**: localhost\MSSQLSERVER02

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Backend logs trong terminal
2. Frontend console trong browser (F12)
3. Database connection
4. Port conflicts (3000, 5173)