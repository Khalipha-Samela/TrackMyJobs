-- Sample data for TrackMyJobs (PostgreSQL version)

-- Insert demo user (password: changeme123)
INSERT INTO users (email, password_hash, display_name) 
VALUES ('demo@trackmyjobs.com', '$2b$10$6QzQu1gh87jj.wgJ/VxPBOECJCEo6NV7DAywXe3TEP4lRsgIPLRXW', 'Demo User')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name;

-- Get the user ID for demo user
DO $$
DECLARE
    demo_user_id INTEGER;
BEGIN
    -- Get the demo user ID
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@trackmyjobs.com';
    
    -- Insert sample applications
    INSERT INTO applications (user_id, company_name, job_title, job_link, application_date, status, notes) VALUES
    (demo_user_id, 'Google', 'Frontend Developer', 'https://careers.google.com/jobs/123', 
     CURRENT_DATE - INTERVAL '5 days', 'Interview', 
     'Had initial phone screen. Technical interview scheduled for next week.'),
    
    (demo_user_id, 'Microsoft', 'React Developer', 'https://careers.microsoft.com/jobs/456', 
     CURRENT_DATE - INTERVAL '10 days', 'Applied', 
     'Application submitted. Waiting for response.'),
    
    (demo_user_id, 'Amazon', 'Frontend Engineer', 'https://amazon.jobs/789', 
     CURRENT_DATE - INTERVAL '15 days', 'Rejected', 
     'Got rejection after technical assessment.'),
    
    (demo_user_id, 'Apple', 'UI Developer', 'https://apple.com/jobs/321', 
     CURRENT_DATE - INTERVAL '20 days', 'Offer', 
     'Received offer! Negotiating salary.'),
    
    (demo_user_id, 'Netflix', 'Senior React Developer', 'https://netflix.com/jobs/654', 
     CURRENT_DATE - INTERVAL '25 days', 'Interview', 
     'Second round interview completed. Waiting for feedback.'),
    
    (demo_user_id, 'Meta', 'Software Engineer', 'https://meta.com/jobs/987', 
     CURRENT_DATE - INTERVAL '30 days', 'Applied', 
     'Application submitted through referral.');
    
    -- Show verification
    RAISE NOTICE 'Sample data inserted successfully!';
END $$;

-- Verify the data was inserted
SELECT 
    COUNT(*) as total_applications,
    SUM(CASE WHEN status = 'Applied' THEN 1 ELSE 0 END) as applied,
    SUM(CASE WHEN status = 'Interview' THEN 1 ELSE 0 END) as interview,
    SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
    SUM(CASE WHEN status = 'Offer' THEN 1 ELSE 0 END) as offer
FROM applications;