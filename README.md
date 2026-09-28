# ĐỀ 29: WEBSITE CHIA SẺ CÔNG THỨC NẤU ĂN (RECIPE SHARING APP)

> **Hệ thống phần mềm hoàn chỉnh triển khai Website Chia Sẻ Công Thức Nấu Ăn, Cơ sở dữ liệu MySQL, phpMyAdmin, Nginx Reverse Proxy, Hệ thống Giám sát Prometheus + Grafana, Thu thập Nhật ký Loki + LogQL & Security Hardening.**

---

##  1. TỔNG QUAN DỰ ÁN

Website **Góc Bếp Việt / Recipe Sharing** là nền tảng chia sẻ và quản lý công thức nấu ăn phong phú, hỗ trợ tìm kiếm theo tên món, lọc theo danh mục (Món Á, Món Âu, Món Tráng Miệng, Đồ Uống, Món Chay, Món Ăn Sáng), định lượng nguyên liệu chuẩn xác, dinh dưỡng (Calo), cùng tính năng gửi bình luận và đánh giá từ cộng đồng.

###  Các Công Nghệ & Dịch Vụ Sử Dụng (Tech Stack):
- **Web Application**: Node.js 20 + Express.js (REST APIs, Prometheus Metrics client `prom-client`)
- **Frontend UI**: Responsive HTML5, Vanilla CSS Glassmorphism, FontAwesome 6, Google Fonts
- **Database**: MySQL 8.0 (Auto Schema Init & Seed Recipe Data)
- **Database Management**: phpMyAdmin (Web UI quản trị CSDL)
- **Reverse Proxy & Hardening**: Nginx Proxy (Rate Limiting, Security Headers, Structured JSON Logs)
- **Monitoring & Metrics**: Prometheus Server + Nginx Prometheus Exporter
- **Log Aggregation & Search**: Grafana Loki 2.9 + Promtail Log Shipper + LogQL
- **Dashboard & Visualization**: Grafana 10.4 (Tự động Provision Datasources & Pre-built Dashboard)

---

## 🌐 2. BẢNG CỔNG DỊCH VỤ & ĐỊA CHỈ TRUY CẬP

| Dịch vụ | Cổng (Port) | Đường dẫn (URL) | Tài khoản / Ghi chú |
| :--- | :--- | :--- | :--- |
| **Website Công Thức Nấu Ăn** | `80` | `http://localhost/` | Giao diện người dùng công thức nấu ăn |
| **phpMyAdmin** | `80` | `http://localhost/phpmyadmin/` | User: `recipe_user` / Pass: `recipe_secret_123` |
| **Grafana Monitoring** | `3001` | `http://localhost:3001` | User: `admin` / Pass: `admin` |
| **Prometheus Server** | `9090` | `http://localhost:9090` | Thu thập metrics hệ thống |
| **App Metrics Endpoint** | `80` | `http://localhost/metrics` | Prometheus Metrics định dạng chuẩn |
| **API Health Check** | `80` | `http://localhost/api/health` | Kiểm tra kết nối DB & App status |
| **Loki Log Engine** | `3100` | `http://localhost:3100` | Loki Log Push API & Query API |

---

##  3. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG (QUICK START)

### Yêu cầu tiên quyết:
- Đã cài đặt **Docker Engine** & **Docker Compose** trên máy (Windows/Linux/macOS).

### Các bước thực hiện:

1. **Cloning / Đứng tại thư mục dự án**:
   ```bash
   cd "c:\TeraBoxDownload\bài kiểm tra kỹ năng 3"
   ```

2. **Khởi chạy toàn bộ hệ thống bằng Docker Compose**:
   ```bash
   docker compose up -d --build
   ```

3. **Kiểm tra trạng thái các container**:
   ```bash
   docker compose ps
   ```

4. **Truy cập Website**:
   - Mở trình duyệt và truy cập: `http://localhost`

---

## 🔐 4. CHI TIẾT SECURITY HARDENING (BẢO MẬT HỆ THỐNG)

Hệ thống đã triển khai đầy đủ các tiêu chuẩn bảo mật Hardening bao gồm:

1. **Nginx Security Headers**:
   - `X-Frame-Options: SAMEORIGIN` (Chống Clickjacking)
   - `X-XSS-Protection: 1; mode=block` (Kích hoạt XSS Auditor)
   - `X-Content-Type-Options: nosniff` (Ngăn MIME-type sniffing)
   - `Content-Security-Policy` & `Referrer-Policy`

