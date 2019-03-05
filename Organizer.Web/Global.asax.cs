using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Web;
using System.Web.Routing;
using Organizer.Web.DataLayer;

namespace Organizer.Web
{
    public class Global : System.Web.HttpApplication
    {
        protected void Application_Start(object sender, EventArgs e)
        {
        }
        protected void Session_Start(object sender, EventArgs e)
        {

        }
        protected void Application_BeginRequest(object sender, EventArgs e)
        {
        }
        protected void Application_AuthenticateRequest(object sender, EventArgs e)
        {
        }
        protected void Application_EndRequest(object sender, EventArgs e)
        {
        }

        protected void Application_Error(object sender, EventArgs e)
        {
            //try
            //{
            //    if (Request.Url.ToString().IgnoreThisRequestUrl()) return;

            //    var exception = Server.GetLastError().GetBaseException();

            //    if (!exception.Message.Contains("A potentially dangerous"))
            //    {
            //        HandleException(exception);
            //    }

            //    //EventLog.WriteEntry("Sample_WebApp", err, EventLogEntryType.Error);
            //    Server.ClearError();
            //}
            //catch
            //{
            //}
        }

        protected void Session_End(object sender, EventArgs e)
        {

        }
        public static void HandleException(Exception exc)
        {
        //    if (!exc.Message.Contains("A potentially dangerous") &&
        //              !exc.Message.Contains("Attempted to perform an unauthorized operation") &&
        //              !exc.Message.Contains("Could not load type 'IsapiModule'") &&
        //              !exc.Message.Contains("The input is not a valid Base-64 string as it contains a non-base 64 character") &&
        //              !exc.Message.Contains("IsapiModule") &&
        //              !exc.Message.Contains("Guid should contain 32 digits with 4 dashes")
        //        )
        //        EmailSender.SendToDeveloper("MyWorkState.com - Unhandled exception in ASP.NET",
        //                    String.Format("UTC time: {0}\r\nURL: {1}\r\nReferrer: {2}\r\nClient IP address: {3}\r\nException data: {4}",
        //                    DateTime.UtcNow, HttpContext.Current.Request.Url, HttpContext.Current.Request.UrlReferrer,
        //                    HttpContext.Current.Request.ServerVariables["REMOTE_ADDR"], exc)
        //                );
        }

        protected void Application_End(object sender, EventArgs e)
        {
            //try
            //{
            //    //if (Request.Url.ToString().IgnoreThisRequestUrl()) return;

            //    var exception = Server.GetLastError().GetBaseException();
            //    HandleException(exception);
               
            //    Server.ClearError();
            //}
            //catch
            //{
            //}
        }
        public static bool RequireHttps()
        {
            if (HttpContext.Current.Request.IsSecureConnection == false && HttpContext.Current.Request.IsLocal == false)
            {
                HttpContext.Current.Response.Redirect("https://" + HttpContext.Current.Request.ServerVariables["HTTP_HOST"] + HttpContext.Current.Request.RawUrl);
                return false;
            }
            return true;
        }
    }
}