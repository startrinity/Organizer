// is included from OrganizerControl.ascx
// uses DataLayer/TreeItem.js
// uses DataLayer/ClientSideProcedures.js

/*
objects:
CommonObjects - contains objects which are accessible from everywhere; is created in InitializeOrganizer()
  properties: .treeItems (used to check if item has children) (may contain invalid order of items, if reordered)
              .container - HTML element where root TreeItem UI element is placed
              .rootTreeItemId
              .draggedUiElement   .displayedMoveToChildrenSpan   .displayedMoveToSiblingsSpan
             
TreeItem - loaded record from database table. has equally same properties as in database
(TreeItem)UiElement - a 'div' which is associated with TreeItem. Contains child element inside. Displays and edits ".Text"                   
    properties:       .treeItem        .textDisplay   .textEditor     .addMultipleChildrenUiContainer(span)           .childrenContainer    .commonObjects
      UI parts: textDisplay, textEditor (hidden), statusDisplay (empty span)
                moveToChildren, moveToSiblings (indicate drag&drop action at drop target)
  
 common panel UI element: collapseAll, expandAll
*/
function FindTreeItem(treeItems, treeItemId) {
    for (var i = 0, max = treeItems.length; i < max; i++)
        if (treeItems[i].Id == treeItemId)
            return treeItems[i];
    throw "can't find item by ID = " + treeItemId;
}