2. **Ẩn phiên bản phần mềm (Information Disclosure Hardening)**:
   - Cấu hình `server_tokens off;` trong `nginx.conf` để không lộ phiên bản Nginx cho hacker.

3. **Chống tấn công Từ chối Dịch vụ (DoS / Brute Force Rate Limiting)**:
   - Cấu hình `limit_req_zone` (tối đa 10 req/s, burst 20) và `limit_conn_zone` giới hạn số lượng kết nối đồng thời theo IP.

4. **Container Security (Non-root user)**:
   - Dockerfile của Web App được chạy dưới tài khoản không phải root (`USER node`).

5. **MySQL Hardening**:
   - Tài khoản truy cập ứng dụng (`recipe_user`) chỉ được cấp quyền trong database `recipe_db`, tách biệt với tài khoản `root`.

---

## 📊 5. GIÁM SÁT PROMETHEUS & TRUY VẤN LOGQL TRONG LOKI / GRAFANA

### A. Chỉ số Prometheus (Metrics):
- `recipe_app_total_recipes`: Gauge đếm tổng số công thức nấu ăn hiện có trong CSDL.
- `http_requests_total`: Counter đếm tổng số yêu cầu HTTP theo phương thức (GET/POST/DELETE) và mã phản hồi (200, 404, 500).
- `http_request_duration_seconds`: Histogram đo thời gian xử lý yêu cầu.
- `nginx_connections_active`: Chỉ số kết nối đang hoạt động của Nginx.

### B. Truy vấn LogQL trong Grafana Loki:
Hệ thống Promtail thu thập nhật ký truy cập JSON từ Nginx và gửi trực tiếp về Loki với nhãn `job="nginx_logs"`.

Các câu lệnh LogQL sử dụng trong Grafana Explore / Dashboard:

1. **Xem toàn bộ Real-time Logs của Nginx**:
   ```logql
   {job="nginx_logs"}
   ```

2. **Lọc các nhật ký yêu cầu HTTP GET**:
   ```logql
   {job="nginx_logs"} |= "GET"
   ```

3. **Lọc cảnh báo lỗi Client Error (HTTP 4xx) hoặc Server Error (HTTP 5xx)**:
   ```logql
   {job="nginx_logs"} |~ "4[0-9][0-9]|5[0-9][0-9]"
   ```

4. **Trích xuất thông tin truy cập dạng JSON**:
   ```logql
   {job="nginx_logs"} | json | remote_addr != ""
   ```

---

## 🛠️ 6. DANH SÁCH REST API ENDPOINTS

- `GET /api/health` - Trạng thái sức khỏe ứng dụng và kết nối CSDL MySQL.
- `GET /api/stats` - Thống kê tổng số công thức, danh mục, nguyên liệu, đánh giá.
- `GET /api/categories` - Lấy danh sách danh mục món ăn.
- `GET /api/ingredients` - Lấy danh sách nguyên liệu.
- `GET /api/recipes` - Lấy danh sách công thức (Hỗ trợ query `category_id`, `ingredient_id`, `search`).
- `GET /api/recipes/:id` - Lấy chi tiết công thức, định lượng nguyên liệu và đánh giá.
- `POST /api/recipes` - Thêm công thức nấu ăn mới.
- `DELETE /api/recipes/:id` - Xóa công thức nấu ăn.
- `POST /api/recipes/:id/reviews` - Đăng bài đánh giá & bình luận món ăn.
- `GET /metrics` - Xuất Prometheus metrics.

---

## 📁 7. CẤU TRÚC THƯ MỤC DỰ ÁN

```
bài kiểm tra kỹ năng 3/
├── app/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   └── public/
│       ├── index.html
│       ├── css/style.css
│       └── js/app.js
├── mysql/
│   └── init/
│       └── 01-schema.sql
├── nginx/
│   ├── nginx.conf
│   └── conf.d/default.conf
├── prometheus/
│   └── prometheus.yml
├── loki/
│   └── loki-config.yaml
├── promtail/
│   └── promtail-config.yaml
├── grafana/
│   └── provisioning/
│       ├── datasources/datasources.yml
│       └── dashboards/
│           ├── dashboards.yml
│           └── recipe-monitoring.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

---
*Đồ án triển khai hệ thống quản lý công thức nấu ăn đầy đủ tính năng & tiêu chuẩn DevOps/Monitoring.*
