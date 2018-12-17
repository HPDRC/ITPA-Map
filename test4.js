"use strict";

function inIframe(windowUse) {
    try {
        return windowUse.self !== window.top;
    } catch (e) { return true; }
}

var StyleSheet = function (settings) {
    var theThis, allRules, usingInsert, styleElem, styleSheet, rules, nRules;

    this.GetAllRules = function () { return allRules; }
    this.GetIsActive = function () { return styleElem != undefined; }

    this.AddStyles = function (styleOrStyleArray) {
        if (styleOrStyleArray != undefined) {
            if (styleOrStyleArray.length == undefined) { styleOrStyleArray = [styleOrStyleArray]; }
            var nStyles = styleOrStyleArray.length;
            for (var i = 0; i < nStyles; ++i) {
                var thisStyle = styleOrStyleArray[i];
                if (thisStyle != undefined && thisStyle.styleName != undefined) {
                    updateOrInsertRule(thisStyle.styleName, addStyleProperties(thisStyle));
                }
            }
        }
    }

    function unCamelize(name) {
        var newName = '', nChars = typeof name === "string" ? name.length : 0;
        for (var i = 0; i < nChars; ++i) {
            var thisChar = name[i], thisCharLower = thisChar.toLowerCase();
            newName += thisChar == thisCharLower ? thisChar : "-" + thisCharLower;
        }
        return newName;
    };

    function addStyleProperties(style, styleStr) {
        typeof styleStr !== "string" && (styleStr = '');
        var prop;
        for (var property in style) {
            if (style.hasOwnProperty(property)) {
                if (property != 'styleName') {
                    if (property == 'inherits') {
                        if (typeof (prop = style[property]) === "object") {
                            if (prop.length) { for (var p in prop) { if (prop.hasOwnProperty(p)) { styleStr = addStyleProperties(prop[p], styleStr); } } }
                            else { styleStr = addStyleProperties(prop, styleStr) }
                        }
                    }
                    else switch (property) {
                        case "tf-shadow":
                            break;
                        default:
                            prop = style[property]; property = unCamelize(property); styleStr += property + ' : ' + prop + '; ';
                            break;
                    }
                }
            }
        }
        return styleStr;
    }

    function updateOrInsertRule(selector, style) { return updateRule(selector, style) || insertRule(selector, style); }

    function updateRule(selector, style) {
        var updatedOK = false;
        var existingRule = allRules[selector];
        if (!!existingRule) {
            try {
                existingRule.style.cssText = style;
                updatedOK = true;
                allRules[selector] = style;
            }
            catch (exception) {
                updatedOK = false;
                //console.log('failed to update css selector ' + selector + ' ' + exception);
            }
            allRules[selector] = styleSheet[nRules];
        }
        return updatedOK
    }

    function insertRule(selector, style) {
        var insertedOK = false;
        if (!!styleSheet) {
            nRules = rules.length;
            try {
                if (usingInsert) { styleSheet.insertRule(selector + "{" + style + "}", nRules); } else { styleSheet.addRule(selector, style); }
                insertedOK = true;
                allRules[selector] = style;
            }
            catch (exception) {
                insertedOK = false;
            }
        }
        return insertedOK;
    }

    function createStyleSheet() {
        var head = settings.document.getElementsByTagName("head");

        if (head != undefined && head.length > 0) {
            styleElem = settings.document.createElement("style");
            styleElem.type = "text/css";
            head[0].appendChild(styleElem);
            if (!!(styleSheet = styleElem.sheet != undefined ? styleElem.sheet : (styleElem.styleSheet != undefined ? styleElem.styleSheet : undefined))) {
                if (!(rules = getStyleSheetRules(styleSheet))) { styleSheet = undefined; }
            }
            if (styleSheet != undefined) {
                if (!(usingInsert = (typeof styleSheet.insertRule == "function"))) {
                    if (typeof styleSheet.addRule != "function") {
                        styleSheet = undefined;
                    }
                }
            }
            if (styleSheet == undefined) { styleElem = undefined; }
        }
    }

    function getStyleSheetRules(styleSheet) {
        var rules;
        if (!!styleSheet) {
            try {
                var mediaType = typeof styleSheet.media;
                rules = mediaType == "string" ? styleSheet.rules : (mediaType == "object" ? styleSheet.cssRules : null);

                if (!rules) {
                    if (!!styleSheet.sheet && !!styleSheet.sheet.cssRules) {
                        rules = styleSheet.sheet.cssRules;
                    }
                }
            } catch (e) {
                //console.log('could not find style sheet rules');
                rules = undefined;
            }
        }
        return rules;
    }

    function initialize() {
        usingInsert = false;
        allRules = {};
        createStyleSheet();
    }

    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};

