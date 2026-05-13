CREATE TABLE System_User (
    UserID          NUMBER(10)     PRIMARY KEY,
    FullName        VARCHAR2(100)  NOT NULL,
    HashedPassword  VARCHAR2(255)  NOT NULL,
    EmailAddress    VARCHAR2(100)  NOT NULL UNIQUE,
    Role            VARCHAR2(50)   NOT NULL,
    Eligibility     VARCHAR2(20)   DEFAULT 'Pending',
    VotedFlag       CHAR(1)        DEFAULT 'N',
    ProfileInfo     VARCHAR2(200),
    CreatedDate     DATE           DEFAULT SYSDATE,
    LastLoginTimestamp TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (Role IN ('Voter', 'Candidate', 'Administrator', 'ElectionOfficial', 'OversightOfficer')),
    CONSTRAINT chk_user_eligibility CHECK (Eligibility IN ('Pending', 'Approved', 'Rejected')),
    CONSTRAINT chk_user_votedflag CHECK (VotedFlag IN ('Y', 'N'))
);

CREATE TABLE Election (
    ElectionID      NUMBER(10)     PRIMARY KEY,
    ElectionName    VARCHAR2(100)  NOT NULL,
    StartDateTime   TIMESTAMP      NOT NULL,
    EndDateTime     TIMESTAMP      NOT NULL,
    Status          VARCHAR2(50)   DEFAULT 'Upcoming',
    Rules           VARCHAR2(1000),
    CONSTRAINT chk_election_status CHECK (Status IN ('Upcoming', 'Active', 'Closed', 'Archived')),
    CONSTRAINT chk_election_dates CHECK (StartDateTime < EndDateTime)
);

CREATE TABLE Positions (
    PositionID      NUMBER(10)     PRIMARY KEY,
    ElectionID      NUMBER(10)     NOT NULL,
    PositionName    VARCHAR2(100)  NOT NULL,
    Description     VARCHAR2(500),
    OrderOnBallot   NUMBER(3)      DEFAULT 0,
    CONSTRAINT fk_positions_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID) ON DELETE CASCADE
);

CREATE TABLE BallotStructure (
    BallotID        NUMBER(10)     PRIMARY KEY,
    ElectionID      NUMBER(10)     NOT NULL,
    BallotName      VARCHAR2(100)  NOT NULL,
    IsActive        CHAR(1)        DEFAULT 'Y',
    CONSTRAINT fk_ballotstructure_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID) ON DELETE CASCADE,
    CONSTRAINT chk_ballotstructure_active CHECK (IsActive IN ('Y', 'N'))
);

CREATE TABLE BallotItem (
    BallotItemID    NUMBER(10)     PRIMARY KEY,
    BallotID        NUMBER(10)     NOT NULL,
    PositionID      NUMBER(10)     NOT NULL,
    DisplayOrder    NUMBER(3)      DEFAULT 0,
    CONSTRAINT fk_ballotitem_ballot FOREIGN KEY (BallotID) REFERENCES BallotStructure(BallotID) ON DELETE CASCADE,
    CONSTRAINT fk_ballotitem_position FOREIGN KEY (PositionID) REFERENCES Positions(PositionID)
);

CREATE TABLE CandidateNomination (
    NominationID    NUMBER(10)     PRIMARY KEY,
    ElectionID      NUMBER(10)     NOT NULL,
    CandidateUserID NUMBER(10)     NOT NULL,
    PositionID      NUMBER(10)     NOT NULL,
    ApprovalStatus  VARCHAR2(20)   DEFAULT 'Pending',
    ApprovedBy      VARCHAR2(100),
    NominationDate  DATE           DEFAULT SYSDATE,
    CONSTRAINT fk_nomination_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID),
    CONSTRAINT fk_nomination_candidate FOREIGN KEY (CandidateUserID) REFERENCES System_User(UserID),
    CONSTRAINT fk_nomination_position FOREIGN KEY (PositionID) REFERENCES Positions(PositionID),
    CONSTRAINT uc_nomination_candidate_position UNIQUE (CandidateUserID, PositionID, ElectionID),
    CONSTRAINT chk_nomination_status CHECK (ApprovalStatus IN ('Pending', 'Approved', 'Rejected'))
);

CREATE TABLE CastVote (
    VoteID              NUMBER(10)     PRIMARY KEY,
    ElectionID          NUMBER(10)     NOT NULL,
    BallotItemID        NUMBER(10)     NOT NULL,
    CandidateUserID     NUMBER(10)     NOT NULL,
    EncryptedVoteData   VARCHAR2(500),
    TimestampCasted     TIMESTAMP      DEFAULT SYSTIMESTAMP,
    CONSTRAINT fk_castvote_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID),
    CONSTRAINT fk_castvote_ballotitem FOREIGN KEY (BallotItemID) REFERENCES BallotItem(BallotItemID),
    CONSTRAINT fk_castvote_candidate FOREIGN KEY (CandidateUserID) REFERENCES System_User(UserID),
    CONSTRAINT uc_vote_per_election UNIQUE (ElectionID, BallotItemID, CandidateUserID, VoteID)
);

CREATE TABLE Results (
    ResultID        NUMBER(10)     PRIMARY KEY,
    ElectionID      NUMBER(10)     NOT NULL,
    BallotItemID    NUMBER(10)     NOT NULL,
    CandidateUserID NUMBER(10)     NOT NULL,
    TotalVotes      NUMBER(10)     DEFAULT 0,
    PercentageWon   NUMBER(5,2)    DEFAULT 0,
    MarginOfVictory NUMBER(10)     DEFAULT 0,
    IsWinner        CHAR(1)        DEFAULT 'N',
    CONSTRAINT fk_results_election FOREIGN KEY (ElectionID) REFERENCES Election(ElectionID),
    CONSTRAINT fk_results_ballotitem FOREIGN KEY (BallotItemID) REFERENCES BallotItem(BallotItemID),
    CONSTRAINT fk_results_candidate FOREIGN KEY (CandidateUserID) REFERENCES System_User(UserID),
    CONSTRAINT uc_results_per_candidate UNIQUE (ElectionID, BallotItemID, CandidateUserID),
    CONSTRAINT chk_results_winner CHECK (IsWinner IN ('Y', 'N')),
    CONSTRAINT chk_results_percentage CHECK (PercentageWon BETWEEN 0 AND 100),
    CONSTRAINT chk_results_votes CHECK (TotalVotes >= 0)
);

CREATE TABLE OversightReview (
    ReviewID            NUMBER(10)     PRIMARY KEY,
    OfficerUserID       NUMBER(10)     NOT NULL,
    NominationID        NUMBER(10),
    ReviewStartTime     TIMESTAMP      DEFAULT SYSTIMESTAMP,
    ReviewEndTime       TIMESTAMP,
    AuditIDStart        NUMBER(10),
    AuditIDEnd          NUMBER(10),
    Findings            VARCHAR2(2000),
    CertificationStatus VARCHAR2(20)   DEFAULT 'Pending',
    CONSTRAINT fk_review_officer FOREIGN KEY (OfficerUserID) REFERENCES System_User(UserID),
    CONSTRAINT fk_review_nomination FOREIGN KEY (NominationID) REFERENCES CandidateNomination(NominationID),
    CONSTRAINT chk_review_status CHECK (CertificationStatus IN ('Pending', 'Certified', 'Rejected', 'NeedsRevision'))
);

