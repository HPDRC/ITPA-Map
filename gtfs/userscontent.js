"use strict";

tf.GTFS.UsersAddContent = function (settings) {
    var theThis, allContent, promptMessage, isShowing;

    this.GetAllContent = function () { return allContent; }

    this.Show = function (show) {
        isShowing = !!show;
        allContent.wrapper.GetHTMLElement().style.display = isShowing ? "block" : "none";
        allContent.userModifyControl.Show(true, undefined);
    }

    this.GetIsShowing = function () { return isShowing; }

    function createControl() {
        var appContent = settings.appContent;
        var classNames = settings.cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: classNames.itemRowWrapperClassName });
        var userModifyControl = new tf.GTFS.UserModifyControl(tf.js.ShallowMerge(settings, { onGo: function () { settings.onAddContent({ confirmed: true }); } }));
        var titleWrapper = new tf.dom.Div({ cssClass: classNames.emailPasswordStatus });
        var modifyCancelRow = new tf.GTFS.ModifyCancelTextButonRow(tf.js.ShallowMerge(settings, { onModify: settings.onAddContent }));
        var autoHideStatus = new tf.GTFS.AutoHideStatus(settings);

        titleWrapper.GetHTMLElement().innerHTML = promptMessage;
        modifyCancelRow.Rename("Add new", "Done");

        wrapper.AddContent(titleWrapper, userModifyControl.GetAllContent().wrapper, modifyCancelRow.GetAllContent().wrapper, autoHideStatus.GetAllContent().statusWrapper);

        allContent = {
            wrapper: wrapper,
            titleWrapper: titleWrapper,
            userModifyControl: userModifyControl,
            modifyCancelRow: modifyCancelRow,
            autoHideStatus: autoHideStatus
        };
    }

    function initialize() {
        isShowing = true;
        promptMessage = "Enter new user attributes below";
        createControl();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

tf.GTFS.UsersSelectedContent = function (settings) {
    var theThis, myI, allContent, modifyPromptStatusMessage, selectAgencyPrompt;

    function onAddDelCancelAgency(notification) {
        var goBackToToolBar = true;
        if (notification.confirmed) {
            if (tf.js.GetFunctionOrNull(settings.getItemFromContent)) {
                var currentContent = theThis.GetCurrentContent();
                var item = settings.getItemFromContent(currentContent);
                var selectedAgency = allContent.agenciesSelectControl.GetSelectedAgency();
                if (!!item && !!selectedAgency) {
                    var showStatus = allContent.autoHideStatus.Show;
                    var itemData = item.GetData();
                    var apiCall, initialStatus;
                    var modifyObj = { userId: itemData.id, agencyId: selectedAgency.id };
                    goBackToToolBar = false;
                    if (notification.isAdd) {
                        initialStatus = "adding user to agency...";
                        apiCall = settings.apiClient.AdminAgencyUserPost;
                    }
                    else {
                        initialStatus = "removing user from agency...";
                        apiCall = settings.apiClient.AdminAgencyUserDelete;
                    }
                    showStatus(true, initialStatus, true);
                    apiCall(function (response) {
                        showStatus(true, tf.GTFS.GetStatusFromXHR(response));
                        //myI.backToToolBar();
                    }, modifyObj);
                }
            }
        }
        else { allContent.autoHideStatus.HideNow(); }

        if (goBackToToolBar) { myI.backToToolBar(); }
    }

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
                        case "modify":
                            //console.log("modifying user");
                            var willSend = false, errorStatus;
                            var modifyControl = allContent.userModifyControl;
                            var modifyObj = { id: itemData.id, isAdmin: modifyControl.GetIsAdmin() };
                            var emailPasswordStrs = modifyControl.GetEmailPasswordStrs();

                            if (emailPasswordStrs.hasAnyEmail) {
                                if (emailPasswordStrs.hasValidEmail) { modifyObj.email = emailPasswordStrs.email; willSend = true; }
                                else { errorStatus = "a valid email address is required"; }
                            }

                            if (!errorStatus) {
                                if (emailPasswordStrs.hasAnyPassword) {
                                    if (emailPasswordStrs.hasValidPassword) {
                                        modifyObj.password = emailPasswordStrs.password; willSend = true;
                                    }
                                    else { errorStatus = emailPasswordStrs.passwordMessage; }
                                }
                            }

                            if (!errorStatus) {
                                if (modifyObj.isAdmin != itemData.isAdmin) { willSend = true; }
                                else if (!willSend) { errorStatus = "no changes detected"; }
                            }

                            if (willSend && !errorStatus) {
                                showStatus(true, "modifying user...", true);
                                settings.apiClient.AdminUserPut(function (response) {
                                    showStatus(true, tf.GTFS.GetStatusFromXHR(response));
                                    myI.backToToolBar();
                                }, modifyObj);
                            }
                            else {
                                modifyControl.SetFocusToEmail();
                                showStatus(true, errorStatus);
                            }
                            break;
                        case "signout":
                            showStatus(true, "signing user out...", true);
                            settings.apiClient.AdminSessionDelete(function (response) {
                                showStatus(true, tf.GTFS.GetStatusFromXHR(response));
                                myI.backToToolBar();
                            }, { userId: itemData.id });
                            break;
                        case "delete":
                            showStatus(true, "deleting user...", true);
                            settings.apiClient.AdminUserDelete(function (response) {
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

    function showModify(show) {
        var itemData;
        if (show) {
            myI.showTitle(true, modifyPromptStatusMessage);
            allContent.modifyCancelRow.Rename("Modify", "Cancel");
            var item = settings.getItemFromContent(theThis.GetCurrentContent());
            if (!!item) { itemData = item.GetData(); }
        }
        allContent.userModifyControl.Show(show, itemData);
    }

    function showSignOut(show) { if (show) { allContent.modifyCancelRow.Rename("Sign Out", "Cancel"); } }

    function showDelete(show) { if (show) { allContent.modifyCancelRow.Rename("Delete", "Cancel"); } }

    function showAgencies(show) {
        if (show) {
            myI.showTitle(true, selectAgencyPrompt);
            allContent.modifyCancelRow.Rename("Add", "Cancel");
        }
        allContent.agenciesSelectControl.Show(show);
        allContent.addDelCancelRow.Show(show);
    }

    //function doFollow() { console.log('follow clicked'); }

    function onSelectedAgency(notification) {
        //console.log(notification.option.settings.id + ' ' + notification.option.settings.value);
        //console.log(allContent.agenciesSelectControl.GetSelectedAgency());
    }

    function createControl() {
        var userModifyControl = new tf.GTFS.UserModifyControl(tf.js.ShallowMerge(settings, { onGo: function () { onModify({ confirmed: true }); } }));

        var agenciesSelectControl = new tf.GTFS.AgenciesSelectControl(tf.js.ShallowMerge(settings, {
            onSelect: onSelectedAgency
        }));

        var addDelCancelRow = new tf.GTFS.AddDelCancelRow(tf.js.ShallowMerge(settings, {
            onAddDelCancel: onAddDelCancelAgency
        }));

        userModifyControl.Show(false);
        addDelCancelRow.Show(false);

        allContent = theThis.GetAllContent();

        allContent = tf.js.ShallowMerge(allContent, {
            addDelCancelRow: addDelCancelRow,
            agenciesSelectControl: agenciesSelectControl,
            userModifyControl: userModifyControl
        });

        allContent.wrapper.InsertContentAfter(userModifyControl.GetAllContent().wrapper, allContent.titleWrapper);
        allContent.wrapper.InsertContentAfter(agenciesSelectControl.GetHTMLElement(), allContent.titleWrapper);
        allContent.wrapper.InsertContentAfter(addDelCancelRow.GetAllContent().wrapper, agenciesSelectControl.GetHTMLElement());
    }

    function getVerbs() {
        var verbs = {};
        verbs["agency"] = { text: "Agencies", toolTip: "Modify user agencies", onShow: showAgencies, isAdmin: true, noModifyCancel: true };
        verbs["modify"] = { text: "Attributes", toolTip: "Modify user attributes", onShow: showModify, isAdmin: true };
        verbs["signout"] = { text: "Sign out", toolTip: "Sign user out of all sessions", onShow: showSignOut, isAdmin: true };
        verbs["delete"] = { text: "Delete", toolTip: "Delete user", onShow: showDelete, isAdmin: true };
        return verbs;
    }

    function initialize() {
        modifyPromptStatusMessage = "Enter new attributes below";
        selectAgencyPrompt = "Select agency below";
        tf.GTFS.ListSelectedContent.call(theThis, tf.js.ShallowMerge(settings, { verbs: getVerbs(), onModify: onModify, setInterface: function (theInterface) { myI = theInterface; } }));
        createControl();
        theThis.GetAllContent = function () { return allContent; };
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.GTFS.UsersSelectedContent, tf.GTFS.ListSelectedContent);

tf.GTFS.UsersContent = function (settings) {
    var theThis, myI, addContentControl, addNewButton;

    function compareContent(a, b) {
        var ea = a.itemData.email.toLowerCase();
        var eb = b.itemData.email.toLowerCase();
        return ea == eb ? 0 : ea < eb ? -1 : 1;
    }

    function prepareSpareContent(content, forItem) {
        return content;
    }

    function updateContentForItem(item) {
        var content = myI.getContentFromItem(item);
        if (!!content) {
            var itemData = item.GetData();
            var emailStr = itemData.email;
            var isAdminStr = itemData.isAdmin ? " (admin)" : ''
            var agencyStr = "";
            var nAgencies = itemData.agencies.length;
            if (nAgencies > 0) {
                agencyStr = " [";
                for (var i = 0; i < nAgencies; ++i) {
                    var agency = itemData.agencies[i];
                    agencyStr += " " + agency.prefix + " ";
                }
                agencyStr += "]";
            }
            content.title.GetHTMLElement().innerHTML = emailStr + isAdminStr + agencyStr;
        }
    }

    function createNewContent(forItem) {
        var theTLF = theThis.GetTLF().Get();
        var appContent = settings.appContent;
        var classNames = settings.cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: classNames.itemWrapperClassName });
        var contentWrapper = new tf.dom.Div({ cssClass: classNames.itemContentWrapperClassName });
        var title = new tf.dom.Div({ cssClass: classNames.itemTitleClassName });
        var itemButton = new tf.dom.Button({ cssClass: classNames.itemButtonClassName, onClick: myI.onItemClick });
        var content = { itemButton: itemButton, wrapper: wrapper, contentWrapper: contentWrapper, title: title };

        contentWrapper.AddContent(title);
        wrapper.AddContent(itemButton, contentWrapper);
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
            var modifyControl = allContent.userModifyControl;
            var modifyObj = { isAdmin: !!modifyControl.GetIsAdmin() };
            var emailPasswordStrs = modifyControl.GetEmailPasswordStrs();

            if (emailPasswordStrs.hasAnyEmail) {
                if (emailPasswordStrs.hasValidEmail) { modifyObj.email = emailPasswordStrs.email; willSend = true; }
                else { errorStatus = "a valid email address is required"; }
            }
            else { errorStatus = "a valid email address is required"; }

            if (!errorStatus) {
                if (emailPasswordStrs.hasAnyPassword) {
                    if (emailPasswordStrs.hasValidPassword) {
                        modifyObj.password = emailPasswordStrs.password; willSend = true;
                    }
                    else { errorStatus = emailPasswordStrs.passwordMessage; }
                }
                else { errorStatus = "a password is required"; }
            }

            if (willSend && !errorStatus) {
                showStatus(true, "creating user...", true);
                settings.apiClient.AdminUserPost(function (response) {
                    showStatus(true, tf.GTFS.GetStatusFromXHR(response));
                    //myI.backToToolBar();
                }, modifyObj);
            }
            else {
                modifyControl.SetFocusToEmail();
                showStatus(true, errorStatus);
            }
        }
        else {
            allContent.autoHideStatus.HideNow();
        }

        if (closeAdd) { showAddContent(false); }
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
        addContentControl = new tf.GTFS.UsersAddContent(tf.js.ShallowMerge(settings, { onAddContent: onAddContent }));
        addContentControl.Show(false);
        theTLF.toolBar.wrapper.AddContent(addContentControl.GetAllContent().wrapper);
        addNewButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
            onClick: onAddContentClicked
        }), undefined, classNames.itemToolBarTextButton + " " + classNames.itemToolBarFixWidthTextButton, "Add new users", undefined, "");
        var addNewButtonButton = addNewButton.GetButton();
        addNewButtonButton.innerHTML = "Add";
        addNewButtonButton.style["float"] = "right";
        theTLF.toolBar.content.AddContent(addNewButtonButton);
    }

    function initialize() {
        var contentId = (settings.contentId != undefined ? settings.contentId : '') + '';
        tf.GTFS.ListContent.call(theThis, tf.js.ShallowMerge(settings, {
            contentInItemAttributeName: "userContent" + contentId, itemInContentAttributeName: "userItem" + contentId,
            listTitle: "Users", itemNameSingle: "user", itemNamePlural: "users",
            setInterface: function (theInterface) { myI = theInterface; },
            attachedSelectedContentType: tf.GTFS.UsersSelectedContent,
            KL: settings.usersList.GetKL(),
            onToggleExpanded: onToggleExpanded,
            prepareSpareContent: prepareSpareContent,
            createNewContent: createNewContent,
            updateContentForItem: updateContentForItem,
            compareContent: compareContent
        }));
        createAddNewControl();
        checkShowAddContentAndButton();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
tf.js.InheritFrom(tf.GTFS.UsersContent, tf.GTFS.ListContent);