function addScript(scriptSrc, callBack, customDoc, id) {
    if (scriptSrc != undefined && typeof scriptSrc === "string") {
        var docUse = customDoc != undefined ? customDoc : document;
        var script = docUse.createElement('script'); script.type = "text/javascript"; script.src = scriptSrc;
        if (id != undefined) { script.id = id; }
        script.onload = callBack;
        docUse.head.appendChild(script);
    }
}

function addScripts(scripts, callBack, customDoc) {
    var nScriptsLoaded = 0, nScriptsToLoad = 0, notified = false;
    function onScriptLoaded() {
        if (!notified) {
            if (++nScriptsLoaded >= nScriptsToLoad) {
                notified = true; callBack();
            }
        }
    }
    if (scripts != undefined && scripts.length != undefined) {
        var nScripts = scripts.length;
        nScriptsToLoad = nScripts;
        for (var i = 0; i < nScripts; ++i) { addScript(scripts[i], onScriptLoaded, customDoc, 'script' + i); }
    }
};

function addStyleSheetRelLink(linkHRef, callBack, customDoc, id) {
    if (linkHRef != undefined && typeof linkHRef === "string") {
        var docUse = customDoc != undefined ? customDoc : document;
        var link = docUse.createElement('link'); link.rel = "stylesheet"; link.type = "text/css"; link.href = linkHRef;
        if (id != undefined) { link.id = id; }
        link.onload = callBack;
        docUse.head.appendChild(link);
    }
}

function addStyleSheetRelLinks(links, callBack, customDoc) {
    var nLinksLoaded = 0, nLinksToLoad = 0, notified = false;
    function onLinkLoaded() {
        if (!notified) {
            if (++nLinksLoaded >= nLinksToLoad) {
                notified = true; callBack();
            }
        }
    }
    if (links != undefined && links.length != undefined) {
        var nLinks = links.length;
        nLinksToLoad = nLinks;
        for (var i = 0; i < nLinks; ++i) { addStyleSheetRelLink(links[i], onLinkLoaded, customDoc, 'link' + i); }
    }
};

function refreshElement(theElement) {
    var domElement = theElement.domElement;
    domElement.className = theElement.className;
    if (theElement.id != undefined) { domElement.id = theElement.id; }
    if (theElement.innerHTML) { domElement.innerHTML = theElement.innerHTML; }
}

function getOnEvent(theLayout, theElement, onName) { return function (event) { theElement.on[onName](event, theLayout, theElement, onName); }; }

function addLayoutElements(theLayout, currentRoot, theElements) {
    if (theElements != undefined) {
        var theDoc = theLayout.doc;
        var nElements = theElements.length;
        for (var i = 0; i < nElements; ++i) {
            var theElement = theElements[i];
            switch (theElement.type) {
                default: case 'div': break;
                case 'iframe': break;
                case 'button': break;
            }
            var domElement = theDoc.createElement(theElement.type);
            theElement.domElement = domElement;
            refreshElement(theElement);
            for (var onName in theElement.on) {
                domElement.addEventListener(onName, getOnEvent(theLayout, theElement, onName));
            }
            currentRoot.appendChild(domElement);
            addLayoutElements(theLayout, domElement, theElement.elements);
            if (theElement.name != undefined) { theLayout.named[theElement.name] = theElement; }
        }
    }
}

function removeAllChildren(elem) { var lastChild; while (lastChild = elem.lastChild) { elem.removeChild(lastChild); } }

function createLayout(theLayout) {
    function loadElements() {
        theLayout.named = {};
        addLayoutElements(theLayout, theBody, theLayout.elements);
        if (theLayout.documentReady != undefined) {
            theLayout.documentReady(theLayout);
        }
        console.log('layoutCreated');
    }
    function loadScripts() {
        if (theLayout.scripts != undefined && theLayout.scripts.length > 0) {
            addScripts(theLayout.scripts, loadElements, theDoc);
        }
        else {
            loadElements();
        }
    }
    function loadLinkRelStyleSheets() {
        if (theLayout.linkRelStyleSheets != undefined && theLayout.linkRelStyleSheets.length > 0) {
            addStyleSheetRelLinks(theLayout.linkRelStyleSheets, loadScripts, theDoc);
        }
        else {
            loadScripts();
        }
    }
    var theDoc = theLayout.doc;
    var theBody = theDoc.body;
    removeAllChildren(theDoc.head);
    removeAllChildren(theBody);
    if (theLayout.cssClasses != undefined && theLayout.cssClasses.length > 0) {
        theLayout.styleSheet = new StyleSheet({ document: theDoc });
        theLayout.styleSheet.AddStyles(theLayout.cssClasses);
    }
    theBody.className = layout.bodyClassName;
    loadLinkRelStyleSheets();
}

