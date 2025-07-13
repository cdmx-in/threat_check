# ThreatCheck API

A RESTful API for scanning files using ClamAV antivirus engine with PostgreSQL logging.

## Features

- **Single File Scan**: Upload and scan a single file
- **Multiple Files Scan**: Upload and scan multiple files in batch
- **Hash Calculation**: Automatically calculates MD5, SHA1, and SHA256 hashes
- **Database Logging**: Logs all scan results to PostgreSQL database
- **Docker Support**: Fully containerized with Docker Compose
- **Health Monitoring**: Health check endpoint for monitoring

## API Endpoints

### Health Check
```
GET /health
```
Returns the health status of the API and ClamAV service.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-02T10:30:00.000Z",
  "clamav": "ClamAV 1.0.0/..."
}
```

### Single File Scan
```
POST /api/scan/file
```
Upload and scan a single file.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (required)

**Response:**
```json
{
  "success": true,
  "scanId": 123,
  "filename": "document.pdf",
  "fileSize": 1024,
  "hashes": {
    "md5": "5d41402abc4b2a76b9719d911017c592",
    "sha1": "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",
    "sha256": "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae"
  },
  "scanResult": {
    "isClean": true,
    "isInfected": false,
    "threats": [],
    "scanTime": "2025-07-02T10:30:00.000Z"
  }
}
```

### Multiple Files Scan
```
POST /api/scan/files
```
Upload and scan multiple files (up to 10 files).

**Request:**
- Content-Type: `multipart/form-data`
- Field: `files[]` (required, array)

**Response:**
```json
{
  "success": true,
  "totalFiles": 3,
  "processedFiles": 3,
  "results": [
    {
      "scanId": 124,
      "filename": "file1.txt",
      "fileSize": 256,
      "hashes": { "md5": "...", "sha1": "...", "sha256": "..." },
      "scanResult": { "isClean": true, "isInfected": false, "threats": [], "scanTime": "..." }
    }
  ]
}
```

### Scan History
```
GET /api/scan/history?limit=50&offset=0
```
Retrieve scan history from the database.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "limit": 50,
  "offset": 0,
  "data": [
    {
      "id": 123,
      "filename": "document.pdf",
      "file_size": 1024,
      "md5_hash": "5d41402abc4b2a76b9719d911017c592",
      "sha1_hash": "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",
      "sha256_hash": "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
      "scan_result": "CLEAN",
      "threats_found": [],
      "scan_time": "2025-07-02T10:30:00.000Z",
      "client_ip": "192.168.1.100",
      "user_agent": "Mozilla/5.0..."
    }
  ]
}
```

### ClamAV Signature Management

#### Get Signature Information
```
GET /api/signatures/info
```
Get current ClamAV signature database information.

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-07-03T10:30:00.000Z",
  "current": {
    "version": "ClamAV 1.0.0/26000/Mon Jul  1 10:30:00 2024",
    "databases": [
      {
        "name": "main.cvd",
        "signatures": 6647427,
        "lastUpdate": "Mon Jul  1 10:30:00 2024"
      },
      {
        "name": "daily.cvd",
        "signatures": 2038936,
        "lastUpdate": "Mon Jul  1 10:30:00 2024"
      }
    ],
    "totalSignatures": 8686363
  },
  "updateHistory": []
}
```

#### Update Signatures
```
POST /api/signatures/update
```
Trigger an update of ClamAV signature databases.

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-07-03T10:30:00.000Z",
  "updateResult": {
    "updated": true,
    "databases": ["main.cvd", "daily.cvd", "bytecode.cvd"],
    "message": "Signature update completed successfully"
  },
  "before": { "totalSignatures": 8686363 },
  "after": { "totalSignatures": 8686500 },
  "message": "Signature update completed successfully"
}
```

#### Get Update History
```
GET /api/signatures/history?limit=50&offset=0
```
Retrieve signature update history from the database.

**Response:**
```json
{
  "success": true,
  "count": 1,
  "limit": 50,
  "offset": 0,
  "data": [
    {
      "id": 1,
      "database_name": "main.cvd",
      "version": "ClamAV 1.0.0/26000/Mon Jul  1 10:30:00 2024",
      "signatures_count": 6647427,
      "last_updated": "2025-07-03T10:30:00.000Z",
      "update_status": "SUCCESS",
      "update_details": "Signature update completed successfully"
    }
  ]
}
```

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd clamscan-api
```

2. Start the services:
```bash
docker-compose up -d
```

3. Wait for all services to be ready (ClamAV may take a few minutes to download virus definitions):
```bash
docker-compose logs -f
```

4. Test the API:
```bash
curl http://localhost:3000/health
```

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database and ClamAV

3. Configure environment variables in `.env` file

4. Start the application:
```bash
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | production |
| `PORT` | Server port | 3000 |
| `DB_HOST` | PostgreSQL host | postgres |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | threatcheck |
| `DB_USER` | Database user | threatcheck_user |
| `DB_PASSWORD` | Database password | threatcheck_password |
| `CLAM_HOST` | ClamAV daemon host | clamav |
| `CLAM_PORT` | ClamAV daemon port | 3310 |

## File Upload Limits

- Maximum file size: 100MB
- Maximum files per request: 10 (for multiple files endpoint)
- Supported formats: All file types are accepted

## Database Schema

The `scan_logs` table stores the following information:
- `id`: Unique identifier
- `filename`: Original filename
- `file_size`: File size in bytes
- `md5_hash`: MD5 hash of the file
- `sha1_hash`: SHA1 hash of the file
- `sha256_hash`: SHA256 hash of the file
- `scan_result`: CLEAN or INFECTED
- `threats_found`: Array of detected threats (if any)
- `scan_time`: Timestamp of the scan
- `client_ip`: IP address of the client
- `user_agent`: User agent string

## Security Features

- Helmet.js for security headers
- CORS enabled
- File size limits
- Temporary file cleanup
- Input validation
- Error handling

## Monitoring

- Health check endpoint at `/health`
- Request logging with Morgan
- Docker health checks
- Graceful shutdown handling

## Development

1. Install dependencies:
```bash
npm install
```

2. Start in development mode:
```bash
npm run dev
```

3. The API will be available at `http://localhost:3000`

## Testing

You can test the API using curl, Postman, or any HTTP client:

### Test single file scan:
```bash
curl -X POST -F "file=@/path/to/test-file.txt" http://localhost:3000/api/scan/file
```

### Test multiple files scan:
```bash
curl -X POST -F "files=@/path/to/file1.txt" -F "files=@/path/to/file2.txt" http://localhost:3000/api/scan/files
```

### Get scan history:
```bash
curl http://localhost:3000/api/scan/history
```

## Architecture

- **Express.js**: Web framework
- **ClamAV**: Antivirus scanning engine
- **PostgreSQL**: Database for logging
- **Multer**: File upload handling
- **Docker**: Containerization

## Error Handling

The API provides comprehensive error handling with appropriate HTTP status codes:
- `400`: Bad Request (missing file, validation errors)
- `500`: Internal Server Error (scanning failures, database errors)

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```
