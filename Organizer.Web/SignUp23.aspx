<%@ Page Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="SignUp23.aspx.cs" Inherits="Organizer.Web.SignUp23" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <title>StarTrinity Organizer - register new user</title>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    <h3>Registration</h3>
    
    <form id="Form1" runat="server">
        <table>
            <tr>
                <td>
                    Email
                </td>
                <td>
                    <asp:TextBox ID="txtEmail" runat="server" />
                </td>
                <td>
                    <asp:RequiredFieldValidator ID="RequiredFieldValidator3" ErrorMessage="Required" Display="Dynamic" ForeColor="Red"
                        ControlToValidate="txtEmail" runat="server" />
                    <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" Display="Dynamic" ValidationExpression="\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*"
                        ControlToValidate="txtEmail" ForeColor="Red" ErrorMessage="Invalid email address." />
                </td>
            </tr>
            <tr>
                <td>
                    Password
                </td>
                <td>
                    <asp:TextBox ID="txtPassword" runat="server" TextMode="Password" />
                </td>
                <td>
                    <asp:RequiredFieldValidator ID="RequiredFieldValidator2" ErrorMessage="Required" ForeColor="Red" ControlToValidate="txtPassword"
                        runat="server" />
                </td>
            </tr>
            <tr>
                <td>
                    Confirm Password
                </td>
                <td>
                    <asp:TextBox ID="txtConfirmPassword" runat="server" TextMode="Password" />
                </td>
                <td>
                   
                </td>
            </tr>
   
            <tr>
                <td>
                </td>
                <td>
                    <asp:Button ID="Button1" CausesValidation="True" Text="Submit" runat="server" OnClick="RegisterUser" />
                </td>
                <td>
                </td>
            </tr>
        </table>
        <asp:Label runat="server" ID="result"></asp:Label>
        
    </form>
</asp:Content>
