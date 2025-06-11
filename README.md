# Form Builder - MSFake 📋

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-Latest-%2361DAFB?logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-%23FFCA28?logo=firebase)](https://firebase.google.com/)

**Công cụ xây dựng form trực quan** với chức năng kéo thả, phân tích dữ liệu response và xuất báo cáo.

👉 [Live Demo](https://luminaryluna06.github.io/form-builder/)

👉 **Ảnh minh họa**

![Trang chủ](https://github.com/user-attachments/assets/9fb37eff-5349-4b05-bc88-2c495d44bc5d)
![Trình tạo form](https://github.com/user-attachments/assets/45275dc7-7bd1-42b1-905f-ba970a463d62)
![Bảng dữ liệu](https://github.com/user-attachments/assets/febab55b-cef5-4789-97fd-54158edc24ca)
![Phân tích dữ liệu](https://github.com/user-attachments/assets/92f778e7-f75c-4226-9cba-47e07adb2eeb)


![Form Builder Preview](link_ảnh_preview.gif)

## ✨ Tính năng nổi bật

- **Drag & Drop Form Designer**: Tạo form trực quan bằng kéo thả component.
- **Quản lý form**: Thêm/sửa/xóa form, tuỳ chỉnh validation với Yup.
- **Thu thập responses**: Lưu trữ response trên Firestore.
- **Phân tích dữ liệu**:
  - Chấm điểm tự động (với form trắc nghiệm).
  - Thống kê response bằng biểu đồ (Mantine Charts).
- **Export data**: Tải responses dưới dạng CSV.
- **Real-time updates**: Cập nhật response ngay lập tức với TanStack Query.

## 🛠 Công nghệ

- **Frontend**:
  - React 18 + TypeScript
  - UI Library: [Mantine UI](https://mantine.dev/)
  - State Management: [TanStack Query](https://tanstack.com/query/latest)
  - Form Validation: [Yup](https://www.npmjs.com/package/yup)
  - Drag & Drop: [Hello-pangea-dnd](https://github.com/hello-pangea/dnd)
- **Backend**:
  - Firebase: Authentication, Firestore, Realtime Database
  - Hosting: Github Page

## 🚀 Cách cài đặt

1. **Clone repo**:
   ```bash
   git clone https://github.com/LuminaryLuna06/form-builder.git
   cd form-builder
   ```
