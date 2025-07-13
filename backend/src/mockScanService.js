class MockScanService {
    constructor() {
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('Mock ClamAV scan service initialized successfully');
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize Mock ClamAV scan service:', error);
            throw error;
        }
    }

    async scanFile(filePath) {
        if (!this.isInitialized) {
            throw new Error('Scan service not initialized');
        }

        try {
            console.log(`Mock scanning file: ${filePath}`);

            // Check if file contains EICAR test signature or has 'eicar' in filename
            const fs = require('fs');
            let isInfected = false;
            let viruses = [];

            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const fileName = filePath.toLowerCase();

                if (fileContent.includes('EICAR') || fileName.includes('eicar') || fileName.includes('infected')) {
                    isInfected = true;
                    viruses = ['Win.Test.EICAR_HDB-1', 'Trojan.MockTest'];
                }
            } catch (readError) {
                // If can't read file, treat as clean
                console.log('Could not read file for EICAR check, treating as clean');
            }

            const result = {
                file: filePath,
                isInfected: isInfected,
                viruses: viruses
            };

            // Simulate scan delay
            await new Promise(resolve => setTimeout(resolve, 100));

            console.log('Mock scan result:', result);

            return result;

        } catch (error) {
            console.error('Error in mock scanning file:', error);
            throw new Error(`Failed to scan file: ${error.message}`);
        }
    }

    async scanFiles(filePaths) {
        if (!this.isInitialized) {
            throw new Error('Scan service not initialized');
        }

        try {
            console.log(`Mock scanning ${filePaths.length} files`);

            const results = [];

            for (const filePath of filePaths) {
                const result = await this.scanFile(filePath);
                results.push(result);
            }

            return results;

        } catch (error) {
            console.error('Error in mock scanning files:', error);
            throw new Error(`Failed to scan files: ${error.message}`);
        }
    }

    async getVersion() {
        if (!this.isInitialized) {
            throw new Error('Scan service not initialized');
        }

        return "Mock ClamAV 1.0.0/test-version";
    }

    async updateSignatures() {
        if (!this.isInitialized) {
            throw new Error('Scan service not initialized');
        }

        console.log('Mock: Starting signature database update...');

        // Simulate update process
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockResult = {
            updated: true,
            databases: ['main.cvd', 'daily.cvd', 'bytecode.cvd'],
            message: 'Mock signature update completed successfully'
        };

        console.log('Mock signature update result:', mockResult);
        return mockResult;
    }

    async getSignatureInfo() {
        if (!this.isInitialized) {
            throw new Error('Scan service not initialized');
        }

        return {
            version: "Mock ClamAV 1.0.0/26000/Mon Jul  1 10:30:00 2024",
            databases: [
                {
                    name: "main.cvd",
                    signatures: 6647427,
                    lastUpdate: "Mon Jul  1 10:30:00 2024"
                },
                {
                    name: "daily.cvd",
                    signatures: 2038936,
                    lastUpdate: "Mon Jul  1 10:30:00 2024"
                },
                {
                    name: "bytecode.cvd",
                    signatures: 333,
                    lastUpdate: "Mon Jul  1 10:30:00 2024"
                }
            ],
            lastUpdate: "Mon Jul  1 10:30:00 2024",
            totalSignatures: 8686696
        };
    }

    async isAvailable() {
        return this.isInitialized;
    }
}

module.exports = MockScanService;
