using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Organizer.Web.DataLayer
{
    public class DeleteTreeItem : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            var id = Guid.Parse(context.Request["treeItemId"]);
            using (var db = new OrganizerEntities())
            {
                var item = db.TreeItems.Find(id);
                CustomMembershipProvider.ValidateAccessToTreeItem_ReturnActiveAuthEntity(item, db, true);
                if (item.ParentId == null) throw new Exception("Can't delete root node");
                
                var children = new List<TreeItem>();
                GetTreeItems.GetChildTreeItemsReadonlyHtml(id, db, children, false, true, null, true); 
                for (int i = children.Count - 1; i >= 0; i--) // need to delete in this order to avoid FK errors
                {
                    db.TreeItems.Remove(children[i]);
                    db.SaveChanges();
                }

                var previousSibling = db.TreeItems.FirstOrDefault(x => x.NextSiblingId == id);
                if (previousSibling != null)
                {
                    previousSibling.NextSiblingId = item.NextSiblingId;
                    db.SaveChanges();
                }

                db.TreeItems.Remove(item);
                db.SaveChanges();
            }

            context.Response.ContentType = "text/plain";
            context.Response.Write("OK");
            
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