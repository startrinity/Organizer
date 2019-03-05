ALTER TABLE [dbo].[TreeItems]
	ADD CONSTRAINT [TreeItems_NextSiblingId_FK]
	FOREIGN KEY (NextSiblingId)
	REFERENCES [TreeItems] (Id)
