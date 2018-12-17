"use strict";

tf.GTFS.GetServiceName = function (serviceItemData) { return serviceItemData.wd_mask_name };

tf.GTFS.GetServiceTitle = function (serviceItemData) { return serviceItemData.service_id + ' - ' + tf.GTFS.GetServiceName(serviceItemData); };

tf.GTFS.ServicesSelectControl = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.ServicesSelectControl)) { return new tf.GTFS.ServicesSelectControl(settings); }

    function getOption(item) {
        var value, id, innerHTML;
        var itemData = !!item ? item.GetData() : undefined;
        if (itemData) { id = itemData.id; value = '' + id; innerHTML = tf.GTFS.GetServiceTitle(itemData); }
        return { value: value, id: id, innerHTML: innerHTML };
    };

    function getValue(item) { return getOption(item).value; };

    function onSelect(notification) {
        if (settings.onSelect) { settings.onSelect(notification); }
    };

    function initialize() {
        var listEditor = settings.getEditor("services");
        var kl = listEditor.GetAssetListEditor().GetKL();
        tf.GTFS.AssetSelectControl.call(theThis, tf.js.ShallowMerge(settings, {
            KL: kl, getOption: getOption, getValue: function (item) { return getOption(item).value; }, onSelect: onSelect,
            listEditor: listEditor
        }));
    };

    initialize();
};
tf.js.InheritFrom(tf.GTFS.ServicesSelectControl, tf.GTFS.AssetSelectControl);

tf.GTFS.ServicesSelectedContent = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.ServicesSelectedContent)) { return new tf.GTFS.ServicesSelectedContent(settings); }
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

    function translateDate(theDate) { return theDate ? theDate : 'service is only available on additional calendar dates' };

    function translateStartDate(itemData) { return translateDate(itemData.start_date); };
    function translateEndDate(itemData) { return translateDate(itemData.end_date); };

    function translateWDMask(itemData) {
        var wdMask = itemData.wd_mask;
        if (wdMask == 0) {
            return 'only available by calendar dates';
        }
        else {
            var weekDays = "";
            var weekDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

            for (var i = 0; i < 7; ++i) {
                var thisMask = 1 << i;
                if (wdMask & thisMask) {
                    if (weekDays) { weekDays += ', '; }
                    weekDays += weekDayNames[i];
                }
            }
            //return weekDays + ' (' + itemData.wd_mask_name + ')';
            return weekDays;
        }
    };

    function makeDateStr(prefix, dates) {
        var datesStr = '', nDates = dates ? dates.length : 0;
        for (var i = 0; i < nDates; ++i) {
            if (datesStr) { datesStr += ', '; }
            datesStr += dates[i];
        }
        return prefix + ': ' + datesStr;
    };

    function translateCalendarDates(itemData) {
        var translateStr;
        var nDates = itemData.calendar_dates ? itemData.calendar_dates.length : 0;
        if (nDates > 0) {
            var availableDates = {};
            for (var i = 0; i < nDates; ++i) {
                var cd = itemData.calendar_dates[i];
                var adk;
                switch (cd.exception_type) {
                    case tf.GTFS.CalendarDatesExceptionTypeAvailable:
                    case tf.GTFS.CalendarDatesExceptionTypeUnavailable:
                        adk = '' + cd.exception_type;
                        break;
                    default:
                        adk = '' + tf.GTFS.CalendarDatesExceptionTypeUnavailable;
                        break;
                }
                var ad = availableDates[adk];
                if (!ad) { ad = availableDates[adk] = []; }
                ad.push(cd.date);
            }

            var hasAvailable = availableDates[tf.GTFS.CalendarDatesExceptionTypeAvailable], hasUnavailable = availableDates[tf.GTFS.CalendarDatesExceptionTypeUnavailable];
            var availableStr = hasAvailable ? makeDateStr("available on", availableDates[tf.GTFS.CalendarDatesExceptionTypeAvailable]) : "";
            var unavailableStr = hasUnavailable ? makeDateStr("unavailable on", availableDates[tf.GTFS.CalendarDatesExceptionTypeUnavailable]) : "";
            var connectorStr = hasAvailable && hasUnavailable ? '<br />' : "";
            translateStr = availableStr + connectorStr + unavailableStr;
        }
        return translateStr;
    };

    function createControl() {
        allContent = theThis.GetAllContent();
        var serviceItemAttributes = {
            "service_id": { desc: "uniquely identifies the service" },
            "wd_mask": { name: 'available on', desc: "service availability by day of the week", translateData: translateWDMask },
            "start_date": { desc: "initial date when service becomes available", translateData: translateStartDate },
            "end_date": { desc: "final date when service is still available", translateData: translateEndDate },
            "calendar_dates": { desc: "additional dates when service is available or unavailable", translateData: translateCalendarDates }
        };
        (allContent.attributesListEditor = tf.GTFS.AttributesListEditor(tf.js.ShallowMerge(settings, { itemAttributes: serviceItemAttributes }))).Show(true);
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
tf.js.InheritFrom(tf.GTFS.ServicesSelectedContent, tf.GTFS.ListSelectedContent);

tf.GTFS.ServicesListEditor = function (settings) {
    var theThis; if (!((theThis = this) instanceof tf.GTFS.ServicesListEditor)) { return new tf.GTFS.ServicesListEditor(settings); }
    var assetListEditor, agencyItem;
    var selectedContent;

    this.GetAssetListEditor = function () { return assetListEditor; };

    this.GetTLF = function () { return settings.TLF; };

    this.RefreshForAgency = function (agencyItemRefresh, then) {
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

    function updateContentForItem(item) {
        var content = assetListEditor.GetContentFromItem(item);
        if (!!content) {
            var itemData = item.GetData();
            content.title.GetHTMLElement().innerHTML = tf.GTFS.GetServiceTitle(itemData);
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
        settings.apiClient.DesignServicesPost(
            function (results) {
                var isOK = false;
                if (results.responseJSON) { if (results.responseJSON.ok) { assetListEditor.UpdateFromNewData(results.responseJSON.result); isOK = true; } }
                if (!isOK) { console.log('services api call failed'); }
                assetListEditor.CloseEditorLoadingToast();
                if (then) { then({ sender: theThis }); }
            }, { id: ad.id });
    };

    function onKLChange(notification) {
        //console.log('service kl change notification received');
    };

    function initialize() {
        assetListEditor = new tf.GTFS.AssetListEditor(tf.js.ShallowMerge(settings, {
            editor: theThis,
            TLF: theThis.GetTLF(),
            //onRemoveAllItems: function () { agencyItem = undefined; },
            attachedSelectedContentType: tf.GTFS.ServicesSelectedContent,
            onKLChange: onKLChange,
            createNewContent: createNewContent,
            prepareSpareContent: prepareSpareContent,
            onContentBecameSpare: onContentBecameSpare,
            updateContentForItem: updateContentForItem,
            //compareContent: compareContent,
            itemNameSingle: "service",
            itemNamePlural: "services",
            assetName: "services",
            contentInItemAttributeName: "serviceContent",
            itemInContentAttributeName: "serviceItem"
        }));
    };

    initialize();
};
