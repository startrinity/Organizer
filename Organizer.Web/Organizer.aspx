<%@ Page Language="C#" MasterPageFile="~/Compact.Master" AutoEventWireup="true" CodeBehind="Organizer.aspx.cs" Inherits="Organizer.Web.Organizer" %>
<%@ Register TagPrefix="my" tagname="Organizer" Src="OrganizerControl.ascx" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <title runat="server" ID="titleElement">StarTrinity Organizer</title>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    <my:Organizer runat="server" ID="organizer" />
    <div runat="server" ID="readonlyDisplay"></div>
</asp:Content>
