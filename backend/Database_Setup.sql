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

