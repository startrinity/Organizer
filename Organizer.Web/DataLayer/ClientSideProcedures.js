// is included from OrganizerControl.ascx

function DataObjectFromXml(xmlElement) {
    var result = {};
    var children = xmlElement.children;
    if (!children) children = xmlElement.childNodes; // IE
    var propertyNames = [];
    for (var i = 0, max = children.length; i < max; i++) { // enumerate all property elements
        var propertyElement = children[i];
        var name = propertyElement.getAttribute('name');
        var value = propertyElement.innerHTML || propertyElement.text;
        
        result[name] = (value || "") // otherwise it will be 'undefined'
            .replace('&amp;', '&')
            .replace('&lt;', '<')
            .replace('&gt;', '>')
            .replace('&quot;', '"')
            .replace('&apos;', ";");
        propertyNames.push(name);
    }
    result.propertyNames = propertyNames;
    return result;
}
function DataObjectToXml(obj) {
    var r = "<item>";
    for (var i = 0, max = obj.propertyNames.length; i < max; i++) { // enumerate all property elements
        var propertyName = obj.propertyNames[i];
        var value = obj[propertyName];
        value = value.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        r += "<p name='" + propertyName + "'>" + value + "</p>";
    }
    r += "</item>";
    return r;
}


function HandleEditorTextChange(editor, changeHandler) {
    if (!window.addEventListener) { // if IE
         editor.attachEvent('onpropertychange', function(e) { 
           if (e.propertyName === 'value') {
             changeHandler(editor);
           }
        });
    }
    else editor.onkeyup = function(e) { changeHandler(e.target); };
}

function ClearAllChildren(parentUiElement) {
    while (parentUiElement.firstChild) parentUiElement.removeChild(parentUiElement.firstChild);
}
function ClearAllChildrenAndAppend(parentUiElement, newChild) {
    while (parentUiElement.firstChild) parentUiElement.removeChild(parentUiElement.firstChild);
    parentUiElement.appendChild(newChild);
}
function ClearAllChildrenAndAppendText(parentUiElement, newChildText) {
    ClearAllChildrenAndAppend(parentUiElement, document.createTextNode(newChildText));
}