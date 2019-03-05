using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Organizer.Web.DataLayer;

namespace Organizer.Web
{
    public partial class SignUp23 : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void RegisterUser(object sender, EventArgs e)
        {
            try
            {
                using (var db = new OrganizerEntities())
                {
                    var userNameAndEmail = txtEmail.Text;
                    var password = txtPassword.Text;
                    var passwordConfirmation = txtConfirmPassword.Text;
                    if (password != passwordConfirmation)
                    {
                        result.Text = "Passwords don't match";
                        result.ForeColor = Color.Red;
                        return;
                    }
                    if (db.AuthEntities.Any(x => x.UserName == userNameAndEmail))
                    {
                        result.Text = String.Format("User '{0}' already exists in database", userNameAndEmail);
                        result.ForeColor = Color.Red;
                        return;
                    }

                    var newUser = new AuthEntity
                        {
                            Id = Guid.NewGuid(),
                            Password = password,
                            UserName = userNameAndEmail,
                            RegisteredAtUtc = DateTime.UtcNow,
                            LastActiveAtUtc = DateTime.UtcNow,
                            RegisteredFromIpAddress = HttpContext.Current.Request.ServerVariables["REMOTE_ADDR"]
                        };
                    db.AuthEntities.Add(newUser);
                    db.SaveChanges();

                    db.TreeItems.Add(new TreeItem
                        {
                            AuthEntityId = newUser.Id,
                            Id = Guid.NewGuid(),
                            CreatedUtc = DateTime.UtcNow,
                            IsCollapsed = false,
                            LastModifiedUtc = DateTime.UtcNow,
                            ParentId = null,
                            NextSiblingId = null,
                            Text = "root item (click here to rename and to add child items)"
                        });
                    db.SaveChanges();

                    result.Text = "Thank you for registration";
                    result.ForeColor = Color.Green;
                    

                }
            }
            catch (Exception exc)
            {
                Global.HandleException(exc);
                result.Text = "An error occured. Please contact technical support";
                result.ForeColor = Color.Red;
                return;
            }
            Response.Redirect("Login.aspx");
        }
    }
}