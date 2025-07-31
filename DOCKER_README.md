# BlueBank - Modern Banking Application

A full-stack banking application built with Next.js frontend and FastAPI backend, containerized for easy deployment.

## 🚀 Quick Start

```bash
# Run with Docker
docker run -d -p 80:80 --name bluebank chenhexu/bluebank:latest

# Access the application
open http://localhost
```

## ✨ Features

- **User Authentication**: Sign up, log in, and profile management
- **Third-Party Login**: Google and Facebook OAuth integration
- **Banking Operations**: 
  - Deposit money
  - Withdraw funds
  - Transfer between users
  - View transaction history
- **Real-time Notifications**: Get notified of money transfers
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: FastAPI, Python 3.11
- **Database**: SQLite
- **Authentication**: Google OAuth, Facebook OAuth
- **Container**: Docker with Nginx

## 📱 Screenshots

- Modern, responsive UI
- Dark mode support
- Real-time notifications
- Mobile-friendly design

## 🔧 Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the backend directory:

```env
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

## 🌐 Access Points

- **Frontend**: `http://localhost` (port 80)
- **Backend API**: `http://localhost/api/` (proxied through Nginx)

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Feel free to submit issues and enhancement requests! 