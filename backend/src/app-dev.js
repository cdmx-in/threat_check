const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ path: '.env.local' });

// Use mock services for local development
const MockDatabase = require('./mockDatabase');
const MockScanService = require('./mockScanService');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const database = new MockDatabase();
const scanService = new MockScanService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Helper function to calculate file hashes
async function calculateFileHashes(filePath) {
  return new Promise((resolve, reject) => {
    const md5Hash = crypto.createHash('md5');
    const sha1Hash = crypto.createHash('sha1');
    const sha256Hash = crypto.createHash('sha256');

    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      md5Hash.update(data);
      sha1Hash.update(data);
      sha256Hash.update(data);
    });

    stream.on('end', () => {
      resolve({
        md5: md5Hash.digest('hex'),
        sha1: sha1Hash.digest('hex'),
        sha256: sha256Hash.digest('hex')
      });
    });

    stream.on('error', reject);
  });
}

// Helper function to clean up temporary files
function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const clamAvStatus = await scanService.getVersion();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      clamav: clamAvStatus,
      mode: 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      mode: 'development'
    });
  }
});

// API 1: Scan single file
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
    const filename = req.file.originalname;
    const fileSize = req.file.size;

    // Calculate file hashes
    const hashes = await calculateFileHashes(filePath);

    // Scan the file
    const scanResult = await scanService.scanFile(filePath);

    // Prepare scan data for logging
    const scanData = {
      filename: filename,
      fileSize: fileSize,
      md5Hash: hashes.md5,
      sha1Hash: hashes.sha1,
      sha256Hash: hashes.sha256,
      scanResult: scanResult.isInfected ? 'INFECTED' : 'CLEAN',
      threatsFound: scanResult.viruses || [],
      clientIp: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Log to database
    const logEntry = await database.logScanResult(scanData);

    // Clean up the temporary file
    cleanupFile(filePath);

    // Return response
    res.json({
      success: true,
      scanId: logEntry.id,
      filename: filename,
      fileSize: fileSize,
      hashes: {
        md5: hashes.md5,
        sha1: hashes.sha1,
        sha256: hashes.sha256
      },
      scanResult: {
        isClean: !scanResult.isInfected,
        isInfected: scanResult.isInfected,
        threats: scanResult.viruses,
        scanTime: logEntry.scan_time
      }
    });

  } catch (error) {
    console.error('Error scanning file:', error);

    // Clean up the temporary file in case of error
    if (filePath) {
      cleanupFile(filePath);
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error during file scan',
      message: error.message
    });
  }
});

// API 2: Scan multiple files
app.post('/api/scan/files', upload.array('files', 10), async (req, res) => {
  const uploadedFiles = req.files || [];
  const results = [];

  try {
    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    // Process each file
    for (const file of uploadedFiles) {
      let filePath = file.path;

      try {
        const filename = file.originalname;
        const fileSize = file.size;

        // Calculate file hashes
        const hashes = await calculateFileHashes(filePath);

        // Scan the file
        const scanResult = await scanService.scanFile(filePath);

        // Prepare scan data for logging
        const scanData = {
          filename: filename,
          fileSize: fileSize,
          md5Hash: hashes.md5,
          sha1Hash: hashes.sha1,
          sha256Hash: hashes.sha256,
          scanResult: scanResult.isInfected ? 'INFECTED' : 'CLEAN',
          threatsFound: scanResult.viruses || [],
          clientIp: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        };

        // Log to database
        const logEntry = await database.logScanResult(scanData);

        // Add to results
        results.push({
          scanId: logEntry.id,
          filename: filename,
          fileSize: fileSize,
          hashes: {
            md5: hashes.md5,
            sha1: hashes.sha1,
            sha256: hashes.sha256
          },
          scanResult: {
            isClean: !scanResult.isInfected,
            isInfected: scanResult.isInfected,
            threats: scanResult.viruses,
            scanTime: logEntry.scan_time
          }
        });

        // Clean up the temporary file
        cleanupFile(filePath);

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);

        // Clean up the temporary file
        cleanupFile(filePath);

        // Add error result
        results.push({
          filename: file.originalname,
          error: 'Failed to process file',
          message: fileError.message
        });
      }
    }

    res.json({
      success: true,
      totalFiles: uploadedFiles.length,
      processedFiles: results.length,
      results: results
    });

  } catch (error) {
    console.error('Error scanning files:', error);

    // Clean up all temporary files
    uploadedFiles.forEach(file => {
      cleanupFile(file.path);
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error during files scan',
      message: error.message,
      partialResults: results.length > 0 ? results : undefined
    });
  }
});

// Get scan history
app.get('/api/scan/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const history = await database.getScanHistory(limit, offset);

    res.json({
      success: true,
      count: history.length,
      limit: limit,
      offset: offset,
      data: history
    });
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan history',
      message: error.message
    });
  }
});

// API: Get ClamAV signature information
app.get('/api/signatures/info', async (req, res) => {
  try {
    const signatureInfo = await scanService.getSignatureInfo();
    const latestUpdates = await database.getLatestSignatureInfo();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      current: signatureInfo,
      updateHistory: latestUpdates
    });
  } catch (error) {
    console.error('Error fetching signature info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch signature information',
      message: error.message
    });
  }
});

// API: Update ClamAV signatures
app.post('/api/signatures/update', async (req, res) => {
  try {
    console.log('Starting signature update request...');

    // Get current signature info before update
    const beforeUpdate = await scanService.getSignatureInfo();

    // Perform the update
    const updateResult = await scanService.updateSignatures();

    // Get signature info after update
    const afterUpdate = await scanService.getSignatureInfo();

    // Log the update to database
    for (const db of afterUpdate.databases) {
      const updateData = {
        databaseName: db.name,
        version: afterUpdate.version,
        signaturesCount: db.signatures,
        updateStatus: updateResult.updated ? 'SUCCESS' : 'FAILED',
        updateDetails: updateResult.message || 'Signature update completed',
        fileSize: null // ClamAV doesn't provide file size info
      };

      await database.logSignatureUpdate(updateData);
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      updateResult: updateResult,
      before: beforeUpdate,
      after: afterUpdate,
      message: 'Signature update completed successfully'
    });
  } catch (error) {
    console.error('Error updating signatures:', error);

    // Log failed update to database
    try {
      const updateData = {
        databaseName: 'update_failed',
        version: 'unknown',
        signaturesCount: 0,
        updateStatus: 'FAILED',
        updateDetails: error.message,
        fileSize: null
      };

      await database.logSignatureUpdate(updateData);
    } catch (logError) {
      console.error('Error logging failed update:', logError);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update signatures',
      message: error.message
    });
  }
});

// API: Get signature update history
app.get('/api/signatures/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const history = await database.getSignatureHistory(limit, offset);

    res.json({
      success: true,
      count: history.length,
      limit: limit,
      offset: offset,
      data: history
    });
  } catch (error) {
    console.error('Error fetching signature history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch signature update history',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'File size exceeds 100MB limit'
      });
    }
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Connect to database
    await database.connect();

    // Initialize scan service
    await scanService.init();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 ThreatCheck API server running on port ${PORT} (Development Mode)`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📄 Single file scan: POST http://localhost:${PORT}/api/scan/file`);
      console.log(`📁 Multiple files scan: POST http://localhost:${PORT}/api/scan/files`);
      console.log(`📋 Scan history: GET http://localhost:${PORT}/api/scan/history`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await database.close();
  process.exit(0);
});

startServer();
