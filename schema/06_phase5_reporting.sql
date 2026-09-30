-- Phase 5: reporting. Additive and safe to re-run. Apply after 05_phase4_platform.sql.
-- Report exports are written to the audit log, so the action list gains EXPORT.
ALTER TABLE audit_log
    MODIFY action ENUM('CREATE','UPDATE','DELETE','LOGIN','LOGIN_FAILED','LOGOUT','PASSWORD_CHANGE','EXPORT') NOT NULL;

-- Helpful indexes for date-range analytics.
ALTER TABLE training_session ADD INDEX IF NOT EXISTS idx_session_date (session_date);
ALTER TABLE performance_record ADD INDEX IF NOT EXISTS idx_perf_date (record_date);
ALTER TABLE fixture ADD INDEX IF NOT EXISTS idx_fixture_status_date (status, match_date);
