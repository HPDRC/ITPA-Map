"use strict";

tf.GTFS.ChatMessage = function (settings) {
    var theThis, allContent, message, date, isSelfSent, order;

    this.GetMessage = function () { return message; }
    this.GetDate = function () { return date; }
    this.GetIsSelfSent = function () { return isSelfSent; }
    this.GetOrder = function () { return order; }
    this.GetAllContent = function () { return allContent; }
    this.CompareWith = function (other) {
        // use import id and order as primary compare
        var thisTime = theThis.GetDate().getTime(), otherTime = other.GetDate().getTime();
        var diff = thisTime - otherTime;
        if (diff == 0) {
            //console.log('breaking tie with order');
            diff = theThis.GetOrder() - other.GetOrder();
        }
        return diff;
    };

    function createControl() {
        var cssClasses = settings.cssClasses;
        var cssClassNames = cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: cssClassNames.chatBoxItemWrapper });
        var message = new tf.dom.Div({ cssClass: cssClassNames.chatBoxMessage });
        var email = new tf.dom.Div({ cssClass: cssClassNames.chatBoxMessageEmail });
        var date = new tf.dom.Div({ cssClass: cssClassNames.chatBoxMessageDate });
        var evObj = settings.notification.evObj;
        var user = evObj.user;
        var auth = settings.apiClient.GetAuth();

        isSelfSent = user != undefined && user.id == auth.id;

        //isSelfSent = true;

        if (!isSelfSent) {
            var wrapperE = wrapper.GetHTMLElement(), wrapperES = wrapperE.style;
            var dateES = date.GetHTMLElement().style, emailES = email.GetHTMLElement().style;
            //message.GetHTMLElement().style.backgroundColor = "beige";
            wrapperES.textAlign = "right";
            wrapperES.flexFlow = "row-reverse nowrap";
            emailES.right = "4px";
            emailES.left = "initial";
            dateES.left = "4px";
            dateES.right = "initial";
        }
        else {
            message.GetHTMLElement().style.backgroundColor = "beige";
        }

        if (evObj.isWarning || evObj.isError) {
            message.GetHTMLElement().style.backgroundColor = "#ffb69e";
        }

        wrapper.AddContent(message, email, date);

        allContent = { wrapper: wrapper, message: message, email: email, date: date };
    }

    function fillMessage() {
        var evObj = settings.notification.evObj;
        date = new Date(evObj.timestamp);
        order = evObj.order != undefined ? evObj.order : 0;
        message = allContent.message.GetHTMLElement().innerHTML = evObj.message;
        allContent.date.GetHTMLElement().innerHTML = tf.js.GetAMPMHourWithSeconds(date);
        var email;
        if (isSelfSent) {
            email = "self";
        }
        else {
            var user = settings.notification.evObj.user;
            if (!!user) {
                email = user.email;
                if (user.isAdmin) {
                    email += ' (admin)';
                }
            }
            else {
                email = "System";
                allContent.email.GetHTMLElement().style.backgroundColor = "palegreen";
            }
        }
        allContent.email.GetHTMLElement().innerHTML = email;
    }

    function initialize() {
        createControl();
        fillMessage();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.ChatBox = function (settings) {
    var theThis, agencyId, allContent, allMessages;

    this.Clear = function () {
        allMessages = [];
        allContent.list.ClearContent();
    };

    this.SetFocus = function () { return allContent.input.GetInputBox().focus(); }
    this.SetAgencyId = function (newAgencyId) { agencyId = newAgencyId; }
    this.GetAgencyId = function () { return agencyId; }
    this.Show = function (show) {
        allContent.wrapper.GetHTMLElement().style.display = !!show ? "flex" : "none";
        if (show) {
            theThis.SetFocus();
            theThis.ScrollVerticallyToEnd();
        }
    }
    this.GetAllContent = function () { return allContent; }
    this.GetAllMessages = function () { return allMessages; }
    this.GetMessageCount = function () { return theThis.GetAllMessages().length; }
    this.ScrollVerticallyToEnd = function () { return tf.dom.ScrollVerticallyToEnd(allContent.list); }

    this.OnMessage = function (notification) {
        var eventNames = settings.notify.GetEventNames();
        var newMessage = new tf.GTFS.ChatMessage(tf.js.ShallowMerge(settings, { notification: notification }));
        var needScrollToEnd = tf.dom.IsLastVerticalScrollElemVisible(allContent.list, 0).isVisible;
        insertMessage(newMessage);
        if (needScrollToEnd) { theThis.ScrollVerticallyToEnd(); }
    }

    function insertMessage(newMessage) {
        var messageCount = theThis.GetMessageCount();
        var messageWrapper = newMessage.GetAllContent().wrapper;
        if (messageCount == 0) {
            allMessages.push(newMessage);
            allContent.list.AddContent(messageWrapper);
        }
        else {
            var bsIndex = tf.js.BinarySearch(allMessages, newMessage, function (a, b) { return a.CompareWith(b); });
            //console.log('message: ' + newMessage.GetMessage() + ' count: ' + messageCount + ' index: ' + bsIndex);
            if (bsIndex < 0) { bsIndex = -(bsIndex + 1); }
            if (bsIndex == messageCount) {
                //console.log('inserted at end');
                allMessages.push(newMessage);
                allContent.list.AddContent(messageWrapper);
            }
            else {
                //console.log('inserted out of order');
                var messageAfterNew = allMessages[bsIndex];
                var wrapperAfterNew = messageAfterNew.GetAllContent().wrapper;
                allMessages.splice(bsIndex, 0, newMessage);
                allContent.list.InsertContentBefore(messageWrapper, wrapperAfterNew);
            }
        }
    }

    function onSend() {
        //theThis.Clear();
        if (agencyId != undefined) {
            var text = allContent.input.GetText();
            if (text.length) {
                settings.apiClient.AgencyMessagePost(undefined, { id: agencyId, message: text });
                allContent.input.SetText('');
            }
        }
    }

    function createControl() {
        var ls = tf.TFMap.LayoutSettings;
        var cssClasses = settings.cssClasses;
        var cssClassNames = cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: cssClassNames.contentWrapper });
        var list = new tf.dom.Div({ cssClass: cssClassNames.chatBoxList + " " + ls.customizedScrollBarClassName });
        var inputWrapper = new tf.dom.Div({ cssClass: cssClassNames.horContentWrapper });
        var inputSettings = { onChange: undefined, onGo: onSend, className: cssClassNames.emailPasswordInputClassName, maxLength: 512, placeHolder: "Type message and click Send" };
        var input = new tf.TFMap.InputBox(inputSettings);
        var inputBox = input.GetInputBox();
        var inputButton = new tf.dom.Button({ cssClass: cssClassNames.signedInButtonClassName, onClick: onSend });
        var inputButtonButton = inputButton.GetButton();
        var clearButton = new tf.dom.Button({ cssClass: cssClassNames.signedInButtonClassName, onClick: theThis.Clear });
        var clearButtonButton = clearButton.GetButton();

        inputButtonButton.innerHTML = "Send";
        inputButtonButton.style.flexGrow = "0";
        inputButtonButton.style.backgroundColor = "darkblue";
        inputBox.autocomplete = "off";
        clearButtonButton.innerHTML = "Clear";
        clearButtonButton.style.flexGrow = "0";
        clearButtonButton.style.backgroundColor = "chocolate";
        clearButtonButton.autocomplete = "off";

        inputWrapper.AddContent(inputBox, inputButtonButton, clearButtonButton);
        wrapper.AddContent(list, inputWrapper);

        allContent = {
            wrapper: wrapper,
            list: list,
            inputWrapper: inputWrapper,
            input: input,
            inputButton: inputButton,
            clearButton: clearButton
        };

        theThis.Show(false);
    }

    function initialize() {
        allMessages = [];
        createControl();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.AgenciesSelectControl = function (settings) {
    var theThis, selectUI, klListener;

    this.GetHTMLElement = function () { return selectUI.GetHTMLElement(); }

    this.Show = function (show) { selectUI.GetHTMLElement().style.display = !!show ? "flex" : "none"; }

    this.GetSelectedAgency = function () {
        var id, prefix, currentOption = selectUI.GetCurrentOption();
        if (!!currentOption) {
            id = currentOption.settings.id;
            prefix = currentOption.settings.value;
        }
        return { id: id, prefix: prefix };
    }

    function addOrUpdateOptions(items) {
        for (var i in items) {
            var item = items[i], iData = item.GetData(), id = iData.id, value = iData.prefix;
            var option = { value: value, innerHTML: value, id: id };
            selectUI.AddOrSetOption(option);
        }
    }

    function delOptions(items) {
        for (var i in items) {
            var item = items[i], itemData = item.GetData(), value = itemData.prefix;
            selectUI.DelOption(value);
        }
    }

    function onKLChange(notification) {
        addOrUpdateOptions(notification.addedItems);
        addOrUpdateOptions(notification.updatedItems);
        delOptions(notification.deletedItems);
        selectUI.Sort();
    }

    function onChange(notification) {
        if (tf.js.GetFunctionOrNull(settings.onSelect)) {
            var option = selectUI.GetCurrentOption();
            settings.onSelect({ sender: theThis, notification: notification, option: option });
        }
    }

    function createControl() {
        var classNames = settings.cssClasses.GetClassNames();
        selectUI = new tf.ui.Select({ cssClass: classNames.agenciesSelectClassName, optionsCSSClass: classNames.agenciesSelectClassName, onChange: onChange });
        theThis.Show(false);
    }

    function initialize() {
        createControl();
        var kl = settings.agenciesList.GetKL();
        klListener = kl.AddAggregateListener(onKLChange);
        kl.NotifyItemsAdded(onKLChange);
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.AgenciesAddContent = function (settings) {
    var theThis, allContent, promptMessage, isShowing;

    this.GetAllContent = function () { return allContent; }

    this.Show = function (show) {
        isShowing = !!show;
        allContent.wrapper.GetHTMLElement().style.display = isShowing ? "block" : "none";
        //allContent.agencyPrefixInput.Show(show);
        if (show) { allContent.agencyPrefixInput.SetFocusToPrefix(); }
    }

    this.GetIsShowing = function () { return isShowing; }

    function createControl() {
        var appContent = settings.appContent;
        var classNames = settings.cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: classNames.itemRowWrapperClassName });
        var agencyPrefixInput = new tf.GTFS.AgencyPrefixInput(tf.js.ShallowMerge(settings, { onGo: function () { settings.onAddContent({ confirmed: true }); } }));
        var titleWrapper = new tf.dom.Div({ cssClass: classNames.emailPasswordStatus });
        var modifyCancelRow = new tf.GTFS.ModifyCancelTextButonRow(tf.js.ShallowMerge(settings, { onModify: settings.onAddContent }));
        var autoHideStatus = new tf.GTFS.AutoHideStatus(settings);

        titleWrapper.GetHTMLElement().innerHTML = promptMessage;
        modifyCancelRow.Rename("Add new", "Done");

        wrapper.AddContent(titleWrapper, agencyPrefixInput.GetAllContent().wrapper, modifyCancelRow.GetAllContent().wrapper, autoHideStatus.GetAllContent().statusWrapper);

        allContent = {
            wrapper: wrapper,
            titleWrapper: titleWrapper,
            agencyPrefixInput: agencyPrefixInput,
            modifyCancelRow: modifyCancelRow,
            autoHideStatus: autoHideStatus
        };
    }

    function initialize() {
        promptMessage = "Enter new agency prefix below";
        createControl();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.AgenciesSelectedContent = function (settings) {
    var theThis, myI, allContent, modifyPromptStatusMessage, missingURLStatus;

    function onModify(notification) {
        var goBackToToolBar = true;
        if (notification.confirmed) {
            if (tf.js.GetFunctionOrNull(settings.getItemFromContent)) {
                var currentContent = theThis.GetCurrentContent();
                var item = settings.getItemFromContent(currentContent);
                if (!!item) {
                    var showStatus = allContent.autoHideStatus.Show;
                    var itemData = item.GetData();
                    goBackToToolBar = false;
                    switch (myI.getCurrentVerb()) {
                        case "prefix":
                            var willSend = false, errorStatus;
                            var theControl = allContent.agencyPrefixInput;
                            var prefixStatus = theControl.GetPrefixStatus();
                            var modifyObj;

                            if (prefixStatus.hasAnyPrefix) {
                                if (prefixStatus.hasValidPrefix) {
                                    modifyObj = {
                                        id: itemData.id,
                                        prefix: prefixStatus.prefix
                                    };
                                    willSend = true;
                                }
                                else { errorStatus = prefixStatus.prefixMessage; }
                            }
                            else { errorStatus = "a valid agency prefix is required"; }

                            if (willSend && !errorStatus) {
                                showStatus(true, "modifying agency...", true);
                                settings.apiClient.AdminAgencyPut(function (response) {
                                    showStatus(true, tf.GTFS.GetStatusFromXHR(response));
                                    //myI.backToToolBar();
                                }, modifyObj);
                            }
                            else {
                                theControl.SetFocusToPrefix();
                                showStatus(true, errorStatus);
                            }
                            break;
                        case "delete":
                            showStatus(true, "deleting agency...", true);
                            settings.apiClient.AdminAgencyDelete(function (response) {
                                showStatus(true, tf.GTFS.GetStatusFromXHR(response));
                                myI.backToToolBar();
                            }, { id: itemData.id });
                            break;
                        case "upload":
                            var willUpload = false, errorStatus;
                            var theFile = allContent.fileSelectInput.GetFirstFile();
                            var formObj;
                            if (!!theFile) {
                                willUpload = true;
                                formObj = new FormData();
                                formObj.append('file', theFile);
                                formObj.append('id', itemData.id);
                            }
                            else {
                                errorStatus = "Select local file to upload";
                            }
                            if (willUpload && !errorStatus) {
                                showStatus(true, "starting upload...", true);
                                settings.apiClient.AgencyUploadPost(function (response) {
                                    showStatus(true, tf.GTFS.GetStatusFromXHR(response));
                                    //myI.backToToolBar();
                                }, formObj);
                            }
                            else {
                                showStatus(true, errorStatus);
                            }
                            break;
                        case "fetch":
                            var willFetch = false, errorStatus;
                            var theURL = allContent.urlInput.GetURLStr();
                            var formObj;
                            if (tf.js.GetIsNonEmptyString(theURL)) {
                                willFetch = true;
                                formObj = {
                                    id: itemData.id,
                                    url: theURL
                                };
                            }
                            else {
                                errorStatus = missingURLStatus;
                            }
                            if (willFetch && !errorStatus) {
                                showStatus(true, "starting fetch...", true);
                                settings.apiClient.AgencyFetchPost(function (response) {
                                    showStatus(true, tf.GTFS.GetStatusFromXHR(response));
                                    //myI.backToToolBar();
                                }, formObj);
                            }
                            else {
                                allContent.urlInput.SetFocus();
                                showStatus(true, errorStatus);
                            }
                            break;
                        case "publish":
                            showStatus(true, "publishing current GTFS...", true);
                            settings.apiClient.AgencyPublishPost(function (response) {
                                showStatus(true, tf.GTFS.GetStatusFromXHR(response));
                                myI.backToToolBar();
                            }, { id: itemData.id });
                            break;
                        default:
                            goBackToToolBar = true;
                            break;
                    }
                }
            }
        }
        else { allContent.autoHideStatus.HideNow(); }

        if (goBackToToolBar) { myI.backToToolBar(); }
    };

    function createControl() {
        allContent = theThis.GetAllContent();

        var agencyPrefixInput = new tf.GTFS.AgencyPrefixInput(tf.js.ShallowMerge(settings, { onGo: function () { onModify({ confirmed: true }); } }));

        var fileSelectInput = new tf.GTFS.FileSelectInput(tf.js.ShallowMerge(settings, { label: "Select local GTFS zip file" }));

        var urlInput = new tf.GTFS.URLInput(tf.js.ShallowMerge(settings, { onGo: function () { onModify({ confirmed: true }); }, prefixPlaceHolder: missingURLStatus }));

        allContent = tf.js.ShallowMerge(allContent, {
            agencyPrefixInput: agencyPrefixInput,
            fileSelectInput: fileSelectInput,
            urlInput: urlInput
        });

        agencyPrefixInput.Show(false);

        allContent.wrapper.InsertContentAfter(agencyPrefixInput.GetAllContent().wrapper, allContent.titleWrapper);
        allContent.wrapper.InsertContentAfter(fileSelectInput.GetAllContent().wrapper, agencyPrefixInput.GetAllContent().wrapper);
        allContent.wrapper.InsertContentAfter(urlInput.GetAllContent().wrapper, fileSelectInput.GetAllContent().wrapper);
    }

    function showUpload(show) {
        if (show) { allContent.modifyCancelRow.Rename("Upload", "Cancel"); }
        allContent.fileSelectInput.Show(show);
    }

    function showFecth(show) {
        allContent.urlInput.Show(show);
        if (show) {
            allContent.urlInput.SetFocus();
            allContent.modifyCancelRow.Rename("Fetch", "Cancel");
        }
    }

    function showSnapshot(show) { if (show) { allContent.modifyCancelRow.Rename("Select destination file", "Cancel"); } }

    function showPrefix(show) {
        allContent.agencyPrefixInput.Show(show);
        if (show) {
            allContent.agencyPrefixInput.SetFocusToPrefix();
            allContent.modifyCancelRow.Rename("Change", "Cancel");
        }
    }

    function showDelete(show) { if (show) { allContent.modifyCancelRow.Rename("Delete", "Cancel"); } }

    function showPublish(show) { if (show) { allContent.modifyCancelRow.Rename("Publish", "Cancel"); } }

    function getVerbs() {
        var verbs = {};
        verbs["edit"] = { text: "Edit", toolTip: "Edit current GTFS", onClick: settings.onEditAgency, isAdmin: false };
        //verbs["snapshot"] = { text: "Download", toolTip: "Download current GTFS file", onShow: showSnapshot, isAdmin: false };
        verbs["upload"] = { text: "Upload", toolTip: "Replace with local GTFS file", onShow: showUpload, isAdmin: false };
        verbs["fetch"] = { text: "Fetch", toolTip: "Replace with remote GTFS file", onShow: showFecth, isAdmin: false };
        verbs["publish"] = { text: "Publish", toolTip: "Publish current GTFS", onShow: showPublish, isAdmin: false };
        verbs["prefix"] = { text: "Prefix", toolTip: "Change agency prefix", onShow: showPrefix, isAdmin: true };
        verbs["delete"] = { text: "Delete", toolTip: "Delete agency", onShow: showDelete, isAdmin: true };
        return verbs;
    };

    function initialize() {
        missingURLStatus = "Enter URL to remote GTFS zip file";
        modifyPromptStatusMessage = "Enter new agency prefix below";
        tf.GTFS.ListSelectedContent.call(theThis, tf.js.ShallowMerge(settings, { verbs: getVerbs(), onModify: onModify, setInterface: function (theInterface) { myI = theInterface; } }));
        createControl();
        theThis.GetAllContent = function () { return allContent; };
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.GTFS.AgenciesSelectedContent, tf.GTFS.ListSelectedContent);

tf.GTFS.AgenciesContent = function (settings) {
    var theThis, myI, addContentControl, addNewButton;

    this.SelectItem = function (newSelectedItem) {

    };

    function compareContent(a, b) {
        var ea = a.itemData.prefix.toLowerCase();
        var eb = b.itemData.prefix.toLowerCase();
        return ea == eb ? 0 : ea < eb ? -1 : 1;
    }

    function prepareSpareContent(content, forItem) {
        var itemData = forItem.GetData();
        content.chatBox.SetAgencyId(itemData.id);
        content.chatBox.Clear();
        content.chatBox.Show(false);
        return content;
    }

    function onContentBecameSpare(content, prevItem) {
        content.chatBox.Clear();
        content.chatBox.Show(false);
    }

    function getGTFSSetInfoStr(info, infoName) {
        var infoStr = "";
        if (info) {
            if (info.published_date) {
                infoStr += info.published_date.substring(0, 10);
            }
            for (var i in info) {
                var wsiItem = info[i];
                var willShow = i != 'extent';
                var name = i;
                if (willShow) {
                    var isCount = name[0] == 'n';
                    if (isCount) {
                        willShow &= (name !== 'nSubAgencies' || wsiItem > 1);
                        if (willShow) {
                            if (infoStr) { infoStr += ' | '; }
                            infoStr += wsiItem + ' ' + name.slice(1);
                        }
                    }
                }
            }
        }
        else {
            infoStr += "none";
        }
        return infoName + ': ' + infoStr;
    }

    function updateContentForItem(item) {
        var content = myI.getContentFromItem(item);
        if (!!content) {
            var itemData = item.GetData();
            var titleStr = itemData.prefix;
            content.title.GetHTMLElement().innerHTML = titleStr;
            content.workingSetSummary.GetHTMLElement().innerHTML = getGTFSSetInfoStr(itemData.workingSetInfo, 'current GTFS');
            content.publishedSetSummary.GetHTMLElement().innerHTML = getGTFSSetInfoStr(itemData.publishedSetInfo, 'published GTFS');
        }
    }

    function createNewContent(forItem) {
        var theTLF = theThis.GetTLF().Get();
        var itemData = forItem.GetData();
        var appContent = settings.appContent;
        var classNames = settings.cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: classNames.itemWrapperClassName });
        var contentWrapper = new tf.dom.Div({ cssClass: classNames.itemContentWrapperClassName });
        var title = new tf.dom.Div({ cssClass: classNames.itemTitleClassName });
        var workingSetSummary = new tf.dom.Div({ cssClass: classNames.itemTitleSubClassName});
        var publishedSetSummary = new tf.dom.Div({ cssClass: classNames.itemTitleSubClassName });
        var itemButton = new tf.dom.Button({ cssClass: classNames.itemButtonClassName, onClick: myI.onItemClick });
        var chatBox = new tf.GTFS.ChatBox(tf.js.ShallowMerge(settings, {}));
        var content = { itemButton: itemButton, wrapper: wrapper, contentWrapper: contentWrapper, title: title, workingSetSummary: workingSetSummary, publishedSetSummary: publishedSetSummary, chatBox: chatBox };

        chatBox.Show(false);
        chatBox.SetAgencyId(itemData.id);
        contentWrapper.AddContent(title, workingSetSummary, publishedSetSummary);
        wrapper.AddContent(itemButton, contentWrapper, chatBox.GetAllContent().wrapper);
        itemButton.content = content;

        return content;
    }

    function showAddContentButton(show) {
        addNewButton.GetButton().style.display = show ? 'inline-block' : 'none';
    }

    function showAddContent(show) {
        if (!!addContentControl) {
            var theTLF = theThis.GetTLF();
            var isExpanded = theTLF.GetIsExpanded();
            addContentControl.Show(show);
            showAddContentButton(!show && isExpanded);
        }
    }

    function onAddContentClicked() { showAddContent(true); }

    function onAddContent(notification) {
        var closeAdd = true;
        var allContent = addContentControl.GetAllContent();
        var showStatus = allContent.autoHideStatus.Show;

        if (notification.confirmed) {
            closeAdd = false;
            var willSend = false, errorStatus;
            var theControl = allContent.agencyPrefixInput;
            var prefixStatus = theControl.GetPrefixStatus();
            var modifyObj;

            if (prefixStatus.hasAnyPrefix) {
                if (prefixStatus.hasValidPrefix) { modifyObj = { prefix: prefixStatus.prefix }; willSend = true; }
                else { errorStatus = prefixStatus.prefixMessage; }
            }
            else { errorStatus = "a valid agency prefix is required"; }

            if (willSend && !errorStatus) {
                showStatus(true, "creating agency...", true);
                settings.apiClient.AdminAgencyPost(function (response) {
                    showStatus(true, tf.GTFS.GetStatusFromXHR(response));
                    //myI.backToToolBar();
                }, modifyObj);
            }
            else {
                theControl.SetFocusToPrefix();
                showStatus(true, errorStatus);
            }
        }
        else {
            allContent.autoHideStatus.HideNow();
        }

        if (closeAdd) { showAddContent(false) }
    }

    function checkShowAddContentAndButton() {
        var theTLF = theThis.GetTLF();
        if (!!theTLF) {
            var isExpanded = theTLF.GetIsExpanded();
            if (!isExpanded) {
                showAddContent(false);
            }
            else {
                showAddContentButton(!addContentControl.GetIsShowing());
            }
        }
    }

    function onToggleExpanded(notification) { checkShowAddContentAndButton(); }

    function createAddNewControl() {
        var theTLF = theThis.GetTLF().Get();
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var classNames = settings.cssClasses.GetClassNames();
        var customAppContentI = settings.customAppContentI;
        var delayMillis = 0, toolTipClass = "*start", toolTipArrowClass = "top";
        var buttonSettings = {
            wrapper: customAppContentI.getContentWrapper(), offsetY: -4, onClick: undefined, onHover: undefined, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };
        addContentControl = new tf.GTFS.AgenciesAddContent(tf.js.ShallowMerge(settings, { onAddContent: onAddContent }));
        addContentControl.Show(false);
        theTLF.toolBar.wrapper.AddContent(addContentControl.GetAllContent().wrapper);
        addNewButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
            onClick: onAddContentClicked
        }), undefined, classNames.itemToolBarTextButton + " " + classNames.itemToolBarFixWidthTextButton, "Add new agencies", undefined, "");
        var addNewButtonButton = addNewButton.GetButton();
        addNewButtonButton.innerHTML = "Add";
        addNewButtonButton.style["float"] = "right";
        theTLF.toolBar.content.AddContent(addNewButtonButton);
    }

    function onChatMessage(notification) {
        var evObj = notification.evObj;
        var agencyId = evObj.id;
        var agencyItem = settings.agenciesList.GetKL().GetItem(agencyId);
        if (agencyItem) {
            var agencyContent = myI.getContentFromItem(agencyItem);
            if (agencyContent) {
                var chatBox = agencyContent.chatBox;
                chatBox.OnMessage(notification);
            }
        }
    }

    function onAgencyProgress(notification) { onChatMessage(notification); }

    function onAgencyMessage(notification) { onChatMessage(notification); }

    function onSelectedStyleChange(notification) {
        var isSelected = notification.isSelected;
        if (isSelected) {
            var item = theThis.GetSelectedItem();
            var itemData = item ? item.GetData() : undefined;
            var workingSetInfo = itemData ? itemData.workingSetInfo : undefined;
            var extent = workingSetInfo ? workingSetInfo.extent : undefined;
            if (extent) { settings.appContent.SetMapExtent(extent); }
        }
        notification.content.chatBox.Show(isSelected);
    };

    function test() {
        settings.apiClient.DesignTripsPost(function (results) {
            console.log(JSON.stringify(results));
        }, {
                "id": 75,
                //"prefix": "MDT",
                //"tripIds": [1],
                //"tripIdsInAgency": ["001"],
                //"routeId": 1,
                //"routeIdInAgency": "001",
                //"routeTypeList": [3],
                //"routeDirectionId": 1,
                //"serviceIds": [1],
                //"serviceIdsInAgency": ["001"],
                //"stopSequenceId": 1,
                "stopIds": [1],
                //"stopIdsInAgency": ["M305"],
                //"onDate": "20170904",
                "minStartHMS": 53600,
                //"maxStartHMS": 3600,
                //"minEndHMS": 3600,
                "maxEndHMS": 63600,
                /*"includeStopSequences": true,
                "includeStopTimes": true,
                "includeStopDistances": true,
                "includeStops": true,
                "includeRoutes": true,
                "includeShapes": true,
                "includeOriginal": false,
                "excludeSimplified": false,*/
                "decodeData": true,
                "returnGeoJSON": true
            });

    };

    function onEditAgency() {
        var item = theThis.GetSelectedItem();
        if (!!item) { settings.onEditAgency(item); }
    };

    function initialize() {
        var contentId = (settings.contentId != undefined ? settings.contentId : '') + '';
        tf.GTFS.ListContent.call(theThis, tf.js.ShallowMerge(settings, {
            contentInItemAttributeName: "agencyContent" + contentId, itemInContentAttributeName: "agencyItem" + contentId,
            listTitle: "Agencies", itemNameSingle: "agency", itemNamePlural: "agencies",
            onEditAgency: onEditAgency,
            setInterface: function (theInterface) { myI = theInterface; },
            attachedSelectedContentType: tf.GTFS.AgenciesSelectedContent,
            KL: settings.agenciesList.GetKL(),
            onSelectedStyleChange: onSelectedStyleChange,
            onToggleExpanded: onToggleExpanded,
            onContentBecameSpare: onContentBecameSpare,
            prepareSpareContent: prepareSpareContent,
            createNewContent: createNewContent,
            updateContentForItem: updateContentForItem,
            compareContent: compareContent
        }));
        createAddNewControl();
        checkShowAddContentAndButton();
        settings.notify.AddAgencyProgressListener(onAgencyProgress);
        settings.notify.AddAgencyMessageListener(onAgencyMessage);
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.GTFS.AgenciesContent, tf.GTFS.ListContent);