CREATE TABLE AccessLog (
    LogID           NUMBER(10)     PRIMARY KEY,
    UserID          NUMBER(10)     NOT NULL,
    LoginTimestamp  TIMESTAMP      DEFAULT SYSTIMESTAMP,
    IPAddress       VARCHAR2(45)   NOT NULL,
    SuccessFlag     CHAR(1)        DEFAULT 'N',
    FailureReason   VARCHAR2(255),
    CONSTRAINT fk_accesslog_user FOREIGN KEY (UserID) REFERENCES System_User(UserID),
    CONSTRAINT chk_accesslog_success CHECK (SuccessFlag IN ('Y', 'N'))
);

CREATE TABLE SystemAuditLog (
    AuditID         NUMBER(10)     PRIMARY KEY,
    UserID          NUMBER(10)     NOT NULL,
    ActionType      VARCHAR2(100)  NOT NULL,
    TargetEntity    VARCHAR2(100)  NOT NULL,
    TargetID        VARCHAR2(50),
    Timestamp       TIMESTAMP      DEFAULT SYSTIMESTAMP,
    IPAddress       VARCHAR2(45),
    Description     VARCHAR2(500),
    CONSTRAINT fk_audit_user FOREIGN KEY (UserID) REFERENCES System_User(UserID)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- System_User indexes
CREATE INDEX idx_user__role
 ON System_User(Role);

 CREATE INDEX idx_user__eligibility
 ON System_User(Eligibility);

 CREATE INDEX idx_user__votedflag
 ON System_User(VotedFlag);

-- Election indexes
 CREATE INDEX idx_election__status
 ON Election(Status);

 CREATE INDEX idx_election_dates
 ON Election(StartDateTime, EndDateTime);

 -- Positions indexes
CREATE INDEX idx_positions__election
 ON Positions(ElectionID);

CREATE INDEX idx_positions__order
 ON Positions(OrderOnBallot);

-- BallotStructure indexes
CREATE INDEX idx_ballotstructure__election
 ON BallotStructure(ElectionID);

CREATE INDEX idx_ballotstructure__ballotitem
 ON BallotStructure(BallotItemID);

 CREATE INDEX idx_ballotstructure__active
 ON BallotStructure(IsActive);

 CREATE INDEX idx_ballotitem__ballot
 ON BallotItem(BallotID);

CREATE INDEX idx_ballotitem__position
 ON BallotItem(PositionID);

-- CandidateNomination indexes
CREATE INDEX idx_nomination__election      
 ON CandidateNomination(ElectionID);

CREATE INDEX idx_nomination__candidate
 ON CandidateNomination(CandidateUserID);

CREATE INDEX idx_nomination__position
 ON CandidateNomination(PositionID);        

CREATE INDEX idx_nomination__status
 ON CandidateNomination(ApprovalStatus);        

 CREATE INDEX idx_nomination__approval
 ON CandidateNomination(ApprovalStatus);        

 CREATE INDEX idx_nomination_date
 ON CandidateNomination(NominationDate);

-- CastVote indexes
CREATE INDEX idx_castvote__election
 ON CastVote(ElectionID);

CREATE INDEX idx_castvote__ballotitem
 ON CastVote(BallotItemID);

 CREATE INDEX idx_castvote__candidate
 ON CastVote(CandidateUserID);

 CREATE INDEX idx_castvote__timestamp
 ON CastVote(TimestampCasted);

-- Results indexes
CREATE INDEX idx_results__election
 ON Results(ElectionID);

 CREATE INDEX idx_results__candidate
 ON Results(CandidateUserID);

CREATE INDEX idx_results__winner
 ON Results(IsWinner);

 CREATE INDEX idx_results_election_winner
 ON Results(ElectionID, IsWinner);

-- OversightReview indexes
CREATE INDEX idx_oversitereview__officer
 ON OversightReview(OfficerUserID);

CREATE INDEX idx_oversitereview__nomination
 ON OversightReview(NominationID);

CREATE INDEX idx_oversitereview__status
 ON OversightReview(CertificationStatus);

 CREATE INDEX idx_oversitereview__times
 ON OversightReview(ReviewStartTime, ReviewEndTime);

-- AccessLog indexes
CREATE INDEX idx_accesslog__user
 ON AccessLog(UserID);

CREATE INDEX idx_accesslog__timestamp
 ON AccessLog(LoginTimestamp);

CREATE INDEX idx_accesslog__success
 ON AccessLog(SuccessFlag);

 CREATE INDEX idx_accesslog__ip
 ON AccessLog(IPAddress);

-- SystemAuditLog indexes
CREATE INDEX idx_auditlog__user
 ON SystemAuditLog(UserID);

CREATE INDEX idx_auditlog__timestamp
 ON SystemAuditLog(Timestamp);

 CREATE INDEX idx_auditlog__action
 ON SystemAuditLog(ActionType);

 CREATE INDEX idx_auditlog__Target
 ON SystemAuditLog(TargetEntity, TargetID);

-- ============================================================
-- Views
-- ============================================================ 

-- 1. Active elections currently running
CREATE VIEW vw_ActiveElections AS
SELECT
    ElectionID,
    ElectionName,
    StartDateTime,
    EndDateTime,
    Status,
    Rules
FROM Election
WHERE Status = 'Active';
GO

-- 2. All approved candidates with their position and election
CREATE VIEW vw_ApprovedCandidates AS
SELECT
    cn.NominationID,
    cn.ElectionID,
    e.ElectionName,
    u.UserID AS CandidateUserID,
    u.FullName AS CandidateName,
    u.EmailAddress,
    p.PositionName,
    cn.NominationDate,
    cn.ApprovedBy
FROM CandidateNomination AS cn
INNER JOIN System_User AS u
    ON cn.CandidateUserID = u.UserID
INNER JOIN Election AS e
    ON cn.ElectionID = e.ElectionID
INNER JOIN Positions AS p
    ON cn.PositionID = p.PositionID
WHERE cn.ApprovalStatus = 'Approved';
GO

-- 3. Election results with winner flag and candidate details
CREATE VIEW vw_ElectionResults AS
SELECT
    r.ResultID,
    e.ElectionName,
    u.FullName AS CandidateName,
    p.PositionName,
    r.TotalVotes,
    r.PercentageWon,
    r.MarginOfVictory,
    r.IsWinner
FROM Results AS r
INNER JOIN System_User AS u
    ON r.CandidateUserID = u.UserID
INNER JOIN BallotItem AS bi
    ON r.BallotItemID = bi.BallotItemID
INNER JOIN Election AS e
    ON bi.ElectionID = e.ElectionID
INNER JOIN Positions AS p
    ON bi.PositionID = p.PositionID;
GO

-- 4. Voter turnout per election
CREATE VIEW vw_VoterTurnout AS
SELECT
    e.ElectionID,
    e.ElectionName,
    e.Status,
    COUNT(DISTINCT cv.VoteID)                            AS TotalVotesCast,
    (SELECT COUNT(*) FROM System_User
     WHERE Eligibility = 'Approved' AND Role = 'Voter') AS TotalEligibleVoters
FROM Election AS e
LEFT JOIN CastVote AS cv ON e.ElectionID = cv.ElectionID
GROUP BY e.ElectionID, e.ElectionName, e.Status;
GO

-- 5. Recent login activity with user details
CREATE VIEW vw_RecentLoginActivity AS
SELECT
    al.LogID,
    u.FullName,
    u.Role,
    al.LoginTimestamp,
    al.IPAddress,
    al.SuccessFlag,
    al.FailureReason
FROM AccessLog AS al
INNER JOIN System_User AS u
    ON al.UserID = u.UserID;
GO

-- 6. Pending nominations waiting for approval
CREATE VIEW vw_PendingNominations AS
SELECT
    cn.NominationID,
    u.FullName AS CandidateName,
    u.EmailAddress,
    e.ElectionName,
    p.PositionName,
    cn.NominationDate
FROM CandidateNomination AS cn
INNER JOIN System_User AS u
    ON cn.CandidateUserID = u.UserID
INNER JOIN Election AS e
    ON cn.ElectionID = e.ElectionID
INNER JOIN Positions AS p
    ON cn.PositionID = p.PositionID
WHERE cn.ApprovalStatus = 'Pending';
GO

-- 7. Oversight reviews with officer name and certification status
CREATE VIEW vw_OversightReviews AS
SELECT
    orv.ReviewID,
    u.FullName AS OfficerName,
    orv.ReviewStartTime,
    orv.ReviewEndTime,
    orv.Findings,
    orv.CertificationStatus,
    cn.NominationID
FROM OversightReview AS orv
INNER JOIN System_User AS u
    ON orv.OfficerUserID = u.UserID
LEFT JOIN CandidateNomination AS cn
    ON orv.NominationID = cn.NominationID;
GO

-- 8. Full audit trail with user details
CREATE VIEW vw_AuditTrail AS
SELECT
    sal.AuditID,
    u.FullName AS ActionBy,
    u.Role,
    sal.ActionType,
    sal.TargetEntity,
    sal.TargetID,
    sal.Timestamp,
    sal.IPAddress,
    sal.Description
FROM SystemAuditLog AS sal
INNER JOIN System_User AS u
    ON sal.UserID = u.UserID;
GO

-- ============================================================
-- Sample Data      
-- ============================================================

-- System_User 
INSERT INTO System_User
    (UserID, FullName, HashedPassword, EmailAddress, Role,
     Eligibility, VotedFlag, ProfileInfo, CreatedDate)
VALUES
(1, 'Lebo Maseko',      'Admin@128Pass',     'admin.smith@gmail.com',      'Administrator',     'Approved',  'N',  'System administrator',           '2026-03-01'),
(2, 'Karabo Nkosi',     'KaraboN@124Pass',   'karabo.nkosi@gmail.com',     'Voter',             'Approved',  'Y',  'Registered voter - District 4',  '2026-03-05'),
(3, 'Brian Mkhatshwa',  'BrianM@124Pass',    'brian.mkhatshwa@gmail.com',  'Voter',             'Approved',  'Y',  'Registered voter - District 2',  '2026-03-05'),
(4, 'Kagiso Sukazi',    'KagisoS@124Pass',   'kagiso.sukazi@gmail.com',    'Voter',             'Approved',  'N',  'Registered voter - District 1',  '2026-03-06'),
(5, 'Dikeledi Mafifi',  'DikelediM@124Pass', 'dikeledi.mafifi@gmail.com',  'Candidate',         'Approved',  'N',  'Running for Student President',  '2026-03-07'),
(6, 'Okuhle Mpethu',    'OkuhleM@124Pass',   'okuhle.mpethu@gmail.com',    'Candidate',         'Approved',  'N',  'Running for Student President',  '2026-03-07'),
(7, 'Kagiso Motsepe',   'KagisoM@124Pass',   'kagiso.motsepe@gmail.com',   'Candidate',         'Approved',  'N',  'Running for Treasurer',          '2026-03-08'),
(8, 'Zanele Khumalo',   'ZaneleK@124Pass',   'zanele.khumalo@gmail.com',   'ElectionOfficial',  'Approved',  'N',  'Senior election coordinator',    '2026-03-02'),
(9, 'Bongani Zulu',     'BonganiZ@124Pass',  'bongani.zulu@gmail.com',     'OversightOfficer',  'Approved',  'N',  'Independent oversight member',   '2026-03-03');
GO


-- Election
INSERT INTO Election
    (ElectionID, ElectionName, StartDateTime, EndDateTime, Status, Rules)
VALUES
(1, 'Student Council Election 2026', '2026-04-10 08:00:00', '2026-04-10 17:00:00', 'Closed',
 'One vote per registered student. Results are final after 24 hours.'),
(2, 'Community Board Election 2026', '2026-05-13 07:00:00', '2026-05-13 20:00:00', 'Active',
 'Eligible residents only. Valid photo ID required at time of voting.'),
(3, 'Staff Representative Election', '2026-07-15 09:00:00', '2026-07-15 16:00:00', 'Upcoming',
 'All permanent staff members are eligible. Voting is anonymous.');
GO


-- Positions
INSERT INTO Positions
    (PositionID, ElectionID, PositionName, Description, OrderOnBallot)
VALUES
(1, 1, 'Student President',    'Leads the student council and represents all students', 1),
(2, 1, 'Treasurer',            'Manages student council finances and annual budget',     2),
(3, 2, 'Board Chairperson',    'Chairs all community board meetings and sets agenda',    1),
(4, 3, 'Staff Representative', 'Represents staff interests in senior management',        1);
GO


-- BallotStructure
INSERT INTO BallotStructure
    (BallotID, ElectionID, BallotName, IsActive)
VALUES
(1, 1, 'Student Council Ballot 2026', 'N'),
(2, 2, 'Community Board Ballot 2026', 'Y'),
(3, 3, 'Staff Rep Ballot 2026',       'N');
GO


-- BallotItem
INSERT INTO BallotItem
    (BallotItemID, BallotID, PositionID, DisplayOrder)
VALUES
(1, 1, 1, 1),
(2, 1, 2, 2),
(3, 2, 3, 1),
(4, 3, 4, 1);
GO


-- CandidateNomination
INSERT INTO CandidateNomination
    (NominationID, ElectionID, CandidateUserID, PositionID,
     ApprovalStatus, ApprovedBy, NominationDate)
VALUES
(1, 1, 5, 1, 'Approved', 'Lebo Maseko', '2026-03-20'),
(2, 1, 6, 1, 'Approved', 'Lebo Maseko', '2026-03-21'),
(3, 1, 7, 2, 'Approved', 'Lebo Maseko', '2026-03-22'),
(4, 2, 5, 3, 'Pending',  NULL,          '2026-04-25'),
(5, 3, 6, 4, 'Rejected', 'Lebo Maseko', '2026-04-30');
GO


-- CastVote
INSERT INTO CastVote
    (VoteID, ElectionID, BallotItemID, CandidateUserID,
     EncryptedVoteData, TimestampCasted)
VALUES
(1, 1, 1, 5, 'ENC_VOTE_DATA_001', '2026-04-10 09:15:00'),
(2, 1, 1, 6, 'ENC_VOTE_DATA_002', '2026-04-10 10:30:00'),
(3, 1, 1, 5, 'ENC_VOTE_DATA_003', '2026-04-10 11:00:00'),
(4, 1, 2, 7, 'ENC_VOTE_DATA_004', '2026-04-10 11:45:00'),
(5, 1, 2, 7, 'ENC_VOTE_DATA_005', '2026-04-10 13:20:00');
GO


-- Results
INSERT INTO Results
    (ResultID, ElectionID, BallotItemID, CandidateUserID,
     TotalVotes, PercentageWon, MarginOfVictory, IsWinner)
VALUES
(1, 1, 1, 5, 2, 66.67, 1, 'Y'),
(2, 1, 1, 6, 1, 33.33, 1, 'N'),
(3, 1, 2, 7, 2, 100.00, 2, 'Y');
GO


-- SystemAuditLog
-- Insert audit records BEFORE OversightReview because OversightReview references AuditIDStart/AuditIDEnd
INSERT INTO SystemAuditLog
    (AuditID, UserID, ActionType, TargetEntity, TargetID,
     [Timestamp], IPAddress, Description)
VALUES
(1, 1, 'CREATE',  'Election',            '1', '2026-03-15 10:00:00', '192.168.1.10',
 'Created Student Council Election 2026'),
(2, 1, 'APPROVE', 'CandidateNomination', '1', '2026-03-20 09:00:00', '192.168.1.10',
 'Approved nomination for Dikeledi Mafifi'),
(3, 1, 'APPROVE', 'CandidateNomination', '2', '2026-03-21 09:30:00', '192.168.1.10',
 'Approved nomination for Okuhle Mpethu'),
(4, 8, 'UPDATE',  'Election',            '1', '2026-04-10 07:55:00', '192.168.1.10',
 'Updated election status to Active'),
(5, 8, 'UPDATE',  'Election',            '1', '2026-04-10 17:05:00', '192.168.1.10',
 'Updated election status to Closed');
GO


-- OversightReview
INSERT INTO OversightReview
    (ReviewID, OfficerUserID, NominationID, ReviewStartTime,
     ReviewEndTime, AuditIDStart, AuditIDEnd, Findings, CertificationStatus)
VALUES
(1, 9, 1, '2026-04-11 08:00:00', '2026-04-11 11:00:00',
 1, 5,
 'No irregularities found. Election conducted fairly and transparently.',
 'Certified'),
(2, 9, 4, '2026-05-13 08:30:00', NULL,
 NULL, NULL,
 'Active review in progress for Community Board Election.',
 'Pending');
GO


-- AccessLog
INSERT INTO AccessLog
    (LogID, UserID, LoginTimestamp, IPAddress,
     SuccessFlag, FailureReason)
VALUES
(1, 1, '2026-04-10 07:45:00', '192.168.1.10', 'Y', NULL),
(2, 2, '2026-04-10 09:05:00', '192.168.1.21', 'Y', NULL),
(3, 3, '2026-04-10 10:20:00', '192.168.1.33', 'Y', NULL),
(4, 4, '2026-05-13 07:55:00', '192.168.1.44', 'N', 'Incorrect password'),
(5, 4, '2026-05-13 07:57:00', '192.168.1.44', 'Y', NULL);


-- PART 4: BASIC QUERIES
-- CMPG 311 - Group 1
-- Done by: [Nabo Nhonho]
-- Student No: [54486785]

-- 1. QUERIES BASED ON COMPANY INFO REQUIREMENTS


-- get all approved voters who can vote
SELECT UserID, FullName, EmailAddress, Eligibility, VotedFlag, CreatedDate
FROM System_User
WHERE Role = 'Voter' AND Eligibility = 'Approved'
ORDER BY FullName;
GO

-- show active elections and the positions available
SELECT e.ElectionID, e.ElectionName, e.StartDateTime, e.EndDateTime, e.Status,
       p.PositionID, p.PositionName, p.Description, p.OrderOnBallot
FROM Election e
INNER JOIN Positions p ON e.ElectionID = p.ElectionID
WHERE e.Status = 'Active'
ORDER BY e.ElectionName, p.OrderOnBallot;
GO

-- approved candidates with their election and position info
SELECT cn.NominationID, u.FullName AS CandidateName, u.EmailAddress,
       e.ElectionName, p.PositionName, cn.ApprovalStatus, cn.ApprovedBy, cn.NominationDate
FROM CandidateNomination cn
INNER JOIN System_User u ON cn.CandidateUserID = u.UserID
INNER JOIN Election e ON cn.ElectionID = e.ElectionID
INNER JOIN Positions p ON cn.PositionID = p.PositionID
WHERE cn.ApprovalStatus = 'Approved'
ORDER BY e.ElectionName, p.PositionName, u.FullName;
GO

-- election results showing who won
SELECT r.ResultID, e.ElectionName, u.FullName AS CandidateName, p.PositionName,
       r.TotalVotes, r.PercentageWon, r.MarginOfVictory,
       CASE r.IsWinner WHEN 'Y' THEN 'Winner' ELSE 'Runner-up' END AS ResultStatus
FROM Results r
INNER JOIN System_User u ON r.CandidateUserID = u.UserID
INNER JOIN BallotItem bi ON r.BallotItemID = bi.BallotItemID
INNER JOIN Positions p ON bi.PositionID = p.PositionID
INNER JOIN Election e ON r.ElectionID = e.ElectionID
ORDER BY e.ElectionName, p.PositionName, r.TotalVotes DESC;
GO

-- pending nominations still waiting for approval
SELECT cn.NominationID, u.FullName AS CandidateName, u.EmailAddress,
       e.ElectionName, p.PositionName, cn.NominationDate, cn.ApprovalStatus
FROM CandidateNomination cn
INNER JOIN System_User u ON cn.CandidateUserID = u.UserID
INNER JOIN Election e ON cn.ElectionID = e.ElectionID
INNER JOIN Positions p ON cn.PositionID = p.PositionID
WHERE cn.ApprovalStatus = 'Pending'
ORDER BY cn.NominationDate;
GO

-- 2. QUERY LIMITATIONS (ROWS & COLUMNS)


-- only show top 3 candidates with most votes
SELECT u.FullName AS CandidateName, p.PositionName, r.TotalVotes, r.PercentageWon
FROM Results r
INNER JOIN System_User u ON r.CandidateUserID = u.UserID
INNER JOIN BallotItem bi ON r.BallotItemID = bi.BallotItemID
INNER JOIN Positions p ON bi.PositionID = p.PositionID
WHERE r.ElectionID = 1
ORDER BY r.TotalVotes DESC
FETCH FIRST 3 ROWS ONLY;
GO

-- limit columns - only show what we need for voters
SELECT UserID, FullName, EmailAddress, Role, Eligibility
FROM System_User
WHERE Role = 'Voter';
GO

-- skip first voter, show next 2 (pagination)
SELECT UserID, FullName, EmailAddress, Eligibility
FROM System_User
WHERE Role = 'Voter'
ORDER BY UserID
OFFSET 1 ROWS FETCH NEXT 2 ROWS ONLY;
GO

-- 3. SORTING OPERATIONS


-- elections sorted by start date newest first
SELECT ElectionID, ElectionName, StartDateTime, EndDateTime, Status
FROM Election
ORDER BY StartDateTime DESC;
GO

-- users sorted by role then name
SELECT UserID, FullName, Role, Eligibility, CreatedDate
FROM System_User
ORDER BY
    CASE Role
        WHEN 'Administrator' THEN 1
        WHEN 'ElectionOfficial' THEN 2
        WHEN 'OversightOfficer' THEN 3
        WHEN 'Candidate' THEN 4
        WHEN 'Voter' THEN 5
    END,
    FullName;
GO

-- candidates sorted by when they were nominated (oldest first)
SELECT cn.NominationID, u.FullName AS CandidateName, e.ElectionName,
       p.PositionName, cn.NominationDate, cn.ApprovalStatus
FROM CandidateNomination cn
INNER JOIN System_User u ON cn.CandidateUserID = u.UserID
INNER JOIN Election e ON cn.ElectionID = e.ElectionID
INNER JOIN Positions p ON cn.PositionID = p.PositionID
ORDER BY cn.NominationDate ASC;
GO

-- results sorted by percentage won (highest first)
SELECT r.ResultID, u.FullName AS CandidateName, p.PositionName, r.TotalVotes, r.PercentageWon
FROM Results r
INNER JOIN System_User u ON r.CandidateUserID = u.UserID
INNER JOIN BallotItem bi ON r.BallotItemID = bi.BallotItemID
INNER JOIN Positions p ON bi.PositionID = p.PositionID
ORDER BY r.PercentageWon DESC;
GO

-- 4. LIKE, AND, OR OPERATORS


-- find anyone with "Karabo" in their name
SELECT UserID, FullName, EmailAddress, Role
FROM System_User
WHERE FullName LIKE '%Karabo%'
ORDER BY FullName;
GO

-- find all gmail users
SELECT UserID, FullName, EmailAddress, Role
FROM System_User
WHERE EmailAddress LIKE '%@gmail.com'
ORDER BY FullName;
GO

-- approved candidates for active elections (AND)
SELECT cn.NominationID, u.FullName AS CandidateName, e.ElectionName,
       p.PositionName, cn.ApprovalStatus
FROM CandidateNomination cn
INNER JOIN System_User u ON cn.CandidateUserID = u.UserID
INNER JOIN Election e ON cn.ElectionID = e.ElectionID
INNER JOIN Positions p ON cn.PositionID = p.PositionID
WHERE cn.ApprovalStatus = 'Approved' AND e.Status = 'Active'
ORDER BY e.ElectionName, u.FullName;
GO

-- candidates or election officials (OR)
SELECT UserID, FullName, EmailAddress, Role, Eligibility
FROM System_User
WHERE Role = 'Candidate' OR Role = 'ElectionOfficial'
ORDER BY Role, FullName;
GO

-- combined: names starting with K who are voters or candidates
SELECT UserID, FullName, EmailAddress, Role, Eligibility
FROM System_User
WHERE FullName LIKE 'K%' AND (Role = 'Voter' OR Role = 'Candidate')
ORDER BY FullName;
GO

-- everyone NOT using gmail
SELECT UserID, FullName, EmailAddress
FROM System_User
WHERE EmailAddress NOT LIKE '%@gmail.com'
ORDER BY FullName;
GO

-- 5. VARIABLES & CHARACTER FUNCTIONS


-- uppercase names
SELECT UserID, UPPER(FullName) AS UpperCaseName, UPPER(EmailAddress) AS UpperCaseEmail, Role
FROM System_User
WHERE Role = 'Candidate';
GO

-- lowercase emails
SELECT UserID, FullName, LOWER(EmailAddress) AS LowerCaseEmail, Role
FROM System_User;
GO

-- proper case names
SELECT UserID, INITCAP(FullName) AS ProperCaseName, Role
FROM System_User;
GO

-- how long are the names
SELECT UserID, FullName, LENGTH(FullName) AS NameLength, LENGTH(EmailAddress) AS EmailLength
FROM System_User
ORDER BY NameLength DESC;
GO

-- first 3 letters of role
SELECT UserID, FullName, Role, SUBSTR(Role, 1, 3) AS RoleAbbreviation
FROM System_User;
GO

-- where is the @ in emails
SELECT UserID, FullName, EmailAddress, INSTR(EmailAddress, '@') AS AtSymbolPosition
FROM System_User;
GO

-- combine name and role
SELECT UserID, CONCAT(CONCAT(FullName, ' - '), Role) AS NameAndRole
FROM System_User;
GO

-- hide most of the password
SELECT UserID, FullName,
       REPLACE(HashedPassword, SUBSTR(HashedPassword, 1, LENGTH(HashedPassword)-4), '****') AS MaskedPassword
FROM System_User;
GO

-- trim any extra spaces
SELECT UserID, TRIM(FullName) AS TrimmedName, Role
FROM System_User;
GO

-- pad user IDs with zeros
SELECT UserID, LPAD(UserID, 5, '0') AS PaddedUserID, FullName, Role
FROM System_User
WHERE Role = 'Voter';
GO

-- 6. ROUNDING/TRUNCATION


-- round percentage to 1 decimal
SELECT ResultID, ElectionID, CandidateUserID, TotalVotes,
       ROUND(PercentageWon, 1) AS RoundedPercentage, MarginOfVictory
FROM Results;
GO

-- round to whole number
SELECT r.ResultID, u.FullName AS CandidateName, r.TotalVotes,
       ROUND(r.PercentageWon, 0) AS WholeNumberPercentage
FROM Results r
INNER JOIN System_User u ON r.CandidateUserID = u.UserID;
GO

-- truncate to 1 decimal
SELECT ResultID, TRUNC(PercentageWon, 1) AS TruncatedPercentage, PercentageWon AS OriginalPercentage
FROM Results;
GO

-- truncate to whole number
SELECT r.ResultID, u.FullName AS CandidateName, TRUNC(r.PercentageWon, 0) AS TruncatedWholeNumber
FROM Results r
INNER JOIN System_User u ON r.CandidateUserID = u.UserID;
GO

-- round up
SELECT ResultID, PercentageWon, CEIL(PercentageWon) AS CeilingPercentage
FROM Results;
GO

-- round down
SELECT ResultID, PercentageWon, FLOOR(PercentageWon) AS FloorPercentage
FROM Results;
GO

-- check if votes are even or odd
SELECT ResultID, TotalVotes, MOD(TotalVotes, 2) AS Remainder,
       CASE WHEN MOD(TotalVotes, 2) = 0 THEN 'Even' ELSE 'Odd' END AS VoteParity
FROM Results;
GO

-- 7. DATE FUNCTIONS


-- current date and time
SELECT SYSDATE AS CurrentDate, SYSTIMESTAMP AS CurrentTimestamp
FROM DUAL;
GO

-- how many months between election start and end
SELECT ElectionID, ElectionName, StartDateTime, EndDateTime,
       ROUND(MONTHS_BETWEEN(EndDateTime, StartDateTime), 2) AS DurationInMonths
FROM Election;
GO

-- add 6 months to election date
SELECT ElectionID, ElectionName, StartDateTime, ADD_MONTHS(StartDateTime, 6) AS SixMonthsLater
FROM Election;
GO

-- next monday after election starts
SELECT ElectionID, ElectionName, StartDateTime, NEXT_DAY(StartDateTime, 'MONDAY') AS NextMonday
FROM Election;
GO

-- last day of the month
SELECT ElectionID, ElectionName, StartDateTime, LAST_DAY(StartDateTime) AS LastDayOfMonth
FROM Election;
GO

-- get year month day separately
SELECT ElectionID, ElectionName, StartDateTime,
       EXTRACT(YEAR FROM StartDateTime) AS ElectionYear,
       EXTRACT(MONTH FROM StartDateTime) AS ElectionMonth,
       EXTRACT(DAY FROM StartDateTime) AS ElectionDay
FROM Election;
GO

-- truncate to start of month and year
SELECT ElectionID, ElectionName, StartDateTime,
       TRUNC(StartDateTime, 'MONTH') AS StartOfMonth,
       TRUNC(StartDateTime, 'YEAR') AS StartOfYear
FROM Election;
GO

-- days until upcoming elections start
SELECT ElectionID, ElectionName, StartDateTime, EndDateTime, Status,
       CASE WHEN Status = 'Upcoming' THEN TRUNC(StartDateTime) - TRUNC(SYSDATE) ELSE 0 END AS DaysUntilStart
FROM Election;
GO

-- format dates nicely
SELECT ElectionID, ElectionName,
       TO_CHAR(StartDateTime, 'DD/MM/YYYY HH24:MI:SS') AS FormattedStartDate,
       TO_CHAR(EndDateTime, 'DD Month YYYY') AS FormattedEndDate
FROM Election;
GO

-- convert string to date
SELECT TO_DATE('2026-04-10', 'YYYY-MM-DD') AS ParsedDate,
       TO_DATE('10/04/2026 08:00:00', 'DD/MM/YYYY HH24:MI:SS') AS ParsedDateTime
FROM DUAL;
GO

-- 8. AGGREGATE FUNCTIONS


-- count users per role
SELECT Role, COUNT(*) AS TotalUsers
FROM System_User
GROUP BY Role
ORDER BY TotalUsers DESC;
GO

-- count unique election statuses
SELECT COUNT(DISTINCT Status) AS UniqueStatuses, COUNT(*) AS TotalElections
FROM Election;
GO

-- total votes per election
SELECT e.ElectionID, e.ElectionName, SUM(r.TotalVotes) AS TotalVotesCast
FROM Election e
LEFT JOIN Results r ON e.ElectionID = r.ElectionID
GROUP BY e.ElectionID, e.ElectionName
ORDER BY TotalVotesCast DESC;
GO

-- average votes per candidate
SELECT e.ElectionID, e.ElectionName, p.PositionName, AVG(r.TotalVotes) AS AverageVotes
FROM Results r
INNER JOIN Election e ON r.ElectionID = e.ElectionID
INNER JOIN BallotItem bi ON r.BallotItemID = bi.BallotItemID
INNER JOIN Positions p ON bi.PositionID = p.PositionID
GROUP BY e.ElectionID, e.ElectionName, p.PositionName;
GO

-- highest and lowest votes per election
SELECT e.ElectionID, e.ElectionName, MAX(r.TotalVotes) AS HighestVotes, MIN(r.TotalVotes) AS LowestVotes
FROM Election e
LEFT JOIN Results r ON e.ElectionID = r.ElectionID
GROUP BY e.ElectionID, e.ElectionName;
GO

-- combined stats per election
SELECT e.ElectionID, e.ElectionName,
       COUNT(DISTINCT r.CandidateUserID) AS TotalCandidates,
       SUM(r.TotalVotes) AS TotalVotes,
       AVG(r.TotalVotes) AS AverageVotes,
       MAX(r.TotalVotes) AS MaxVotes,
       MIN(r.TotalVotes) AS MinVotes
FROM Election e
LEFT JOIN Results r ON e.ElectionID = r.ElectionID
GROUP BY e.ElectionID, e.ElectionName;
GO

-- count votes per ballot item
SELECT bi.BallotItemID, p.PositionName, COUNT(cv.VoteID) AS VotesCast
FROM BallotItem bi
INNER JOIN Positions p ON bi.PositionID = p.PositionID
LEFT JOIN CastVote cv ON bi.BallotItemID = cv.BallotItemID
GROUP BY bi.BallotItemID, p.PositionName
ORDER BY VotesCast DESC;
GO

-- 9. GROUP BY & HAVING CLAUSES


-- group users by role and eligibility
SELECT Role, Eligibility, COUNT(*) AS UserCount
FROM System_User
GROUP BY Role, Eligibility
ORDER BY Role, Eligibility;
GO

-- elections with more than 1 candidate
SELECT e.ElectionID, e.ElectionName, COUNT(cn.NominationID) AS CandidateCount
FROM Election e
INNER JOIN CandidateNomination cn ON e.ElectionID = cn.ElectionID
GROUP BY e.ElectionID, e.ElectionName
HAVING COUNT(cn.NominationID) > 1;
GO

-- positions where average votes are above 1
SELECT p.PositionID, p.PositionName, AVG(r.TotalVotes) AS AverageVotes
FROM Positions p
INNER JOIN BallotItem bi ON p.PositionID = bi.PositionID
INNER JOIN Results r ON bi.BallotItemID = r.BallotItemID
GROUP BY p.PositionID, p.PositionName
HAVING AVG(r.TotalVotes) > 1;
GO

-- nominations grouped by election and status
SELECT e.ElectionName, cn.ApprovalStatus, COUNT(*) AS NominationCount,
       MIN(cn.NominationDate) AS FirstNomination, MAX(cn.NominationDate) AS LastNomination
FROM CandidateNomination cn
INNER JOIN Election e ON cn.ElectionID = e.ElectionID
GROUP BY e.ElectionName, cn.ApprovalStatus
ORDER BY e.ElectionName, cn.ApprovalStatus;
GO

-- elections with nominations in March 2026
SELECT e.ElectionID, e.ElectionName, COUNT(cn.NominationID) AS MarchNominations
FROM Election e
INNER JOIN CandidateNomination cn ON e.ElectionID = cn.ElectionID
WHERE cn.NominationDate >= TO_DATE('2026-03-01', 'YYYY-MM-DD')
  AND cn.NominationDate < TO_DATE('2026-04-01', 'YYYY-MM-DD')
GROUP BY e.ElectionID, e.ElectionName
HAVING COUNT(cn.NominationID) > 0;
GO

-- positions where winner got over 50%
SELECT p.PositionID, p.PositionName, MAX(r.PercentageWon) AS WinningPercentage, COUNT(r.ResultID) AS CandidateCount
FROM Positions p
INNER JOIN BallotItem bi ON p.PositionID = bi.PositionID
INNER JOIN Results r ON bi.BallotItemID = r.BallotItemID
GROUP BY p.PositionID, p.PositionName
HAVING MAX(r.PercentageWon) > 50;
GO

-- 10. JOINS


-- inner join
SELECT e.ElectionID, e.ElectionName, e.Status, p.PositionID, p.PositionName, p.OrderOnBallot
FROM Election e
INNER JOIN Positions p ON e.ElectionID = p.ElectionID
ORDER BY e.ElectionName, p.OrderOnBallot;
GO

-- left join
SELECT e.ElectionID, e.ElectionName, e.Status, r.ResultID, r.TotalVotes, r.IsWinner
FROM Election e
LEFT JOIN Results r ON e.ElectionID = r.ElectionID
ORDER BY e.ElectionID, r.ResultID;
GO

-- right join
SELECT e.ElectionID, e.ElectionName, r.ResultID, r.CandidateUserID, r.TotalVotes
FROM Election e
RIGHT JOIN Results r ON e.ElectionID = r.ElectionID;
GO

-- full outer join
SELECT e.ElectionID, e.ElectionName, r.ResultID, r.TotalVotes
FROM Election e
FULL OUTER JOIN Results r ON e.ElectionID = r.ElectionID
ORDER BY e.ElectionID, r.ResultID;
GO

-- multiple joins - full ballot structure
SELECT bs.BallotID, bs.BallotName, bs.IsActive, e.ElectionName,
       bi.BallotItemID, bi.DisplayOrder, p.PositionName, p.Description
FROM BallotStructure bs
INNER JOIN Election e ON bs.ElectionID = e.ElectionID
INNER JOIN BallotItem bi ON bs.BallotID = bi.BallotID
INNER JOIN Positions p ON bi.PositionID = p.PositionID
ORDER BY bs.BallotID, bi.DisplayOrder;
GO

-- self join - compare candidates for same position
SELECT cn1.NominationID AS Nomination1, u1.FullName AS Candidate1,
       cn2.NominationID AS Nomination2, u2.FullName AS Candidate2,
       cn1.ElectionID, p.PositionName
FROM CandidateNomination cn1
INNER JOIN CandidateNomination cn2 ON cn1.ElectionID = cn2.ElectionID
    AND cn1.PositionID = cn2.PositionID AND cn1.NominationID < cn2.NominationID
INNER JOIN System_User u1 ON cn1.CandidateUserID = u1.UserID
INNER JOIN System_User u2 ON cn2.CandidateUserID = u2.UserID
INNER JOIN Positions p ON cn1.PositionID = p.PositionID;
GO

-- three table join with where clause
SELECT e.ElectionName, u.FullName AS CandidateName, p.PositionName, cn.ApprovalStatus
FROM Election e
INNER JOIN CandidateNomination cn ON e.ElectionID = cn.ElectionID
INNER JOIN System_User u ON cn.CandidateUserID = u.UserID
INNER JOIN Positions p ON cn.PositionID = p.PositionID
WHERE e.Status = 'Active' AND cn.ApprovalStatus = 'Approved';
GO

-- cross join - all voters with all elections
SELECT u.UserID, u.FullName, e.ElectionID, e.ElectionName
FROM System_User u
CROSS JOIN Election e
WHERE u.Role = 'Voter'
ORDER BY u.UserID, e.ElectionID;
GO

-- 11. SUB-QUERIES


-- single row subquery - election with most votes
SELECT ElectionID, ElectionName, Status
FROM Election
WHERE ElectionID = (
    SELECT ElectionID FROM Results
    GROUP BY ElectionID
    ORDER BY SUM(TotalVotes) DESC
    FETCH FIRST 1 ROWS ONLY
);
GO

-- multi row subquery with IN
SELECT UserID, FullName, EmailAddress, Role
FROM System_User
WHERE UserID IN (
    SELECT DISTINCT CandidateUserID FROM CandidateNomination
);
GO

-- correlated subquery
SELECT e.ElectionID, e.ElectionName,
       (SELECT COUNT(*) FROM CandidateNomination cn WHERE cn.ElectionID = e.ElectionID) AS CandidateCount
FROM Election e
WHERE (SELECT COUNT(*) FROM CandidateNomination cn WHERE cn.ElectionID = e.ElectionID) > (
    SELECT AVG(candidate_count) FROM (
        SELECT COUNT(*) AS candidate_count FROM CandidateNomination GROUP BY ElectionID
    )
);
GO

-- subquery in FROM clause
SELECT ElectionID, ElectionName, TotalVotes, CandidateCount,
       ROUND(TotalVotes / NULLIF(CandidateCount, 0), 2) AS VotesPerCandidate
FROM (
    SELECT e.ElectionID, e.ElectionName, NVL(SUM(r.TotalVotes), 0) AS TotalVotes,
           COUNT(DISTINCT r.CandidateUserID) AS CandidateCount
    FROM Election e
    LEFT JOIN Results r ON e.ElectionID = r.ElectionID
    GROUP BY e.ElectionID, e.ElectionName
) vote_stats;
GO

-- EXISTS subquery
SELECT e.ElectionID, e.ElectionName, e.Status
FROM Election e
WHERE EXISTS (SELECT 1 FROM CandidateNomination cn WHERE cn.ElectionID = e.ElectionID);
GO

-- NOT EXISTS subquery
SELECT p.PositionID, p.PositionName, e.ElectionName
FROM Positions p
INNER JOIN Election e ON p.ElectionID = e.ElectionID
WHERE NOT EXISTS (SELECT 1 FROM CandidateNomination cn WHERE cn.PositionID = p.PositionID);
GO

-- scalar subquery in SELECT
SELECT r.ResultID, u.FullName AS CandidateName, r.TotalVotes,
       (SELECT SUM(TotalVotes) FROM Results r2 WHERE r2.ElectionID = r.ElectionID) AS ElectionTotalVotes,
       ROUND(r.TotalVotes * 100.0 / NULLIF((SELECT SUM(TotalVotes) FROM Results r2 WHERE r2.ElectionID = r.ElectionID), 0), 2) AS CalculatedPercentage
FROM Results r
INNER JOIN System_User u ON r.CandidateUserID = u.UserID;
GO

-- ALL operator subquery
SELECT u.FullName AS CandidateName, e.ElectionName, r.TotalVotes
FROM Results r
INNER JOIN System_User u ON r.CandidateUserID = u.UserID
INNER JOIN Election e ON r.ElectionID = e.ElectionID
WHERE r.TotalVotes > ALL (
    SELECT AVG(TotalVotes) FROM Results GROUP BY ElectionID
);
GO

-- Done by: [Nabo Nhonho]

-- FUNCTIONS
-- 1. DATE FUNCTIONS

DELIMITER //

-- Check election status
CREATE FUNCTION fn_IsElectionActive(
    p_start DATETIME,
    p_end DATETIME
)
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE v_status VARCHAR(20);

    IF NOW() BETWEEN p_start AND p_end THEN
        SET v_status = 'Active';
    ELSEIF NOW() < p_start THEN
        SET v_status = 'Upcoming';
    ELSE
        SET v_status = 'Closed';
    END IF;

    RETURN v_status;
END //

-- Days until election starts
CREATE FUNCTION fn_DaysUntilElection(
    p_start DATETIME
)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN DATEDIFF(p_start, NOW());
END //

-- Format election date
CREATE FUNCTION fn_FormatElectionDate(
    p_date DATETIME
)
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    RETURN DATE_FORMAT(p_date, '%d %M %Y %H:%i');
END //

-- 2. ROUNDING FUNCTIONS

-- Round percentage
CREATE FUNCTION fn_RoundPercentage(
    p_value DECIMAL(10,4)
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    RETURN ROUND(p_value, 2);
END //

-- Calculate vote percentage
CREATE FUNCTION fn_CalculateVotePercentage(
    p_votes INT,
    p_totalVotes INT
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_percentage DECIMAL(10,2);

    IF p_totalVotes = 0 THEN
        SET v_percentage = 0;
    ELSE
        SET v_percentage = (p_votes * 100.0) / p_totalVotes;
    END IF;

    RETURN ROUND(v_percentage, 2);
END //

-- Check if vote count is even or odd
CREATE FUNCTION fn_VoteParity(
    p_votes INT
)
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
    IF MOD(p_votes, 2) = 0 THEN
        RETURN 'Even';
    ELSE
        RETURN 'Odd';
    END IF;
END //

-- 3. CHARACTER FUNCTIONS

-- Convert name to uppercase
CREATE FUNCTION fn_UpperCaseName(
    p_name VARCHAR(100)
)
RETURNS VARCHAR(100)
DETERMINISTIC
BEGIN
    RETURN UPPER(p_name);
END //

-- Convert email to lowercase
CREATE FUNCTION fn_LowerCaseEmail(
    p_email VARCHAR(100)
)
RETURNS VARCHAR(100)
DETERMINISTIC
BEGIN
    RETURN LOWER(p_email);
END //

-- Mask password
CREATE FUNCTION fn_MaskPassword(
    p_password VARCHAR(255)
)
RETURNS VARCHAR(255)
DETERMINISTIC
BEGIN
    RETURN CONCAT('****', RIGHT(p_password, 4));
END //

-- Extract email domain
CREATE FUNCTION fn_GetEmailDomain(
    p_email VARCHAR(100)
)
RETURNS VARCHAR(100)
DETERMINISTIC
BEGIN
    RETURN SUBSTRING_INDEX(p_email, '@', -1);
END //

DELIMITER ;

-- 4. BUSINESS RULE TRIGGERS

DELIMITER //

-- Prevent duplicate voting
CREATE TRIGGER trg_PreventDuplicateVote
BEFORE INSERT ON CastVote
FOR EACH ROW
BEGIN
    DECLARE v_count INT;

    SELECT COUNT(*)
    INTO v_count
    FROM CastVote
    WHERE VoterUserID = NEW.VoterUserID
      AND ElectionID = NEW.ElectionID;

    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Voter has already voted in this election';
    END IF;
END //

-- Prevent voting outside election period
CREATE TRIGGER trg_CheckElectionPeriod
BEFORE INSERT ON CastVote
FOR EACH ROW
BEGIN
    DECLARE v_start DATETIME;
    DECLARE v_end DATETIME;

    SELECT StartDateTime, EndDateTime
    INTO v_start, v_end
    FROM Election
    WHERE ElectionID = NEW.ElectionID;

    IF NOW() NOT BETWEEN v_start AND v_end THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Voting is not allowed outside election period';
    END IF;
END //

-- Prevent deleting votes
CREATE TRIGGER trg_PreventVoteDeletion
BEFORE DELETE ON CastVote
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Votes cannot be deleted';
END //

-- Prevent updating votes
CREATE TRIGGER trg_PreventVoteUpdate
BEFORE UPDATE ON CastVote
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Votes cannot be modified';
END //

-- Ensure only administrators create elections
CREATE TRIGGER trg_AdminCreateElection
BEFORE INSERT ON Election
FOR EACH ROW
BEGIN
    IF NEW.CreatedByRole <> 'Administrator' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only administrators can create elections';
    END IF;
END //

DELIMITER ;

-- 5. CONSTRAINTS

-- Unique email addresses
ALTER TABLE System_User
ADD CONSTRAINT uq_email UNIQUE (EmailAddress);

-- Valid user roles
ALTER TABLE System_User
ADD CONSTRAINT chk_role
CHECK (
    Role IN (
        'Voter',
        'Candidate',
        'Administrator',
        'ElectionOfficial',
        'OversightOfficer'
    )
);

-- Valid percentages
ALTER TABLE Results
ADD CONSTRAINT chk_percentage
CHECK (
    PercentageWon BETWEEN 0 AND 100
);

-- 6. SAMPLE QUERY USING FUNCTIONS

SELECT
    u.UserID,
    u.FullName,
    fn_UpperCaseName(u.FullName) AS UpperName,
    fn_LowerCaseEmail(u.EmailAddress) AS LowerEmail,
    fn_GetEmailDomain(u.EmailAddress) AS EmailDomain,
    fn_MaskPassword(u.HashedPassword) AS HiddenPassword,
    r.TotalVotes,
    fn_RoundPercentage(r.PercentageWon) AS RoundedPercentage,
    fn_VoteParity(r.TotalVotes) AS VoteType,
    fn_FormatElectionDate(e.StartDateTime) AS ElectionStart,
    fn_IsElectionActive(e.StartDateTime, e.EndDateTime) AS ElectionStatus,
    fn_DaysUntilElection(e.StartDateTime) AS DaysRemaining
FROM Results r
INNER JOIN System_User u
    ON r.CandidateUserID = u.UserID
INNER JOIN Election e
    ON r.ElectionID = e.ElectionID;

-- Done by: Karabo Kwakwa
