"use strict";

tf.GTFS.UsersList = function (settings) {
    var theThis, KL;

    this.GetKL = function () { return KL; }

    function makeListEmpty() { updateKL([]); }

    function updateKL(withJSON) {
        KL.UpdateFromNewData(withJSON);
        //tf.GTFS.DumpKL(KL);
    }

    function onListFromAPI(response) {
        if (!!response && !!response.responseJSON && !!tf.js.GetIsArray(response.responseJSON)) {
            updateKL(response.responseJSON);
        }
        else {
            makeListEmpty();
        }
    }

    function refreshFromAPI() {
        var auth = settings.apiClient.GetAuth();
        if (auth.email) {
            if (auth.isAdmin) { settings.apiClient.AdminUserGet(onListFromAPI); }
            else { settings.apiClient.UserUsersGet(onListFromAPI); }
        }
        else {
            makeListEmpty();
        }
    }

    function refreshSignInState() {
        refreshFromAPI();
    }

    function onAuthChange(/*newAuth*/) { refreshSignInState(); }

    function createKL() {
        KL = new tf.js.KeyedList({
            name: "users",
            getKeyFromItemData: function (d) {
                return d.id;
            },
            needsUpdateItemData: function (u) { return true },
            filterAddItem: function (d) { return true; }
        });
    }

    function onRefreshFromNotification(notification) {
        //console.log(notification.eventName);
        refreshSignInState();
    }

    //function onUserMessage(notification) { console.log(notification); }

    function initialize() {
        createKL();
        settings.apiClient.AddAuthListener(onAuthChange);

        settings.notify.AddUserAddedListener(onRefreshFromNotification);
        settings.notify.AddUserChangedListener(onRefreshFromNotification);
        settings.notify.AddUserDeletedListener(onRefreshFromNotification);

        //settings.notify.AddUserMessageListener(onUserMessage);

        //settings.notify.AddAgencyAddedListener(onRefreshFromNotification);    // NOT NEEDED
        settings.notify.AddAgencyDeletedListener(onRefreshFromNotification);
        settings.notify.AddAgencyChangedListener(onRefreshFromNotification);

        settings.notify.AddUserAddedToAgencyListener(onRefreshFromNotification);
        settings.notify.AddUserRemovedFromAgencyListener(onRefreshFromNotification);

        refreshSignInState();
    }
    (function actualConstructor(theThisSet) { theThis = theThisSet; initialize(); })(this);
};
