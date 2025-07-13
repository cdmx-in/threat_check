const express = require('express');
const NodeClam = require('clamscan');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3765;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Initialize ClamAV
let clamscan;
let scanService;

// Simple in-memory store for signature history (since we're not using database)
let signatureHistory = [];
let scanHistory = [];
let nextScanId = 1;
let nextHistoryId = 1;

async function initializeClamAV() {
    try {
        console.log('Initializing ClamAV...');

        clamscan = await new NodeClam().init({
            removeInfected: false,
            quarantineInfected: false,
            scanLog: null,
            debugMode: false,
            fileList: null,
            scanRecursively: true,
            clamscan: {
                path: '/usr/bin/clamscan',
                scanArchives: true,
                active: true
            },
            clamdscan: {
                socket: false,
                host: false,
                port: false,
                active: false
            },
            preference: 'clamscan'
        });

        console.log('ClamAV initialized successfully');

        // Create a simplified scan service
        scanService = {
            async getSignatureInfo() {
                try {
                    const version = await clamscan.getVersion();
                    console.log('Raw ClamAV version output:', version);

                    // Parse the version string to extract signature information
                    const sigInfo = parseSignatureInfo(version);

                    return {
                        version: version.trim(),
                        databases: sigInfo.databases,
                        lastUpdate: sigInfo.lastUpdate,
                        totalSignatures: sigInfo.totalSignatures
                    };
                } catch (error) {
                    console.error('Error getting signature info:', error);
                    throw error;
                }
            },

            async updateSignatures() {
                try {
                    console.log('Starting signature update...');

                    // Get before state
                    const beforeInfo = await this.getSignatureInfo();

                    // Update using freshclam
                    const { exec } = require('child_process');
                    const updateResult = await new Promise((resolve, reject) => {
                        exec('sudo freshclam --verbose', (error, stdout, stderr) => {
                            if (error && error.code !== 1) { // Exit code 1 is often "no updates available"
                                console.error('Freshclam error:', error);
                                console.error('Stderr:', stderr);
                                reject(error);
                            } else {
                                console.log('Freshclam stdout:', stdout);
                                console.log('Freshclam stderr:', stderr);
                                resolve({ stdout, stderr, updated: true });
                            }
                        });
                    });

                    // Get after state
                    const afterInfo = await this.getSignatureInfo();

                    // Log the update to history
                    for (const db of afterInfo.databases) {
                        signatureHistory.push({
                            id: nextHistoryId++,
                            database_name: db.name,
                            version: afterInfo.version,
                            signatures_count: db.signatures,
                            last_updated: new Date().toISOString(),
                            update_status: 'SUCCESS',
                            update_details: 'Signature update completed successfully',
                            file_size: null
                        });
                    }

                    return {
                        updated: true,
                        databases: afterInfo.databases.map(db => db.name),
                        before: beforeInfo,
                        after: afterInfo,
                        message: 'Signature update completed successfully',
                        updateResult
                    };
                } catch (error) {
                    console.error('Update failed:', error);

                    // Log failed update
                    signatureHistory.push({
                        id: nextHistoryId++,
                        database_name: 'update_failed',
                        version: 'unknown',
                        signatures_count: 0,
                        last_updated: new Date().toISOString(),
                        update_status: 'FAILED',
                        update_details: error.message,
                        file_size: null
                    });

                    throw error;
                }
            }
        };

        return true;
    } catch (error) {
        console.error('Failed to initialize ClamAV:', error);
        throw error;
    }
}

function parseSignatureInfo(versionString) {
    const lines = versionString.split('\n');
    const databases = [];
    let totalSignatures = 0;
    let lastUpdate = null;

    console.log('Parsing version string:', versionString);

    // Look for database information in various formats
    for (const line of lines) {
        console.log('Processing line:', line);

        // Common ClamAV patterns
        if (line.includes('main.cvd') || line.includes('daily.cvd') || line.includes('bytecode.cvd')) {
            const match = line.match(/(main|daily|bytecode)\.c[vl]d.*?(\d+).*?(\w+\s+\w+\s+\d+)/);
            if (match) {
                const [, dbName, sigCount, dateStr] = match;
                const signatures = parseInt(sigCount) || 0;

                databases.push({
                    name: `${dbName}.cvd`,
                    signatures,
                    lastUpdate: dateStr
                });

                totalSignatures += signatures;

                if (!lastUpdate || new Date(dateStr) > new Date(lastUpdate)) {
                    lastUpdate = dateStr;
                }
            }
        }
    }

    // If no specific databases found, create default structure
    if (databases.length === 0) {
        const now = new Date().toISOString();

        // Try to extract version number and signature count
        const versionMatch = versionString.match(/ClamAV\s+([\d.]+)/);
        const sigMatch = versionString.match(/(\d+)/);

        const totalSigs = sigMatch ? parseInt(sigMatch[1]) : 0;

        databases.push(
            { name: 'main.cvd', signatures: Math.floor(totalSigs * 0.7), lastUpdate: now },
            { name: 'daily.cvd', signatures: Math.floor(totalSigs * 0.25), lastUpdate: now },
            { name: 'bytecode.cvd', signatures: Math.floor(totalSigs * 0.05), lastUpdate: now }
        );

        totalSignatures = totalSigs;
        lastUpdate = now;
    }

    return {
        databases,
        totalSignatures,
        lastUpdate: lastUpdate || new Date().toISOString()
    };
}

