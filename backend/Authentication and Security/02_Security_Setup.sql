
-- Step 1: Add security column to System_User

ALTER TABLE System_User 
ADD COLUMN Salt                VARCHAR(255)    DEFAULT NULL,
ADD COLUMN AccountLocked       CHAR(1)         DEFAULT 'N',
ADD COLUMN FailedLoginAttempts INT             DEFAULT 0,
ADD COLUMN LastLoginIP         VARCHAR(45)     DEFAULT NULL,
ADD COLUMN TwoFactorEnabled    CHAR(1)         DEFAULT 'N',
ADD COLUMN RefreshToken        VARCHAR(500)    DEFAULT NULL,
ADD COLUMN RefreshTokenExpiry  DATETIME        DEFAULT NULL;

ALTER TABLE System_User 
ADD CONSTRAINT chk_account_locked CHECK (AccountLocked IN ('Y', 'N')),
ADD CONSTRAINT chk_two_factor CHECK (TwoFactorEnabled IN ('Y', 'N'));

-- Step 2: Session management table

CREATE TABLE UserSession (
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

-- Step 3: Password reset table

CREATE TABLE PasswordReset (
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

-- Step 4: Security Audit log

CREATE TABLE SecurityAuditLog (
    AuditID             INT             PRIMARY KEY AUTO_INCREMENT,
    UserID              INT             NULL,
    EventType           VARCHAR(50)     NOT NULL,
    EventDetail         TEXT,
    IPAddress           VARCHAR(45),
    UserAgent           VARCHAR(255),
    Status              VARCHAR(20)     DEFAULT 'Success',
    Timestamp           DATETIME        DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_audit_user FOREIGN KEY (UserID) REFERENCES System_User(UserID) ON DELETE SET NULL,
    
    INDEX idx_audit_user (UserID),
    INDEX idx_audit_timestamp (Timestamp),
    INDEX idx_audit_event (EventType),
    INDEX idx_audit_status (Status)
);