"use strict";

function bootStrapApp(appSettings) {
    var params = tf.urlapi.ParseURLAPIParameters(appSettings.fullURL);
    var appParam = params[tf.consts.appParamName];
    var app;

    if (tf.js.GetIsNonEmptyString(appParam)) {
        var mdtAppSettings, geoFenceAppSettings, GTFSSettings;
        switch (appParam.toLowerCase()) {
            case 'mdt':
            case 'mdtrths':
                mdtAppSettings = { showRT: true, showHistory: true, startWithHistory: false };
                break;
            case 'mdthsrt':
                mdtAppSettings = { showRT: true, showHistory: true, startWithHistory: true };
                break;
            case 'mdtrt':
                mdtAppSettings = { showRT: true, showHistory: false, startWithHistory: false };
                break;
            case 'mdths':
                mdtAppSettings = { showRT: false, showHistory: true, startWithHistory: true };
                break;
            case "geofence":
            case "geofencerths":
                geoFenceAppSettings = { showRT: true, showHistory: true, startWithHistory: false };
                break;
            case 'geofencehsrt':
                geoFenceAppSettings = { showRT: true, showHistory: true, startWithHistory: true };
                break;
            case 'geofencert':
                geoFenceAppSettings = { showRT: true, showHistory: false, startWithHistory: false };
                break;
            case 'geofencehs':
                geoFenceAppSettings = { showRT: false, showHistory: true, startWithHistory: true };
                break;
            case 'gtfs':
                //GTFSSettings = { transitServerURL: 'http://192.168.0.121:1337/' };
                //GTFSSettings = { transitServerURL: 'http://192.168.0.44/' };
                GTFSSettings = { transitServerURL: 'http://131.94.133.245/' };
                break;
        }
        if (app == undefined) {
            var layerZIndexSettings = { layerZIndex: 10 };
            if (geoFenceAppSettings != undefined) {
                app = new tf.GeoFenceApp.App(tf.js.ShallowMerge(appSettings, geoFenceAppSettings, layerZIndexSettings));
            }
            else if (mdtAppSettings != undefined) {
                app = new tf.MDTBusesApp.App(tf.js.ShallowMerge(appSettings, mdtAppSettings, layerZIndexSettings));
            }
            else if (GTFSSettings != undefined) {
                app = new tf.GTFS.App(tf.js.ShallowMerge(appSettings, GTFSSettings, layerZIndexSettings));
            }
        }
    }

    if (app == undefined) { app = new tf.TFMap.App(appSettings); }

    return app;
};

//var fakeHRef = 'http://tfcore.cs.fiu.edu/hterramap/#fmap=m2&type=map&perspectivemap=&Lat=25.757765&Lon=-80.367935&res=&Legendh=$$http://n00.cs.fiu.edu/defaultmapWMFL$$&&DLayerSelect1=true&dlayerfield1=L&DLayerColor1=&DLayerLegend1=Sights&DLayerData1=http%3A//acorn.cs.fiu.edu/cgi-bin/arquery.cgi%3Fcategory%3Dgeoimages%26visualvalue%3E%3D4%26vid=itpa%26tfaction=shortdisplayflash%26filetype=.json&DLayerSelect2=true&dlayerfield2=L&DLayerColor2=&DLayerLegend2=SideView&DLayerData2=http%3A//acorn.cs.fiu.edu/cgi-bin/arquery.cgi%3Fcategory%3Dalta%26vid=itpa%26tfaction=shortdisplayflash%26filetype=.json&DLayerSelect3=true&dlayerfield3=L&DLayerColor3=&DLayerLegend3=MLS&DLayerData3=http%3A//acorn.cs.fiu.edu/cgi-bin/arquery.cgi%3Fcategory%3Dcallreal%26vid=itpa%26tfaction=shortdisplayflash%26filetype=.json&DLayerSelect4=true&dlayerfield4=L&DLayerColor4=&DLayerLegend4=Stores&DLayerData4=http%3A//n00.cs.fiu.edu/cgi-bin/arquery.cgi?category=us_companies_2013%26tfaction=shortdisplayflash%26arcriteria=1%26SIC_CODE_Description|=store+stores%26filetype=.json&DLayerSelect5=true&dlayerfield5=L&DLayerColor5=&DLayerLegend5=Hotels&DLayerData5=http%3A//acorn.cs.fiu.edu/cgi-bin/arquery.cgi%3Fcategory%3Dhotelsd%5Fwikix2011%5Fiypages%5Fdemographics%5Fsic%5Fclustering%5Felevation%26vid=itpa%26tfaction=shortdisplayflash%26filetype=.json&DLayerSelect6=true&dlayerfield6=L&DLayerColor6=&DLayerLegend6=Restaurants&DLayerData6=http%3A//n00.cs.fiu.edu/cgi-bin/arquery.cgi?category=us_companies_2013%26tfaction=shortdisplayflash%26arcriteria=1%26Industry=Eating%26filetype=.json&Panels=type+zoom+nav+overview+measure+download+legend+fullscreen&address=1225+SW+107+AVE,++MIAMI,+FLORIDA+33174&vid=itpa&tf_passtrough=%26tfaction%3Ddispense%26sreq%3Dgnisstr';

var fiuServer = 'http://transit.cs.fiu.edu/api/v1/';
var devServer = 'http://192.168.0.105:8080/v1/';
var centosServer = 'http://192.168.0.81/api/v1/';

//var transitServerURL = devServer;
//var transitServerURL = centosServer;
var transitServerURL = fiuServer;

//var appSettings = { transitServerURL: transitServerURL, fullURL: fakeHRef };
var appSettings = { transitServerURL: transitServerURL, fullURL: window.location.href };

var globalMapApp;

(function initializeTFMap() {
    //var params = tf.urlapi.ParseURLAPIParameters(appSettings.fullURL);
    //console.log(JSON.stringify(params));
    if (/*!params['skip_bootstrap_app'] && */typeof (tf_skip_bootstrap_app) === 'undefined') {
        globalMapApp = bootStrapApp(appSettings);
    }
    //else { console.log('skipping boot strap'); }
}) ();
