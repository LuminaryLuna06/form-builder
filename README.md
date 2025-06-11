# Form Builder - MSFake 📋

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![React](https://img.shields.io/badge/React-Latest-%2361DAFB?logo=react)](https://react.dev/)  
[![Firebase](https://img.shields.io/badge/Firebase-Latest-%23FFCA28?logo=firebase)](https://firebase.google.com/)

**A visual form builder** with drag-and-drop functionality, response data analysis, and report generation.

👉 [Live Demo](https://luminaryluna06.github.io/form-builder/)

👉 **Screenshots**

![Homepage](https://github.com/user-attachments/assets/9fb37eff-5349-4b05-bc88-2c495d44bc5d)  
![Form Editor](https://github.com/user-attachments/assets/45275dc7-7bd1-42b1-905f-ba970a463d62)  
![Data Table](https://github.com/user-attachments/assets/febab55b-cef5-4789-97fd-54158edc24ca)  
![Data Analysis](https://github.com/user-attachments/assets/92f778e7-f75c-4226-9cba-47e07adb2eeb)

## ✨ Key Features

- **Drag & Drop Form Designer**: Visually create forms by dragging and dropping components.
- **Form Management**: Add/edit/delete forms with Yup validation.
- **Response Collection**: Store responses in Firestore.
- **Data Analysis**:
  - Automatic scoring (for quiz forms).
  - Response statistics with charts (Mantine Charts).
- **Data Export**: Download responses as CSV.
- **Real-time Updates**: Instant response updates with TanStack Query.

## 🛠 Technologies

- **Frontend**:
  - React 18 + TypeScript
  - UI Library: [Mantine UI](https://mantine.dev/)
  - State Management: [TanStack Query](https://tanstack.com/query/latest)
  - Form Validation: [Yup](https://www.npmjs.com/package/yup)
  - Drag & Drop: [Hello-pangea-dnd](https://github.com/hello-pangea/dnd)
- **Backend**:
  - Firebase: Authentication, Firestore, Realtime Database
  - Hosting: GitHub Pages

## 🚀 Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/LuminaryLuna06/form-builder.git
   cd form-builder
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure Firebase**:

   - Create a new project in [Firebase Console](https://console.firebase.google.com/)
   - Enable required services: Authentication, Firestore Database
   - Copy configuration from "Project settings"

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   # ... (other variables)
   ```

4. **Run the application**:

   ```bash
   npm run dev
   ```

5. **Deploy (optional)**:
   ```bash
   npm run build
   ```

## 🔥 Firebase Configuration

1. **Authentication**:

   - Go to Authentication → Enable sign-in methods (Email/Password, Google, etc.)

2. **Database**:
   - Go to Firestore Database → Create collections: `forms` and `responses`
   - Configure appropriate Security Rules

## 📌 Notes

- Do not commit the `.env` file to the repository
- Verify Security Rules before deploying
