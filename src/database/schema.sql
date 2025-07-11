-- Table for radar dates
CREATE TABLE IF NOT EXISTS radar_dates (
  id SERIAL PRIMARY KEY,
  date VARCHAR(10) NOT NULL,  -- Format: YYYY.MM
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for radar entries
CREATE TABLE IF NOT EXISTS radar_entries (
  id SERIAL PRIMARY KEY,
  quadrant INTEGER NOT NULL,
  ring INTEGER NOT NULL,
  label VARCHAR(255) NOT NULL,
  link VARCHAR(512),
  active BOOLEAN DEFAULT TRUE,
  moved INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_radar_entries_quadrant ON radar_entries(quadrant);
CREATE INDEX IF NOT EXISTS idx_radar_entries_ring ON radar_entries(ring);

-- Table for Comments 
CREATE TABLE IF NOT EXISTS [dbo].[Comments](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[TechnologyLabel] [nvarchar](50) NULL,
	[Author] [nvarchar](max) NULL,
	[Text] [nvarchar](max) NULL,
	[Email] [nvarchar](max) NULL,
	[CommentDate] [datetime] NULL,
	[IsApproved] [nvarchar](5) NULL,
	[Timestamp] [datetime] NOT NULL
);

--  Table For References
CREATE TABLE IF NOT EXISTS [dbo].[References](
  [Id] [int] IDENTITY(1,1) NOT NULL,
  [TechnologyLabel] [nvarchar](50) NULL,
  [Author] [nvarchar](max) NULL,
  [Text] [nvarchar](max) NULL,
  [Email] [nvarchar](max) NULL,
  [CommentDate] [datetime] NULL,
  [IsApproved] [nvarchar](5) NULL,
  [Timestamp] [datetime] NOT NULL
);

CREATE TABLE [dbo].[Technology](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[TechnologyName] [nvarchar](255) NOT NULL,
	[Quadrant] [nvarchar](30) NOT NULL,
	[Ring] [nvarchar](30) NOT NULL,
	[Link] [nvarchar](255) NULL,
	[CreatedBy] [nvarchar](255) NULL,
	[CreatedAt] [datetime] NULL,
	[EditedAt] [datetime] NULL,
	[PublicationStatus] [nvarchar](50) NULL,
	[Archived] [bit] NULL,
	[ProfileImage] [nvarchar](255) NULL,
	[Tags] [nvarchar](255) NULL,
	[Abstract] [nvarchar](max) NOT NULL,
	[DefinitionAndScope] [nvarchar](max) NULL,
	[TechnologySegment] [nvarchar](255) NOT NULL,
	[RelevanceAndImpactForFidelidade] [nvarchar](max) NULL,
	[OngoingActivitiesAndApplications] [nvarchar](max) NULL,
	[TechnologyExpert] [nvarchar](255) NULL,
	[TechnologyMaturity] [nvarchar](50) NULL,
	[ImpactedBusinessUnits] [nvarchar](max) NULL,
	[LastReviewDate] [date] NULL,
	[NextReviewDate] [date] NULL,
	[RatingPotentialBenefit] [int] NULL,
	[RatingPotentialBenefitDecimal] [decimal](5, 2) NULL,
	[RatingApplicationScope] [int] NULL,
	[RatingApplicationScopeDecimal] [decimal](5, 2) NULL,
	[RatingBusinessModelFit] [int] NULL,
	[RatingBusinessModelFitDecimal] [decimal](5, 2) NULL,
	[RatingBusinessImpact] [int] NULL,
	[RatingBusinessImpactDecimal] [decimal](5, 2) NULL,
	[RatingDisruptivePotential] [int] NULL,
	[RatingDisruptivePotentialDecimal] [decimal](5, 2) NULL,
	[RatingInternalKnowHow] [int] NULL,
	[RatingInternalKnowHowDecimal] [decimal](5, 2) NULL,
	[RatingTimeToMaturity] [int] NULL,
	[RatingTimeToMaturityDecimal] [decimal](5, 2) NULL,
	[BusinessUnit] [nvarchar](255) NULL,
	[References] [nvarchar](max) NULL,
	[ReferencesTitle] [nvarchar](255) NULL,
	[RecommendedAction] [nvarchar](max) NULL,
	[CurrentStatus] [nvarchar](50) NULL,
	[ContentSource] [nvarchar](255) NULL,
	[RelationTechnology] [nvarchar](255) NULL,
	[RelationInnovationProgram] [nvarchar](255) NULL,
	[RelationInnovationProject] [nvarchar](255) NULL,
	[RelationOpportunitySpace] [nvarchar](255) NULL,
	[RelationCompany] [nvarchar](255) NULL,
	[RelationTrend] [nvarchar](255) NULL,
	[RelationInspiration] [nvarchar](255) NULL
  );