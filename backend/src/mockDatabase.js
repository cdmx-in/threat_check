class MockDatabase {
    constructor() {
        this.scanLogs = [];
        this.signatureUpdates = [];
        this.idCounter = 1;
    }

    async connect() {
        try {
            console.log('Mock Database connected successfully');
        } catch (error) {
            console.error('Mock Database connection failed:', error);
            throw error;
        }
    }

    async logScanResult(scanData) {
        try {
            const logEntry = {
                id: this.idCounter++,
                filename: scanData.filename,
                file_size: scanData.fileSize,
                md5_hash: scanData.md5Hash,
                sha1_hash: scanData.sha1Hash,
                sha256_hash: scanData.sha256Hash,
                scan_result: scanData.scanResult,
                threats_found: scanData.threatsFound || [],
                client_ip: scanData.clientIp,
                user_agent: scanData.userAgent,
                scan_time: new Date().toISOString()
            };

            this.scanLogs.push(logEntry);
            console.log('Mock logged scan result:', logEntry);

            return {
                id: logEntry.id,
                scan_time: logEntry.scan_time
            };
        } catch (error) {
            console.error('Error in mock logging scan result:', error);
            throw error;
        }
    }

    async getScanHistory(limit = 100, offset = 0) {
        try {
            // Sort by scan_time descending and apply pagination
            const sorted = this.scanLogs.sort((a, b) =>
                new Date(b.scan_time) - new Date(a.scan_time)
            );

            const result = sorted.slice(offset, offset + limit);
            return result;
        } catch (error) {
            console.error('Error in mock fetching scan history:', error);
            throw error;
        }
    }

    async logSignatureUpdate(updateData) {
        try {
            const updateEntry = {
                id: this.signatureUpdates.length + 1,
                database_name: updateData.databaseName,
                version: updateData.version,
                signatures_count: updateData.signaturesCount,
                last_updated: new Date().toISOString(),
                update_status: updateData.updateStatus,
                update_details: updateData.updateDetails,
                file_size: updateData.fileSize
            };

            this.signatureUpdates.push(updateEntry);
            console.log('Mock logged signature update:', updateEntry);

            return {
                id: updateEntry.id,
                last_updated: updateEntry.last_updated
            };
        } catch (error) {
            console.error('Error in mock logging signature update:', error);
            throw error;
        }
    }

    async getSignatureHistory(limit = 50, offset = 0) {
        try {
            // Sort by last_updated descending and apply pagination
            const sorted = this.signatureUpdates.sort((a, b) =>
                new Date(b.last_updated) - new Date(a.last_updated)
            );

            const result = sorted.slice(offset, offset + limit);
            return result;
        } catch (error) {
            console.error('Error in mock fetching signature history:', error);
            throw error;
        }
    }

    async getLatestSignatureInfo() {
        try {
            // Get the latest update for each database
            const latestUpdates = {};

            for (const update of this.signatureUpdates) {
                const dbName = update.database_name;
                if (!latestUpdates[dbName] ||
                    new Date(update.last_updated) > new Date(latestUpdates[dbName].last_updated)) {
                    latestUpdates[dbName] = update;
                }
            }

            return Object.values(latestUpdates);
        } catch (error) {
            console.error('Error in mock fetching latest signature info:', error);
            throw error;
        }
    }

    async close() {
        console.log('Mock Database connection closed');
    }
}

module.exports = MockDatabase;
