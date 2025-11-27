# Japanese Flashcard App

Ứng dụng học tiếng Nhật với flashcard 5 mặt, tối ưu cho mobile.

## Tính năng

- 📚 Upload file Excel để tạo bộ từ vựng
- 🎴 Flashcard 5 mặt: Kanji, Nghĩa, Phiên âm, Hán Việt, Ví dụ
- 📱 Giao diện mobile-first, touch-friendly
- 🔀 Trộn thẻ ngẫu nhiên
- ⌨️ Hỗ trợ điều hướng bằng bàn phím

## Yêu cầu hệ thống

- Node.js 18+
- npm hoặc yarn

## Cấu trúc dự án

```
japanese-flashcard/
├── backend/          # Express API server
│   ├── src/
│   │   ├── index.js
│   │   ├── database.js
│   │   └── routes/
│   └── package.json
├── frontend/         # React Vite app
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── api.js
│   └── package.json
├── deploy/           # Deployment configs
└── README.md
```

## Cài đặt & Chạy local

### Backend

```bash
cd backend
npm install
npm run dev
```

Server chạy tại: http://localhost:3001

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App chạy tại: http://localhost:3000

## Định dạng file Excel

File Excel cần có các cột sau (không phân biệt hoa thường):

| Cột | Mô tả | Tên thay thế |
|-----|-------|--------------|
| Kanji | Chữ Kanji | 漢字 |
| Meaning | Nghĩa tiếng Việt | Nghĩa, nghĩa |
| Pronunciation | Phiên âm Hiragana | Hiragana, Phiên âm, ひらがな |
| Sino-Vietnamese | Âm Hán Việt | Hán Việt, hán việt |
| Example | Câu ví dụ | Ví dụ, 例文 |

### Ví dụ file Excel:

| Kanji | Meaning | Pronunciation | Sino-Vietnamese | Example |
|-------|---------|---------------|-----------------|---------|
| 日本 | Nhật Bản | にほん | Nhật Bản | 日本は美しい国です |
| 勉強 | Học tập | べんきょう | Miễn Cường | 毎日勉強します |

## Deploy lên EC2 (Ubuntu 24.04)

Xem chi tiết trong file `deploy/README.md`

### Quick deploy:

```bash
# Copy files lên server
scp -r ./* user@your-ec2-ip:/home/user/japanese-flashcard/

# SSH vào server và chạy script
ssh user@your-ec2-ip
cd /home/user/japanese-flashcard/deploy
chmod +x deploy.sh
./deploy.sh
```

## License

MIT
