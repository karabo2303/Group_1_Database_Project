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
