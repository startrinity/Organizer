using System;
using System.Collections;
using System.Collections.Generic;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Web;

namespace Organizer.Web.DataLayer
{
    /// <summary>
    /// returns this item and all children recursively, in the display order
    /// </summary>
    public class GetTreeItems : IHttpHandler
    {
        /// <summary>
        ///  sorts items according to NextSiblingId
        /// </summary>
        static LinkedList<TreeItem> SortSiblings(List<TreeItem> list, bool fixNextSiblingId = false, OrganizerEntities db = null)
        {
            var r = new LinkedList<TreeItem>();

            var nonEndingItemsByNextSiblingId = new Dictionary<Guid, TreeItem>();
            foreach (var treeItem in list)
            {
                if (treeItem.NextSiblingId == null || nonEndingItemsByNextSiblingId.ContainsKey(treeItem.NextSiblingId.Value))
                    r.AddLast(treeItem);
                else nonEndingItemsByNextSiblingId.Add(treeItem.NextSiblingId.Value, treeItem);
            }

            if (r.First != null)
            {
                for (var enumeratedEndingItem = r.First;;)
                {
                    var searchedNextSiblingId = enumeratedEndingItem.Value.Id;
                    var nextSiblingItemNode = enumeratedEndingItem;

                _search_previous_sibling:
                    TreeItem foundTreeItem;
                    if (nonEndingItemsByNextSiblingId.TryGetValue(searchedNextSiblingId, out foundTreeItem))
                    {
                        nonEndingItemsByNextSiblingId.Remove(searchedNextSiblingId);
                        nextSiblingItemNode = r.AddBefore(nextSiblingItemNode, foundTreeItem);
                        searchedNextSiblingId = foundTreeItem.Id;
                        goto _search_previous_sibling;
                    }

                    if (enumeratedEndingItem.Next == null) break;
                    enumeratedEndingItem = enumeratedEndingItem.Next;
                }

            }
            foreach (var item in nonEndingItemsByNextSiblingId.Values)
                r.AddLast(item);

            if (fixNextSiblingId)
            {
                if (db == null) throw new ArgumentNullException();
                TreeItem previousTI = null;
                foreach (var treeItem in r)
                {
                    if (previousTI != null && previousTI.NextSiblingId != treeItem.Id)
                    {
                        previousTI.NextSiblingId = treeItem.Id;
                        db.SaveChanges();
                    }
                    previousTI = treeItem;
                }
                if (previousTI != null && previousTI.NextSiblingId.HasValue) // last item must have NextSiblingId = null
                {
                    previousTI.NextSiblingId = null;
                    db.SaveChanges();
                }
            }

            return r;
        }

        

        public static string RenderTreeItemsReadonly(OrganizerEntities db, TreeItem rootItem)
        {
            var itemsHtml = new StringBuilder();
            var items = new List<TreeItem>();
            if (rootItem != null)
            {
                itemsHtml.AppendFormat("<h4>{0}</h4>", rootItem.Text);
                items.Add(rootItem);
                GetChildTreeItemsReadonlyHtml(rootItem.Id, db, items, true, true, itemsHtml);
            }

            return itemsHtml.ToString();
        }
        static string RemovePrivateText(string itemText)
        {
            if (String.IsNullOrEmpty(itemText)) return "";
            const char startMarker = '{';
            const char endMarker = '}';
            var r = new StringBuilder();
            foreach (var str in itemText.Split(startMarker))
            {
                var endMarkerIndex = str.IndexOf(endMarker);
                r.Append(str.Substring(endMarkerIndex+1));
            }
            return r.ToString();
        }
        public static void GetChildTreeItemsReadonlyHtml(Guid parentId, OrganizerEntities db, List<TreeItem> result, bool fixNextSiblingId = false, bool recursive = true, StringBuilder htmlOutput = null, bool getAllItems = false)
        {
#if DEBUG2
            if (result.Count > 100) return;
#endif
            var items = SortSiblings(db.TreeItems.Where(x => x.ParentId == parentId).ToList(), fixNextSiblingId, db);
            result.AddRange(items);
            if (htmlOutput != null) htmlOutput.Append("<ul>");

            foreach (var item in items)
            {
                if (getAllItems || item.ShareRead != false)
                {
                    if (htmlOutput != null)
                    {
                        htmlOutput.AppendFormat("<li>{0}", RemovePrivateText(item.Text));
                    }
                    if (recursive)
                    {
                        if (getAllItems || item.AutoLoadNestedChildrenIfNotRoot)
                            GetChildTreeItemsReadonlyHtml(item.Id, db, result, fixNextSiblingId, true, htmlOutput);
                        else
                        {
                            if (db.TreeItems.Any(x => x.ParentId == item.Id))
                                item.Text += " [...children]";
                        }
                    }
                    if (htmlOutput != null) htmlOutput.Append("</li>");                   
                }
            }
            if (htmlOutput != null) htmlOutput.Append("</ul>");

        }
        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "text/xml";

            var acceptEncoding = context.Request.Headers["Accept-Encoding"];
            if (!string.IsNullOrEmpty(acceptEncoding))
            {
                // The two common compression formats in web are GZip and Deflate
                if (acceptEncoding.IndexOf("gzip", StringComparison.OrdinalIgnoreCase) > -1)
                {
                    // Read the response using a GZip compressor ,   and replace the output with compressed result
                    context.Response.Filter = new GZipStream(context.Response.Filter, CompressionMode.Compress);
                    // Tell the client the ouput they got is compressed in GZip
                    context.Response.AppendHeader("Content-Encoding", "gzip");
                }
                else if (acceptEncoding.IndexOf("deflate", StringComparison.OrdinalIgnoreCase) > -1)
                {
                    // Read the response using a Deflate compressor ,   and replace the output with compressed result
                    context.Response.Filter = new DeflateStream(context.Response.Filter, CompressionMode.Compress);
                    // Tell the client the ouput they got is compressed in Deflate
                    context.Response.AppendHeader("Content-Encoding", "deflate");
                }
            }
            

            var rootTreeItemId = Guid.Parse(context.Request["rootTreeItemId"]);
            var result = new List<TreeItem>();
            AuthEntity user = null;
            using (var db = new OrganizerEntities())
            {
                var item = db.TreeItems.FirstOrDefault(x => x.Id == rootTreeItemId);
                if (item != null)
                {
                    user = CustomMembershipProvider.ValidateAccessToTreeItem_ReturnActiveAuthEntity(item, db, false);
                    user.LastActiveAtUtc = DateTime.UtcNow;
                    db.SaveChanges();

                    result.Add(item);
                    GetChildTreeItemsReadonlyHtml(item.Id, db, result, true, true);
                }
            }
            if (result.Count != 0 && user != null)
                context.Response.Write(ServerSideProcedures.ItemsListToXml(result[0], result, 
                   null// (x) => new Dictionary<string, string> {{"IsSelected", ((TreeItem)x).Id == user.SelectedTreeItemId ? "True" : "False"}}
                    ));
        }

        public bool IsReusable
        {
            get
            {
                return true;
            }
        }

    }
}