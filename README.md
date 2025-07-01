# AT-ICT Learning Management System

A comprehensive Learning Management System built with the MERN stack, featuring real-time chat, assignment management, quiz system, and multi-role dashboards for students, teachers, and parents.

## 🚀 Features

### For Students
- **Dashboard Overview**: Track assignments, quizzes, and grades
- **Material Access**: Download course materials and resources
- **Assignment Submission**: Upload and submit assignments
- **Quiz Taking**: Interactive quiz system with instant feedback
- **Real-time Chat**: Direct communication with teachers
- **Schedule Viewing**: Class schedules and important dates
- **Announcements**: Stay updated with latest news

### For Teachers
- **Student Management**: View and manage student progress
- **Material Upload**: Share course resources and materials
- **Assignment Creation**: Create and grade assignments
- **Quiz Builder**: Build interactive quizzes with multiple question types
- **Real-time Chat**: Communicate with students and parents
- **Announcement System**: Post important updates
- **Schedule Management**: Manage class schedules

### For Parents
- **Child Progress**: Monitor child's academic performance
- **Communication**: Chat with teachers about child's progress
- **Reports & Marks**: View detailed progress reports
- **Announcements**: Stay informed about school activities

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Deployment**: Docker, Nginx

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/AT-ICT_Test.git
cd AT-ICT_Test
```

### 2. Install Dependencies
```bash
npm run install-all
```

### 3. Environment Setup
```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend environment  
cp client/.env.example client/.env
# Edit client/.env with your configuration
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health Check: http://localhost:5000/health

## 🔧 Environment Variables

### Backend (.env in /backend)
```env
MONGO_URI=mongodb://localhost:27017/atict
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
JWT_EXPIRE=30d
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880
```

### Frontend (.env in /client)
```env
REACT_APP_API_URL=http://localhost:5000
```

## 🐳 Docker Deployment

### Quick Docker Setup
```bash
# Build and run with Docker Compose
npm run docker:compose

# Or build manually
npm run docker:build
npm run docker:run
```

### Production Docker Deployment
```bash
# Clone repository on server
git clone https://github.com/your-username/AT-ICT_Test.git
cd AT-ICT_Test

# Set up environment variables
cp backend/.env.example backend/.env
cp client/.env.example client/.env
# Edit with production values

# Deploy with Docker Compose
docker-compose up -d
```

## 📖 Deployment Guide

For detailed deployment instructions, see [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

### Deployment Options:
1. **VPS/Dedicated Server** - Full control with PM2 and Nginx
2. **Vercel + Railway** - Serverless frontend with managed backend
3. **Docker** - Containerized deployment with Docker Compose

## 🔒 Security Features

- JWT Authentication with secure secrets
- Rate limiting to prevent abuse
- CORS protection
- Helmet security headers
- Input validation and sanitization
- File upload restrictions
- Environment-based configurations

## 📁 Project Structure

```
AT-ICT_Test/
├── backend/                 # Express.js backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── scripts/           # Utility scripts
│   └── uploads/           # File uploads
├── client/                # React frontend
│   ├── public/           # Static files
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── Pages/        # Page components
│   │   ├── config/       # Configuration
│   │   └── utils/        # Utilities
│   └── build/            # Production build
├── DEPLOYMENT_CHECKLIST.md # Deployment checklist and guide
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile           # Multi-stage Docker build
└── README.md           # This file
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Student Endpoints
- `GET /api/student/dashboard` - Student dashboard data
- `GET /api/student/materials` - Course materials
- `GET /api/student/assignments` - Student assignments
- `GET /api/student/quizzes` - Available quizzes

### Teacher Endpoints
- `GET /api/teacher/dashboard` - Teacher dashboard data
- `GET /api/teacher/students` - Managed students
- `POST /api/teacher/materials` - Upload materials
- `POST /api/teacher/assignments` - Create assignments

### Chat Endpoints
- `GET /api/chat/conversations` - User conversations
- `POST /api/chat/send` - Send message
- `POST /api/chat/files` - Upload chat files

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MONGO_URI in backend/.env
   - Ensure MongoDB is running
   - Verify network connectivity

2. **CORS Errors**
   - Check CLIENT_URL in backend/.env
   - Verify frontend URL configuration

3. **File Upload Issues**
   - Check upload directory permissions
   - Verify MAX_FILE_SIZE setting
   - Ensure Cloudinary configuration (if used)

4. **Socket.IO Connection Issues**
   - Check proxy configuration
   - Verify WebSocket support
   - Check firewall settings

## 📞 Support

For support and questions:
- Email: support@at-ict.com
- Documentation: See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Issues: Create a GitHub issue

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📊 Monitoring

### Health Checks
- Backend: `GET /health`
- Database connectivity monitoring
- Application performance tracking

### Logging
- Application logs in `/backend/logs`
- Nginx access logs
- PM2 process logs

---

**AT-ICT LMS** - Empowering Education Through Technology 