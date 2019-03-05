ALTER TABLE [dbo].[TreeItemUrls]
	ADD CONSTRAINT [TreeItemUrls_TreeItemId_FK]
	FOREIGN KEY (TreeItemId)
	REFERENCES [TreeItems] (Id)
