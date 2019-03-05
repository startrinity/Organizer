// is included from OrganizerControl.ascx

function GetTreeItems(rootTreeItemId, callback) { // callback (items list or null if error)   // returned list of tree item has 1st element = root, and next items = children, hierarchical
    var request = new XMLHttpRequest();
    var url = '/DataLayer/GetTreeItems.ashx' + '?rnd=' + (Math.random() + 1).toString(36).substring(7) + '&rootTreeItemId=' + rootTreeItemId;
    request.open('GET', url, true);  // rnd against caching in IE8
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            if (request.status == 200) {

                if (!request.responseXML || !request.responseXML.documentElement) { callback(null); return; }
                var children = request.responseXML.documentElement.children;
                if (!children) children = request.responseXML.documentElement.childNodes; // IE
                var result = [];
                for (var i = 0, max = children.length; i < max; i++)
                    result.push(DataObjectFromXml(children[i]));
                callback(result);
            } // status==200
            else callback(null);
        } // readyState == 4
    }; // onreadystatechange
    request.send(null);
}

function UpdateTreeItem(treeItem, callbackOK, callbackError) {
    if (treeItem == null) {
        callbackOK();
        return;
    }

    var request = new XMLHttpRequest();  
    request.open('POST', '/DataLayer/UpdateTreeItem.ashx', true);  
    request.send(DataObjectToXml(treeItem)); 
    request.onreadystatechange = function() { 
        if (request.readyState == 4) { 
            if (request.status == 200 && request.responseText.indexOf('OK') == 0) {
                if (callbackOK) callbackOK();
            } else { 
                if (callbackError) callbackError(); 
            } 
        } 
    };
}

function MoveTreeItem(fromId, toId, moveType, // top, bottom, children, siblings
      callbackOK, callbackError) {
    var request = new XMLHttpRequest();
    request.open('GET', '/DataLayer/MoveTreeItem.ashx?from=' + fromId + '&to=' + toId + '&moveType=' + moveType, true);
    request.send(null);
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            if (request.status == 200 && request.responseText.indexOf('OK') == 0) {
                callbackOK();
            } else {
                callbackError(request.responseText);
            }
        }
    };
}

function InsertTreeItem_Sibling(thisTreeItemId, callbackOK, callbackError) { // callbackOK(newInsertedTreeItem)

    var request = new XMLHttpRequest();
    request.open('GET', '/DataLayer/InsertTreeItem_Sibling.ashx?thisTreeItemId=' + thisTreeItemId, true);
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            if (request.status == 200) {
                if (!request.responseXML || !request.responseXML.documentElement) { callbackError(); return; }
                callbackOK(DataObjectFromXml(request.responseXML.documentElement));
            } else {
                callbackError();
            }
        }
    };
}
function InsertTreeItem_Child(thisTreeItemId, callbackOK, callbackError) { // callbackOK(newInsertedTreeItem)

    var request = new XMLHttpRequest();
    request.open('GET', '/DataLayer/InsertTreeItem_Child.ashx?thisTreeItemId=' + thisTreeItemId, true);
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            if (request.status == 200) {
                if (!request.responseXML || !request.responseXML.documentElement) { callbackError(); return; }
                callbackOK(DataObjectFromXml(request.responseXML.documentElement));
            } else {
                callbackError();
            }
        }
    };
}
function DeleteTreeItem(treeItemId, callbackOK, callbackError) {
    var request = new XMLHttpRequest();
    request.open('GET', '/DataLayer/DeleteTreeItem.ashx?treeItemId=' + treeItemId, true);
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            if (request.status == 200 && request.responseText.indexOf('OK') == 0) {
                callbackOK();
            } else {
                callbackError(request.responseText);
            }
        }
    };
}