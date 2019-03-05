using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Organizer.Web.DataLayer
{
    public class MoveTreeItem : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            var moveType = context.Request["moveType"];
            var from = Guid.Parse(context.Request["from"]);
            var toStr = context.Request["to"];
            Guid? to;
            if (!String.IsNullOrEmpty(toStr)) to = Guid.Parse(toStr); else to = null;
            using (var db = new OrganizerEntities())
            {
                var fromItem = db.TreeItems.Find(from);
                CustomMembershipProvider.ValidateAccessToTreeItem_ReturnActiveAuthEntity(fromItem, db, true);
                TreeItem toItem = null;
                if (to.HasValue)
                {
                    toItem = db.TreeItems.Find(to);
                    CustomMembershipProvider.ValidateAccessToTreeItem_ReturnActiveAuthEntity(toItem, db, true);
                }

                switch (moveType)
                {
                    case "top":
                        {
                            var children = new List<TreeItem>();
                            GetTreeItems.GetChildTreeItemsReadonlyHtml(fromItem.ParentId.Value, db, children, false, false);
                            var firstChild = children.FirstOrDefault();
                            
                            var previousSibling = db.TreeItems.FirstOrDefault(x => x.NextSiblingId == from);
                            if (previousSibling != null)
                            {
                                previousSibling.NextSiblingId = fromItem.NextSiblingId;
                                db.SaveChanges();
                            }

                            fromItem.NextSiblingId = firstChild.Id;
                            db.SaveChanges();
                        }
                        break;
                    case "bottom":
                        {
                            var children = new List<TreeItem>();
                            GetTreeItems.GetChildTreeItemsReadonlyHtml(fromItem.ParentId.Value, db, children, false, false);
                            var lastChild = children.LastOrDefault();

                            var previousSibling = db.TreeItems.FirstOrDefault(x => x.NextSiblingId == from);
                            if (previousSibling != null)
                            {
                                previousSibling.NextSiblingId = fromItem.NextSiblingId;
                                db.SaveChanges();
                            }

                            if (lastChild != null) lastChild.NextSiblingId = fromItem.Id;
                            fromItem.NextSiblingId = null;
                            db.SaveChanges();
                        }
                        break;
                    case "children":
                        {
                            var children = new List<TreeItem>();
                            GetTreeItems.GetChildTreeItemsReadonlyHtml(to.Value, db, children, false, false);
                            var lastChild = children.LastOrDefault();

                            var previousSibling = db.TreeItems.FirstOrDefault(x => x.NextSiblingId == from);
                            if (previousSibling != null)
                            {
                                previousSibling.NextSiblingId = fromItem.NextSiblingId;
                                db.SaveChanges();
                            }
                            fromItem.ParentId = toItem.Id;
                            fromItem.NextSiblingId = null;
                            if (lastChild != null) lastChild.NextSiblingId = fromItem.Id;
                            db.SaveChanges();
                        }
                        break;
                    case "siblings":
                        {
                            var previousSibling = db.TreeItems.FirstOrDefault(x => x.NextSiblingId == from);
                            if (previousSibling != null)
                            {
                                previousSibling.NextSiblingId = fromItem.NextSiblingId;
                                db.SaveChanges();
                            }

                            fromItem.ParentId = toItem.ParentId;
                            fromItem.NextSiblingId = toItem.NextSiblingId;
                            toItem.NextSiblingId = fromItem.Id;

                            db.SaveChanges();
                        }
                        break;
                    default: throw new ArgumentException("invalid moveType: " + moveType);
                }

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