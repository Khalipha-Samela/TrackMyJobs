-- Use the database
USE trackmyjobs;

-- Insert demo user (password: changeme123)
INSERT INTO users (email, password_hash, display_name) 
VALUES ('demo@trackmyjobs.com', '$2b$10$6QzQu1gh87jj.wgJ/VxPBOECJCEo6NV7DAywXe3TEP4lRsgIPLRXW', 'Demo User')
ON DUPLICATE KEY UPDATE email = email;

-- Insert sample applications
INSERT INTO applications (user_id, company_name, job_title, job_link, application_date, status, notes) 
SELECT 
    (SELECT id FROM users WHERE email = 'demo@trackmyjobs.com'),
    'Google',
    'Frontend Developer',
    'https://careers.google.com/jobs/123',
    CURDATE() - INTERVAL 5 DAY,
    'Interview',
    'Had initial phone screen. Technical interview scheduled for next week.'
UNION ALL
SELECT 
    (SELECT id FROM users WHERE email = 'demo@trackmyjobs.com'),
    'Microsoft',
    'React Developer',
    'https://careers.microsoft.com/jobs/456',
    CURDATE() - INTERVAL 10 DAY,
    'Applied',
    'Application submitted. Waiting for response.'
UNION ALL
SELECT 
    (SELECT id FROM users WHERE email = 'demo@trackmyjobs.com'),
    'Amazon',
    'Frontend Engineer',
    'https://amazon.jobs/789',
    CURDATE() - INTERVAL 15 DAY,
    'Rejected',
    'Got rejection after technical assessment.'
UNION ALL
SELECT 
    (SELECT id FROM users WHERE email = 'demo@trackmyjobs.com'),
    'Apple',
    'UI Developer',
    'https://apple.com/jobs/321',
    CURDATE() - INTERVAL 20 DAY,
    'Offer',
    'Received offer! Negotiating salary.'
UNION ALL
SELECT 
    (SELECT id FROM users WHERE email = 'demo@trackmyjobs.com'),
    'Netflix',
    'Senior React Developer',
    'https://netflix.com/jobs/654',
    CURDATE() - INTERVAL 25 DAY,
    'Interview',
    'Second round interview completed. Waiting for feedback.'
UNION ALL
SELECT 
    (SELECT id FROM users WHERE email = 'demo@trackmyjobs.com'),
    'Meta',
    'Software Engineer',
    'https://meta.com/jobs/987',
    CURDATE() - INTERVAL 30 DAY,
    'Applied',
    'Application submitted through referral.';

-- Verify the data was inserted
SELECT 
    COUNT(*) as 'Total Applications',
    SUM(CASE WHEN status = 'Applied' THEN 1 ELSE 0 END) as 'Applied',
    SUM(CASE WHEN status = 'Interview' THEN 1 ELSE 0 END) as 'Interview',
    SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as 'Rejected',
    SUM(CASE WHEN status = 'Offer' THEN 1 ELSE 0 END) as 'Offer'
FROM applications;