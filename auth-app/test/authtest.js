// test/authtest.js
import request from 'supertest'; // Import supertest using ES module syntax
import app from '../server.js'; // Ensure the path is correct and use ES module syntax
import mysql from 'mysql2'; // Import mysql2 if needed (though you may not need it here)
import { expect } from 'chai'; // Import expect from chai

// Clear the test database before each test
beforeEach(async () => {
    const db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    // Clear the users table
    await new Promise((resolve, reject) => {
        db.query('DELETE FROM users', (err) => {
            if (err) return reject(err);
            resolve();
        });
    });

    db.end(); // Close the database connection
});

// Test Registration
describe('POST /register', () => {
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

        expect(res.status).to.equal(201);
        expect(res.body.message).to.equal('User registered successfully!');
    });

    it('should return an error for duplicate registration', async () => {
        await request(app)
            .post('/register')
            .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

        const res = await request(app)
            .post('/register')
            .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

        expect(res.status).to.equal(500);
        expect(res.body.error).to.exist;
    });
});

// Test Login
describe('POST /login', () => {
    it('should log in an existing user', async () => {
        // First, register a user to log in
        await new Promise((resolve, reject) => {
            const db = mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
            });

            db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
                ['testuser', 'test@example.com', 'password123'], 
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );

            db.end(); // Close the database connection
        });

        const res = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal('Login successful!');
        expect(res.body.redirectUrl).to.exist;
    });

    it('should return an error for invalid login', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: 'nonexistent', password: 'wrongpassword' });

        expect(res.status).to.equal(401);
        expect(res.body.message).to.equal('Invalid username or password.');
    });
});

// Test Password Reset
// describe('POST /reset-password', () => {
//     it('should send a password reset link for existing email', async () => {
//         // Register a user to test password reset
//         await new Promise((resolve, reject) => {
//             const db = mysql.createConnection({
//                 host: process.env.DB_HOST,
//                 user: process.env.DB_USER,
//                 password: process.env.DB_PASSWORD,
//                 database: process.env.DB_NAME,
//             });

//             db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
//                 ['testuser', 'test@example.com', 'password123'], 
//                 (err) => {
//                     if (err) return reject(err);
//                     resolve();
//                 }
//             );

//             db.end(); // Close the database connection
//         });

//         const res = await request(app)
//             .post('/reset-password')
//             .send({ email: 'test@example.com' });

//         expect(res.status).to.equal(200);
//         expect(res.body.message).to.equal('Password reset link sent!');
//     });

//     it('should return an error for non-existent email', async () => {
//         const res = await request(app)
//             .post('/reset-password')
//             .send({ email: 'nonexistent@example.com' });

//         expect(res.status).to.equal(404);
//         expect(res.body.message).to.equal('Email not found.');
//     });
// });