//#region UiElement procedures: menu item's handlers
function UiElement_AddFirstChildUiElement(parentUiElement, childUiElement) {
    if (parentUiElement.childrenContainer.firstChild) {
        if (parentUiElement.addNewItemUiElement) parentUiElement.childrenContainer.insertBefore(childUiElement, parentUiElement.addNewItemUiElement.nextSibling);
        else parentUiElement.childrenContainer.insertBefore(childUiElement, parentUiElement.childrenContainer.firstChild);
    }
    else parentUiElement.childrenContainer.appendChild(childUiElement);
}
function UiElement_AddNextSibling_BeginEditing(uiElement) {
    ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'adding new...');
    InsertTreeItem_Sibling(uiElement.treeItem.Id, function (insertedTreeItem) {
        uiElement.commonObjects.treeItems.push(insertedTreeItem);
        ClearAllChildren(uiElement.statusDisplay);
        var newUiElement = document.createElement('div');
        newUiElement.commonObjects = uiElement.commonObjects;
        UiElement_CreateOrUpdate(newUiElement, insertedTreeItem);
        if (uiElement.nextSibling) uiElement.parentNode.insertBefore(newUiElement, uiElement.nextSibling);
        else uiElement.parentNode.appendChild(newUiElement);
        TextEditor_OnEdit(newUiElement);
    }, function() {
        ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'error');
    });
}
function UiElement_AddChild_BeginEditing(uiElement) {
    ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'adding new...');
    InsertTreeItem_Child(uiElement.treeItem.Id, function (insertedTreeItem) {
        ClearAllChildren(uiElement.statusDisplay);
        uiElement.commonObjects.treeItems.push(insertedTreeItem);
        UiElement_ApplyExpandCollapseButtonVisibility(uiElement);
        var newUiElement = document.createElement('div');
        newUiElement.commonObjects = uiElement.commonObjects;
        UiElement_CreateOrUpdate(newUiElement, insertedTreeItem);
        UiElement_AddFirstChildUiElement(uiElement, newUiElement);
        TextEditor_OnEdit(newUiElement);
    }, function () {
        ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'error');
    });
}
function UiElement_AddMultipleChildren_InsertChild(uiElement, lines, lineIndex) {
    if (lineIndex < 0) {
        ClearAllChildren(uiElement.statusDisplay);
        return;
    }
    if (/\S/.test(lines[lineIndex])) {
        // line is not empty and not just whitespace
        ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'adding item #' + (lines.length - lineIndex) + '/' + lines.length + '...');

        // insert new item
        InsertTreeItem_Child(uiElement.treeItem.Id, function(insertedTreeItem) {
            uiElement.commonObjects.treeItems.push(insertedTreeItem);
            UiElement_ApplyExpandCollapseButtonVisibility(uiElement);
            var newUiElement = document.createElement('div');
            newUiElement.commonObjects = uiElement.commonObjects;

            // update it with new text
            insertedTreeItem.Text = lines[lineIndex];
            UpdateTreeItem(insertedTreeItem, function() {
                // update UI
                UiElement_CreateOrUpdate(newUiElement, insertedTreeItem);
                UiElement_AddFirstChildUiElement(uiElement, newUiElement);

                // go to next item
                UiElement_AddMultipleChildren_InsertChild(uiElement, lines, lineIndex - 1);
            }, function() {
                ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'error');
            });
        }, function() {
            ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'error');
        });
    } else {
        // line is empty: don't add it
        // go to next item
        UiElement_AddMultipleChildren_InsertChild(uiElement, lines, lineIndex - 1);
    }
    
    
}
function UiElement_AddMultipleChildren(uiElement) {
    var div = document.createElement('div');

    div.style.backgroundColor = '#EEE';
    div.style.border = '1px solid #F55';
    div.style.padding = '5px';
    div.appendChild(document.createTextNode('Enter new items, one item per line'));
    div.appendChild(document.createElement('br'));
    var textArea = document.createElement('textarea');
    textArea.style.height = '100px';
    textArea.style.width = '300px';
    div.appendChild(textArea);
    div.appendChild(document.createElement('br'));

    var okButton = document.createElement('a'); okButton.style.cursor = 'pointer'; okButton.style.textDecoration = 'underline';
    okButton.appendChild(document.createTextNode('OK'));
    okButton.onclick = function (e) {
        ClearAllChildren(uiElement.addMultipleChildrenUiContainer);
        var text = textArea.value;
        var lines = text.split(/\r\n|\r|\n/g);
        UiElement_AddMultipleChildren_InsertChild(uiElement, lines, lines.length - 1);
    };
    div.appendChild(okButton);
    div.appendChild(document.createTextNode('|'));
    var cancelButton = document.createElement('a'); cancelButton.style.cursor = 'pointer'; cancelButton.style.textDecoration = 'underline';
    cancelButton.appendChild(document.createTextNode('Cancel'));
    cancelButton.onclick = function (e) {
        ClearAllChildren(uiElement.addMultipleChildrenUiContainer);
    };
    div.appendChild(cancelButton);

    uiElement.addMultipleChildrenUiContainer.appendChild(div);
    textArea.focus();
}
function UiElement_Delete(uiElement) {
    if (confirm('Do you really want to delete the item "' +  uiElement.treeItem.Text + '" and all its children (if any)?') == true) {
        ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'deleting...');
        DeleteTreeItem(uiElement.treeItem.Id, function() {
            uiElement.parentNode.removeChild(uiElement);
            for (var i = 0; i < uiElement.commonObjects.treeItems.length; i++)
                if (uiElement.commonObjects.treeItems[i].Id === uiElement.treeItem.Id) {
                    uiElement.commonObjects.treeItems.splice(i, 1);
                    break;
                }
        },
        function () {
            ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'error');
        });
    }
}
function UiElement_MoveToChildren(srcUiElement, dstUiElement) {
    ClearAllChildrenAndAppendText(srcUiElement.statusDisplay, 'moving...');
    MoveTreeItem(srcUiElement.treeItem.Id, dstUiElement.treeItem.Id, 'children', function () {
        srcUiElement.treeItem.ParentId = dstUiElement.treeItem.Id;

        srcUiElement.parentNode.removeChild(srcUiElement);
        var newUiElement = document.createElement('div');
        newUiElement.commonObjects = srcUiElement.commonObjects;
        UiElement_CreateOrUpdate(newUiElement, srcUiElement.treeItem, srcUiElement.commonObjects.treeItems);
        
        dstUiElement.childrenContainer.appendChild(newUiElement);
        UiElement_ApplyExpandCollapseButtonVisibility(dstUiElement);
    }, function () { // err
        ClearAllChildrenAndAppendText(srcUiElement.statusDisplay, 'error');
    });
}
function UiElement_MoveToSiblings(srcUiElement, dstUiElement) {
    ClearAllChildrenAndAppendText(srcUiElement.statusDisplay, 'moving...');
    MoveTreeItem(srcUiElement.treeItem.Id, dstUiElement.treeItem.Id, 'siblings', function () {
        srcUiElement.treeItem.ParentId = dstUiElement.treeItem.ParentId;

        srcUiElement.parentNode.removeChild(srcUiElement);
        var newUiElement = document.createElement('div');
        newUiElement.commonObjects = srcUiElement.commonObjects;
        UiElement_CreateOrUpdate(newUiElement, srcUiElement.treeItem, srcUiElement.commonObjects.treeItems);
       
        var siblingUiElementsContainer = dstUiElement.parentNode;
        if (!dstUiElement.nextSibling) siblingUiElementsContainer.appendChild(newUiElement);
        else siblingUiElementsContainer.insertBefore(newUiElement, dstUiElement.nextSibling);
    }, function () { // err
        ClearAllChildrenAndAppendText(srcUiElement.statusDisplay, 'error');
    });
}
function UiElement_MoveToTop(uiElement) {
    // find first treeItem in list which has same parentId   (first sibling)
    // set previous item next sibling
    // save to DB
    // move item in UI
    var parentUiElement = uiElement.parentNode.parentNode;

    var firstSiblingTreeItem = uiElement.parentNode.firstChild.treeItem;
    if (!firstSiblingTreeItem) firstSiblingTreeItem = uiElement.parentNode.firstChild.nextSibling.treeItem; // skip 'add new item' UI element 
    if (firstSiblingTreeItem.Id == uiElement.treeItem.Id) { // already first sibling
        return;
    }

    ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'moving...');
    MoveTreeItem(uiElement.treeItem.Id, '', 'top', function () {
        uiElement.parentNode.removeChild(uiElement);
        var newUiElement = document.createElement('div');
        newUiElement.commonObjects = uiElement.commonObjects;
        UiElement_CreateOrUpdate(newUiElement, uiElement.treeItem, uiElement.commonObjects.treeItems);
        // insert new UI element as the first child into parent UI container
        UiElement_AddFirstChildUiElement(parentUiElement, newUiElement);
    }, function () { // err
        ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'error');
    });
}
function UiElement_MoveToBottom(uiElement) {
    var lastSiblingTreeItem = uiElement.parentNode.lastChild.treeItem;
    if (lastSiblingTreeItem.Id == uiElement.treeItem.Id) { // already last sibling
        return;
    }
    
    ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'moving...');
    MoveTreeItem(uiElement.treeItem.Id, '', 'bottom', function () {
        var siblingUiElementsContainer = uiElement.parentNode;
        siblingUiElementsContainer.removeChild(uiElement);
        var newUiElement = document.createElement('div');
        newUiElement.commonObjects = uiElement.commonObjects;
        UiElement_CreateOrUpdate(newUiElement, uiElement.treeItem, uiElement.commonObjects.treeItems);
        // insert new UI element as the last child into parent UI container
        siblingUiElementsContainer.appendChild(newUiElement);
    }, function () { // err
        ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'error');
    });
}
//#endregion