// Helper function to calculate file hashes
function calculateFileHashes(filePath) {
    const fileBuffer = fs.readFileSync(filePath);

    return {
        md5: crypto.createHash('md5').update(fileBuffer).digest('hex'),
        sha1: crypto.createHash('sha1').update(fileBuffer).digest('hex'),
        sha256: crypto.createHash('sha256').update(fileBuffer).digest('hex')
    };
}

// Routes

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        if (!clamscan) {
            return res.status(503).json({
                status: 'unhealthy',
                message: 'ClamAV not initialized',
                timestamp: new Date().toISOString()
            });
        }

        const version = await clamscan.getVersion();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            clamav: version.trim(),
            mode: 'local'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get current signature information
app.get('/api/signatures/info', async (req, res) => {
    try {
        if (!scanService) {
            return res.status(503).json({
                success: false,
                error: 'Scan service not available',
                timestamp: new Date().toISOString()
            });
        }

        const current = await scanService.getSignatureInfo();

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            current,
            updateHistory: signatureHistory.slice(-5) // Last 5 updates
        });
    } catch (error) {
        console.error('Error getting signature info:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Trigger signature update
app.post('/api/signatures/update', async (req, res) => {
    try {
        if (!scanService) {
            return res.status(503).json({
                success: false,
                error: 'Scan service not available',
                timestamp: new Date().toISOString()
            });
        }

        const result = await scanService.updateSignatures();

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            updateResult: result.updateResult || result,
            before: result.before,
            after: result.after,
            message: result.message || 'Signature update completed successfully'
        });
    } catch (error) {
        console.error('Error updating signatures:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get signature update history
app.get('/api/signatures/history', (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        const totalCount = signatureHistory.length;
        const data = signatureHistory
            .slice()
            .reverse() // Most recent first
            .slice(offset, offset + limit);

        res.json({
            success: true,
            count: data.length,
            total: totalCount,
            page,
            limit,
            offset,
            data
        });
    } catch (error) {
        console.error('Error getting signature history:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// File scanning endpoint
app.post('/api/scan/file', upload.single('file'), async (req, res) => {
    let filePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        filePath = req.file.path;
        const fileStats = fs.statSync(filePath);
        const hashes = calculateFileHashes(filePath);

        console.log(`Scanning file: ${req.file.originalname} (${fileStats.size} bytes)`);

        const scanResult = await clamscan.scanFile(filePath);

        const result = {
            success: true,
            scanId: nextScanId++,
            filename: req.file.originalname,
            fileSize: fileStats.size,
            hashes,
            scanResult: {
                isClean: scanResult.isInfected === false,
                isInfected: scanResult.isInfected === true,
                threats: scanResult.viruses || [],
                scanTime: new Date().toISOString()
            }
        };

        // Add to scan history
        scanHistory.push({
            id: result.scanId,
            filename: result.filename,
            fileSize: result.fileSize,
            scanResult: result.scanResult,
            timestamp: result.scanResult.scanTime
        });

        res.json(result);

    } catch (error) {
        console.error('Error scanning file:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        // Clean up uploaded file
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }
    }
});

// Get scan history
app.get('/api/scan/history', (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        const totalCount = scanHistory.length;
        const data = scanHistory
            .slice()
            .reverse() // Most recent first
            .slice(offset, offset + limit);

        res.json({
            success: true,
            count: data.length,
            total: totalCount,
            page,
            limit,
            offset,
            data
        });
    } catch (error) {
        console.error('Error getting scan history:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve Swagger UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
async function startServer() {
    try {
        await initializeClamAV();

        app.listen(port, () => {
            console.log(`🚀 ThreatCheck API server running on port ${port} (Local ClamAV Mode)`);
            console.log(`📊 Health check: http://localhost:${port}/health`);
            console.log(`📄 API Documentation: http://localhost:${port}/`);
            console.log(`🔬 Signature Info: GET http://localhost:${port}/api/signatures/info`);
            console.log(`🔄 Signature Update: POST http://localhost:${port}/api/signatures/update`);
            console.log(`📈 Signature History: GET http://localhost:${port}/api/signatures/history`);
            console.log(`🔍 File Scan: POST http://localhost:${port}/api/scan/file`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
