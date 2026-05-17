-- VIEW 1: Failed login attempts
CREATE VIEW vw_FailedLogins AS
SELECT 
    al.LogID, u.FullName, u.EmailAddress, al.LoginTimestamp, al.IPAddress, al.FailureReason
FROM AccessLog al
LEFT JOIN System_User u ON al.UserID = u.UserID
WHERE al.SuccessFlag = 'N'
ORDER BY al.LoginTimestamp DESC;

-- VIEW 2: Locked accounts
CREATE VIEW vw_LockedAccounts AS
SELECT UserID, FullName, EmailAddress, Role, FailedLoginAttempts, LastLoginTimestamp
FROM System_User
WHERE AccountLocked = 'Y';

-- VIEW 3: Active sessions
CREATE VIEW vw_ActiveSessions AS
SELECT us.SessionID, u.FullName, u.Role, us.IPAddress, us.CreatedAt, us.ExpiresAt, us.LastActivity
FROM UserSession us
INNER JOIN System_User u ON us.UserID = u.UserID
WHERE us.IsActive = 'Y' AND us.ExpiresAt > NOW()
ORDER BY us.LastActivity DESC;

-- VIEW 4: Security audit summary
CREATE VIEW vw_SecurityAuditSummary AS
SELECT EventType, COUNT(*) AS EventCount,
       SUM(CASE WHEN Status = 'Success' THEN 1 ELSE 0 END) AS SuccessCount,
       SUM(CASE WHEN Status = 'Failed' THEN 1 ELSE 0 END) AS FailedCount,
       DATE(Timestamp) AS EventDate
FROM SecurityAuditLog
GROUP BY EventType, DATE(Timestamp)
ORDER BY EventDate DESC, EventCount DESC;

-- VIEW 5: Oversight vote audit (RESTRICTED - only Oversight Officers)
CREATE VIEW vw_OversightVoteAudit AS
SELECT 
    cv.VoteID, cv.TimestampCasted, vtr.VoterUserID, u.FullName AS VoterName,
    cv.ElectionID, cv.CandidateUserID, cand.FullName AS VotedForCandidate
FROM CastVote cv
INNER JOIN VoterTokenRegistry vtr ON cv.VoterToken = vtr.VoterToken
INNER JOIN System_User u ON vtr.VoterUserID = u.UserID
INNER JOIN System_User cand ON cv.CandidateUserID = cand.UserID;