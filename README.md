# URL Shortener

A web application that allows users to convert long URLs into shortened links and track their usage analytics.

## ✨ Features

- **URL Shortening**: Convert long URLs into short, shareable links
- **Redirection**: Automatic redirect to original URL when short link is accessed
- **Click Tracking**: Track the number of clicks for each shortened link
- **Link Dashboard**: View all created links with their analytics
- **Data Persistence**: Links are stored and persist across page refreshes
- **Input Validation**: Prevents invalid or empty URL submissions
- **User Authentication**: Secure signup/login system with JWT tokens
- **Animations**: Modern UI with smooth animations and transitions
- **API Documentation**: Complete Swagger/OpenAPI documentation
- **Rate Limiting**: Protection against abuse
- **Health Monitoring**: System health checks and metrics

## 🚀 Quick Start

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

### Vercel Deployment

#### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/url-shortener)

#### Manual Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🏗️ Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Authentication**: JWT tokens with bcrypt password hashing
- **Storage**: In-memory storage (production: Vercel KV recommended)
- **Deployment**: Vercel serverless functions
- **Security**: Helmet.js, CORS, rate limiting
- **Documentation**: Swagger/OpenAPI 3.0
- **Monitoring**: Health checks, logging, metrics

## 📚 API Documentation

Once running, visit:
- **Interactive API Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/api/health

## 🔧 Configuration

### Environment Variables

Create a `.env` file for local development:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
```

For production, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📁 Project Structure

```
url-shortener/
├── api/                    # Vercel serverless functions
│   ├── auth-register.js      # User registration
│   ├── auth-login.js        # User authentication
│   ├── auth-me.js          # Get current user
│   ├── shorten.js          # Create short URL
│   ├── urls.js             # Get user URLs
│   └── health.js           # Health check
├── public/                 # Static frontend files
│   ├── index.html          # Main application
│   └── script.js          # Frontend JavaScript
├── server.js              # Local development server
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### URL Management
- `POST /api/shorten` - Create short URL (requires auth)
- `GET /api/urls` - Get user URLs (requires auth)
- `GET /{shortCode}` - Redirect to original URL

### System
- `GET /api/health` - Health check and system metrics
- `GET /api-docs` - Interactive API documentation

## 🎨 UI Features

- **Animated Interface**: Smooth transitions and micro-interactions
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Easy on the eyes
- **Real-time Updates**: Click counts refresh automatically
- **Copy to Clipboard**: One-click link copying
- **Form Validation**: Client and server-side validation

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS Protection**: Proper cross-origin handling
- **Security Headers**: Helmet.js protection
- **Input Validation**: Express-validator sanitization
- **Content Security Policy**: XSS protection

## 📊 Monitoring & Analytics

- **Health Checks**: System status and metrics
- **Request Logging**: Morgan logger with file output
- **Performance Monitoring**: Memory usage and uptime
- **Error Tracking**: Comprehensive error handling
- **Cache Management**: In-memory caching with TTL

## 🚀 Deployment

### Vercel (Recommended)
- Serverless functions
- Automatic HTTPS
- Global CDN
- Preview deployments
- Custom domain support

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

## 🔄 Development Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run build      # Build for production
npm run deploy     # Deploy to Vercel production
```

## 📈 Production Considerations

### Database
Current implementation uses in-memory storage. For production:
- Use Vercel KV for persistence
- Or integrate external database (MongoDB, PostgreSQL)
- Update API functions accordingly

### Scaling
- Vercel automatically scales serverless functions
- Consider edge functions for better performance
- Monitor function execution time (10s limit)

### Security
- Use strong JWT secrets in production
- Enable environment-specific configurations
- Monitor for abuse and unusual activity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report via GitHub Issues
- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Docs**: Available at `/api-docs` endpoint

---

**Ready to shorten URLs! 🔗**
