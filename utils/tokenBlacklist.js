// utils/tokenBlacklist.js
const redis = require('redis');
const client = redis.createClient();

client.on('error', (err) => console.error('Redis Client Error', err));

// Connect to Redis
(async () => {
    await client.connect();
})();

// Add token to blacklist
async function blacklistToken(token, expiresIn) {
    try {
        // Store token with expiration time
        await client.setEx(
            `blacklist:${token}`, 
            expiresIn, // seconds
            'true'
        );
        return true;
    } catch (error) {
        console.error('Error blacklisting token:', error);
        return false;
    }
}

async function isTokenBlacklisted(token) {
    try {
        const result = await client.get(`blacklist:${token}`);
        return result !== null;
    } catch (error) {
        console.error('Error checking blacklist:', error);
        return false;
    }
}
module.exports = { blacklistToken, isTokenBlacklisted };