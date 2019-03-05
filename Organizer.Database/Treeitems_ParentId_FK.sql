ALTER TABLE [dbo].[TreeItems]
	ADD CONSTRAINT [TreeItems_ParentId_FK]
	FOREIGN KEY (ParentId)
	REFERENCES [TreeItems] (Id)