function UiElement_DisplayText(uiElement, draggingNow) {
    var textDisplay = uiElement.textDisplay;
    ClearAllChildren(textDisplay);
    if (uiElement.treeItem.Text.length != 0) {
        var text = uiElement.treeItem.Text;
        if (draggingNow) {
            var maxLength = 8;
            if (text.length > maxLength)
                text = text.substring(0, maxLength) + '...';
        }
        var url = ExtractUrl(text);
        if (url) {
            textDisplay.appendChild(document.createTextNode(text));
            textDisplay.appendChild(document.createTextNode(' '));
            var a = document.createElement('a');
            a.appendChild(document.createTextNode('go'));
            a.setAttribute('href', url);
            a.setAttribute('target', '_blank');
            textDisplay.appendChild(a);
        }
        else textDisplay.appendChild(document.createTextNode(text));
    } else
        textDisplay.appendChild(document.createTextNode('[no text]'));
}
//#region TextEditor 
function TextEditor_AdjustWidthOnTextChanged(editor) {
    var l = editor.value.length;
    if (l < 3) l = 3;
    editor.size = l;
}
function TextEditor_WaitForKeys(textEditor, keyHandler) { // key handler (keyCode)
    if (!window.addEventListener) {  // if IE
        document.onkeydown = function(event) { 
            event = event || window.event; //IE does not pass the event object
            var keyCode = event.which || event.keyCode; 
            keyHandler(keyCode);
        }; 
    } 
    else
        textEditor.onkeydown = function (e) {
            keyHandler(e.keyCode);
        };
}
function TextEditor_SaveText_FinishEditing(uiElement, optionalCallbackOK) {
    uiElement.treeItem.Text = uiElement.textEditor.value;
    ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'saving...');
    UpdateTreeItem(uiElement.treeItem, function () { // ok
        ClearAllChildren(uiElement.statusDisplay);
       
        UiElement_DisplayText(uiElement, false);
        uiElement.textEditor.style.display = 'none';
        uiElement.textDisplay.style.display = '';
       
        if (optionalCallbackOK) optionalCallbackOK();
    }, function () {
        ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'error');
    });
}
function TextEditor_OnEdit(uiElement) {
    uiElement.textDisplay.style.display = 'none';
    uiElement.textEditor.style.display = '';
    uiElement.textEditor.value = uiElement.treeItem.Text;
    

    uiElement.textEditor.focus();
    // If this function exists...
    if (uiElement.textEditor.setSelectionRange) {
        // ... then use it
        // (Doesn't work in IE)

        // Double the length because Opera is inconsistent about whether a carriage return is one character or two. Sigh.
        var len = uiElement.textEditor.value.length * 2;
        uiElement.textEditor.setSelectionRange(len, len);
    }
    else {
        // ... otherwise replace the contents with itself
        // (Doesn't work in Google Chrome)
        uiElement.textEditor.value = uiElement.textEditor.value;
    }
    // Scroll to the bottom, in case we're in a tall textarea
    // (Necessary for Firefox and Google Chrome)
    uiElement.textEditor.scrollTop = 999999;
    
    TextEditor_AdjustWidthOnTextChanged(uiElement.textEditor);
    TextEditor_WaitForKeys(uiElement.textEditor,
        function(keyCode) {
            switch (keyCode) {
            case 13:
                // enter: save text to DB
                TextEditor_SaveText_FinishEditing(uiElement);
                break;
            case 27:
                // esc: cancel
                uiElement.textEditor.style.display = 'none';
                uiElement.textDisplay.style.display = '';
                break;
            //case 186:
            //    // semicolon: save this and add next sibling
            //    TextEditor_SaveText_FinishEditing(uiElement, function () {
            //        // when saved current item: add next sibling and begin editing it
            //        UiElement_AddNextSibling_BeginEditing(uiElement);
            //    });
            //    break;
            //case 219:
            //    // sq brackets open: save this and add child
            //    TextEditor_SaveText_FinishEditing(uiElement, function () {
            //        // when saved current item: add child and begin editing it
            //        UiElement_AddChild_BeginEditing(uiElement);
            //    });
            //    break;
            }
        }
    );
}
//#endregion

