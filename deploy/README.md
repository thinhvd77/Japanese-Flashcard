# Deploy lên EC2 Ubuntu 24.04

Hướng dẫn deploy ứng dụng Japanese Flashcard lên EC2 Free Tier.

## Yêu cầu

- EC2 instance (t2.micro hoặc t3.micro free tier)
- Ubuntu 24.04 LTS
- Node.js đã cài sẵn
- Nginx đã cài sẵn
- Mở port 80 (HTTP) trong Security Group

## Các bước deploy

### 1. Copy dự án lên server

```bash
# Từ máy local
scp -r /path/to/japanese-flashcard/* ubuntu@your-ec2-ip:/home/ubuntu/japanese-flashcard/
```

### 2. SSH vào server

```bash
ssh ubuntu@your-ec2-ip
```

### 3. Cài đặt PM2 (process manager)

```bash
sudo npm install -g pm2
```

### 4. Chạy script deploy

```bash
cd /home/ubuntu/japanese-flashcard/deploy
chmod +x deploy.sh
./deploy.sh
```

### 5. Setup Nginx

```bash
# Copy nginx config
sudo cp /home/ubuntu/japanese-flashcard/deploy/nginx.conf /etc/nginx/sites-available/japanese-flashcard

# Enable site
sudo ln -sf /etc/nginx/sites-available/japanese-flashcard /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 6. Setup PM2 startup

```bash
pm2 startup
# Chạy lệnh mà PM2 hiển thị
pm2 save
```

## Cấu trúc sau khi deploy

```
/home/ubuntu/japanese-flashcard/
├── backend/
│   ├── data/           # SQLite database
│   └── ...
├── frontend/
│   └── dist/           # Static files (served by nginx)
└── deploy/
```

## Quản lý ứng dụng

```bash
# Xem status
pm2 status

# Xem logs
pm2 logs japanese-flashcard-api

# Restart
pm2 restart japanese-flashcard-api

# Stop
pm2 stop japanese-flashcard-api
```

## Tối ưu cho Free Tier

Cấu hình đã được tối ưu cho EC2 free tier (1GB RAM):

1. **SQLite** thay vì MySQL/PostgreSQL - không cần RAM cho database server
2. **PM2** với mode fork (single instance) - tiết kiệm RAM
3. **Nginx** serve static files - giảm tải cho Node.js
4. **Gzip compression** - giảm bandwidth
5. **File caching** - giảm I/O

## Troubleshooting

### Nginx không khởi động

```bash
# Kiểm tra lỗi config
sudo nginx -t

# Xem logs
sudo tail -f /var/log/nginx/error.log
```

### PM2 không chạy

```bash
# Kiểm tra Node.js
node -v

# Kiểm tra logs
pm2 logs

# Chạy trực tiếp để xem lỗi
cd /home/ubuntu/japanese-flashcard/backend
node src/index.js
```

### Không thể upload file

```bash
# Kiểm tra quyền thư mục uploads
ls -la /home/ubuntu/japanese-flashcard/backend/uploads

# Tạo thư mục nếu chưa có
mkdir -p /home/ubuntu/japanese-flashcard/backend/uploads
chmod 755 /home/ubuntu/japanese-flashcard/backend/uploads
```
