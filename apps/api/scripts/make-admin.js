const mysql = require('mysql2/promise');
require('dotenv').config();

async function makeUserAdmin() {
    try {
        // Parse DATABASE_URL
        const url = new URL(process.env.DATABASE_URL);
        const connection = await mysql.createConnection({
            host: url.hostname,
            port: url.port || 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.slice(1)
        });

        console.log('🔗 Connected to database');

        // Update user with email test4@example.com to ADMIN role
        const [result] = await connection.execute(
            'UPDATE users SET role = ? WHERE email = ?',
            ['ADMIN', 'test4@example.com']
        );

        if (result.affectedRows > 0) {
            console.log('✅ User test4@example.com updated to ADMIN role');
        } else {
            console.log('❌ User test4@example.com not found');
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

makeUserAdmin();










