using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Organizer.Web.DataLayer
{
    public class InsertTreeItem_Child : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "text/xml";
            var thisTreeItemId = Guid.Parse(context.Request["thisTreeItemId"]);
            using (var db = new OrganizerEntities())
            {
                var thisTreeItem = db.TreeItems.Find(thisTreeItemId);
                CustomMembershipProvider.ValidateAccessToTreeItem_ReturnActiveAuthEntity(thisTreeItem, db, true);
                var thisTreeItemChildren = new List<TreeItem>();
                GetTreeItems.GetChildTreeItemsReadonlyHtml(thisTreeItemId, db, thisTreeItemChildren);
                var newItem = new TreeItem
                    {
                        CreatedUtc = DateTime.UtcNow,
                        Id = Guid.NewGuid(),
                        LastModifiedUtc = DateTime.UtcNow,
                        ParentId = thisTreeItem.Id,
                        NextSiblingId = thisTreeItemChildren.Count != 0 ? (Guid?)thisTreeItemChildren[0].Id : null,
                    };
                db.TreeItems.Add(newItem);
                db.SaveChanges();

                context.Response.Write(ServerSideProcedures.DataObjectToXml(newItem));
            }
            
        }

        public bool IsReusable
        {
            get
            {
                return true;
            }
        }
    }
}