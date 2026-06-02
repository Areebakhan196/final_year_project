# The Silent Reporter - Frontend

A production-ready, highly secure React frontend for the anonymous complaint reporting system.

## 🚀 Features

- **Anonymous Submission**: Text and Audio reporting modes with end-to-end encryption support.
- **Evidence Management**: Secure image and audio file uploads.
- **Real-time Tracking**: Check complaint status using a unique Tracking ID.
- **Admin Dashboard**: Comprehensive management interface with data analytics and decrypted content review.
- **Premium UI/UX**: Built with Tailwind CSS v4, Framer Motion, and Lucide React.
- **Mobile Responsive**: Fully optimized for all device sizes.

## 🛠️ Tech Stack

- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS v4
- **State Management**: Context API
- **API Client**: Axios with global interceptors
- **Animations**: Framer Motion
- **Notifications**: React Toastify
- **Icons**: Lucide React

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Backend server running on `http://localhost:8000` (or configured via proxy)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Configuration

The application is configured to proxy `/api` requests to the backend. Ensure your backend is running and `vite.config.js` is correctly configured if using a custom port.

## 🔒 Security & Privacy

- **No PII Collection**: The frontend does not capture IP addresses, device metadata, or personal information.
- **Secure Handling**: Files are handled as `FormData` and transmitted over HTTPS.
- **Anonymity First**: Tracking IDs are stored locally only if the user chooses to.

---
© 2026 The Silent Reporter.
