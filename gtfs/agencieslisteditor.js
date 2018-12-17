"use strict";

tf.GTFS.SubAgenciesSelectedContent = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.SubAgenciesSelectedContent)) { return new tf.GTFS.SubAgenciesSelectedContent(settings); }
    var myI, allContent;

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
        var subAgencyItemAttributes = {
            "agency_id": { desc: "uniquely identifies the sub agency" },
            "agency_name": { desc: "the name of the sub agency for display" },
            "agency_url": { desc: "optional url to sub agency web page", type: tf.GTFS.EditorAttributeTypes.url },
            "agency_timezone": { desc: "sub agency timezone" },
            "agency_lang": { desc: "optional primary languaged used by the sub agency" },
            "agency_phone": { desc: "optional sub agency voice telephone number" },
            "agency_fare_url": { desc: "optional url to web page containing fare information", type: tf.GTFS.EditorAttributeTypes.url },
            "agency_email": { desc: "optional customer service email address" }
        };
        (allContent.attributesListEditor = tf.GTFS.AttributesListEditor(tf.js.ShallowMerge(settings, { itemAttributes: subAgencyItemAttributes }))).Show(true);
        allContent.wrapper.InsertContentAfter(allContent.attributesListEditor.GetAllContent().wrapper, allContent.titleWrapper);
    };

    function getVerbs() {
        var verbs = {};
        return verbs;
    };

    function onContentChange() {
        var currentContent = theThis.GetCurrentContent();
        var item = settings.getItemFromContent(currentContent);
        if (!!item) {
            var itemData = item.GetData();
            allContent.attributesListEditor.UpdateContent(itemData);
        }
    };

    function initialize() {
        tf.GTFS.ListSelectedContent.call(theThis, tf.js.ShallowMerge(settings, { verbs: getVerbs(), onModify: onModify, setInterface: function (theInterface) { myI = theInterface; }, onContentChange: onContentChange }));
        createControl();
        theThis.GetAllContent = function () { return allContent; };
    }
    initialize();
};
tf.js.InheritFrom(tf.GTFS.SubAgenciesSelectedContent, tf.GTFS.ListSelectedContent);

tf.GTFS.SubAgenciesListEditor = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.SubAgenciesListEditor)) { return new tf.GTFS.SubAgenciesListEditor(settings); }
    var assetListEditor, agencyItem;
    var selectedContent;

    this.GetAssetListEditor = function () { return assetListEditor; };

    this.GetTLF = function () { return settings.TLF; };

    this.RefreshForAgency = function(agencyItemRefresh, then) {
        if (agencyItemRefresh != agencyItem) {
            agencyItem = agencyItemRefresh;
            refreshFromAPI(then);
        }
    };

    this.Show = function (agencyItemShow) {
        if (agencyItemShow != agencyItem) {
            agencyItem = agencyItemShow;
            refreshFromAPI();
        }
        assetListEditor.ShowHide(true);
    };

    this.RemoveAllItems = function () {
        agencyItem = undefined;
        assetListEditor.RemoveAllItems();
    };

    this.Hide = function () { assetListEditor.ShowHide(false); };

    //function compareContent(a, b) { return 0; }

    function prepareSpareContent(content, forItem) { return content; }

    function onContentBecameSpare(content, prevItem) { }

    function getSubAgencyName(subAgencyItemData) { return subAgencyItemData.agency_name ? subAgencyItemData.agency_name : 'unnamed subAgency'; };

    function getSubAgencyTitle(subAgencyItemData) { return subAgencyItemData.agency_id + ' - ' + getSubAgencyName(subAgencyItemData); };

    function updateContentForItem(item) {
        var content = assetListEditor.GetContentFromItem(item);
        if (!!content) {
            var itemData = item.GetData();
            content.title.GetHTMLElement().innerHTML = getSubAgencyTitle(itemData);
        }
    };

    function onItemClick(notification) {
        var button = !!notification ? notification.domObj : undefined;
        if (!!button) {
            assetListEditor.OnContentSelectToggle(button.content);
        }
    };

    function createNewContent(forItem) {
        var theTLF = theThis.GetTLF().Get();
        var itemData = forItem.GetData();
        var appContent = settings.appContent;
        var classNames = settings.cssClasses.GetClassNames();
        var wrapper = new tf.dom.Div({ cssClass: classNames.itemWrapperClassName });
        var contentWrapper = new tf.dom.Div({ cssClass: classNames.itemContentWrapperClassName });
        var title = new tf.dom.Div({ cssClass: classNames.itemTitleClassName });
        var itemButton = new tf.dom.Button({ cssClass: classNames.itemButtonClassName, onClick: onItemClick });
        var content = { itemButton: itemButton, wrapper: wrapper, contentWrapper: contentWrapper, title: title };

        contentWrapper.AddContent(title);
        wrapper.AddContent(itemButton, contentWrapper);
        itemButton.content = content;

        return content;
    };

    function refreshFromAPI(then) {
        var ad = agencyItem.GetData();
        assetListEditor.RemoveAllItems();
        assetListEditor.ShowEditorLoadingToast();
        settings.apiClient.DesignAgenciesPost(
            function (results) {
                var isOK = false;
                if (results.responseJSON) { if (results.responseJSON.ok) { assetListEditor.UpdateFromNewData(results.responseJSON.result); isOK = true; } }
                if (!isOK) { console.log('subAgencies api call failed'); }
                assetListEditor.CloseEditorLoadingToast();
                if (then) { then({ sender: theThis }); }
            }, { id: ad.id });
    };

    function onKLChange(notification) {
        //console.log('subAgency kl change notification received');
    };

    function initialize() {
        assetListEditor = new tf.GTFS.AssetListEditor(tf.js.ShallowMerge(settings, {
            editor: theThis,
            TLF: theThis.GetTLF(),
            //onRemoveAllItems: function () { agencyItem = undefined; },
            attachedSelectedContentType: tf.GTFS.SubAgenciesSelectedContent,
            onKLChange: onKLChange,
            createNewContent: createNewContent,
            prepareSpareContent: prepareSpareContent,
            onContentBecameSpare: onContentBecameSpare,
            updateContentForItem: updateContentForItem,
            //compareContent: compareContent,
            itemNameSingle: "sub agency",
            itemNamePlural: "sub agencies",
            assetName: "sub agencies",
            contentInItemAttributeName: "subAgencyContent",
            itemInContentAttributeName: "subAgencyItem"
        }));
        //assetListEditor.AddEditorToSettings(settings);
    };

    initialize();
};
