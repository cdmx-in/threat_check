const { Pool } = require('pg');

class Database {
    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'threatcheck',
            user: process.env.DB_USER || 'threatcheck_user',
            password: process.env.DB_PASSWORD || 'threatcheck_password',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }

    async connect() {
        try {
            await this.pool.connect();
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }

    async logScanResult(scanData) {
        const query = `
            INSERT INTO scan_logs
            (filename, file_size, md5_hash, sha1_hash, sha256_hash, scan_result, threats_found, client_ip, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, scan_time
        `;

        const values = [
            scanData.filename,
            scanData.fileSize,
            scanData.md5Hash,
            scanData.sha1Hash,
            scanData.sha256Hash,
            scanData.scanResult,
            JSON.stringify(scanData.threatsFound || []),
            scanData.clientIp,
            scanData.userAgent
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error logging scan result:', error);
            throw error;
        }
    }

    async getScanHistory(limit = 100, offset = 0) {
        const query = `
            SELECT * FROM scan_logs
            ORDER BY scan_time DESC
            LIMIT $1 OFFSET $2
        `;

        try {
            const result = await this.pool.query(query, [limit, offset]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching scan history:', error);
            throw error;
        }
    }

    async logSignatureUpdate(updateData) {
        const query = `
            INSERT INTO signature_updates
            (database_name, version, signatures_count, update_status, update_details, file_size)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, last_updated
        `;

        const values = [
            updateData.databaseName,
            updateData.version,
            updateData.signaturesCount,
            updateData.updateStatus,
            updateData.updateDetails,
            updateData.fileSize
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error logging signature update:', error);
            throw error;
        }
    }

    async getSignatureHistory(limit = 50, offset = 0) {
        const query = `
            SELECT * FROM signature_updates
            ORDER BY last_updated DESC
            LIMIT $1 OFFSET $2
        `;

        try {
            const result = await this.pool.query(query, [limit, offset]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching signature history:', error);
            throw error;
        }
    }

    async getLatestSignatureInfo() {
        const query = `
            SELECT database_name, version, signatures_count, last_updated, update_status
            FROM signature_updates
            WHERE last_updated = (
                SELECT MAX(last_updated)
                FROM signature_updates
                WHERE database_name = signature_updates.database_name
            )
            ORDER BY database_name
        `;

        try {
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching latest signature info:', error);
            throw error;
        }
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = Database;
