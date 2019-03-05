using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using Organizer.Web.DataLayer;

namespace Organizer.Web
{
    public class CustomMembershipProvider : MembershipProvider
    {
        static TreeItem GetRootTreeItem(TreeItem treeItem, OrganizerEntities db)
        {
            if (treeItem.AuthEntityId != null) return treeItem;
            if (treeItem.ParentId == null) throw new UnauthorizedAccessException();
            var parentItem = db.TreeItems.Find(treeItem.ParentId.Value);
            return GetRootTreeItem(parentItem, db);
        }
        static TreeItem GetRootTreeItemToValidateAccess(TreeItem treeItem, OrganizerEntities db, AuthEntity currentAuthenticatedAuthEntity)
        {
            if (treeItem.AuthEntityId != null) return treeItem;
            if (currentAuthenticatedAuthEntity == null)
            {
                if (treeItem.ShareRead == true || treeItem.ShareWrite == true) return treeItem;
            }
            if (treeItem.ParentId == null) throw new UnauthorizedAccessException();
            var parentItem = db.TreeItems.Find(treeItem.ParentId.Value);
            return GetRootTreeItemToValidateAccess(parentItem, db, currentAuthenticatedAuthEntity);
        }
        /// <summary>
        /// throws exception if access is denied
        /// </summary>
        /// <param name="treeItem">tree item which is being accessed</param>
        /// <param name="db"></param>
        /// <param name="write">which kind of access we need: read or write (read for readonly links) (write=false)</param>
        /// <returns>AuthEntity (user account record) to set LastActiveAtUtc field (to avoid deletion of account and its tree items on idle timer expiry)</returns>
        public static AuthEntity ValidateAccessToTreeItem_ReturnActiveAuthEntity(TreeItem treeItem, OrganizerEntities db, bool write)
        {
            AuthEntity currentAuthenticatedAuthEntity = null;
            if (HttpContext.Current.Request.IsAuthenticated) currentAuthenticatedAuthEntity = db.AuthEntities.First(x => x.UserName == HttpContext.Current.User.Identity.Name);
           
            // go to first parent item with not-null authEntityId
            var rootItem = GetRootTreeItemToValidateAccess(treeItem, db, currentAuthenticatedAuthEntity);

            if (currentAuthenticatedAuthEntity == null)
            {
                if (write)
                {
                    if (rootItem.ShareWrite == null || rootItem.ShareWrite == false)
                        throw new UnauthorizedAccessException("drf sdf sgdfg");
                }
                else
                {
                    if (rootItem.ShareRead == null || rootItem.ShareRead == false)
                        throw new UnauthorizedAccessException("23451234x52345");
                }
                
                return GetRootTreeItem(rootItem, db).AuthEntity;
            }
            else
            {
                // if we access root item with ShareRead == true  then we don't need to do any authentication
                if (treeItem.ShareRead == true && write == false)
                {
                    // here we have 2 accounts to mark as active: currentAuthenticatedAuthEntity (currently logged in user) 
                    //        or   GetRootTreeItem(rootItem, db).AuthEntity   (user who shared the link)
                    return GetRootTreeItem(rootItem, db).AuthEntity;
                }

                if (rootItem.AuthEntityId != currentAuthenticatedAuthEntity.Id)
                     throw new UnauthorizedAccessException("sdfs dgsdfg234234  rootItem.ShareRead = " + rootItem.ShareRead + "  write=" + write);
                return currentAuthenticatedAuthEntity;
            }
        }

        public override MembershipUser CreateUser(string username,
           string password, string email, string passwordQuestion,
           string passwordAnswer, bool isApproved,
           object providerUserKey, out MembershipCreateStatus status)
        {
            throw new NotImplementedException();
        }

        public override MembershipUser GetUser(string username, bool userIsOnline)
        {
            throw new NotImplementedException();
        }

        public override bool ValidateUser(string username, string password)
        {
            using (var db = new OrganizerEntities())
                return db.AuthEntities.Any(x => x.UserName == username && x.Password == password);
        }

        public override int MinRequiredPasswordLength
        {
            get { throw new NotImplementedException(); }
        }

        public override bool RequiresUniqueEmail
        {
            get { throw new NotImplementedException(); }
        }

        public override string ApplicationName
        {
            get
            {
                throw new NotImplementedException();
            }
            set
            {
                throw new NotImplementedException();
            }
        }

        public override bool ChangePassword(string username, string oldPassword, string newPassword)
        {
            throw new NotImplementedException();
        }

        public override bool ChangePasswordQuestionAndAnswer(string username, string password, string newPasswordQuestion, string newPasswordAnswer)
        {
            throw new NotImplementedException();
        }

        public override bool DeleteUser(string username, bool deleteAllRelatedData)
        {
            throw new NotImplementedException();
        }

        public override bool EnablePasswordReset
        {
            get { throw new NotImplementedException(); }
        }

        public override bool EnablePasswordRetrieval
        {
            get { throw new NotImplementedException(); }
        }

        public override MembershipUserCollection FindUsersByEmail(string emailToMatch, int pageIndex, int pageSize, out int totalRecords)
        {
            throw new NotImplementedException();
        }

        public override MembershipUserCollection FindUsersByName(string usernameToMatch, int pageIndex, int pageSize, out int totalRecords)
        {
            throw new NotImplementedException();
        }

        public override MembershipUserCollection GetAllUsers(int pageIndex, int pageSize, out int totalRecords)
        {
            throw new NotImplementedException();
        }

        public override int GetNumberOfUsersOnline()
        {
            throw new NotImplementedException();
        }

        public override string GetPassword(string username, string answer)
        {
            throw new NotImplementedException();
        }

        public override MembershipUser GetUser(object providerUserKey, bool userIsOnline)
        {
            throw new NotImplementedException();
        }

        public override string GetUserNameByEmail(string email)
        {
            throw new NotImplementedException();
        }

        public override int MaxInvalidPasswordAttempts
        {
            get { throw new NotImplementedException(); }
        }

        public override int MinRequiredNonAlphanumericCharacters
        {
            get { throw new NotImplementedException(); }
        }

        public override int PasswordAttemptWindow
        {
            get { throw new NotImplementedException(); }
        }

        public override MembershipPasswordFormat PasswordFormat
        {
            get { throw new NotImplementedException(); }
        }

        public override string PasswordStrengthRegularExpression
        {
            get { throw new NotImplementedException(); }
        }

        public override bool RequiresQuestionAndAnswer
        {
            get { throw new NotImplementedException(); }
        }

        public override string ResetPassword(string username, string answer)
        {
            throw new NotImplementedException();
        }

        public override bool UnlockUser(string userName)
        {
            throw new NotImplementedException();
        }

        public override void UpdateUser(MembershipUser user)
        {
            throw new NotImplementedException();
        }
    }
}