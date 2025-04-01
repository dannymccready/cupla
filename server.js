const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Successfully connected to database');
    release();
});

// Create necessary tables
async function createTables() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                account_type VARCHAR(20) DEFAULT 'user' CHECK (account_type IN ('user', 'admin', 'super_admin')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await createSuperAdmin(client);
    } catch (err) {
        console.error('Error creating tables:', err);
    } finally {
        client.release();
    }
}

// Create super admin account
async function createSuperAdmin(client) {
    const email = 'dannymccready@gmail.com';
    const password = 'Aria2015';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            await client.query(
                'INSERT INTO users (email, password, account_type) VALUES ($1, $2, $3)',
                [email, hashedPassword, 'super_admin']
            );
            console.log('Super admin created successfully');
        }
    } catch (err) {
        console.error('Error creating super admin:', err);
    }
}

// Initialize database
createTables().catch(console.error);

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Routes
app.post('/api/register', async (req, res) => {
    const { email, password, accountType } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password, account_type) VALUES ($1, $2, $3) RETURNING id',
            [email, hashedPassword, accountType]
        );
        res.status(201).json({ message: 'User created successfully', id: result.rows[0].id });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            res.status(400).json({ error: 'Email already exists' });
        } else {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Error creating user' });
        }
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        res.json({ 
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                accountType: user.account_type
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error during login' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/user', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, account_type FROM users WHERE id = $1',
            [req.session.userId]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ error: 'Error fetching user data' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 