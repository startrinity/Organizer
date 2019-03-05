using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace Organizer.Web
{
    public partial class Compact : System.Web.UI.MasterPage
    {
        protected void Page_Load(object sender, EventArgs e)
        {
#if DEBUG
            debugModeWarning.Text = " (DEBUG mode)";
#endif
            loggedInSpan.Visible = Request.IsAuthenticated;
            loggedOutSpan.Visible = !Request.IsAuthenticated;
            
            if (HttpContext.Current.Request.IsAuthenticated)
            {
                loggedInAs.Text =  HttpContext.Current.User.Identity.Name;
            }
        }
    }
}