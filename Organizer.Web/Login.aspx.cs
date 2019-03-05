using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace Organizer.Web
{
    public partial class Login : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Global.RequireHttps();
        }

        protected void Login_OnLoggedIn(object sender, EventArgs e)
        {
            var urlParam = Request.QueryString["url"];
            var newUrl = !String.IsNullOrEmpty(urlParam) ? urlParam : "/Organizer.aspx";
            Response.Redirect(newUrl);
        }
    }
}