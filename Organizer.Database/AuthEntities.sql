CREATE TABLE [dbo].[AuthEntities]
(
	[Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT newid(), 
    [UserName] VARCHAR(50) NOT NULL, 
    [Password] VARCHAR(50) NOT NULL,
	[RegisteredAtUtc] [datetime] NULL,
	[LastActiveAtUtc] [datetime] NULL,
	[RegisteredFromIpAddress] [varchar](50) NULL,
-- weak FK.  generates TreeItem.IsSelected 
)
