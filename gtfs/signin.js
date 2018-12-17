"use strict";

tf.GTFS.SignInContent = function (settings) {
    var theThis, isVisible, allContent, states, state, errorMessage, lastEmailSignedIn, isChanging;

    this.OnCreated = function (notification) {
        allContent.emailInput.GetInputBox().focus();
    }

    this.OnVisibilityChange = function (notification) { theThis.SetIsVisible(notification.isVisible); }

    this.SetIsVisible = function (newIsVisible) {
        if (isVisible != (newIsVisible = !!newIsVisible)) {
            isVisible = newIsVisible;
            allContent.wrapper.GetHTMLElement().style.display = isVisible ? 'block' : 'none';
        }
    }

    function onAuthChange(notification) {
        //setTimeout(refreshSignInState, 0);
        refreshSignInState();
    }

    function getEmailStr() { return allContent.emailInput.GetText(); }
    function getPasswordStr() { return allContent.passwordInput.GetText(); }
    function setEmailStr(emailStr) { return allContent.emailInput.SetText(emailStr); }
    function setPasswordStr(passwordStr) { return allContent.passwordInput.SetText(passwordStr); }

    function getNewEmailStr() { return allContent.changeEmailPassword.emailInput.GetText(); }
    function getNewPasswordStr() { return allContent.changeEmailPassword.passwordInput.GetText(); }
    function setNewEmailStr(emailStr) { return allContent.changeEmailPassword.emailInput.SetText(emailStr); }
    function setNewPasswordStr(passwordStr) { return allContent.changeEmailPassword.passwordInput.SetText(passwordStr); }

    function refreshSignInState() {
        var auth = settings.apiClient.GetAuth();
        var isSignedIn;
        if (auth.email != undefined) {
            state = auth.isAdmin ? states.signedInAdmin : states.signedInUser;
            isSignedIn = true;
            if (lastEmailSignedIn != auth.email) {
                isChanging = false;
                lastEmailSignedIn = auth.email;
            }
            if (!isChanging) {
                errorMessage = undefined;
            }
        }
        else {
            state = states.notSignedIn;
            isSignedIn = false;
            isChanging = false;
        }

        var statusMessage = "";

        switch (state) {
            case states.signedInAdmin:
            case states.signedInUser:
                if (isChanging) {
                    if (errorMessage) { statusMessage = errorMessage + "<br />"; }
                    statusMessage += 'The current value of fields left empty will be preserved';
                }
                else {
                    statusMessage = auth.email;
                    if (auth.isAdmin) { statusMessage += ' (admin)'; }
                }
                break;
            case states.notSignedIn:
                if (errorMessage) { statusMessage = errorMessage + "<br />"; }
                statusMessage += "enter credentials below";
                break;
        }

        var statusWrapperE = allContent.statusWrapper.GetHTMLElement();

        statusWrapperE.innerHTML = statusMessage;
        statusWrapperE.style.background = (!!errorMessage ? "firebrick" : "royalblue");

        allContent.emailPasswordWrapper.GetHTMLElement().style.display = (isSignedIn ? "none" : "flex");
        allContent.signInButton.GetButton().style.display = (isSignedIn ? "none" : "block");

        var showChangingItems = isSignedIn && isChanging;
        var showChangingItemsVerb = showChangingItems ? "flex" : "none";

        allContent.changeEmailPassword.wrapper.GetHTMLElement().style.display = showChangingItemsVerb;

        var changingDisplayVerb = (isSignedIn && isChanging) ? "inline-block" : "none";
        setButtonsDisplay(allContent.changingButtons, changingDisplayVerb);

        var signedInDisplayVerb = ((isSignedIn && !isChanging) ? "inline-block" : "none");
        setButtonsDisplay(allContent.signedInButtons, signedInDisplayVerb);
        
        //console.log(state);
    }

    function onModify(confirmed) {
        var requestedChanges = false;
        if (isChanging) {
            if (confirmed) {
                var newEmailStr = tf.js.GetNonEmptyString(getNewEmailStr(), undefined);
                var newPasswordStr = tf.js.GetNonEmptyString(getNewPasswordStr(), undefined);
                if (tf.js.GetIsNonEmptyString(newEmailStr) || tf.js.GetIsNonEmptyString(newPasswordStr)) {
                    //console.log('changing: ' + newEmailStr + ' ' + newPasswordStr);
                    requestedChanges = true;
                    settings.apiClient.UserPut(function (result) {
                        if (!!result.responseJSON) {
                            if (result.responseJSON.ok) {
                                errorMessage = undefined;
                            }
                            else {
                                if (!(errorMessage = result.responseJSON.message)) {
                                    errorMessage = undefined;
                                    console.log('empty error message');
                                }
                            }
                        }
                        else {
                            errorMessage = 'connection failed';
                        }
                        if (errorMessage != undefined) { refreshSignInState(); }
                    }, { email: newEmailStr, password: newPasswordStr });
                }
            }
        }
        setNewEmailStr('');
        setNewPasswordStr('');
        if (!requestedChanges) {
            isChanging = !isChanging;
            refreshSignInState();
        }
        if (isChanging) {
            allContent.changeEmailPassword.emailInput.GetInputBox().focus();
        }
    }

    function onSignIn() {
        var emailStr = getEmailStr();
        var passwordStr = getPasswordStr();
        if (tf.js.GetIsNonEmptyString(emailStr) && tf.js.GetIsNonEmptyString(passwordStr)) {
            settings.agenciesContent.GetTLF().SetIsExpanded(true);
            settings.apiClient.AuthPost(function (result) {
                if (!!result.responseJSON) {
                    if (result.responseJSON.ok) {
                        errorMessage = undefined;
                    }
                    else {
                        if (!(errorMessage = result.responseJSON.message)) {
                            errorMessage = undefined;
                            console.log('empty error message');
                        }
                    }
                }
                else {
                    errorMessage = 'connection failed';
                }
                if (errorMessage != undefined) { refreshSignInState(); }
            }, { email: emailStr, password: passwordStr });
            setPasswordStr('');
        }
    };

    function onSignOut() { return settings.apiClient.AuthDelete(); };
    function onSignOutAll() { return settings.apiClient.AuthDelete(undefined, { allSessions: true }); }
    function onRefresh() { return settings.apiClient.RefreshUser(); }

    function setButtonsDisplay(buttons, displayVerb) { for (var i in buttons) { buttons[i].button.GetButton().style.display = displayVerb; } }

    function getButtonSettings() {
        var delayMillis = 0;
        var toolTipClass = "*start";
        var toolTipArrowClass = "top";
        var buttonSettings = {
            offsetY: 0, onClick: undefined, onHover: undefined, delayMillis: delayMillis, toolTipClass: toolTipClass, toolTipArrowClass: toolTipArrowClass
        };
        return buttonSettings;
    }

    function createControl() {
        var ls = tf.TFMap.LayoutSettings;
        var customAppContentI = settings.customAppContentI;
        var mainToolBarButtonClassNames = customAppContentI.getMainToolBarButtonClasses();
        var mainToolBarSpanClassNames = customAppContentI.getMainToolBarSpanClasses();
        var appContent = settings.appContent, appStyles = appContent.GetAppStyles();
        var cssClasses = settings.cssClasses;
        var cssClassNames = cssClasses.GetClassNames();
        //var buttonSettings = getButtonSettings();
        var wrapper = customAppContentI.createNonScrollContent();
        var toolBar = customAppContentI.createMainToolBar();
        var content = customAppContentI.createNonScrollContent();
        /*var titleButton = tf.TFMap.CreateSVGButton(appContent, tf.js.ShallowMerge(buttonSettings, {
            wrapper: toolBar.wrapper,
            onClick: undefined
        }), appStyles.GetFenceSVG(), mainToolBarButtonClassNames, "hello, world", undefined, "titleButton");*/
        var titleSpan = document.createElement('span');

        titleSpan.className = mainToolBarSpanClassNames;
        titleSpan.style.lineHeight = "20px";
        titleSpan.innerHTML = "Sign In";

        toolBar.content.AddContent(/*titleButton.GetButton(),*/ titleSpan);

        wrapper.AddContent(/*toolBar.wrapper, */content);

        var signInButtonsWrapper = new tf.dom.Div({ cssClass: cssClassNames.signInButtonsWrapper });
        var statusWrapper = new tf.dom.Div({ cssClass: cssClassNames.emailPasswordStatus });
        var signInButton = new tf.dom.Button({ cssClass: cssClassNames.signInButtonClassName, onClick: onSignIn });
        var signInButtonButton = signInButton.GetButton();

        statusWrapper.GetHTMLElement().innerHTML = "";
        signInButtonButton.innerHTML = "Click here to Sign In";

        signInButtonsWrapper.AddContent(signInButtonButton);

        var signedInButtonSpecs = {};
        signedInButtonSpecs["signOutButton"] = { innerHTML: "Sign out", handler: onSignOut };
        signedInButtonSpecs["signOutAllButton"] = { innerHTML: "Sign out all", handler: onSignOutAll };
        signedInButtonSpecs["modifyButton"] = { innerHTML: "Modify", handler: onModify };
        //signedInButtonSpecs["refreshButton"] = { innerHTML: "Refresh", handler: onRefresh };

        var signedInButtons = cssClasses.CreateButtons(signedInButtonSpecs, cssClassNames.signedInButtonClassName, signInButtonsWrapper);

        var changingButtonSpecs = {};
        changingButtonSpecs["modify"] = { innerHTML: "Modify", handler: function () { onModify(true); } };
        changingButtonSpecs["cancel"] = { innerHTML: "Cancel", handler: function () { onModify(false); } };

        var changingButtons = cssClasses.CreateButtons(changingButtonSpecs, cssClassNames.signedInButtonClassName, signInButtonsWrapper);

        tf.dom.AddCSSClass(content, cssClassNames.contentWrapper);

        var signInEmailPassword = cssClasses.CreateEmailPasswordGroup(onSignIn, "gtfsemail", "gtfspassword", "enter email address", "enter password", true);
        var changeEmailPassword = cssClasses.CreateEmailPasswordGroup(onModify, undefined, undefined, "enter new email address", "enter new password", false);

        //content.AddContent(emailInputBox, passwordInputBox);
        content.AddContent(statusWrapper, signInEmailPassword.wrapper, changeEmailPassword.wrapper, signInButtonsWrapper);

        allContent = {
            wrapper: wrapper, toolBar: toolBar, content: content, /*titleButton: titleButton, */titleSpan: titleSpan,
            statusWrapper: statusWrapper, emailInput: signInEmailPassword.emailInput, passwordInput: signInEmailPassword.passwordInput, signInButton: signInButton,
            signInEmailPassword: signInEmailPassword,
            changeEmailPassword: changeEmailPassword,
            signedInButtons: signedInButtons,
            changingButtons: changingButtons,
            emailPasswordWrapper: signInEmailPassword.wrapper
        };
        settings.customAppContentI.getContentWrapper().AddContent(wrapper);
    }

    function initialize() {
        isChanging = false;
        settings.apiClient.AddAuthListener(onAuthChange);
        createControl();
        states = { signedInUser: "siu", signedInAdmin: "sia", notSignedIn: "nsi" };
        refreshSignInState();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

