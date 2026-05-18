-- Step 1: Session management table
CREATE TABLE IF NOT EXISTS UserSession (
    SessionID           VARCHAR(255)    PRIMARY KEY,
    UserID              INT             NOT NULL,
    AccessToken         TEXT            NOT NULL,
    RefreshToken        TEXT            NOT NULL,
    IPAddress           VARCHAR(45)     NOT NULL,
    UserAgent           VARCHAR(255),
    CreatedAt           DATETIME        DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt           DATETIME        NOT NULL,
    LastActivity        DATETIME        DEFAULT CURRENT_TIMESTAMP,
    IsActive            CHAR(1)         DEFAULT 'Y',
    
    CONSTRAINT fk_session_user FOREIGN KEY (UserID) REFERENCES System_User(UserID) ON DELETE CASCADE,
    CONSTRAINT chk_session_active CHECK (IsActive IN ('Y', 'N')),
    
    INDEX idx_session_user (UserID),
    INDEX idx_session_expiry (ExpiresAt),
    INDEX idx_session_active (IsActive)
);

-- Step 2: Password reset table

CREATE TABLE IF NOT EXISTS PasswordReset (
    ResetID             INT             PRIMARY KEY AUTO_INCREMENT,
    UserID              INT             NOT NULL,
    ResetToken          VARCHAR(255)    NOT NULL UNIQUE,
    ExpiresAt           DATETIME        NOT NULL,
    Used                CHAR(1)         DEFAULT 'N',
    CreatedAt           DATETIME        DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_reset_user FOREIGN KEY (UserID) REFERENCES System_User(UserID) ON DELETE CASCADE,
    CONSTRAINT chk_reset_used CHECK (Used IN ('Y', 'N')),
    
    INDEX idx_reset_token (ResetToken),
    INDEX idx_reset_expiry (ExpiresAt)
);

-- Step 3: Security Audit log

CREATE TABLE IF NOT EXISTS SecurityAuditLog (
    AuditID             INT             PRIMARY KEY AUTO_INCREMENT,
    UserID              INT             NULL,
    EventType           VARCHAR(50)     NOT NULL,
    EventDetail         TEXT,
    IPAddress           VARCHAR(45),
    UserAgent           VARCHAR(255),
    Status              VARCHAR(20)     DEFAULT 'Success',
    Timestamp           DATETIME        DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_security_audit_user FOREIGN KEY (UserID) REFERENCES System_User(UserID) ON DELETE SET NULL,
    
    INDEX idx_audit_user (UserID),
    INDEX idx_audit_timestamp (Timestamp),
    INDEX idx_audit_event (EventType),
    INDEX idx_audit_status (Status)
);