//var iDoc = document;

var bodyClass = { styleName: ".bodyClass", fontFamily: "Roboto", fontSize: "16px", lineHeight: "20px", padding: "0px", margin: "0px", border: "none", backgroundColor: "transparent", overflow: "hidden" };
var appRootClass = {
    styleName: ".appRootClass", padding: "0px", margin: "0px", border: "none", backgroundColor: "transparent", overflow: "hidden",
    cursor: "default", display: "block", position: "absolute", zIndex: "1", left: "0px", top: "0px", width: "100%", height: "100%"
};
var tableClass = {
    styleName: ".tableClass", position: "absolute", left: "0px", top: "0px", width: "300px", height: "100%", backgroundColor: "lightblue",
    display: "flex", flexFlow: "column nowrap"
};
var editorClass = {
    styleName: ".editorClass", position: "absolute", left: "300px", top: "0px", width: "calc(100% - 300px)", height: "100%", backgroundColor: "lightgreen",
    display: "flex", flexFlow: "column nowrap"
};
var iFrameClass = { styleName: ".iFrameClass", margin: "auto", border: "1px solid black", width: "70%", height: "70%" };
var buttonClass = {
    styleName: ".buttonClass", outline: "0", border: "1px solid transparent", fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit",
    padding: "4px", margin: "auto"
};
var buttonClassHover = { styleName: ".buttonClass:hover", border: "1px solid red" };

var layout = {
    documentReady: function (theLayout) {
        var myWindow = theLayout.window;
        var btn1Element = theLayout.named["l1Button"];
        btn1Element.innerHTML = "hello, world.";
        myWindow.refreshElement(btn1Element);
        if (!myWindow.inIframe(theLayout.window)) {
            theLayout.onLayout(theLayout, 2);
        }
        console.log('document ready');
    },
    linkRelStyleSheets: [
        "http://fonts.googleapis.com/css?family=Roboto:100,300,400,700",
        "http://fonts.googleapis.com/css?family=Roboto+Condensed:100,300,400,700"
    ],
    scripts: ["./test4.js"],
    cssClasses: [bodyClass, appRootClass, tableClass, editorClass, buttonClass, buttonClassHover, iFrameClass],
    //doc: iDoc,
    bodyClassName: "bodyClass",
    onLayout: function(theLayout, index) {
        var IAmInIFrame = inIframe(window);
        console.log('on layout ' + index + ' code in iframe: ' + IAmInIFrame);
        //var nIters = 1000;
        var isSelfReplace = index == 1;
        var parentIFrame = document.getElementById("iframe");
        var parentIFrameWindow = !!parentIFrame ? parentIFrame.contentWindow : undefined;
        var targetDoc = isSelfReplace ? document : parentIFrameWindow.document;
        theLayout.doc = targetDoc;
        theLayout.window = isSelfReplace ? window : parentIFrameWindow;
        createLayout(theLayout);
    },
    elements: [{
        name: "root", className: "rootClass", type: 'div',
        elements: [
            {
                name: "table", className: "tableClass", type: 'div',
                elements: [
                    {
                        name: "l1Button", className: "buttonClass ripple", type: 'button', innerHTML: "Layout 1",
                        on: {
                            click: function (event, theLayout, theElement, onName) { theLayout.onLayout(theLayout, 1); }
                        }
                    },
                    {
                        name: "l2Button", className: "buttonClass ripple", type: 'button', innerHTML: "Layout 2",
                        on: {
                            click: function (event, theLayout, theElement, onName) { theLayout.onLayout(theLayout, 2); }
                        }
                    }
                ]
            },
            {
                name: "editor", className: "editorClass", type: 'div',
                elements: [
                    {
                        name: "iframe", id: "iframe", className: "iFrameClass", type: 'iframe'
                    }
                ]
            }
        ]
    }]
};
