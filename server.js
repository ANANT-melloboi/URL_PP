const express = require('express');
const cors = require('cors');
const shortid = require('shortid');
const validUrl = require('valid-url');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
const NodeCache = require('node-cache');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize cache
const cache = new NodeCache({
    stdTTL: parseInt(process.env.CACHE_TTL_SECONDS) || 300,
    checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600
});

// In-memory storage (in production, use a database)
let urlDatabase = {};
let users = {};
let currentUser = null;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Logging middleware
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    const logFile = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });
    app.use(morgan('combined', { stream: logFile }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'URL Shortener API',
            version: '1.0.0',
            description: 'A comprehensive URL shortening service with authentication and analytics',
            contact: {
                name: 'API Support',
                email: 'support@urlshortener.com'
            },
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware for authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Validation middleware
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
}

// Generate short code
function generateShortCode() {
    return shortid.generate().substring(0, 6);
}

// Validate URL
function isValidUrl(url) {
    return validUrl.isUri(url);
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Utility functions
function logRequest(req, message) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${message}`);
}

function getCachedData(key) {
    return cache.get(key);
}

function setCachedData(key, data, ttl = 300) {
    cache.set(key, data, ttl);
}

// API Routes

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Server error
 */
app.post('/api/auth/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        logRequest(req, `Registration attempt for ${email}`);
        
        // Check if user already exists
        if (users[email]) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create user
        users[email] = {
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        // Generate token
        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        
        logRequest(req, `User registered successfully: ${email}`);
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { email }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], handleValidationErrors, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        logRequest(req, `Login attempt for ${email}`);
        
        // Check if user exists
        const user = users[email];
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        
        logRequest(req, `User logged in successfully: ${email}`);
        
        res.json({
            message: 'Login successful',
            token,
            user: { email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Token required
 *       403:
 *         description: Invalid token
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = users[req.user.email];
    if (user) {
        res.json({ user: { email: user.email } });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: Create a short URL
 *     tags: [URL Shortening]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - longUrl
 *             properties:
 *               longUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Short URL created successfully
 *       400:
 *         description: Invalid URL
 *       401:
 *         description: Authentication required
 */
app.post('/api/shorten', [
    authenticateToken,
    body('longUrl').isURL().withMessage('Please provide a valid URL')
], handleValidationErrors, (req, res) => {
    const { longUrl } = req.body;
    const userEmail = req.user.email;

    logRequest(req, `URL shortening request by ${userEmail}`);

    // Generate short code
    let shortCode = generateShortCode();
    
    // Ensure uniqueness
    while (urlDatabase[shortCode]) {
        shortCode = generateShortCode();
    }

    // Store in database
    const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
    urlDatabase[shortCode] = {
        longUrl,
        shortUrl,
        shortCode,
        clicks: 0,
        createdAt: new Date().toISOString(),
        createdBy: userEmail
    };

    // Clear cache for this user's URLs
    cache.del(`urls_${userEmail}`);

    logRequest(req, `Short URL created: ${shortCode} by ${userEmail}`);

    res.json({
        shortUrl,
        shortCode,
        longUrl,
        clicks: 0
    });
});

/**
 * @swagger
 * /api/urls:
 *   get:
 *     summary: Get all URLs for authenticated user
 *     tags: [URL Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of URLs
 *       401:
 *         description: Authentication required
 */
app.get('/api/urls', authenticateToken, (req, res) => {
    const userEmail = req.user.email;
    
    // Check cache first
    const cacheKey = `urls_${userEmail}`;
    const cachedUrls = getCachedData(cacheKey);
    
    if (cachedUrls) {
        logRequest(req, `Cache hit for ${userEmail}'s URLs`);
        return res.json(cachedUrls);
    }
    
    const urls = Object.values(urlDatabase)
        .filter(url => url.createdBy === userEmail)
        .map(url => ({
            shortUrl: url.shortUrl,
            longUrl: url.longUrl,
            clicks: url.clicks,
            createdAt: url.createdAt
        }));
    
    // Cache the result
    setCachedData(cacheKey, urls);
    
    logRequest(req, `Retrieved ${urls.length} URLs for ${userEmail}`);
    
    res.json(urls);
});

/**
 * @swagger
 * /{shortCode}:
 *   get:
 *     summary: Redirect to original URL
 *     tags: [Redirection]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to original URL
 *       404:
 *         description: Short URL not found
 */
app.get('/:shortCode', (req, res) => {
    const { shortCode } = req.params;
    
    logRequest(req, `Redirect request for ${shortCode}`);
    
    if (!urlDatabase[shortCode]) {
        return res.status(404).json({ error: 'Short URL not found' });
    }

    // Increment click count
    urlDatabase[shortCode].clicks++;
    
    // Clear relevant cache
    const userEmail = urlDatabase[shortCode].createdBy;
    cache.del(`urls_${userEmail}`);
    
    logRequest(req, `Redirecting ${shortCode} to ${urlDatabase[shortCode].longUrl} (clicks: ${urlDatabase[shortCode].clicks})`);
    
    // Redirect to original URL
    res.redirect(urlDatabase[shortCode].longUrl);
});

/**
 * @swagger
 * /api/analytics/{shortCode}:
 *   get:
 *     summary: Get analytics for a specific URL
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics data
 *       404:
 *         description: Short URL not found
 */
app.get('/api/analytics/:shortCode', authenticateToken, (req, res) => {
    const { shortCode } = req.params;
    
    if (!urlDatabase[shortCode]) {
        return res.status(404).json({ error: 'Short URL not found' });
    }
    
    const urlData = urlDatabase[shortCode];
    
    // Check if user owns this URL
    if (urlData.createdBy !== req.user.email) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
        shortUrl: urlData.shortUrl,
        longUrl: urlData.longUrl,
        clicks: urlData.clicks,
        createdAt: urlData.createdAt
    });
});

// Health check endpoint
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System health status
 */
app.get('/api/health', (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cache: {
            keys: cache.keys().length,
            stats: cache.getStats()
        },
        environment: NODE_ENV
    };
    
    res.json(health);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        ...(NODE_ENV === 'development' && { details: err.message })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    cache.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    cache.close();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
});
