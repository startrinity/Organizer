using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Organizer.Web.DataLayer;

namespace Organizer.Web
{
    public partial class OrganizerControl : System.Web.UI.UserControl
    {
        public string RootTreeItemId { get; set; }
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!String.IsNullOrEmpty(RootTreeItemId))
            {
                this.scriptContainer.InnerHtml = String.Format(
                    "<div id='{1}'></div><script type='text/javascript'>InitializeOrganizer('{0}', document.getElementById('{1}'));</script>",
                    RootTreeItemId,
                    Guid.NewGuid());
            }
        }
    }
}