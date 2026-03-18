docker compose up -d --build
docker-compose stop
docker-compose start
docker-compose down




--------------------
docker compose ps
docker-compose down -v

docker compose logs -f
docker logs rms-db-init

-----------
docker compose down -v
docker compose build --no-cache
docker compose up -d

---------------
Dưới đây là tóm tắt cực ngắn gọn về luồng hoạt động của hai sơ đồ:

### 1. Sơ đồ Frontend (Giao diện)

* **Hiển thị:** `routes` → `pages` → `components`.
* **Logic:** `pages` gọi `hooks` để kết nối với `service`.
* **Dữ liệu:** `service` và `hooks` truy xuất dữ liệu từ `data` và `utils`.

### 2. Sơ đồ Backend (Hệ thống)

* **Tiếp nhận:** `Controller` và `Hub` nhận yêu cầu.
* **Xử lý:** `Service` thực hiện nghiệp vụ thông qua `Mapping` và `Dto`.
* **Lưu trữ:** `Repository` quản lý `Entity` và truy cập `Data`.
* **Hỗ trợ:** `Common` cung cấp tài nguyên dùng chung cho toàn bộ hệ thống.

---

**Sự khác biệt cốt lõi:** Sơ đồ 1 tập trung vào **luồng điều hướng người dùng**, sơ đồ 2 tập trung vào **luồng xử lý và lưu trữ dữ liệu**.
