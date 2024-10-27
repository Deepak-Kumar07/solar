const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto'); // Import the crypto module
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Session setup with random session ID generation
app.use(session({
    genid: (req) => {
        return crypto.randomBytes(16).toString('hex'); // Generate a random session ID
    },
    secret: 'il667744123987us', // Change this to a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 } // Session will expire after 1 minute (60000 milliseconds)
}));

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL connected...');
});

// Routes
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(sql, [username, email, password], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'User registered successfully!' });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length > 0) {
            // Store user information in the session
            req.session.userId = results[0].id; // Assuming `id` is the user ID
            req.session.username = username; // Optionally store the username
            res.status(200).json({
                message: 'Login successful!',
                redirectUrl: 'https://laughing-cod-7j499g746jg3xwq4-3001.app.github.dev/'
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password.' });
        }
    });
});

app.post('/reset-password', (req, res) => {
    const { email } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length > 0) {
            // Here you would typically send a reset email, but we'll just respond
            res.status(200).json({ message: 'Password reset link sent!', redirect: '/login' });
        } else {
            res.status(404).json({ message: 'Email not found.' });
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;