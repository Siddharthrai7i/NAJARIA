// utils/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET ;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

function generateToken(userId) {
    return jwt.sign(
        { userId }, 
        JWT_SECRET, 
        { expiresIn: JWT_EXPIRE }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

module.exports = { generateToken, verifyToken };
