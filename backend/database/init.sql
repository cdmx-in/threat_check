-- Create scan_logs table
CREATE TABLE IF NOT EXISTS scan_logs (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    md5_hash VARCHAR(32) NOT NULL,
    sha1_hash VARCHAR(40) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    scan_result VARCHAR(50) NOT NULL,
    threats_found JSONB DEFAULT '[]'::jsonb,
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_ip VARCHAR(45),
    user_agent TEXT
);

-- Create signature_updates table
CREATE TABLE IF NOT EXISTS signature_updates (
    id SERIAL PRIMARY KEY,
    database_name VARCHAR(255) NOT NULL,
    version VARCHAR(100),
    signatures_count INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_status VARCHAR(50) DEFAULT 'SUCCESS',
    update_details TEXT,
    file_size BIGINT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_logs_md5 ON scan_logs(md5_hash);
CREATE INDEX IF NOT EXISTS idx_scan_logs_sha1 ON scan_logs(sha1_hash);
CREATE INDEX IF NOT EXISTS idx_scan_logs_sha256 ON scan_logs(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scan_time ON scan_logs(scan_time);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scan_result ON scan_logs(scan_result);

-- Create indexes for signature_updates table
CREATE INDEX IF NOT EXISTS idx_signature_updates_database_name ON signature_updates(database_name);
CREATE INDEX IF NOT EXISTS idx_signature_updates_last_updated ON signature_updates(last_updated);
CREATE INDEX IF NOT EXISTS idx_signature_updates_status ON signature_updates(update_status);
