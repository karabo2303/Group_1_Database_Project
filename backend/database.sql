CREATE TABLE Election(
	ElectionName VARCHAR(100),
    StartDateTime DATETIME,
    EndDateTime DATETIME,
    Status VARCHAR(100),
    Rules VARCHAR(100)
    
);
CREATE TABLE BallotItem(
	BalotItemID INT,
	BallotID INT,
    PositionID INT,
    DisplayOrder VARCHAR(100)
);

CREATE TABLE BallotStructure(
	BallotID INT ,
    ElectionID INT,
    BallotName VARCHAR(100),
    isActive BOOLEAN
);

CREATE TABLE SystemAuditLog(
	AudidID INT,
    userID INT,
    ActionType VARCHAR(100),
    TargetEntity VARCHAR(100),
    TargetID INT,
    Timestamp DATE,
    IPAdress INT,
    Description VARCHAR(100)

);

CREATE TABLE CastVote(
	VoteID INT,
    ElectionID INT,
    BallotItemID INT,
    CandidateUserID INT,
    VoterToken VARCHAR(100),
    EncryptedVoteData VARCHAR(100),
    TimestampCasted DATETIME
);

CREATE TABLE Positions(
	PositionID INT,
    ElectionID INT,
    PositionName VARCHAR(100),
    Description VARCHAR(100),
    OrderOnBallot INT
);

CREATE TABLE Results(
	ResultID INT,
    ElectionID INT,
    BallotItemID INT,
    CandidateUserID INT,
    TotalVotes INT,
    PercentageWon DECIMAL(2,2),
    MarginOfVictory INT,
    isWinner BOOLEAN
);

CREATE TABLE CandidateNomination(
	NominationID INT,
    ElectionID INT,
    CandidateUserID INT,
    PositionID INT,
    ApprovatStatus BOOLEAN,
    ApprovedBy VARCHAR(100)
);

CREATE TABLE User(
	UserID INT,
    FullName VARCHAR(100),
    HashedPassword VARCHAR(100),
    EmailAdress VARCHAR(100),
    Role VARCHAR(100),
    Eligibility BOOLEAN,
    VotedFlag BOOLEAN,
    ProfileInfo VARCHAR(200),
    CreatedDate DATE ,
    LastLoginTimestamp DATETIME
    
	);

CREATE TABLE OversightReview(
	ReviewID INT,
    OfficeUserID INT,
    ReviewStartTime DATETIME,
    ReviewEndTime DATETIME,
    AuditIDStart DATE,
    AuditIDEnd DATE,
    Findings VARCHAR(100),
    CertificationStatus BOOLEAN
);
CREATE TABLE AcessLog(
	LogID INT,
    UserID INT,
    LoginTimeStamp DATETIME,
    IPAdress INT,
    SucessFlag BOOLEAN,
    FailureReason VARCHAR(100)
);