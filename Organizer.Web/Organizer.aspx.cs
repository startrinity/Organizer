using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using Organizer.Web.DataLayer;

namespace Organizer.Web
{
    public partial class Organizer : System.Web.UI.Page
    {
        TreeItem GetTopRootItem(OrganizerEntities db, TreeItem item)
        {
            if (item == null) throw new ArgumentNullException();
            if (item.ParentId == null) return item;
            return GetTopRootItem(db, db.TreeItems.FirstOrDefault(x => x.Id == item.ParentId));
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            Global.RequireHttps();

            var rootTreeItemStr = Request["RootTreeItemId"];

            using (var db = new OrganizerEntities())
            {

                AuthEntity currentlyLoggedInUser = null;
                if (Request.IsAuthenticated)
                    currentlyLoggedInUser = db.AuthEntities.First(x => x.UserName == HttpContext.Current.User.Identity.Name);
                
                TreeItem rootTreeItem = null;
                bool writeAccess = false, readAccess = false;
                if (String.IsNullOrEmpty(rootTreeItemStr))
                {
                    if (currentlyLoggedInUser == null)
                    {
                        Response.Redirect("/Login.aspx?url=" + HttpUtility.UrlEncode(Request.Url.ToString()));
                        return;
                    }
                    rootTreeItem = db.TreeItems.First(x => x.AuthEntityId == currentlyLoggedInUser.Id && x.ParentId == null);
                    CustomMembershipProvider.ValidateAccessToTreeItem_ReturnActiveAuthEntity(rootTreeItem, db, true);
                    writeAccess = true;
                }
                else
                {
                    var rootTreeItemId = Guid.Parse(rootTreeItemStr);
                    rootTreeItem = db.TreeItems.Find(rootTreeItemId);
                    if (currentlyLoggedInUser != null)
                    {
                        // if currently logged in user is not equal to root tree item's user then we try to get readonly access
                        if (currentlyLoggedInUser.Id != GetTopRootItem(db, rootTreeItem).AuthEntityId && rootTreeItem.ShareRead == true)
                        {
                            CustomMembershipProvider.ValidateAccessToTreeItem_ReturnActiveAuthEntity(rootTreeItem, db, false);
                            readAccess = true;
                        }
                        else
                        {
                            CustomMembershipProvider.ValidateAccessToTreeItem_ReturnActiveAuthEntity(rootTreeItem, db, true);
                            writeAccess = true;
                        }
                    }
                    else
                    {
                        if (rootTreeItem.ShareWrite == true) writeAccess = true;
                        if (rootTreeItem.ShareRead == true) readAccess = true;
                    }
                }

                titleElement.InnerText = rootTreeItem.Text;
                
                if (writeAccess) organizer.RootTreeItemId = rootTreeItem.Id.ToString();
                else if (readAccess)
                {
                    readonlyDisplay.InnerHtml = GetTreeItems.RenderTreeItemsReadonly(db, rootTreeItem);
                }
                else
                {
                    Response.Redirect("/Login.aspx?url=" + HttpUtility.UrlEncode(Request.Url.ToString()));
                }
            }
        }
    }
}