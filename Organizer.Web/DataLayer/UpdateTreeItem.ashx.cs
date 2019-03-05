using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Xml.Linq;

namespace Organizer.Web.DataLayer
{
    public class UpdateTreeItem : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            using (var reader = new StreamReader(context.Request.InputStream))
            {
                var xml = XDocument.Parse(reader.ReadToEnd());
                reader.Close();

                var id = Guid.Parse(xml.Root.Elements().First(e => (string)e.Attribute("name") == "Id").Value);
                using (var db = new OrganizerEntities())
                {
                    var item = db.TreeItems.Find(id);
                    if (item == null) throw new Exception("item is not found by ID = " + id);
                    CustomMembershipProvider.ValidateAccessToTreeItem_ReturnActiveAuthEntity(item, db, true);
                    ServerSideProcedures.XmlToItem(item, xml.Root, "LastModifiedUtc", "IsSelected", "Id", "ParentId", "NextSiblingId");
                    item.LastModifiedUtc = DateTime.UtcNow;
                    db.SaveChanges();
                }

                context.Response.ContentType = "text/plain";
                context.Response.Write("OK");
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