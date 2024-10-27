// server.js
import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql2/promise'; // Use the promise version for async/await
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'il667744123987us',
    resave: false,
    saveUninitialized: true,
}));

// MySQL connection
const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Test DB connection
try {
    await db.connect();
    console.log('Connected to MySQL database.');
} catch (err) {
    console.error('Database connection failed:', err);
}

// User Registration Route
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
            [username, email, hashedPassword]);
        res.status(201).send({ message: 'User registered successfully!' });
    } catch (err) {
        return res.status(500).send({ error: 'User registration failed.' });
    }
});

// User Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [results] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

        if (results.length === 0) {
            return res.status(401).send({ message: 'Invalid username or password.' });
        }

        // Compare passwords
        const match = await bcrypt.compare(password, results[0].password);
        if (!match) {
            return res.status(401).send({ message: 'Invalid username or password.' });
        }

        res.send({ message: 'Login successful!', redirectUrl: '/dashboard' });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: 'Internal server error.' });
    }
});

// Password Reset Route
app.post('/reset-password', (req, res) => {
    const { email } = req.body;

    // Logic to send password reset link (implement email sending here)
    // For now, just return a success message
    res.send({ message: 'Password reset link sent!' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export the app for testing
export default app;