//#region expand collapse
function ExpandCollapseButton_UpdateImage(uiElement) {
    if (uiElement.treeItem.IsCollapsed == 'False') {
        uiElement.expandCollapseButton.src = '/Images/collapseButton.png';
    } else {
        uiElement.expandCollapseButton.src = '/Images/expandButton.png';
    }
}
function UiElement_ExpandCollapse(uiElement) {
    if (uiElement.treeItem.IsCollapsed == 'True') uiElement.treeItem.IsCollapsed = 'False';
    else uiElement.treeItem.IsCollapsed = 'True';
    ExpandCollapseButton_UpdateImage(uiElement);
    if (uiElement.treeItem.IsCollapsed == 'True') uiElement.childrenContainer.style.display = 'none';
    else uiElement.childrenContainer.style.display = '';
    UpdateTreeItem(uiElement.treeItem);
}
//#endregion

//#region status
function GetStatuses() {
    return [
        { status: "currentlyExecuted", color: "#D4FF2A" },
        { status: "plannedAsPriority", color: "#FFFFAA" },
        { status: "questionable", color: "#E1E1D1" },
        { status: "done", color: "#bfcdfc" },
        { status: "", color: "#FFF" }
    ];
}
function UiElement_UpdateTreeItem_IndicateSavingStatus(uiElement) {
    
    ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'saving...');
    UpdateTreeItem(uiElement.treeItem, function () { // ok
        ClearAllChildren(uiElement.statusDisplay);
    }, function () {
        ClearAllChildrenAndAppendText(uiElement.statusDisplay, 'error');
    });
}
function UiElement_ChangeStatus(uiElement, newStatus) {
    uiElement.treeItem.Status = newStatus;
    UiElement_ApplyStatus(uiElement);
    UiElement_UpdateTreeItem_IndicateSavingStatus(uiElement);
}
function UiElement_ApplyStatus(uiElement) {
    var statuses = GetStatuses();
    for (var i = 0, max = statuses.length; i < max; i++)
        if (statuses[i].status == uiElement.treeItem.Status) {
            uiElement.textDisplay.style.backgroundColor = statuses[i].color;
            return;
        }
    uiElement.textDisplay.style.backgroundColor = '';
}
//#endregion
function UiElement_ApplyExpandCollapseButtonVisibility(uiElement) {
    for (var i = 0; i < uiElement.commonObjects.treeItems.length; i++)
        if (uiElement.commonObjects.treeItems[i].ParentId === uiElement.treeItem.Id) {
            uiElement.expandCollapseButton.style.display = '';
            return;
        }
    uiElement.expandCollapseButton.style.display = 'none';
}
function ExtractUrl(text) {
    var startIndex = text.indexOf('http://');
    if (startIndex < 0) startIndex = text.indexOf('https://');
    
    if (startIndex < 0) return null;

    var endIndex = text.indexOf(' ', startIndex);
    if (endIndex == -1) { return text.substr(startIndex); }
    else return text.substr(startIndex, endIndex - startIndex);
}


