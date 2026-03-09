# Vercel Deployment Guide

This guide will help you deploy the URL Shortener application to Vercel.

## 🚀 Quick Deploy

### Prerequisites
- Vercel account (sign up at [vercel.com](https://vercel.com))
- GitHub account (recommended)
- Node.js installed locally

### One-Click Deployment
1. Click the button below to deploy to Vercel:
   
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/url-shortener)

### Manual Deployment

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy
```bash
vercel --prod
```

## ⚙️ Environment Variables

Before deploying, set up these environment variables in your Vercel dashboard:

### Required Variables
- `JWT_SECRET` - A strong secret key for JWT tokens
- `NODE_ENV` - Set to `production`

### Optional Variables
- `JWT_EXPIRES_IN` - Token expiration time (default: 24h)
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 12)
- `CACHE_TTL_SECONDS` - Cache time-to-live (default: 300)

### Setting Environment Variables
1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the variables above

## 🏗️ Project Structure

```
url-shortener/
├── api/                    # Serverless functions
│   ├── auth-register.js      # User registration
│   ├── auth-login.js        # User login
│   ├── auth-me.js          # Get current user
│   ├── shorten.js          # Create short URL
│   ├── urls.js             # Get user URLs
│   └── health.js           # Health check
├── public/                 # Static files
│   ├── index.html          # Main frontend
│   └── script.js          # Frontend JavaScript
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies and scripts
└── .env.production       # Production environment template
```

## 🔧 Configuration

### vercel.json
The `vercel.json` file configures:
- **Build settings** - Node.js serverless functions
- **Routing** - API routes vs static files
- **Headers** - CORS configuration
- **Environment** - Production mode

### Serverless Functions
Each file in `/api` becomes a serverless function:
- `/api/auth/register` → User registration
- `/api/auth/login` → User authentication
- `/api/shorten` → URL shortening
- `/api/urls` → Get user URLs
- `/api/health` → Health monitoring

## 🌐 Deployment Process

### Automatic Deployment (Recommended)
1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables
4. Deploy automatically on git push

### Manual Deployment
1. Run `vercel` locally to test
2. Run `vercel --prod` for production
3. Monitor deployment in Vercel dashboard

## 📊 Monitoring

### Health Check
Your deployed app includes a health endpoint:
```
https://your-app.vercel.app/api/health
```

### Vercel Analytics
- Access logs in Vercel dashboard
- Monitor function performance
- Track usage and errors

## 🔒 Security Considerations

### Production Security
- Use strong `JWT_SECRET`
- Enable HTTPS (automatic on Vercel)
- Monitor for abuse
- Consider rate limiting with Vercel KV

### Database Note
Current implementation uses in-memory storage. For production:
- Use Vercel KV for persistence
- Or integrate external database (MongoDB, PostgreSQL)
- Update API functions accordingly

## 🚨 Troubleshooting

### Common Issues

#### 1. CORS Errors
- Check `vercel.json` headers configuration
- Ensure API routes are properly configured

#### 2. Authentication Failures
- Verify `JWT_SECRET` is set in Vercel
- Check token expiration settings

#### 3. Build Failures
- Ensure all dependencies are in `package.json`
- Check Node.js version compatibility

#### 4. Function Timeouts
- Vercel functions have 10-second limit
- Optimize database queries
- Consider edge functions for faster responses

### Debugging
```bash
# Local development
npm run dev

# Vercel logs
vercel logs

# Deploy preview
vercel
```

## 🔄 Continuous Deployment

### GitHub Integration
1. Connect your GitHub repository to Vercel
2. Configure build settings
3. Deploy automatically on:
   - Push to main branch
   - Pull requests (preview deployments)

### Custom Domain
1. Go to Vercel dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Configure DNS records

## 📈 Performance Optimization

### Vercel Edge Functions
For better performance, consider edge functions:
```javascript
// api/shorten.js
export const config = {
  runtime: 'edge',
};
```

### Caching
- Static files are cached automatically
- API responses can be cached with Cache-Control headers
- Consider Vercel KV for data caching

## 🆙 Upgrading

### Database Migration
When adding persistent storage:
1. Create migration scripts
2. Deploy database changes first
3. Update application code
4. Monitor for issues

### Version Updates
1. Update dependencies
2. Test locally
3. Deploy to preview
4. Promote to production

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Help**: [vercel.com/help](https://vercel.com/help)
- **GitHub Issues**: Report issues in repository

---

**Ready to deploy! 🚀**

Your URL shortener is now configured for Vercel deployment with serverless functions, proper routing, and production optimizations.
