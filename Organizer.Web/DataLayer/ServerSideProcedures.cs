using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Web;
using System.Xml.Linq;

namespace Organizer.Web.DataLayer
{
    public static class ServerSideProcedures
    {
        public static string ItemsListToXml(object firstObj, IEnumerable<object> list, Func<object, Dictionary<string,string>> extraPropertiesCallback = null)
        {
            var sb = new StringBuilder();
            sb.Append("<list>");
            var type = firstObj.GetType();
            var typeName = type.Name;
            var properties = type.GetProperties();

            foreach (var o in list)
                sb.Append(DataObjectToXml(typeName, properties, o, extraPropertiesCallback));
            
            sb.Append("</list>");
            return sb.ToString();
        }
        public static string DataObjectToXml(object o)
        {
            var type = o.GetType();
            var typeName = type.Name;
            var properties = type.GetProperties();
            return DataObjectToXml(typeName, properties, o);
        }
        static string EscapeXml(object obj)
        {
            if (obj == null) return "";
            var escaped = new System.Xml.Linq.XText(obj.ToString()).ToString();
            return escaped;
        }
        public static string DataObjectToXml(string typeName, PropertyInfo[] properties, object o, Func<object, Dictionary<string, string>> extraPropertiesCallback = null)
        {
            var sb = new StringBuilder();

            sb.Append("<item>");
            foreach (var p in properties)
            {
                if (p.Name == "AuthEntities") continue; // don't know how to avoid hardcoding here
                if (p.Name.StartsWith("AuthEntity")) continue; // don't know how to avoid hardcoding here
                if (p.PropertyType.IsSubclassOf(typeof(IEnumerable))) continue;
                if (p.PropertyType.IsGenericType &&
                    p.PropertyType.GetGenericTypeDefinition() == typeof(IEnumerable<>)) continue;
                if (p.PropertyType.IsGenericType &&
                    p.PropertyType.GetGenericTypeDefinition() == typeof(ICollection<>)) continue;
                if (typeName.StartsWith(p.PropertyType.Name)) continue; // e.g. 'TreeItem1' FK-generated property
                sb.AppendFormat("<p name='{0}'>{1}</p>", p.Name, EscapeXml(p.GetValue(o, new object[] { })));
            }
            if (extraPropertiesCallback != null)
            {
                var extraProperties = extraPropertiesCallback(o);
                foreach (var kv in extraProperties)
                {
                    sb.AppendFormat("<p name='{0}'>{1}</p>", kv.Key, EscapeXml(kv.Value));
                }
            }
            sb.Append("</item>");
          
            return sb.ToString();
        }

        public static T XmlToItem<T>(XElement e)
        {
            var r = default(T);
            XmlToItem(r, e);
            return r;
        }
        public static void XmlToItem<T>(T r, XElement e, params string[] ignoredPropertyNames)
        {
            var type = typeof(T);
            foreach (var propertyElement in e.Elements())
            {
                var propertyName = (string) propertyElement.Attribute("name");
                if (ignoredPropertyNames.Contains(propertyName)) continue;
                var p = type.GetProperty(propertyName);
                if (String.Format("{0}", p.GetValue(r, new object[] { })) != propertyElement.Value)
                {
                    if (p.PropertyType == typeof(Guid?))
                    {
                        p.SetValue(r,
                            propertyElement.Value != "" ? (Guid?)Guid.Parse(propertyElement.Value) : null,
                            new object[] { });
                    }
                    else if (p.PropertyType == typeof(bool?))
                    {
                        p.SetValue(r,
                            propertyElement.Value != "" ? (bool?)bool.Parse(propertyElement.Value) : null,
                            new object[] { });
                    }
                    else
                        p.SetValue(r,
                            p.PropertyType == typeof(string) ? (object)propertyElement.Value : (object)Convert.ChangeType(propertyElement.Value, p.PropertyType),
                            new object[] { });
                }
            }
        }
    }
}