# Form Builder - MSFake 🏗️

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-%2361DAFB)](https://react.dev/)  
[![Firebase](https://img.shields.io/badge/Firebase-9.22.0-%23FFCA28)](https://firebase.google.com/)

**Công cụ xây dựng form trực quan** với chức năng kéo thả, phân tích dữ liệu response và xuất báo cáo.

👉 [Live Demo](https://luminaryluna06.github.io/form-builder/)

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
