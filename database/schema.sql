-- Create database
CREATE DATABASE IF NOT EXISTS trackmyjobs;
USE trackmyjobs;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    job_link VARCHAR(500),
    application_date DATE NOT NULL,
    status ENUM('Applied', 'Interview', 'Rejected', 'Offer') DEFAULT 'Applied',
    notes TEXT,
    cv_filename VARCHAR(255),
    cv_original_name VARCHAR(255),
    cv_mime_type VARCHAR(100),
    cv_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_application_date (application_date),
    INDEX idx_status (status)
);
