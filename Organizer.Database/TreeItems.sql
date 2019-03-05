CREATE TABLE [dbo].[TreeItems]
(
	[Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT newid(), 
    [ParentId] UNIQUEIDENTIFIER NULL, 
    [Text] NVARCHAR(MAX) NULL -- syntax {privateWriteAccessText}publicReadonlyText
	, 
    [CreatedUtc] DATETIME NOT NULL DEFAULT getutcdate(), 
    [LastModifiedUtc] DATETIME NOT NULL DEFAULT getutcdate(), 
    [ShareRead] BIT NULL, 
    [DueTimeUtc] DATETIME NULL, 
    [AuthEntityId] UNIQUEIDENTIFIER NULL, 
    [ChildrenDisplayMode] VARCHAR(16) NULL,
    [Priority] INT NULL -- lower is less important
	, 
    [IsCollapsed] BIT NOT NULL DEFAULT 0, 
    [LastModifiedEntityId] UNIQUEIDENTIFIER NULL, 
    [NextSiblingId] UNIQUEIDENTIFIER NULL ---- applies to display order of items.   makes sense when using simplest display modes.
	-- when it is todo list(priority), it is ignored.      -- optional. if null, Id-based order is used (as returned from DB)
	-- is ignored in JS
, 
    [Status] VARCHAR(50) NULL,	-- [empty]=normal, currentlyExecuted, plannedAsPriority, questionable, done
	
    [ShareWrite] BIT default 0, 
	)