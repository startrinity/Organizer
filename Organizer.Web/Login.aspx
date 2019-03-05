<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Login.aspx.cs" Inherits="Organizer.Web.Login" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    <form runat="server">
        <asp:Login ID="Login1" runat="server" OnLoggedIn="Login_OnLoggedIn"></asp:Login>
        <a href="/SignUp23.aspx">sign up</a>
    </form>
</asp:Content>