function UiElement_InitializeAddNewItemUi(uiElement, childrenContainer) {
    var addNewItemUiElement = document.createElement('div');
    addNewItemUiElement.style.margin = '0px 0px 0px 15px';
    addNewItemUiElement.appendChild(document.createTextNode('+ '));
    var newItemTextBox = document.createElement('input');
    newItemTextBox.setAttribute('type', 'text');
    newItemTextBox.style.width = 'calc(100% - 3em)';
    newItemTextBox.style.border = 'none';
    newItemTextBox.style.borderColor = 'transparent';
    TextEditor_WaitForKeys(newItemTextBox,
        function (keyCode) {
            if (keyCode == 13) {
                // enter key: insert new item to DB
                ClearAllChildrenAndAppendText(uiElement.addNewItemStatusDisplay, 'adding new item...');

                // insert new item
                InsertTreeItem_Child(uiElement.treeItem.Id, function (insertedTreeItem) {
                    uiElement.commonObjects.treeItems.push(insertedTreeItem);
                    UiElement_ApplyExpandCollapseButtonVisibility(uiElement);
                    var newUiElement = document.createElement('div');
                    newUiElement.commonObjects = uiElement.commonObjects;

                    // update it with new text
                    insertedTreeItem.Text = newItemTextBox.value;
                    UpdateTreeItem(insertedTreeItem, function () {
                        // update UI
                        UiElement_CreateOrUpdate(newUiElement, insertedTreeItem);
                        UiElement_AddFirstChildUiElement(uiElement, newUiElement);
                        newItemTextBox.value = '';
                        ClearAllChildrenAndAppendText(uiElement.addNewItemStatusDisplay, '');
                    }, function () {
                        ClearAllChildrenAndAppendText(uiElement.addNewItemStatusDisplay, 'error');
                    });
                }, function () {
                    ClearAllChildrenAndAppendText(uiElement.addNewItemStatusDisplay, 'error');
                });
            }
        }
    );
    addNewItemUiElement.appendChild(newItemTextBox);
    
    uiElement.addNewItemStatusDisplay = document.createElement('span');
    uiElement.addNewItemStatusDisplay.style.backgroundColor = '#BEF';
    addNewItemUiElement.appendChild(uiElement.addNewItemStatusDisplay);
    childrenContainer.insertBefore(addNewItemUiElement, childrenContainer.firstChild);
    uiElement.addNewItemUiElement = addNewItemUiElement;
}
///////////////=================   main TreeItem GUI initialization procedure,  drag&drop procedures
function UiElement_CreateOrUpdate(uiElement, uiElementTreeItem, optionalTreeItemsForChildren) { // recursive   // clears uiElement (div), updates it and its content with new data
    // clear UI element
    uiElement.style.margin = '0px 0px 0px 14px';
    ClearAllChildren(uiElement);

    // attach it to the UI element
    uiElement.treeItem = uiElementTreeItem;

    var expandCollapseButton = document.createElement('img');
    expandCollapseButton.style.width = '14px';
    expandCollapseButton.style.height = '14px';
    expandCollapseButton.style.marginTop = '-1px';
    expandCollapseButton.style.marginBottom = '-1px';
    expandCollapseButton.style.cursor = 'pointer';
    uiElement.expandCollapseButton = expandCollapseButton;
    ExpandCollapseButton_UpdateImage(uiElement);
    expandCollapseButton.onclick = function(e) {
        UiElement_ExpandCollapse(uiElement);
    };
    UiElement_ApplyExpandCollapseButtonVisibility(uiElement);
    uiElement.appendChild(expandCollapseButton);
    
    // create text display, text editor, delete button, add next button, expand/collapse
    var textDisplayWithDragIndicators = document.createElement('span');
    var textDisplay = document.createElement('span');
    uiElement.textDisplay = textDisplay;
    textDisplay.style.margin = '0px 2px';
    textDisplay.style.cursor = 'pointer';
    //#region drag and drop UI, event handlers
    var moveToChildren = document.createElement('span');
    moveToChildren.style.padding = '0px 4px';
    moveToChildren.style.backgroundColor = '#BEF';
    moveToChildren.style.display = 'none';
    moveToChildren.appendChild(document.createTextNode('to children'));
    textDisplayWithDragIndicators.appendChild(moveToChildren);

    var moveToSiblings = document.createElement('span');
    moveToSiblings.style.padding = '0px 4px';
    moveToSiblings.style.backgroundColor = '#BEF';
    moveToSiblings.style.display = 'none';
    moveToSiblings.appendChild(document.createTextNode('to siblings'));
    textDisplayWithDragIndicators.appendChild(moveToSiblings);
    
    var hideDisplayedMoveToXxxSpans = function(commonObjects2) {
        if (commonObjects2.displayedMoveToChildrenSpan) {
            commonObjects2.displayedMoveToChildrenSpan.style.display = 'none';
            commonObjects2.displayedMoveToChildrenSpan = null;
        }
        if (commonObjects2.displayedMoveToSiblingsSpan) {
            commonObjects2.displayedMoveToSiblingsSpan.style.display = 'none';
            commonObjects2.displayedMoveToSiblingsSpan = null;
        }
    };
    
    textDisplayWithDragIndicators.setAttribute('draggable', 'true');
    textDisplayWithDragIndicators.ondragstart = function (e) {
        uiElement.commonObjects.draggedUiElement = uiElement;
        uiElement.commonObjects.draggedUiElement.textDisplay.style.fontWeight = 'bold';
        UiElement_DisplayText(uiElement, true);
    };
    textDisplayWithDragIndicators.ondragend = function (e) {
        hideDisplayedMoveToXxxSpans(uiElement.commonObjects);
        uiElement.commonObjects.draggedUiElement.textDisplay.style.fontWeight = '';
        uiElement.commonObjects.draggedUiElement = null;
        UiElement_DisplayText(uiElement, false);
    };
    textDisplayWithDragIndicators.ondragover = function (e) {
        e.preventDefault();
        return false;
    };
    textDisplayWithDragIndicators.ondragenter = function (e) {
        if (uiElement.treeItem.Id == uiElement.commonObjects.draggedUiElement.treeItem.Id) return; // dragging to same tree item - ignore
        hideDisplayedMoveToXxxSpans(uiElement.commonObjects);
        moveToChildren.style.display = '';
        moveToSiblings.style.display = '';
        uiElement.commonObjects.displayedMoveToChildrenSpan = moveToChildren;
        uiElement.commonObjects.displayedMoveToSiblingsSpan = moveToSiblings;
    };
    moveToSiblings.ondragenter = function (e) {
        if (uiElement.treeItem.Id == uiElement.commonObjects.draggedUiElement.treeItem.Id) return; // dragging to same tree item - ignore
        hideDisplayedMoveToXxxSpans(uiElement.commonObjects);
        moveToChildren.style.display = '';
        moveToChildren.style.fontWeight = '';
        moveToSiblings.style.display = '';
        moveToSiblings.style.fontWeight = 'bold';
        uiElement.commonObjects.displayedMoveToChildrenSpan = moveToChildren;
        uiElement.commonObjects.displayedMoveToSiblingsSpan = moveToSiblings;
    };
    moveToChildren.ondragenter = function (e) {
        if (uiElement.treeItem.Id == uiElement.commonObjects.draggedUiElement.treeItem.Id) return; // dragging to same tree item - ignore
        hideDisplayedMoveToXxxSpans(uiElement.commonObjects);
        moveToChildren.style.display = '';
        moveToChildren.style.fontWeight = 'bold';
        moveToSiblings.style.display = '';
        moveToSiblings.style.fontWeight = '';
        uiElement.commonObjects.displayedMoveToChildrenSpan = moveToChildren;
        uiElement.commonObjects.displayedMoveToSiblingsSpan = moveToSiblings;
    };
    moveToChildren.ondrop = function (e) {
        hideDisplayedMoveToXxxSpans(uiElement.commonObjects);
        e.preventDefault();
        //  alert('move to children: drag and drop from ' + uiElement.commonObjects.draggedUiElement.treeItem.Text + ' to ' + uiElement.treeItem.Text);
        UiElement_MoveToChildren(uiElement.commonObjects.draggedUiElement, uiElement);
        return false;
    };
    moveToSiblings.ondrop = function (e) {
        hideDisplayedMoveToXxxSpans(uiElement.commonObjects);
        e.preventDefault();
       // alert('move to siblings: drag and drop from ' + uiElement.commonObjects.draggedUiElement.treeItem.Text + ' to ' + uiElement.treeItem.Text);
        UiElement_MoveToSiblings(uiElement.commonObjects.draggedUiElement, uiElement);
        return false;
    };
    //#endregion
    UiElement_DisplayText(uiElement, false);
    textDisplayWithDragIndicators.appendChild(textDisplay);

    textDisplay.onclick = function (e) {
        PopupMenu_Show(e, uiElement);
    };
    uiElement.appendChild(textDisplayWithDragIndicators);

    var textEditor = document.createElement('input');
    textEditor.type = 'text';
    textEditor.style.display = 'none';
    HandleEditorTextChange(textEditor, function(e) { TextEditor_AdjustWidthOnTextChanged(textEditor); });
    uiElement.appendChild(textEditor);
    uiElement.textEditor = textEditor;
    
    uiElement.addMultipleChildrenUiContainer = document.createElement('span');
    uiElement.appendChild(uiElement.addMultipleChildrenUiContainer);
    
    var statusDisplay = document.createElement('span');
    statusDisplay.style.backgroundColor = '#BEF';
    uiElement.appendChild(statusDisplay);
    uiElement.statusDisplay = statusDisplay;

    // enumerate children with parentId = this id
    var childrenContainer = document.createElement('span');
    if (optionalTreeItemsForChildren) {
        var thereAreChildren = false;
        for (var i = 0, max = optionalTreeItemsForChildren.length; i < max; i++) {
            if (optionalTreeItemsForChildren[i].ParentId == uiElementTreeItem.Id) {
                // add child elements into this one
                var childUiElement = document.createElement('div');
                childUiElement.commonObjects = uiElement.commonObjects;
                UiElement_CreateOrUpdate(childUiElement, optionalTreeItemsForChildren[i], optionalTreeItemsForChildren); // recursive call
                childrenContainer.appendChild(childUiElement);
                thereAreChildren = true;
            }
        }
        if (thereAreChildren) UiElement_InitializeAddNewItemUi(uiElement, childrenContainer);
    }
    if (uiElement.treeItem.IsCollapsed == 'True') childrenContainer.style.display = 'none';
    uiElement.appendChild(childrenContainer);
    uiElement.childrenContainer = childrenContainer;
    
    UiElement_ApplyStatus(uiElement);
}
function PopupMenu_Show(e, uiElement) {
    var menuBackgroundDiv = document.createElement('div');
    menuBackgroundDiv.style.backgroundColor = '#EEE';
    menuBackgroundDiv.style.opacity = 0.35;
    menuBackgroundDiv.style.position = 'absolute';
    menuBackgroundDiv.style.left = '0px';
    menuBackgroundDiv.style.top = '0px';
    menuBackgroundDiv.style.width = document.body.clientWidth + 300 + 'px';
    menuBackgroundDiv.style.height = document.body.clientHeight + 300 + 'px';
    uiElement.commonObjects.container.appendChild(menuBackgroundDiv);
    
    var menuWidth = 270;
    var menuHeight = 150;
    var menuDiv = document.createElement('div');
    menuDiv.style.backgroundColor = '#FFF';
    menuDiv.style.border = '1px solid #CCC';
    menuDiv.style.position = 'absolute';
    menuDiv.style.left = e.layerX - 10 + 'px';
    var menuTopY = e.layerY - 10;
   // var maxY = window.innerHeight - 40 + document.body.scrollTop;
  //  if (menuTopY + menuHeight > maxY) // if menu goes out of screen - limit it
  //      menuTopY = maxY - menuHeight;
    menuDiv.style.top = menuTopY + 'px';
    menuDiv.style.width = menuWidth + 'px';
    menuDiv.style.height = menuHeight + 'px';
    
    menuDiv.style.padding = '5px';
    var hideMenu = function() {
        uiElement.commonObjects.container.removeChild(menuBackgroundDiv);
        uiElement.commonObjects.container.removeChild(menuDiv);
    };
    menuBackgroundDiv.onclick = function(e) { hideMenu(); };

    //#region buttons
    var editTextButton = document.createElement('a');
    editTextButton.appendChild(document.createTextNode('edit text'));
    editTextButton.setAttribute('href', 'javascript:');
    editTextButton.onclick = function (e) {
        hideMenu();
        TextEditor_OnEdit(uiElement);
    };
    menuDiv.appendChild(editTextButton);
    menuDiv.appendChild(document.createElement('br'));

    menuDiv.appendChild(document.createTextNode('add '));
    if (uiElement.treeItem.Id != uiElement.commonObjects.rootTreeItemId) {
        var addSiblingButton = document.createElement('a');
        addSiblingButton.appendChild(document.createTextNode('sibling'));
        addSiblingButton.setAttribute('href', 'javascript:');
        addSiblingButton.onclick = function(e) {
            hideMenu();
            UiElement_AddNextSibling_BeginEditing(uiElement);
        };
        menuDiv.appendChild(addSiblingButton);
        menuDiv.appendChild(document.createTextNode('|'));
    }
    
    var addChildButton = document.createElement('a');
    addChildButton.appendChild(document.createTextNode('child'));
    addChildButton.setAttribute('href', 'javascript:');
    addChildButton.onclick = function (e) {
        hideMenu();
        UiElement_AddChild_BeginEditing(uiElement);
    };
    menuDiv.appendChild(addChildButton);
    menuDiv.appendChild(document.createTextNode('|'));
    

    var addMultipleChildrenButton = document.createElement('a');
    addMultipleChildrenButton.appendChild(document.createTextNode('children'));
    addMultipleChildrenButton.setAttribute('href', 'javascript:');
    addMultipleChildrenButton.onclick = function (e) {
        hideMenu();
        UiElement_AddMultipleChildren(uiElement);
    };
    menuDiv.appendChild(addMultipleChildrenButton);
    
    menuDiv.appendChild(document.createElement('br'));
    
    if (uiElement.treeItem.Id != uiElement.commonObjects.rootTreeItemId) {
        menuDiv.appendChild(document.createTextNode('move to '));
        var moveToTopButton = document.createElement('a');
        moveToTopButton.appendChild(document.createTextNode('top'));
        moveToTopButton.setAttribute('href', 'javascript:');
        moveToTopButton.onclick = function(e) {
            hideMenu();
            UiElement_MoveToTop(uiElement);
        };
        menuDiv.appendChild(moveToTopButton);

        menuDiv.appendChild(document.createTextNode('|'));
        var moveToBottomButton = document.createElement('a');
        moveToBottomButton.appendChild(document.createTextNode('bottom'));
        moveToBottomButton.setAttribute('href', 'javascript:');
        moveToBottomButton.onclick = function(e) {
            hideMenu();
            UiElement_MoveToBottom(uiElement);
        };
        menuDiv.appendChild(moveToBottomButton);
        menuDiv.appendChild(document.createElement('br'));
    }

    menuDiv.appendChild(document.createTextNode('status: '));
    var statuses = GetStatuses();
    for (var i = 0, max = statuses.length; i < max; i++)
    {
        var status = statuses[i].status;

        var f = function(s) {
            var statusButton = document.createElement('a');
            statusButton.style.paddingLeft = '20px';
            statusButton.style.border = '1px solid #AAA';
            statusButton.style.marginLeft = '3px';
            var s2 = s; if (!s2) s2 = 'none';
            statusButton.setAttribute('title', s2);
            statusButton.setAttribute('href', 'javascript:');
            statusButton.style.backgroundColor = statuses[i].color;
            statusButton.onclick = function(e) {
                hideMenu();
                UiElement_ChangeStatus(uiElement, s);
            };
            menuDiv.appendChild(statusButton);
        }; f(status);
       // if (i < max - 1) menuDiv.appendChild(document.createTextNode('| '));
    }


    menuDiv.appendChild(document.createElement('br'));
    
    if (uiElement.treeItem.Id != uiElement.commonObjects.rootTreeItemId) {
        var deleteButton = document.createElement('a');
        deleteButton.appendChild(document.createTextNode('delete'));
        deleteButton.setAttribute('href', 'javascript:');
        deleteButton.onclick = function (e) {
            hideMenu();
            UiElement_Delete(uiElement);
        };
        menuDiv.appendChild(deleteButton);
        menuDiv.appendChild(document.createElement('br'));
    }
    //#endregion

    menuDiv.appendChild(document.createTextNode('created: ' + uiElement.treeItem.CreatedUtc + ' UTC'));
    menuDiv.appendChild(document.createElement('br'));
    menuDiv.appendChild(document.createTextNode('modified: ' + uiElement.treeItem.LastModifiedUtc + ' UTC'));
    menuDiv.appendChild(document.createElement('br'));
    var link = document.createElement('a');
    link.setAttribute('target', '_blank');
    link.setAttribute('href', '/Organizer.aspx?RootTreeItemId=' + uiElement.treeItem.Id);
    link.appendChild(document.createTextNode('link to this item'));
    menuDiv.appendChild(link);

    var bool2checkboxUi = function(boolStr, checkbox) {
        if (boolStr == 'True') checkbox.checked = true;
        else if (boolStr == 'False') checkbox.checked = false;
        else checkbox.indeterminate = true;
    };
    menuDiv.appendChild(document.createElement('br'));
    var shareReadCheckbox = document.createElement('input');
    shareReadCheckbox.setAttribute('type', 'checkbox');
    bool2checkboxUi(uiElement.treeItem.ShareRead, shareReadCheckbox);
   
    menuDiv.appendChild(shareReadCheckbox);
    menuDiv.appendChild(document.createTextNode('share read '));
    shareReadCheckbox.onclick = function () {
        if (uiElement.treeItem.ShareRead == '') uiElement.treeItem.ShareRead = 'True';
        else if (uiElement.treeItem.ShareRead == 'True') uiElement.treeItem.ShareRead = 'False';
        else uiElement.treeItem.ShareRead = '';
        bool2checkboxUi(uiElement.treeItem.ShareRead, shareReadCheckbox);
        UiElement_UpdateTreeItem_IndicateSavingStatus(uiElement);
    };
    
    var shareWriteCheckbox = document.createElement('input');
    shareWriteCheckbox.setAttribute('type', 'checkbox');
    bool2checkboxUi(uiElement.treeItem.ShareWrite, shareWriteCheckbox);
    menuDiv.appendChild(shareWriteCheckbox);
    menuDiv.appendChild(document.createTextNode('share write'));
    shareWriteCheckbox.onclick = function () {
        if (uiElement.treeItem.ShareWrite == '') uiElement.treeItem.ShareWrite = 'True';
        else if (uiElement.treeItem.ShareWrite == 'True') uiElement.treeItem.ShareWrite = 'False';
        else uiElement.treeItem.ShareWrite = '';
        bool2checkboxUi(uiElement.treeItem.ShareWrite, shareWriteCheckbox);
        UiElement_UpdateTreeItem_IndicateSavingStatus(uiElement);
    };

    uiElement.commonObjects.container.appendChild(menuDiv);
}

function InitializeOrganizer(rootTreeItemId, container) {
    ClearAllChildrenAndAppendText(container, 'loading...');
    GetTreeItems(rootTreeItemId, function (treeItems) {
        if (!treeItems) {
            ClearAllChildrenAndAppendText(container, 'failed to load data');
            return;
        }
        var commonObjects = {};
        commonObjects.treeItems = treeItems;
        commonObjects.rootTreeItemId = rootTreeItemId;
        commonObjects.container = container;
        commonObjects.draggedUiElement = null;
        container.commonObjects = commonObjects;
      
        var rootTreeItem = FindTreeItem(treeItems, rootTreeItemId);
        rootTreeItem.IsCollapsed = 'False';
        UiElement_CreateOrUpdate(container, rootTreeItem, treeItems);
    });
}