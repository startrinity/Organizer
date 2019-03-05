ALTER TABLE [dbo].TreeItems
	ADD CONSTRAINT [TreeItems_AuthEntityId_FK]
	FOREIGN KEY (AuthEntityId)
	REFERENCES AuthEntities (Id)
