"use strict";

let precision = 6;

const ShapesMapFeatures = function (options) {
    let theThis = this; if (!(theThis instanceof ShapesMapFeatures)) { return new ShapesMapFeatures(options); }
    let map, layer;
    let mapFeatures;
    let initialized;

    this.SetVisible = (bool) => { if (layer) { layer.SetVisible(bool); } return theThis.GetVisible(); };
    this.GetVisible = () => { return layer ? layer.GetIsVisible() : true };

    this.UpdateItemVisible = (item) => {
        if (layer && item) {
            let mf = mapFeatures[item.id];
            if (mf) {
                if (mf.visible != item.visible) {
                    mf.visible = item.visible;
                    if (mf.visible) { layer.AddMapFeature(mf.mapFeature); }
                    else { layer.DelMapFeature(mf.mapFeature); }
                }
            }
        }
    };

    this.UpdateFromEditor = shape => {
        let mapFeature = theThis.GetMapFeature(shape.shape_name);
        if (mapFeature) {
            let mapApp = getGlobalMapApp();
            let appContent = mapApp.GetContent();
            let mti = appContent.GetMeasureToolInterface();
            var mtiInfo = mti.getInfo(), hasArea = mtiInfo.nPoints > 2;
            if (hasArea) {
                let lineStringCoords = mti.getLineStringFeature().GetGeom().GetCoordinates().slice(0);
                let polyCode = new tf.map.PolyCode();
                if (shape.shapeClosed) {
                    let len = lineStringCoords.length;
                    if (len > 0) { lineStringCoords.push(lineStringCoords[0].slice(0)); }
                }
                let coords = polyCode.EncodeLineString(lineStringCoords, precision);
                shape.shape_points = coords;
            }
        }
    };

    this.SendLineStringToEditor = lineStringCoords => {
        let mapApp = getGlobalMapApp();
        let appContent = mapApp.GetContent();
        let mti = appContent.GetMeasureToolInterface();
        mti.setLineString(lineStringCoords);
        mti.setShowArea(false);
        if (!appContent.IsMeasureToolOn()) { appContent.ToggleMeasureTool(); }
    };

    this.SendToEditor = shape => {
        let mapFeature = theThis.GetMapFeature(shape.shape_name);
        if (mapFeature) {
            var lineStringCoords = mapFeature.GetGeom().GetCoordinates();
            var lineStringEdit = lineStringCoords.slice(0);
            if (shape.shapeClosed && lineStringEdit.length > 1) {
                lineStringEdit = lineStringEdit.slice(0, lineStringEdit.length - 1);
            }
            theThis.SendLineStringToEditor(lineStringEdit);
        }
    };

    this.SimplifyEditorLineString = (simplifyTolerance) => {
        if (initialized) {
            let mapApp = getGlobalMapApp();
            let appContent = mapApp.GetContent();
            let mti = appContent.GetMeasureToolInterface();
            var mtiInfo = mti.getInfo(), hasArea = mtiInfo.nPoints > 2;
            if (hasArea) {
                simplifyTolerance = simplifyTolerance > 0 ? simplifyTolerance : 1;
                let lineStringCoords = mti.getLineStringFeature().GetGeom().GetCoordinates().slice(0);
                lineStringCoords = tf.map.SimplifyLS(lineStringCoords, simplifyTolerance);
                mti.setLineString(lineStringCoords);
                mti.setShowArea(false);
                if (!appContent.IsMeasureToolOn()) { appContent.ToggleMeasureTool(); }
            }
        }
    };

    this.PanToShapeFeature = mapFeature => {
        if (mapFeature) {
            let extent = mapFeature.GetExtent();
            map.SetVisibleExtent(tf.js.ScaleMapExtent(extent, 1.4))
        }
    };

    this.PanTo = shape => {
        return theThis.PanToShapeFeature(theThis.GetMapFeature(shape.shape_name));
    };

    this.GetMapFeature = (shapeName) => { return mapFeatures[shapeName] ? mapFeatures[shapeName].mapFeature : undefined; }
    this.GetMapFeatureLengthInMeters = (shapeName) => { return mapFeatures[shapeName] ? mapFeatures[shapeName].lengthInMeters : 0; }

    this.Update = (data) => {
        if (layer) {
            //console.log('updating shapes');
            layer.RemoveAllFeatures();
            if (copyShape) {
                layer.AddMapFeature(copyShape, true);
            }
            mapFeatures = {};
            let polyCode = new tf.map.PolyCode();
            for (let i in data) {
                let d = data[i];
                let visible = d.visible;
                let coords = tf.js.GetIsNonEmptyString(d.shape_points) ? polyCode.DecodeLineString(d.shape_points, precision) : [];
                if (coords.length < 2) {
                    //console.log('shape with less than 2 points');
                }
                let geom = {
                    shapeData: d,
                    type: 'linestring',
                    coordinates: coords,
                    style: getShapeStyle,
                    hoverStyle: getShapeStyle
                };
                let mapFeature = new tf.map.Feature(geom);
                if (visible) {
                    layer.AddMapFeature(mapFeature, true);
                }
                mapFeatures[d.shape_name] = { mapFeature: mapFeature, lengthInMeters: mapFeature.GetGeom().GetLength(), visible: visible };
            }
            layer.AddWithheldFeatures();
            gtfsShapes.forceUpdate();
        }
        else {
            //console.log('shapes update deferred...');
            setTimeout(() => { theThis.Update(data); }, 500);
        }
    };

    const onMapFeatureClick = (notification) => {
        let mapFeature = notification.mapFeature;
        let shapeData = mapFeature.GetSettings().shapeData;
        if (shapeData) {
            theThis.PanTo(shapeData);
        }
    };

    const getShapeStyle = (kf, mapFeature) => {
        var isHover = true;
        var lineWidth = 1;
        var zindex = 8;
        var lineWidthTick = lineWidth * 2 + 1;
        var mapFeatureSettings = mapFeature.GetSettings();
        var lineItemColor = mapFeatureSettings.color ? mapFeatureSettings.color : "#f00";
        return [
            { line: true, line_color: "#000", line_width: lineWidthTick + 2, zindex: 3, line_opacity: 20 },
            { line: true, line_color: lineItemColor, line_width: lineWidthTick, zindex: 4, line_opacity: 70 },
            { line: true, line_color: "#fff", line_width: lineWidth + 2, zindex: zindex, line_cap: "butt", line_opacity: 100, line_dash: [16, 10] }
        ];
    };

    let copyShape;

    const createGeomCopyShape = geom => {
        geom.style = geom.hoverStyle = getShapeStyle;
        geom.color = "#0c0";
        return new tf.map.Feature(geom);
    };

    const createITPAMLSCopyShape = shapeStr => {
        let polyCode = new tf.map.PolyCode();
        let geom = polyCode.ToGeoJSONMultiLineString(JSON.parse(shapeStr), 7);
        return createGeomCopyShape(geom);
    };

    const createITPACatsShape = () => {
        return createITPAMLSCopyShape("[\"g|{fjNnp_~{n@f^~W~iAgEvuB_nDv|AwnCvnC_nD~bBgbC~WovAgE_cBod@ovA_}Iw`E_nDgE_uCfw@giBnoB_jA~tCgw@~mDnd@~tC~iAv`Ef_GvrF\",\"_mggjN~dm}{n@gbCod@fw@wyEfiBwgD~{BgiBvgDo}@nhCoK~iAnKvyEfpAv`End@vcAgEfw@wj@n}@nKnd@fw@~|If_GnlFoiJvj@ooBvQ_nD?_`FfxG?oKoiJgw@fEnKfcJ\",\"_lnejN~qk|{n@oKw~Ookq@fpAw}lBv|Ag_GnK_d{@naDod@geq@gqsAfmEf^ns^_dIvQgiB~p@_yF_X_rGvQnK~oR~vj@_cB~WwgDod@gol@\",\"gyynjNfxk|{n@vj@fwkA~`jC_vJ~{BgEftDgw@v`E?fEo}Yvj@g^veO?wQolFwQ_cB_q@od@wQwcAnKgw@nd@_q@nd@wQv|Af^f^fpAgE~p@n}@nKfiBnvAnvAvgDf_Gf{C~tC_q@nvAoKf|JgEv}H~iAvhKnaDnd@gw@fpA_`F\"]");
    };

    const createITPAGPEShape = () => {
        return createITPAMLSCopyShape("[\"_mggjN~dm}{n@nd@~tC~iAv`Ef_GvrFf^~W~iAgEnsEw}HvnC_nD~bBgbC~WovAgE_cBod@ovA_}Iw`E_nDgE_uCfw@giBnoB_jA~tCgw@~mDgbCod@vj@ohCv|Ag{CvcAovA~iAo}@vgD_jA~tCoKnvAvQvgD~iA~_F~p@~iAvcAvj@~Wfw@gE~p@gw@?o}@od@gw@vj@wk`@_q@gbC_}mB~{BopInd@otLvQgagAnzD_hwAnsEwivBnwH_ePod@gbu@olF_dIgmEooBozD_kHoxh@ovAoxOooBw}a@_q@w`w@fEofg@_q@_syAg^g~XosE_yx@wQg_sHv|AobvA?os^vQw}a@vgDg{u@na]ggqBnoBovZ_Xoh\\\\owHgdj@oriAgixCgxGgwY_cBwfVwnConfAooB_`_@od@o}YnoBw}z@nhCoh\\\\~Woh\\\\_cB_n]g}QoxzAwcAwpQwQ_jZv|Agt]fbCouS~uJopb@~kOwlg@f{CoqPnhC_n]fEoyVozD_ka@w`Ew~OwaLgpZ_mVwrx@ooBozDo~GwgDwnC_XgfFn}@g{C~bBwzL~`MwhK~fEwsM~iAoyo@vQ_`_@~{B_bT_cBwvIoKwytDfpAovZ_|Bg_`@g_GoqPg`NwdH_~P_gEoe`@w|AwfVwtTw{l@gxGokXgwYg_dCwcAwwPgpA_i~AvgDgp~BfE_cmAgmEwbxIfEwfo@fpAoe`@wnCwda@gqHo`VotLgvRw{SomMwoJgiBgeX~Wggf@ftDgf|Cf_G_jZ_cBonm@opI_r`@_X_etBfbCodkA~W_mV~tCgud@vzLo{d@vnCgdj@fw@g~q@~|IguiJvoJglp@f{CohyC~fE_qr@gw@gddH~`MwmgA~fEo}zFfw@gthBnsEomf@wj@w~O_kHo|k@_|t@oh\\\\obd@opIovZ_lO_vaK~{B__X~gLgpZvoc@w_p@~cIgb\\\\~p@_tUgjI_djFgiBw{bE~_x@n_O~tnAvfVndYvgDnkq@f_GgjI_nlE~bBgxG~|Iw}Hn_aAwnCns^wsMgpAggM_lO_aMvyEgud@w|AwoJ_}IgpAoiJvgDftDvsMgpAvlNf^fw@fyN~{B\",\"_uihmNfmszwn@gu}@wvIwuxCg}j@~{B~phEv}H~~xFgiBv~OgcJflWg_`@~}i@oeGnmMwyEf}QovA~aT~rNnhzJnvAn|Rf|JfpZ~WvnCod@v}Hg{Cn_OgEf_GfpAftDnvAnoB~xFnzDngU~|I~tCfiBvnCfw@fuKvoJvdHfmEvwP~cIvtTf_GfgMfw@v{So}@v~aA_hLfyNo}@naaCwuBvapBvj@f}QwQvapBo~GvjzFwoJvqq@vj@fgMnKf}nCw`Enmf@ohCfrOod@vj~IwvI~rrBgfFfvR_uCfud@grO~wXgfF~bfBwj@nte@~W~ja@oKnmf@_X~kOfEnhu@fxG~vQn}@vytDgmEvut@fmEn~G~tC~|IvoJnlF~sU~xFfeq@fbCv`w@~{B~acEf{C~rvEw`E~zxBnd@vxbBfiBfyg@nhCf~X~~W~rrBftDfrOn`Vv{l@niJnuS~vQfps@nsE~|IvvI~|InwHvgDvvIfiBvcZvcAfxvDwuBv}a@vnC~|I~p@nmMvdH~r`AfE~yf@w`En{K~bB~uJvvI~lVfso@~qGft]vuBv_WfE~~WgiBfi[wxWnt~@w`EnuSgbCfvRovA~f^vQnvZfiBv_WvwPfcuAnoB~hl@wgDv~h@wuBnul@~tCfcgCvcAnyVvyEft]vs_Af`kCf_GvcZg^vlg@w|AfvR_tUvypAgxGf}j@gpAndr@vnCn_lCn}@f~X~p@nbaD~{Bn{}@oKf_hFwuBnu~AvuB~`_AfjIncdAn{Kvky@g^fgMwgDfxGwoJfpAgcJwdHo}@gjI~mD_fp@vyEgtDv}Hwj@vouAf|J~dPnKfzkDwzLfifBgxGvhhCgbCwQf{\\\\wQnoBovAf^w`Eod@wyEgpA_jAoKohCnKwgDn}@_|BfiBgiBvgDoKfpA\"]");
    };

    const createITPAGPETurnpikeShape = () => {
        return createITPAMLSCopyShape("[\"_mggjN~dm}{n@nd@~tC~iAv`En~GvkG~iAgEnsEw}HvrFgqH~WovAgE_cBod@ovA_}Iw`E_nDgE_uCfw@giBnoB_jA~tCgw@~mDgbCod@gpA~_Fod@fw@whKoaDw}H_jAwnCgEolFnK??ovAnK_uC~p@_jA_q@wcAg^ooB_jAovAwgDod@od@wcA_q@o}@oKfE_q@gEwj@_Xod@wj@_X_q@gEod@vQod@~p@oKfw@vQvcA~p@nd@vQ~bBvQnlF_XnvZo`VfEgtDfw@_|BfEfbCv~~DvzLgEfqHv|AfqHfjIfbCvrFvj@vyEg^vdH_gE~|IwyEnzDguKnhC_kwDfmEoh`CftDwaLoK_kfJoK_k_KfcJodzFnsE_{_Bnd@w~~DfmEoq{AfbCoqPwj@o~y@v|Aozv@?wa_H~qG_mzBv`EoywFnpIodY?omMg^gb\\\\wnC_ka@gqHwwfDwh}@woeN_urDg}QowH_xX_ePogUocRwiRouS_b~S_~pXgi[wvb@ojQoh\\\\wiRofg@_zMghm@_rGgol@gpAw}a@oK_{rJowHo_{HomM_`hMwrFgnfGgiB_zqBgbCgdcAwj@wda@od@woc@w|AobKoaDwoJ_vJ_pRwj@_gEnd@ozDfiBoaDnhCgpAvxp@gpAft]o}@vmUgiB~d{A_q@fcgCwnCnkq@wuBfrh@osEf|c@wvIngU_rGfeXguKnbd@_tU~ja@orWv~OomMfrzAoq{Afjb@oz]~lV_fWntL_~PfyNgdQf`g@w~h@~lVwxWfbu@gmw@fcJoiJfpAohCn}@ooBnd@giBvj@ozDfE_uCgEohCod@oaDwj@ohCo}@wuBw|AwuBgbC_`FgfFg`NwcAwyEod@ozDod@gjIwlNwipJfE_`F~WwvI~bBggMv|AwkGfbCgxG~fEgjInz]_zf@ftDwdHvrF_wQfpAgjInd@_dIw}H_tvFooBgnbDnKweOgEweOfcc@fcJfm^~xFngn@vsM~zTftD~gLv|A~g~@fjIgxGoazC_q@okq@~bBgxG~bBwnC~xF_nD~g~@_|BfjIovAv_W_oKgpAggMw`EosEgjIolF~mDwg]wrF_XfEod@gtD_sN_kHf{CnhCfcJgpAvlNf^fw@fyN~{B\",\"_uihmNfmszwn@gu}@wvI_pRwnCofNgbCghm@omMwk`@gxGggf@obKgE~zTvj@f}j@nvAvvfCfjI~cjFoK~yMgiBv~O_yFvpQwyE~|Iwn\\\\n{d@_nDn~GovA~mDg{C~nKo}@fmEo}@~cI_X~|I~rNnhzJnvAn|Rv|AneGf`N~oRfiBv}HfEvkGod@fmE_q@f{CwuBftDgc|@vz~@obd@n{d@ock@fol@wwPfvRosw@nsw@gimA~tnA_zM~`MwwPvsMofNvoJgdQ~nK_od@foS_fW~uJgt]vhK_~PnaD_bT~tC_lOnvAotLn}@wae@v|AoyaBfbCoqbA~p@of`AvcAgpZgpAo}Y?otLvuB_dIf{Cg_Gv`EobK~yM_cBv`Ew`E~oRod@~|I~WvhK~mDnz]~W~jHnKfgMgEvmUn}@fol@nvAv{SnzD~tkEv`Ef{dFvgDv|~BnqPvdgQ?n_pFvQnbhCnoBvda@fiB~oR~uJvmn@nwHf~Xv}H~aT~|IfoSviRvn\\\\vyw@~heAfi_CnzzCf|~NfzmRv{SflWnuSvpQv{SvzLfaUv}Hn~tOngdEn`zBn|k@~}PftDvmUnaDn}YvuBv~Of^fzUgEfyvE_kH~ja@wj@v_Wgw@~|mB_|Bnhu@_jA~naD_uCvrx@od@f{u@od@vdz@fw@nqPooB~ftD_gEnvlA_q@feXvQvk`@_XnvtGwkGnt~@o}@fmmEgtDv`^gEfnpBwuBn|hDg^fejAnd@vmgAg^~ebBgEnxeD_gEf~|Bg{CfqHnvAvyE~tCnvAf_G?nhCooBvyEwuBfbC_rGvnCo|R~WwuBo}@wnCgqH?o_aA_|Bo{sE~mDf^fsVwQvQ_jAnKgb\\\\?_gEwQgpA~p@wQ~p@o}@\"]");
    };

    const createITPAGPEPalmettoShape = () => {
        return createITPAMLSCopyShape("[\"_mggjN~dm}{n@nd@~tC~iAv`En~GvkG~iAgEnsEw}HvnC_nD~bBgbC~WovAgE_cBod@ovA_}Iw`E_nDgE_uCfw@giBnoB_jA~tCgw@~mDgbCod@gpA~_Fod@fw@whKoaDw}H_jAwnCgE_dI~W_uC~p@g_Gg{CovAwgDgiBovAo}@oKfE_q@gEwj@_Xod@wj@_X_q@gEod@vQod@~p@oKfw@vQvcA~p@nd@vQ~bBvQnlF_XnvZo`VfEgtDfw@gw@ohnAg|JwslQwgDovpD_jAgduB_Xg}Q_jAoh\\\\~bBwrF~mD_jAne`@oK~iAvj@~p@~iA~WnvA?v|Aod@nvAo}@fw@g{Cnd@_vJwj@_tU_nDoz]gtDgqHod@gjIgEggMvQ_kHv|AgoSnKgeq@gEoxOnd@_fWoKo{d@w|AgcJoKo|Rn}@g|c@nKoa]~p@_syAvdHwfVgEwmgAvcAo|}AnzD_bm@vj@_c[wQ_s`A_uCoo[od@oaoAvj@_gEf^wrjBfiBoaDoK_oK~WghT?wdtHvdHormDfbCws|Df{ConxBnoB_|[vj@wnhI~|Io~}CffF_yFf^_xq@~p@wonB~mDgoeA~{B_ooBf{Cw~h@~p@_`_@wj@oqmC~fEorWg^gx}CffFojQo}@oo[w}HofNoiJggMofNw}HgdQ_rG_tUw|A_lOwcAoeoEgEo}Y_cBwze@_q@wfo@oKwj}BosEoomAg{CwwqFnvAgki@nKote@wvIwjlH?gbu@_jA_kz@gbC_|t@_yFoxwEgEweOgfF_neFwhKgptGo}@oiJw|AowH_gEwhK_iS_c[_uCoeGg^_nDnd@gtD~`Mw{S~{[oz]vnC_yFnd@giBvj@ozD?o~God@oaDwj@ohCo}@wuBw|AwuBgbC_`FgfFg`NwcAwyE_jAweOofNwjwJn}@w~Of{C_lOfjIocRnz]_zf@ftDwdHnoBwrFfbCgcJfpAgjInd@_dInK_oKgjI_djFgiBw{bEfcc@fcJfm^~xFngn@vsM~zTftD~gLv|A~g~@fjIgxGoazC_q@okq@~bBgxGffF_yFvuBwcA~g~@_|BfjIovAv_W_oKgpAggMw`EosEgjIolF~mDwg]olFo}@gtD_sN_kHf{CnhCfcJgpAvlNf^fw@fyN~{B\",\"_uihmNfmszwn@gfqAofNwo|@wpQ_tgAw{SgE~zTvj@f}j@nvAvvfCfjI~cjFoK~yMgiBv~O_yFvpQwyE~|Iwn\\\\n{d@_nDn~GovA~mDg{C~nKo}@fmEo}@~cI_X~|I~rNnhzJnvAn|Rv|AneGf`N~oRvcAftD~p@n~Gwj@~cI_q@f{CwuBftDgc|@vz~@_rGfiBg{CoK_|B_cBwj@gpAwQovAfEw|Av|AwgD~iA_q@~bBwQ~bBfEv|Af^nvA~p@~{BfiBnbd@~ok@noB~mDf{Cv}Hvj@~{Bvj@nzDnd@ffFf_G~d_Eod@n`Vg^fcc@fw@vqXvj@n~y@oKfoSnwHvy_Gnd@njQvuBnqtBnoBfud@~p@nnTfw@vm`BvQn{d@vnC~vuB~Wfgf@n}@vze@~bBnomA_q@nul@~p@vyw@fw@vdHf{CnzlEvj@vcZfbCnqi@vQfqH~iAf_pLvQf|JnvAncRvgDvwP~qG~}P~jHfnLf|J~nK~rN~uJvtTv}HnlFvcAnuSfpAffnEgxGfoeA_cBffjBwgDfzyBg{CnlFvQ~laBoaDfykCosE~vQgEf`dD_rGffqAwcAf``Agw@ne}CoaD~|tAgpAnte@_XfoeAo}@n_aAwcA~ilAwcAfeXfEvbpCwuBfqz@gpA~m~FosEnkXg^vioC_|B~kzA_q@n_aAvnCnvZvQn`o@_jAn`VgiBfxvDg{CnweCozDvnu@fEvpQvj@nz]_Xv~aA_cB~jHvcA~pYf^nuS~bB~tC~p@voJnzDvnCfiBnoBvuBvcAf{Cf^~{B~fEvu|Ff^feq@~|I~}}OfiBnbhC~jH~WfsVwQvQ_jAnKgb\\\\?_gEwQgpA~p@wQnd@g^nKg^\"]");
    };

    const createITPAGPEDetour3 = () => {
        return createITPAMLSCopyShape("[\"opo}jNvix_zn@fxy@no[\",\"wvq}lNvtqyxn@nqP_Xvj@~`f@wwP~Wod@_af@\",\"gdlfmNv_t`xn@vnu@~_x@fdQvpQnqPnjQ~vQnjQvkGn~Gv~aA~dbAfkP~vQ~uc@fcc@\",\"_`xfkNfjr{yn@fiBf_GvcA~{Bv`Ef_GvyE~_F~xFftDnhC~iAfxGvuBn~G~iA~tCnKvbl@gw@vda@_|BvaLg^f{\\\\_XvfVod@vkGgEnrWfpAvcAnKn}@~WfiBnvAn}@nvAnd@fiBnKfmEnbKnhC~cI~tCfqH~_Fn}@vcA~Wf^fw@~_F~p@vut@\",\"opo}jNvix_zn@wuBg^_oK_q@\",\"gw_~jNnxu_zn@?fiB\",\"gwt{jNfzt`zn@vj@f^vuBvj@fpAfE~bBgEn}@g^vj@o}@nd@w`End@wcAf^wQfpAwQfpAvQvj@vQnd@nd@vj@v|AfE~bBgEnzDnK~iA~p@fbC~bBvuB~iAvj@v|Af^vmU~_FfqHvgD\",\"_chhmN~nr{wn@~WooBg^gdQod@ozD\",\"wnihmNv}vzwn@wQnzDf^fdQf^noB\",\"grqemNf_iqwn@_|BwQ\",\"g{tfjNftz}{n@v|AwnCvnC_nD~bBgbC~WovA\",\"gw_~jNvby_zn@vQvhKg^~fEvQnwHoK~p@wj@nvAgw@~p@o}@~W_cBnKovAgw@wj@o}@o}@_uC_q@gmEgiBopb@_XooBooBw|ZwQotLnd@_`Ffw@oaD~WwcA~qGgyN~p@giB~p@wnC~W_`FgE_`F_Xw|Ao}@_nDooBozDgmEgtD_uCgpAg{Cod@wuBgEovAfEgiBvj@giBnvAgpAv|AgiBfbCwkG~nK_uCv`Ew|AnvAo}@vj@_jAnd@_uCfw@w|AvQoaDfEolx@~p@_vJf^_g^vuBgvk@~p@_uCgEg{CwQ_uCg^_uCwj@wnCgw@wnCwcAg_Gg{CwuBw|AgiB_cBolFoeG_dIomM_q@gpA\",\"oqejjNfpcg|n@?o_aA\",\"w|qxjN~tkmzn@o}@ntL_XvvIg^fhT?fyN~tC~hwB\",\"o{wujNvig~zn@neGouSniJ_qYfpAgqHvQwnCnKwoJo}@wsf@od@_nDg{CftDgx`@nwa@ovA_nDg^wcAg^giB_X_|BwQgtDg^_sg@oKovAg~X?g^wdH_q@gcJw|Ag|JgbC_vJopIodY_`FwsM_gEomM_cBoeG_cB_}Igw@wkGod@_`Fg^_sNw|AwhoBwuBwp|Awj@_xX_uC_mo@gpA_vc@\",\"wsrvjNfyhh{n@?gki@~iAoul@vQ_wQ?_tUfEofNgE_lOvQw}a@~iAgf_@v|A_tUnvAwzLnhCwwP~|Iwze@\",\"_arvjNfmrp{n@wQ_shG\",\"oqejjNvoae|n@vj@_rGf^wuBn}@_cBnvA_jA~bB_q@naDoK\",\"o`chmNfk{~wn@ooBwumA_q@odY\",\"wfw~lNfldmxn@_bfA~bBw|s@~bBgszBv`Ewj@wmn@_X_zMgEo_O_jAoomAgqHgjjFgqa@~p@giBwumA\",\"o`chmNfk{~wn@~uc@~ge@fdQnjQ\",\"gmf~lNnjcwxn@wnC_pdA_jAokq@_q@__XwcAohu@gpAgrh@_q@ote@wcAomf@\",\"wvq}lNvtqyxn@giB_|mAgkPvQ\",\"oyfyjN~ugkzn@o}@oe`@od@gt]?ozDg^ozD\",\"w|jyjNfc|hzn@oK~fE?vsMn}@~tu@fpA?\",\"g_pyjNn}qazn@fiBnvA~fEnsEvnCvrFfpA~_Ff^~tCnKnhC?fmEo~G~pr@wgD~b[wj@vhKoKvzL~bBvzwA\",\"o_gfjNvj}|{n@wQ~WwcAfEw`Eod@wyEgpA_jAoKohCnKwgDn}@_|BfiBo}@fpAwj@nvAoKfpA\",\"_isljNfpe|{n@~c{@oaDf_GoK\",\"gouemNfp|qwn@_q@vvIv|Afw@nlFftDv`EnsEfpAfgMw_W~nKwrFvcAovAvQoqPf^wze@n}@wyEf^wuBvcAgbCfiB_cBvnCwcAvnCg^nhCfEftDvj@fvk@naD~xqAnoB~vcA\",\"gouemNfp|qwn@~{B_pR\",\"wcojjNfa`|{n@~{BgE\",\"_uihmNfmszwn@fEnoB\",\"gpkgjNn_l}{n@gpA~_Fod@fw@whKoaDw}H_jAwnCgEolFnKovAnK_uC~p@_jA_q@wcAg^ooB_jAovAwgDod@od@wcA_q@o}@oK\",\"_mggjN~dm}{n@gbCod@\",\"ow}ijN~zj~{n@w`E?gtDfw@\",\"w~kijNf}n}{n@weO?wj@f^gEn}Y\",\"wfkjjN~z_|{n@ffx@od@nyo@_q@~iZod@\",\"_zefjN~}{{{n@wQf{\\\\wQnoB\",\"gqepjNf|n|{n@ndYwcAnqPg^\",\"wzhijN~fb}{n@fE_q@gEwj@_Xod@wj@_X_q@gEod@vQod@~p@oKfw@vQvcA~p@nd@vQ~bBvQnlF\",\"gpkgjNn_l}{n@fbCnd@\",\"wnihmNv}vzwn@gEooB\",\"onijjNfsl~{n@_|BfE\",\"_ahfmN~h|pwn@nhCfcJoK~{BwcAvoJf^fw@fyN~{B\",\"_uihmNfmszwn@ooB_wcAoaD_yqAwj@gvk@gEgtDf^ohCvcAwnC~bBwnCfbCgiBvuBwcAvyEg^vze@o}@nqPg^nvAwQvrFwcAv_W_oKgpAggMw`EosEolFgtDw|Agw@~p@wvI\",\"gyynjNfxk|{n@fjb@w|AvwPgw@fkP_q@\",\"_mggjN~dm}{n@nd@~tC~iAv`Ef_GvrF\",\"wpifjNvzi}{n@_aMobK\",\"odjgjN~ug}{n@wj@nhC\",\"w|jyjNfc|hzn@_cBwzwAnKwzLvj@whKvgD_c[n~G_qr@?gmEoKohCg^_uCgpA_`FwnCwrF_gEosEgiBovA\",\"_chhmN~nr{wn@~p@ndYnoBvumA\",\"gbjvlN~nzzxn@vy^gw@vbSgE~m]~p@fgMnKvlg@wj@nofB_uC~xFwQns^wuBfrOod@nbaD_uCfg|Dw`EnkcBozDnfNwj@vaLovAnsEo}@f_G_cB~t\\\\gnLnsEgpAffF_jA~fEwj@ftDg^vaLg^~t\\\\_Xfj{@nKfkP_XfhT~p@~kOnK~}P_Xv~OfEvmUg^~kOfEnwa@~tC~oRfbCvdHnd@fqH~Wn~G?nljB_cBfsVg^nxh@_jA\",\"_u}~lNfkghxn@vpQ~rNvpQnmM~xFffFvn\\\\vxWvwPvzLn|RveOnjcAvrx@~bBv|AvcAv|Avj@ne`@~p@fzUfw@~fw@~bBnsw@fEfrOnd@nfNnd@fm^~_Fn~}CvcAfgf@wj@n}@~WfyNfnL_X~fEwQ~sUgiB~gL_q@nfNgpA\",\"_jvijNnxmd|n@vnCfw@fbCfbC~mD~fEfbCvrFvj@vyEgE~mD_XvuBooBffFovAvuB_|B~{Bw|An}@_uCfw@g_GfpAwik@nd@g`kCvgD_|[vj@\",\"gzrpjNfmnf|n@ojQ_jAoeGod@_eP_uC_rG_cBg_GooBg_G_uC_`FwgD_`FosEg{CozD_nD_yFgbColF_|B_dIw{SwmgAw{SospAgfFwfV_pRohnA_gEgm^w|Aw~OoaD_}b@ovA_g^gw@oh\\\\w|Agi_CgEoljB\",\"o}pxjNvoaszn@_XvrFfE~xFvj@fgMnd@fmE~iAniJfpAn~GnzDnxO~fEn_O~tCfcJfzUflp@npI~oRfnLvmUnzD~|I\",\"wqdvjNfglyzn@~bBnwHvcAvdHwQff_@oKneGw|AfvRofNf~q@olFnz]gxGf}j@_q@fcJ_XfyNfE~rNoK~qGvcAvjkAvQ~gLfw@vjr@n}@f~X?n}kAvQvqq@f^fqa@~p@n|R~iA~}i@fE~z_BwQfcgCgiBvpcAoKvcZnK~rNfw@~f^~p@~dPn}@nqPv|A~oRvuBv{Sfw@fcJn{Kvky@oKnwHwQvnCo}@vnCgiBnhCwuBn}@gbC~WwuBgEohC_q@_|BgiBw|AohCgw@_nDgEg{CfiBggf@~WozDvj@gbCfpA_cBnhCgpA~bB_XvyEwQ~iZfiBvdz@~qGvoJvQftDgE~v|A_yF\",\"_itlkNffcyxn@vu[~iAfvRv|AvgDnd@~{B~p@naD~bBvnCvuBvuB~{BnvA~{Bf{CvvIfpAf|JnhCv_WnoBndYfiB~wq@~WvgDf^f|c@nK~ok@f^vqq@~p@~`_Av|AvqcBn}@fjtA?~t\\\\_X~aTwgD~wcBgEvn\\\\f^~wq@nK~oRvj@vfVn}@nqP~iAfrOn}@~jHv{SnrbBfbCn_OftDfrO~_F~rNn_Ovg]vkGvsMv|Av`En~GnrWnlFngU~iAftD\",\"gc`|lN~y|zxn@gnLg^wu[wj@wwP?w`EnK\",\"_plmkN~e{xxn@_vnB~fEoic@fw@wdH?g`Nod@_gEg^w`Eg^g}QoaDg|JovA_sNovAobK_XgfFgEggMfEwezA~{Bg~XfEgqa@wQwxWnKoxOf^gmE~WwoJ~iA_nD~p@olFnvAwdH~{B_bTffFggM~bBgxGnd@wuBoKgcJvQgjb@f^_yF~WgaUnaD_|[nzDo`o@n}@_}qE~fEwufBfiBgrOnd@_y_@vuBoggAnoBwwbAnvAggM?weh@o}@gjIfEwm}EnpI\",\"_lagkNvos{yn@osEwvIgpAgfF_jA_rG_|BorWw|AwfVo}@wgDgvR_sg@ohC_kHgpA_yFo}@oeG_fWoqtBgpAwlNwcAwwPod@o`Vwj@oggAfEgpZnaD__cB~WwtTwQgmw@ohCopxDfEwae@wj@w}a@gw@ovlA~WgxGfEwfo@fpAoe`@gpAglWo}@owHw|A_rGgiBwkG_yFgnLgbCozDoaDgmEgmEgtDgtD_|BgxGg{CwyE_jA_uCg^gfFgEwvIfEwzL~p@wr_@f{C\",\"wrwfjNfw}|{n@wuB?_uCfw@giBnoB_jA~tCgw@~mD\",\"g|{fjNnp_~{n@f^~W~iAgEvuB_nD\",\"_u~emNvlwpwn@_kHf{C\",\"gouemNnlhqwn@vj@wkGw|A_yFwrF_X\",\"ghijjNfyld|n@fEnrp@gEfhm@vcAnhC~p@~W?ggM\",\"okmjjNnyl~{n@fbCv~~D\",\"g_pyjNn}qazn@w|Aw|AgtDgiBoyVwrFgpAwj@wcAgw@wcAw|Ag^_cBoKooB~WgtDwQw|Ao}@wuBgpAo}@_q@wQw|AgEgiBnd@od@~WwcA~iA_jA~fEgw@n}@wj@~Wod@fE_q@?wnCg^\",\"gw_~jNvby_zn@veO_X\",\"wcb~lNn{zzxn@wcAofg@\",\"oyfyjN~ugkzn@vgDfE~p@~WvQnd@vQvj@gEn}@gw@nhCgEvuBvQfiB~iAvgDfqHvwPn}@nhCf^nhCfE~bBwQ~kO\",\"ohd~lN~sryxn@vpQg^\",\"gwt{jNfzt`zn@gxy@oo[\"]", "fleet_id": "4008658", "shape_sm_c": "[\"_chhmN~nr{wn@o}@wtTvQozDvcAv_W_XnoBnaDf{gBvbpCvquCvfsCfltCnboB~d{AnjcAvrx@vgDnzD~oR~mmLwj@n}@~WfyNfvRwj@ndr@olFvy^gw@~y_Afw@vlg@wj@nofB_uCv`w@_nDvj~IwvInkcBozDfi[gbCney@_mV~~WgiBnljBod@fud@n}@nyhAwj@n`hAvvI~ksB_cBvl`AgiBvu[~iA~~WfbCn~G~tCneGvrFvrFvsMvyE~|b@noBndYfbCv`w@fxG~_}J_X~wq@wgD~wcBnd@vxbBvj@vfVnhCvda@fzUn~kBnwHvr_@~_F~rN~iZf~q@faUnp{@neGf|JvsMfuKvaLv`EntLnvAvbl@gw@ngn@g{C~bt@o}@vkGgEvu[vuBvgD~mD~p@nwHngUn~GvhK~cIfw@~_F~p@vut@veOfpAvz~@nz]vrFg^fpAg_GvcAovAfmEvQfpAfbCnKniJ~tC~xFnvZ~jHfqHvgDfqH~jH~_FvsMvj@vlNggM~tnAgw@ndYvgD~fbCnpIncoCvrFnn|Ev`EvjY~kOvhd@vsMn{d@v|Af|JfpA~hSf~X?n}@v_p@fw@ffFvuBvrFnte@wlg@nd@~mDn}@vsf@g^n_OgpAfqH_pRngn@_}Ivze@_`Fns^wgDf{u@wQfgxAw|Anm_A?fki@~Wn`tJv|Afi_CvnCnp{@naD~|b@vdH~lo@~oRnhnAffFvfVv{SnspAv{SvmgA~{B~cInmM~aT~`Mf|Jn_OneG~wX~xF~pYnoB~gtE_yF~rN_gEnsEwrFnhC_}Iod@whKgbCwrFgqHgjIwnCgw@oaDnKozD~{Bo}@~bB_jAvhK?vgoAwuBoaD?w{~AgbCw~~D~rNo}@fEo}Yvj@g^veO?od@opIwcAgiBnvA_|Bv|Af^~WfbCvgD~bBnvAvgDf_Gf{CnlFo}@f|JgEv}H~iAvhKnaDvuBgxGfbCnd@noBvvIn~GvkG~iAgEfgM_pR~WovA_aMobKwuB?_uCfw@giBnoBgbC~cI\",\"gouemNfp|qwn@gyN_|Bg^gw@fpAwlNohCgcJ~jHg{CvrF~Wv|A~xFwj@vkG~{BvQ_nDvg]fjInlFv`EnsEfpAfgMw_W~nKgjInvA_h~@~{B_yF~mDwgDn~Gg^nhC~p@nkq@fxGnazC\",\"gw_~jNnxu_zn@fEns^ooBnzDoaDnd@gbCwuBooBgcJwrFw~aAwQotLvuBggM~uJgsVvQ_aMovAwkGooBozDgcJoeG_rGwj@w`E~p@wdHnwHwaLvpQg{CfbC_`Fv|Awl`A~iA_~i@~tCglp@vj@_wQ_uCweOw}HwvIoiJ_dIomMoeG_hLgpAgfF_jA_rGwyEgzn@g~Xwgv@gpA_yFodY_x|B_uCoe`@_jAgzyBnzDwtxBg{Cw~pFfEwae@_cBguoBf^_`x@fpAoe`@wnCwda@_gEw~Og|JwiRwoJobKomMgxGwoJgiBgfFgEorWfw@wr_@f{Co`sCf_G_fWod@gdj@owHovZooBguoB~{BgjtA?oxOf^_~P~bBgdj@vlNggM~bBoxaA~bBg~q@~|IguiJvoJglp@f{Cg`kC~fEgy`Agw@wm}EnpI_ei@_jAoyVnKwcAofg@fcc@gw@vj@~`f@wwP~WwnC_~tBgkPvQwnC_pdAwhKglxF_tvFvhK_uCwy{CgqHgjjFgqa@~p@giBwumA\",\"w|jyjNfc|hzn@oKv{Sn}@~tu@~xFfEvcAn}@nKfiBgw@nhCnK~_Ff|Jn`Vv|A~qGoK~oRovAflWg^nbd@~tC~hwBwQvlNfpAnuSf{C~hSnxOf}j@fzUflp@f{\\\\v|s@vgDf}Qg^vlg@w|AfvRofNf~q@olFnz]gxGf}j@_jAn}Yn}@vqcBnhC~ryAvQfp~Bf{Cvm`BoKf_hFgiBvpcA?vwi@fiB~lo@f{Cnbd@~mD~__@n{Kvky@g^fgMwgDfxGwuBn}@_yFvQohC_q@wyEwrFo}@gjIfbCwbl@~{BgfFnhCgpAv}Hwj@vouAf|JvoJvQnypGwmU~hpCwnCwQf{\\\\od@nhCgkP_|BgqH~iAozDnzD_cBfqH\",\"g_pyjNn}qazn@_rG_gEoyVwrF_uC_cB_cBw`EgEobKwnCgtDwnC_XwnCn}@wcA~iA_jA~fE_cBnvAgfF_X\",\"gw_~jNvby_zn@veO_X\"]");
    };

    const createITPAGPEDetour4 = () => {
        return createITPAMLSCopyShape("[\"_d`xjNnccbzn@_|B~nKwsMv}a@_gEveOw`EnuSgbCfvRgw@veOg^f`NgEf`N~WfuKnd@vvIvcA~gLvwPfcuAvcAfuK~Wv}HvQf_G?vsM_XntLod@~cIgiBfdQ\",\"gdlfmNv_t`xn@vnu@~_x@fdQvpQnqPnjQ~vQnjQvkGn~Gv~aA~dbAfkP~vQ~uc@fcc@\",\"gkkfmNvpgaxn@_X_pR\",\"_chhmN~nr{wn@~WooBg^gdQod@ozD\",\"wnihmNv}vzwn@wQnzDf^fdQf^noB\",\"g{tfjNftz}{n@v|AwnCvnC_nD~bBgbC~WovA\",\"oqejjNfpcg|n@?o_aA\",\"gx~wjNnbx~yn@wnCo{KwnC_dI_qY_laAw|Ao~GgpAopIwcAwaL_jAweh@_jAgps@?g}Qfw@g{\\\\vnCgeq@nd@gxGn}@_rGf`Nwxp@vnCo_OvcAwkGvj@gxGvQwyEfE_wQwQgqHg_G_{fA_jAglWoKonTnKwdHf^gcJvj@gcJnd@ozDvuBo_OfpAowH~bB_dInaDwaLnsEotLnvAwrFfcJwfVnvAw`Efw@oaDfw@gmEfw@_rGvQ_`FnKg_Gwj@g`yAnKw`Eod@_{m@gw@otL_jA_}I_jAwrFolFgvR_pk@wonBocRock@wg]op{@wcAohC_|B_}Iw|Ag|Jod@ozDg^gxGwj@grOoKgcJ_jAo{Kod@wuBo}@_|B_uCosEgiBgpAgiBo}@wnC_q@ohCwQozD~W_}IfbC_|BvQgwYfuK_`FvuBgbCvj@gzUfiBgdQf^omxA~p@o`hAfbCo_aAfw@gpZnd@oojEftD\",\"w|qxjN~tkmzn@o}@ntL_XvvIg^fhT?fyN~tC~hwB\",\"o{wujNvig~zn@vdHwy^v|Ag|Jn}@owHf^wkG~WggMgEggM_XgjIgw@otLovAwhK_cBwvI_|BopI_|B_kHohCwdH_nDw}HohCgxGoaD_kHgdj@ggxAg{C_kHgw@_|BooBo~GooBoiJgw@gmEgw@w}Hwj@_hLw|A_fp@_q@ogUooB_`_@od@o}YnK_sN~p@okX~p@g}QnhCoh\\\\~W_aM?ofNwj@_~Pgw@_oKg}QoxzAwcAwpQ_XwhKfEg`N~Wg`NvcA_sNfbCouSftDocRv`E_lO~uJwcZ~tC_hLvcAwyEnvAwvIfpAofNfw@ofNfEgnL?gjI_q@_vJo}@_vJ_jA_}IovAwdH\",\"wsrvjNfyhh{n@?gki@~iAoul@vQ_wQ?_tUfEofNgE_lOvQw}a@~iAgf_@v|A_tUnvAwzLnhCwwP~|Iwze@\",\"_arvjNfmrp{n@wQ_shG\",\"oqejjNvoae|n@vj@_rGf^wuBn}@_cBnvA_jA~bB_q@naDoK\",\"o`chmNfk{~wn@ooBwumA_q@odY\",\"o`chmNfk{~wn@~uc@~ge@fdQnjQ\",\"gmf~lNnjcwxn@wnC_pdA_jAokq@_q@__XwcAohu@gpAgrh@_q@ote@wcAomf@\",\"ohd~lN~sryxn@wcAohnA\",\"o_gfjNvj}|{n@wQ~WwcAfEw`Eod@wyEgpA_jAoKohCnKwgDn}@_|BfiBo}@fpAwj@nvAoKfpA\",\"wpifjNvzi}{n@gE_cBod@ovA_}Iw`Egw@gE\",\"_isljNfpe|{n@~c{@oaDf_GoK\",\"_spemN~o{pwn@gpA_nDgbCovAwyEfEoiJvgDvj@noB\",\"grqemNf_iqwn@vj@olFoKw`E\",\"gouemNfp|qwn@_q@vvIv|Afw@nlFftDv`EnsEfpAfgMw_W~nKwrFvcAovAvQoqPf^wze@n}@wyEf^wuBvcAgbCfiB_cBvnCwcAvnCg^nhCfEftDvj@fvk@naD~xqAnoB~vcA\",\"gouemNfp|qwn@~{B_pR\",\"wcojjNfa`|{n@~{BgE\",\"_uihmNfmszwn@fEnoB\",\"gpkgjNn_l}{n@gpA~_Fod@fw@whKoaDw}H_jAwnCgEolFnKovAnK_uC~p@_jA_q@wcAg^ooB_jAovAwgDod@od@wcA_q@o}@oK\",\"_mggjN~dm}{n@gbCod@\",\"ow}ijN~zj~{n@w`E?gtDfw@\",\"w~kijNf}n}{n@weO?wj@f^gEn}Y\",\"wfkjjN~z_|{n@ffx@od@nyo@_q@~iZod@\",\"_zefjN~}{{{n@wQf{\\\\wQnoB\",\"gqepjNf|n|{n@ndYwcAnqPg^\",\"wzhijN~fb}{n@fE_q@gEwj@_Xod@wj@_X_q@gEod@vQod@~p@oKfw@vQvcA~p@nd@vQ~bBvQnlF\",\"gpkgjNn_l}{n@fbCnd@\",\"wnihmNv}vzwn@gEooB\",\"onijjNfsl~{n@_|BfE\",\"_ahfmN~h|pwn@nhCfcJoK~{BwcAvoJf^fw@fyN~{B\",\"_uihmNfmszwn@ooB_wcAoaD_yqAwj@gvk@gEgtDf^ohCvcAwnC~bBwnCfbCgiBvuBwcAvyEg^vze@o}@nqPg^nvAwQvrFwcAv_W_oKgpAggMw`EosEolFgtDw|Agw@~p@wvI\",\"gyynjNfxk|{n@fjb@w|AvwPgw@fkP_q@\",\"_mggjN~dm}{n@nd@~tC~iAv`Ef_GvrF\",\"odjgjN~ug}{n@wj@nhC\",\"gdlfmNv_t`xn@gdQojQ_vc@_he@\",\"_chhmN~nr{wn@~p@ndYnoBvumA\",\"gbjvlN~nzzxn@vy^gw@vbSgE~m]~p@fgMnKvlg@wj@nofB_uC~xFwQns^wuBfrOod@nbaD_uCfg|Dw`EnkcBozDnfNwj@vaLovAnsEo}@f_G_cB~t\\\\gnLnsEgpAffF_jA~fEwj@ftDg^vaLg^~t\\\\_Xfj{@nKfkP_XfhT~p@~kOnK~}P_Xv~OfEvmUg^~kOfEnwa@~tC~oRfbCvdHnd@fqH~Wn~G?nljB_cBfsVg^nxh@_jA\",\"_u}~lNfkghxn@vpQ~rNvpQnmM~xFffFvn\\\\vxWvwPvzLn|RveOnjcAvrx@~bBv|AvcAv|Avj@ne`@~p@fzUfw@~fw@~bBnsw@fEfrOnd@nfNnd@fm^~_Fn~}CvcAfgf@wj@n}@~WfyNfnL_X~fEwQ~sUgiB~gL_q@nfNgpA\",\"_jvijNnxmd|n@vnCfw@fbCfbC~mD~fEfbCvrFvj@vyEgE~mD_XvuBooBffFovAvuB_|B~{Bw|An}@_uCfw@g_GfpAwik@nd@g`kCvgD_|[vj@\",\"gzrpjNfmnf|n@ojQ_jAoeGod@_eP_uC_rG_cBg_GooBg_G_uC_`FwgD_`FosEg{CozD_nD_yFgbColF_|B_dIw{SwmgAw{SospAgfFwfV_pRohnA_gEgm^w|Aw~OoaD_}b@ovA_g^gw@oh\\\\w|Agi_CgEoljB\",\"o}pxjNvoaszn@vcAnyVnvA~yMfbCfyNf{CvzLvyEf`Nfgf@vrqA~jH~vQnhCnwHnvAneG\",\"wqdvjNfglyzn@~bBnwHvcAvdHwQff_@oKneGw|AfvRofNf~q@olFnz]gxGf}j@_q@fcJ_XfyNfE~rNoK~qGvcAvjkAvQ~gLfw@vjr@n}@f~X?n}kAvQvqq@f^fqa@~p@n|R~iA~}i@fE~z_BwQfcgCgiBvpcAoKvcZnK~rNfw@~f^~p@~dPn}@nqPv|A~oRvuBv{Sfw@fcJn{Kvky@oKnwHwQvnCo}@vnCgiBnhCwuBn}@gbC~WwuBgEohC_q@_|BgiBw|AohCgw@_nDgEg{CfiBggf@~WozDvj@gbCfpA_cBnhCgpA~bB_XvyEwQ~iZfiBvdz@~qGvoJvQftDgE~v|A_yF\",\"_itlkNffcyxn@nxOwj@v_iA_|BnggAwcA~odA_jAnfg@gw@f~jAwnCnh\\\\_Xnlx@_XnkXg^f~XnKvhKvQ~rN?vrFvQnaD~WftDn}@nvAfw@~bBfpA~bB~bBv|AnaDfiBneGnvAvvInsEfkPnzDniJv}H~kO~wXf~q@naDn~GfyNnbd@n|k@f|nB~_FvpQfpAf_GvcAnpI~WnzDvQ~xFvQ~lVoK~cb@nd@~yf@vQnck@wQf_G_X~_Fo}@vdHwcAnsEgw@fbCgaUv_p@_uCnbK_|Bf|JwnCvbS_jA~nKwj@fcJ_q@vbSfEvlNnhCn`o@v`Ef{u@vQn~GgEfdQ_X~xFod@ffFwuBvlNwsMngn@ooB~gLgw@vkGwj@~qG_q@feXwcAnkXo}@vn\\\\~Wv~h@~{BntwAf^fcJvcAnpI~iAffF~{BnpIfiBnlF~qG~kO~vQfgf@vuBnwHfbCnmMfw@~jHnd@niJnK~eWod@~`MgpAvsMw|AvvI\",\"gc`|lN~y|zxn@gnLg^wu[wj@wwP?w`EnK\",\"_plmkN~e{xxn@_vnB~fEoic@fw@wdH?g`Nod@_gEg^w`Eg^g}QoaDg|JovA_sNovAobK_XgfFgEggMfEwezA~{Bg~XfEgqa@wQwxWnKoxOf^gmE~WwoJ~iA_nD~p@olFnvAwdH~{B_bTffFggM~bBgxGnd@wuBoKgcJvQgjb@f^_yF~WgaUnaD_|[nzDo`o@n}@_}qE~fEwufBfiBgrOnd@_y_@vuBoggAnoBwwbAnvAggM?weh@o}@gjIfEwm}EnpI\",\"wrwfjNfw}|{n@wuB?_uCfw@giBnoB_jA~tCgw@~mD\",\"g|{fjNnp_~{n@f^~W~iAgEvuB_nD\",\"ghijjNfyld|n@fEnrp@gEfhm@vcAnhC~p@~W?ggM\",\"okmjjNnyl~{n@fbCv~~D\",\"wcb~lNn{zzxn@wcAofg@\",\"gdlfmNv_t`xn@~W~oR\",\"_u}~lNfkghxn@_vc@gcc@gkP_wQw~aA_ebAwkGo~G_wQojQoqPojQgdQwpQwnu@_`x@\",\"wfw~lNfldmxn@gmE_`|C\"]", "fleet_id": "4008660", "shape_sm_c": "[\"gkkfmNvpgaxn@_X_pRnfyAf}|AvfsCfltCnboB~d{AnjcAvrx@vgDnzD~oR~mmLwj@n}@~WfyNfvRwj@ndr@olFvy^gw@~y_Afw@vlg@wj@nofB_uCv`w@_nDvj~IwvInkcBozDfi[gbCney@_mV~~WgiBnljBod@fud@n}@nyhAwj@nwa@~tC~oRfbCnvZn}@v`bCgbCvrcCwrFnxlCwnCvesB_gEnboBgpAvo|@~p@vvInvAn~GnlF~fE~gLnvAvvInsEfkPfyNnvZnz]v}z@fyNnbd@n}r@~maC~tCvpQvj@ntLvj@vquCg{CfzUoo[nf`A_|Bf|JwyEvr_@w|A~f^fEvlNfjIv|eBnKvcZo}@f`NwuBvlNwsMngn@wgDvtT_`FntwA~Wv~h@f{CvxbBvcAnpI~fEvwPft]va~@vuBnwHfbCnmMv|AnuSnK~eWwuBvu[wyEvfVw{Sndr@w`EnuSgbCfvRovA~f^gEf`Nn}@~lVn|RflbBnoBft]_Xfi[gmEv~h@gw@~__@~tCfcgCvcAnyVvyEft]f{CvzL~mv@~ksB~_F~}PvgDf}Qg^vlg@w|AfvRofNf~q@olFnz]gxGf}j@_jAn}Yn}@vqcBnhC~ryAvQfp~Bf{Cvm`BoKf_hFgiBvpcA?vwi@fiB~lo@f{Cnbd@~mD~__@n{Kvky@g^fgMwgDfxGwuBn}@_yFvQohC_q@wyEwrFgw@_nD~{B__q@~{BgfFnlFgiBvyEwQvouAf|JvoJvQnypGwmU~hpCwnCwQf{\\\\od@nhCgkP_|BgqH~iAozDnzDwyEnjQwhKoaDw}H_jAg|JfEolFn}@g_Gg{CovAwgDwgD_cB_XgbCw|Ag^ovA~{BvcAfiBnd@npIweO?wj@f^gEn}Y_sNn}@fbCv~~D?v{~AvuBnaD?wgoA~iAwhKn}@_cBnzD_|BnaDoKvnCfw@fqHfjIfbCvrFnd@vhKohC~|IosEvrF_sN~fE_htE~xF_qYooB_xX_yFo_OoeG_aMg|JgjIotLg_GoqPw{SwmgAw{SospAgfFwfV_pRohnAwdH_mo@oaD_}b@wnCop{@w|Agi_C_Xwl~Kv|Aom_AvQggxA~iAgf_@ftDwoc@flWgnwAf{CwtTfw@_tUgEggMgpAw_WovAwhK_`FghTgzgA_ftC_`F_iSooB_lOozDowsAooB_`_@od@o}YnoBw}z@nhCoh\\\\~Woh\\\\_cB_n]g}QoxzAw|Aoz]fEg`N~Wg`N~fEoic@~uJopb@~kOwlg@f{CoqPnhC_n]fEoyVooB_mVoaDwbSopb@omxA_nD_pRwcAwaL_uC_w|Afw@oyo@ftDo~y@nnTgliAfbCw_WoKgi[gjIgh_B?gt]~iAogUnpIoxh@fi[ot~@vgDwbSf^g`NwcA_~mCgw@otL_uCwpQo}r@_gbCocRock@ol_@_z_A_|B_}IgbCwwPovAwoc@_jAo{K_cBwrF_uCosEgiBgpAobKgbCouS~mDo{d@vwPgzUfiBwrjBfpAo`hAfbCgahH~qGo`sCf_G_fWod@gdj@owHovZooBguoB~{BgjtA?oxOf^_~P~bBgdj@vlNggM~bBoxaA~bBg~q@~|IguiJvoJglp@f{Cg`kC~fEgy`Agw@wm}EnpI_ei@_jAoyVnKohC_pvBwaLgyoF_dI_djF\",\"gdlfmNv_t`xn@g{u@osw@oaDg{gB~WooBwcAw_WwQnzDn}@vtT\",\"gouemNfp|qwn@gyN_|Bg^gw@fpAwlNgtDwsMniJwgDvyEgEfbCnvAfpA~mDnKv`EwyEfud@fjInlFv`EnsEfpAfgMw_W~nKgjInvA_h~@~{B_yF~mDwgDn~Gg^nhC~p@nkq@fxGnazC\",\"_mggjN~dm}{n@fbC_dIfiBooB~tCgw@~mDfE~|Iv`End@nvAwQnzDggM~oR_jAfEo~GwkGooBwvIgbCod@\"]");
    };

    const createITPAGPEDetour5 = () => {
        return createITPAMLSCopyShape("[\"_d`xjNnccbzn@_|B~nKwsMv}a@_gEveOw`EnuSgbCfvRgw@veOg^f`NgEf`N~WfuKnd@vvIvcA~gLvwPfcuAvcAfuK~Wv}HvQf_G?vsM_XntLod@~cIgiBfdQ\",\"gdlfmNv_t`xn@vnu@~_x@fdQvpQnqPnjQ~vQnjQvkGn~Gv~aA~dbAfkP~vQ~uc@fcc@\",\"wsrvjNfyhh{n@nd@gjIn}@woc@~p@gdQfw@g`g@vcA_zf@nd@_kz@nhCosw@?owH_X_nD_jAg_GwnCg_GgpAgiBw|AgiB_jAgw@oaDooB_cBwj@wyEwcAohC_XgbCoKohCvQwda@~tCgcc@fw@_`_@vcAgbCvj@\",\"_chhmN~nr{wn@~WooBg^gdQod@ozD\",\"wnihmNv}vzwn@wQnzDf^fdQf^noB\",\"grqemNf_iqwn@_|BwQ\",\"g{tfjNftz}{n@v|AwnCvnC_nD~bBgbC~WovA\",\"oqejjNfpcg|n@?o_aA\",\"w|qxjN~tkmzn@o}@ntL_XvvIg^fhT?fyN~tC~hwB\",\"_arvjNfmrp{n@wQ_shG\",\"oqejjNvoae|n@vj@_rGf^wuBn}@_cBnvA_jA~bB_q@naDoK\",\"o`chmNfk{~wn@ooBwumA_q@odY\",\"o`chmNfk{~wn@~uc@~ge@fdQnjQ\",\"gmf~lNnjcwxn@wnC_pdA_jAokq@_q@__XwcAohu@gpAgrh@_q@ote@wcAomf@\",\"ohd~lN~sryxn@wcAohnA\",\"o_gfjNvj}|{n@wQ~WwcAfEw`Eod@wyEgpA_jAoKohCnKwgDn}@_|BfiBo}@fpAwj@nvAoKfpA\",\"_isljNfpe|{n@~c{@oaDf_GoK\",\"gouemNfp|qwn@_q@vvIv|Afw@nlFftDv`EnsEfpAfgMw_W~nKwrFvcAovAvQoqPf^wze@n}@wyEf^wuBvcAgbCfiB_cBvnCwcAvnCg^nhCfEftDvj@fvk@naD~xqAnoB~vcA\",\"gouemNfp|qwn@~{B_pR\",\"wcojjNfa`|{n@~{BgE\",\"_uihmNfmszwn@fEnoB\",\"gpkgjNn_l}{n@gpA~_Fod@fw@whKoaDw}H_jAwnCgEolFnKovAnK_uC~p@_jA_q@wcAg^ooB_jAovAwgDod@od@wcA_q@o}@oK\",\"_mggjN~dm}{n@gbCod@\",\"ow}ijN~zj~{n@w`E?gtDfw@\",\"w~kijNf}n}{n@weO?wj@f^gEn}Y\",\"wfkjjN~z_|{n@ffx@od@nyo@_q@~iZod@\",\"_zefjN~}{{{n@wQf{\\\\wQnoB\",\"gqepjNf|n|{n@ndYwcAnqPg^\",\"wzhijN~fb}{n@fE_q@gEwj@_Xod@wj@_X_q@gEod@vQod@~p@oKfw@vQvcA~p@nd@vQ~bBvQnlF\",\"gpkgjNn_l}{n@fbCnd@\",\"wnihmNv}vzwn@gEooB\",\"onijjNfsl~{n@_|BfE\",\"_ahfmN~h|pwn@nhCfcJoK~{BwcAvoJf^fw@fyN~{B\",\"_uihmNfmszwn@ooB_wcAoaD_yqAwj@gvk@gEgtDf^ohCvcAwnC~bBwnCfbCgiBvuBwcAvyEg^vze@o}@nqPg^nvAwQvrFwcAv_W_oKgpAggMw`EosEolFgtDw|Agw@~p@wvI\",\"gyynjNfxk|{n@fjb@w|AvwPgw@fkP_q@\",\"_mggjN~dm}{n@nd@~tC~iAv`Ef_GvrF\",\"wpifjNvzi}{n@_aMobK\",\"odjgjN~ug}{n@wj@nhC\",\"gdlfmNv_t`xn@gdQojQ_vc@_he@\",\"_chhmN~nr{wn@~p@ndYnoBvumA\",\"gbjvlN~nzzxn@vy^gw@vbSgE~m]~p@fgMnKvlg@wj@nofB_uC~xFwQns^wuBfrOod@nbaD_uCfg|Dw`EnkcBozDnfNwj@vaLovAnsEo}@f_G_cB~t\\\\gnLnsEgpAffF_jA~fEwj@ftDg^vaLg^~t\\\\_Xfj{@nKfkP_XfhT~p@~kOnK~}P_Xv~OfEvmUg^~kOfEnwa@~tC~oRfbCvdHnd@fqH~Wn~G?nljB_cBfsVg^nxh@_jA\",\"_u}~lNfkghxn@vpQ~rNvpQnmM~xFffFvn\\\\vxWvwPvzLn|RveOnjcAvrx@~bBv|AvcAv|Avj@ne`@~p@fzUfw@~fw@~bBnsw@fEfrOnd@nfNnd@fm^~_Fn~}CvcAfgf@wj@n}@~WfyNfnL_X~fEwQ~sUgiB~gL_q@nfNgpA\",\"_jvijNnxmd|n@vnCfw@fbCfbC~mD~fEfbCvrFvj@vyEgE~mD_XvuBooBffFovAvuB_|B~{Bw|An}@_uCfw@g_GfpAwik@nd@g`kCvgD_|[vj@\",\"gzrpjNfmnf|n@ojQ_jAoeGod@_eP_uC_rG_cBg_GooBg_G_uC_`FwgD_`FosEg{CozD_nD_yFgbColF_|B_dIw{SwmgAw{SospAgfFwfV_pRohnA_gEgm^w|Aw~OoaD_}b@ovA_g^gw@oh\\\\w|Agi_CgEoljB\",\"o}pxjNvoaszn@vcAnyVnvA~yMfbCfyNf{CvzLvyEf`Nfgf@vrqA~jH~vQnhCnwHnvAneG\",\"wqdvjNfglyzn@~bBnwHvcAvdHwQff_@oKneGw|AfvRofNf~q@olFnz]gxGf}j@_q@fcJ_XfyNfE~rNoK~qGvcAvjkAvQ~gLfw@vjr@n}@f~X?n}kAvQvqq@f^fqa@~p@n|R~iA~}i@fE~z_BwQfcgCgiBvpcAoKvcZnK~rNfw@~f^~p@~dPn}@nqPv|A~oRvuBv{Sfw@fcJn{Kvky@oKnwHwQvnCo}@vnCgiBnhCwuBn}@gbC~WwuBgEohC_q@_|BgiBw|AohCgw@_nDgEg{CfiBggf@~WozDvj@gbCfpA_cBnhCgpA~bB_XvyEwQ~iZfiBvdz@~qGvoJvQftDgE~v|A_yF\",\"_itlkNffcyxn@nxOwj@v_iA_|BnggAwcA~odA_jAnfg@gw@f~jAwnCnh\\\\_Xnlx@_XnkXg^f~XnKvhKvQ~rN?vrFvQnaD~WftDn}@nvAfw@~bBfpA~bB~bBv|AnaDfiBneGnvAvvInsEfkPnzDniJv}H~kO~wXf~q@naDn~GfyNnbd@n|k@f|nB~_FvpQfpAf_GvcAnpI~WnzDvQ~xFvQ~lVoK~cb@nd@~yf@vQnck@wQf_G_X~_Fo}@vdHwcAnsEgw@fbCgaUv_p@_uCnbK_|Bf|JwnCvbS_jA~nKwj@fcJ_q@vbSfEvlNnhCn`o@v`Ef{u@vQn~GgEfdQ_X~xFod@ffFwuBvlNwsMngn@ooB~gLgw@vkGwj@~qG_q@feXwcAnkXo}@vn\\\\~Wv~h@~{BntwAf^fcJvcAnpI~iAffF~{BnpIfiBnlF~qG~kO~vQfgf@vuBnwHfbCnmMfw@~jHnd@niJnK~eWod@~`MgpAvsMw|AvvI\",\"wrwfjNfw}|{n@wuB?_uCfw@giBnoB_jA~tCgw@~mD\",\"g|{fjNnp_~{n@f^~W~iAgEvuB_nD\",\"_u~emNvlwpwn@_kHf{C\",\"gouemNnlhqwn@vj@wkGw|A_yFwrF_X\",\"ghijjNfyld|n@fEnrp@gEfhm@vcAnhC~p@~W?ggM\",\"okmjjNnyl~{n@fbCv~~D\",\"gezzjNnq~~zn@o|}AnzDwjYvQgvR~Wo{d@od@ozv@gbC_bT_XolFoKoaoAvj@_gEf^_pRf^wawA~iAoaDoK_oK~WghT?wmn@~p@_vgCvuBw|Z~p@gdj@f^w`^nd@gzUfEwnnAfw@wumA~iA_lO?_|mAvcAorWfE_|t@n}@gf_@vQg``AnvAgmw@~W_|[vj@_taI~|IwyE?ospAfbC_jlA~bB_yFf^g`g@~p@wvI?w}sAvuB_qYfw@_rG~Wg||@~bB_bm@~p@_`x@nvA\",\"_jb~lNvy~`{n@g|JgpAw|Awj@oaDgiB_jAgpAo}@_cBgw@_cBo}@_`FgEooBnKwnCnd@gxGvj@w`EvQosEn~Gwn\\\\v`EwtT~p@wvInd@gcJ?_z_AoKokXwcAowz@nKw}Hf^waLnd@w}H~iAgnLf`NoueA~kOw`pA~_Fo{d@~bBorWnvAgx`@vj@wmUnKw_WgEgt]oKwlNg^weOod@__X?_aMo}@g}j@nKoiJvcA_hLfpA_dIfbC_vJfbCgxGnzDgjIftDoeGf~Xoo[nomAwkrAnmM_eP~aTo}YfuKgdQn~GgyN~cIwiRftDoiJ~_FweOnlF_~P~qGwxWngU__jA~gLwtm@nzDgsV~p@wdHvcAgqHnvAwmU~WwlNvQoqPnKogn@wcAohu@giB_he@w|A_jlAnKoqPvcAo}YvQguKwQwziCg{u@nvAgjb@vj@wgv@~bBod@~p@gyNf^g|c@~p@gdQnd@oueAnoBooBoe}C_aMoo`J\",\"wcb~lNn{zzxn@wcAofg@\",\"_u}~lNfkghxn@_vc@gcc@gkP_wQw~aA_ebAwkGo~G_wQojQoqPojQgdQwpQwnu@_`x@\",\"wfw~lNfldmxn@gmE_`|C\"]", "fleet_id": "4008662", "shape_sm_c": "[\"_chhmN~nr{wn@o}@wtTvQozDvcAv_W_XnoBnaDf{gBvbpCvquCvfsCfltCnboB~d{AnjcAvrx@vgDnzD~oR~mmLwj@n}@~WfyNfvRwj@ndr@olFvy^gw@~y_Afw@vlg@wj@nofB_uCv`w@_nDvj~IwvInkcBozDfi[gbCney@_mV~~WgiBnljBod@fud@n}@nyhAwj@nwa@~tC~oRfbCnvZn}@v`bCgbCvrcCwrFnxlCwnCvesB_gEnboBgpAvo|@~p@vvInvAn~GnlF~fE~gLnvAvvInsEfkPfyNnvZnz]v}z@fyNnbd@n}r@~maC~tCvpQvj@ntLvj@vquCg{CfzUoo[nf`A_|Bf|JwyEvr_@w|A~f^fEvlNfjIv|eBnKvcZo}@f`NwuBvlNwsMngn@wgDvtT_`FntwA~Wv~h@f{CvxbBvcAnpI~fEvwPft]va~@vuBnwHfbCnmMv|AnuSnK~eWwuBvu[wyEvfVw{Sndr@w`EnuSgbCfvRovA~f^gEf`Nn}@~lVn|RflbBnoBft]_Xfi[gmEv~h@gw@~__@~tCfcgCvcAnyVvyEft]f{CvzL~mv@~ksB~_F~}PvgDf}Qg^vlg@w|AfvRofNf~q@olFnz]gxGf}j@_jAn}Yn}@vqcBnhC~ryAvQfp~Bf{Cvm`BoKf_hFgiBvpcA?vwi@fiB~lo@f{Cnbd@~mD~__@n{Kvky@g^fgMwgDfxGwuBn}@_yFvQohC_q@wyEwrFgw@_nD~{B__q@~{BgfFnlFgiBvyEwQvouAf|JvoJvQnypGwmU~hpCwnCwQf{\\\\od@nhCgkP_|BgqH~iAozDnzDwyEnjQwhKoaDw}H_jAg|JfEolFn}@g_Gg{CovAwgDwgD_cB_XgbCw|Ag^ovA~{BvcAfiBnd@npIweO?wj@f^gEn}Y_sNn}@fbCv~~D?v{~AvuBnaD?wgoA~iAwhKn}@_cBnzD_|BnaDoKvnCfw@fqHfjIfbCvrFnd@vhKohC~|IosEvrF_sN~fE_htE~xF_qYooB_eP_uCgrOosEg_G_uC_`FwgDg|J_oKgqHofN_|B_dIw{SwmgAw{SospAgfFwfV_pRohnAwdH_mo@oaD_}b@ovA_g^gw@oh\\\\w|Agi_C_Xo`tJ~tCg``A~{Bg{nAnd@_kz@nhC_laA_cBgnLwnCg_G_nDosEolFwgDw}HooBwkGod@gne@vgDgdcA~{BgbCvj@o|}AnzD_bm@vj@ogyBgmEoaoAvj@_xXn}@_h|K~uJ_r{NfuKwkeJvhKovuN~lVg|JgpAgjIgfFwuB_gEo}@_`FfEg_G~bBonTf`Nodr@nvA_{ToKofyAwcAowz@vj@o`VnoB_mVfne@ws|DnzDwky@vj@wmUfE_uu@wnCwsqBfpAorWnsE_{Tv}HocRftDoeGvngBg|nBnmM_ePfx`@wbl@vxWonm@nmMwda@~qGwxWngU__jAncR_ieAfmEweh@fw@wgoAwcAohu@giB_he@w|A_jlA~bBgfx@wQwziCofyAfbCwgv@~bBod@~p@gyNf^_x|B~fEooBoe}CweO_whKwcAohnAwaLgyoF_dI_djF\",\"gouemNfp|qwn@gyN_|Bg^gw@fpAwlNohCgcJ~jHg{CvrF~Wv|A~xFwj@vkG~{BvQ_nDvg]fjInlFv`EnsEfpAfgMw_W~nKgjInvA_h~@~{B_yF~mDwgDn~Gg^nhC~p@nkq@fxGnazC\",\"_mggjN~dm}{n@fbC_dIfiBooB~tCgw@vuB?~`MnbK_XnvAggM~oR_jAfEo~GwkGooBwvIgbCod@\"]");
    };

    const createLSCopyShape = shapeStr => {
        let polyCode = new tf.map.PolyCode();
        let precison = 6;
        let geom = {
            type: 'linestring',
            coordinates: polyCode.DecodeLineString(shapeStr, precision)
        };
        return createGeomCopyShape(geom);
    };

    const createCopyShape = () => {
        //var shapeStr = "rcpkxCkmoyo@npNvVdVcYjBolCTqb@wC}\rD{aARod@bBs|BR_b@??vCgmCoaGgeA{wEyiMcuFwKe]tAu|@kDouAiBmVk@aKXtGYeJDb@[{a@wM?sNSao@oAyGnAbE{@kvARon@CkX?clA_AqcBs@eVr@cZ~BevAwBqUbDbBsPccAg@_DSkCrIsIz@wGhIkIeAw}@nA{^z@ku@jCkdA_Io|HS{c@nAseA~p@sjKzEgzA`FwgA|AsnGxB{i@tGcaG`KkaHtEsyElJukF~BytA?ezAdDyrFdAuJxA}oEz@_NkFczDiBy[tE}o@TmNa@}g@t@vEkFm`Cec@gbBsIao@SsIzBmgCb@aEMuOYaZwGg^sWqqAcf@meB{@_I}BcmB}Akn@RcBR?^n@_@cASkHa@gDhAwH`Bc\pAwmCbAcAnBs}B|JylHtCylA`IerE??}AyChGqmB`@uhBhEkjAlAcmClAsx@";
        var shape = { "shape": "b|mhxCqp}bp@??????????????sA`A????aAx@_BvA_CnB{GdEeEvBsFt@sFMaFmAeDwDeByDsBuE{B_F}BgFoA_GGcGNuEpAkFdAiElD}C`DoCjBeA??fBu@vB_AbGyBvBi@??jBc@rBg@hA_FYsA??YyAbEqBnD_AxBq@vBo@rBq@vAu@??ZoDm@eBmB_Ge@sAaAyCi@gBm@wBeCwHs@eE]mBWmBg@qDi@_Fi@aFMuFK{ED{FHgFHiBHgCRiBr@mFv@sD^iH??{BgE??uB}FkD}FkFuCcBcAeB}@eC}@oCiCgCyDcFwDsEwAqBcFlAkFhFwB|Fj@vEtDhGr@bGNfDH??tCHnDoE?oC?oC?yC?oFAgG???oF???uBRkD`DgBnHEtEAdE?jB?nHAxa@CdFCxEqIBiFLyAVwA??????????????|AkIp@aIVoI\\iJ`@eJ\\kIXsGPmERyETkFZmHRoHTaITaITyIVcJZwIZgIXgHJiCT_GLqDJiCN{DPiFReFFeBLkDRmFPuEP_FVmGHsBJoCViGTcGXwH\\{I^aJ^mJ`@aKb@aK\\iJ\\mJ\\aJZwI\\cJZsIZsIZcIReGLcD??FyA????????DkAiGaHsFG}IImKK}KIiMG{KE}ICcGCuCC????yBCqHIoKI{KCiLE{LEiLE{LCiMEgMEyME_N?uLfAwMKiMKiMKkLK{KI{KI}KKkKI_IGcGGuECoDyHFoDJwFJqGJeGFcEjDm@bGFnHH~HF~HHrFDvCDhCBdEBtFFnHF`HHvCBbDmCDyDJiGH_FDaEj@qB`A}Bj@wA??????????Tg@??fUNvD?fCfANpBO|C?`E?jFMnF?bBkBfFuDd@aHo@kSU?JgG`@sGGaHGoHGiCCwCEiBAqHGqGGoIIaHGeFGyAAoEhCG~DI|EIjEEjC??????????CfB??K~F??QlFWjH[rI]pJ_@bK_@zKa@fLa@nLc@`Me@dMc@`Mc@`Mc@`Mc@|LOtEq@rRYxHS~FKjC??EtAdDpCbFB`IDzJFzKNjLNzKN??jKJ|IJpIF`HBxB@tD@xB@??????????????fE@nIDhB?|HrGOlEStGYbJ_@rKg@`Li@zLk@~La@vMe@xM??i@dM??e@xK_@lIUfFG~AMnCI`B????I~B[bH[fJSnJMxJQpIShJIhLGxMGtNIdPGlPInPGpPItPGzPIzPOzPObQQ~Po@xr@OnOOvNMfNQtMUbNWbNWpNWjNUfN??MlM??UzL[dLYbKSvHO~EhHhFbGB`ID??~HD??rFB|GnD@pCE|DcBnEgDrDcFGsFGyBAwDEk@_EtBB~GJvEDhBB??vBDpF{DBaC?}CAsCjEyAfDA`HAvEOfDMzCMrFmAzFsBrFyCdGeDnFcDzA}@`BaAf@yF{AqB_CcDgCaEaCeEsBkD_CqC_DqC@sElBuCP}De@mGw@sGyA{G??{B{G??qAiHOyH\\kHbBmHjCuGjEwFhFgExF_DzGeBfFq@~Ck@nFtD`@tDnCZ??`BX??oBxSL|E?`BN|BL|BzBnDdDtDfDrDlHtJFEWPqA`AmA|@????????" };
        var shapeStr = JSON.parse(shape.shape);
        //shapeStr = JSON.parse(shapeStr[0]);
        copyShape = createLSCopyShape(shapeStr);
        //copyShape = createITPACatsShape();;
    };

    const initialize = () => {
        //createCopyShape();

        initialized = true;

        let layerSettings = {
            name: "shapes", isVisible: true, isHidden: true,
            useClusters: false,
            /*clusterFeatureDistance: settings.clusterFeatureDistance,
            clusterStyle: settings.clusterStyle,
            clusterLabelStyle: settings.clusterLabelStyle,*/
            zIndex: 5
        };

        let mapApp = getGlobalMapApp();
        let content = mapApp.GetContent();
        map = content.GetMap();
        layer = content.CreateCustomMapLayer(layerSettings, false);
        map.AddListener(tf.consts.mapFeatureClickEvent, onMapFeatureClick);
    };

    const tryInitialize = () => {
        initialized = false;
        mapFeatures = {};
        if (getGlobalMapApp()) { initialize(); } else { setTimeout(() => { return tryInitialize(); }, 500); }
    };

    tryInitialize();
};

const Shape = ({ item, shapesMapFeatures, change, remove, update, pan, sendToEditor, updateFromEditor, calcStopSequence, calcShape }) => {
    let marginPx = commonStyles.marginPx;
    let nameId = item.id + 'shape_name';
    let pointsId = item.id + 'shape_desc';
    let editId = item.id + 'edit';
    let updateId = item.id + 'update';
    let panId = item.id + 'pan';
    let shapeLengthId = item.id + 'shapeLen';
    let visibleId = item.id + 'visible';
    let calcStopSequenceId = item.id + 'calcStopSequence';

    let shapeLength = shapesMapFeatures.GetMapFeatureLengthInMeters(item.shape_name);

    //shapeLength = (shapeLength  * 0.000621371).toFixed(3);  // miles
    shapeLength = shapeLength.toFixed(3);  // meters

    return (
        <div className="gtfsListItem">

            <label htmlFor={visibleId} style={{ margin: marginPx }} title="Show or hide this Shape on the map" ><small>visible</small>
                <input style={{ marginLeft: '10px' }} className="" type="checkbox" id={visibleId} onChange={() => {
                item.visible = !item.visible; delete item._needChange; change(item);
                }} checked={item.visible} />
            </label>

            <label htmlFor={item.id + 'shapeClosed'} style={{ margin: marginPx }} title="Show or hide this Shape on the map" ><small>shape_closed</small>
                <input style={{ marginLeft: '10px' }} className="" type="checkbox" id={item.id + 'shapeClosed'} onChange={() => {
                    item.shapeClosed = !item.shapeClosed; delete item._needChange; change(item);
                }} checked={item.shapeClosed} />
            </label>

            <input style={{ marginLeft: '10px' }} className="" type="button" id="{editId}" onClick={() => { sendToEditor(item) }} value="Edit" title="Edit shape with map Measure Tool" />
            <input style={{ marginLeft: '10px' }} className="" type="button" id="{updateId}" onClick={() => { updateFromEditor(item) }} value="Update" title="Update shape from map Measure Tool" />

            <input style={{ marginLeft: '10px' }} className="" type="button" id="{panId}" onClick={() => { pan(item) }} value="CenterTo" title="Center Map to Shape" />

            <label title="Used to link this Shape to other objects, like Stop Sequences" htmlFor={nameId} style={{ margin: marginPx }}><small>shape_name</small>
                <input style={{ margin: marginPx, width: '120px' }} value={item.shape_name} className="" type="text" id={nameId}
                    onBlur={() => { if (item._needChange) { delete item._needChange; change(item); } }}
                    onChange={(event) => { if (item.shape_name != event.target.value) { item._needChange = true; item.shape_name = event.target.value; update(); } }} />
            </label>

            <label title="Shape compressed polyline, do not edit directly, copy/paste to/from elsewhere is OK" htmlFor={pointsId} style={{ margin: marginPx }}><small>shape_points</small>
                <input style={{ margin: marginPx, width: '280px' }} value={item.shape_points} className="" type="text" id={pointsId}
                    onBlur={() => { if (item._needChange) { delete item._needChange; change(item); } }}
                    onChange={(event) => { if (item.shape_points != event.target.value) { item._needChange = true; item.shape_points = event.target.value; update(); } }} />
            </label>

            <label title="Shape length in meters" style={{ margin: marginPx }} htmlFor={shapeLengthId}><small>shape_length</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '80px', fontSize: '110%' }} className="" id={shapeLengthId} >{shapeLength}m</div>
            </label>

            <input style={{ marginLeft: '10px' }} className="" type="button" id="{calcStopSequenceId}" onClick={() => { calcStopSequence(item) }} value="Calc Stop Seq" title="Calculate stop sequence" />

            <TextPressButton text={'Calc Shape'} title={"Calc shape from car directions"} onClick={e => { calcShape(item); }} />

            <input className="delButton" type="button" onClick={() => { remove(item.id) }} value="Del" title="Delete without confirmation!" />
        </div>
    );
};

const ShapesList = ({ data, shapesMapFeatures, change, remove, update, pan, sendToEditor, updateFromEditor, calcStopSequence, calcShape }) => {
    const items = data.map((item) => {
        return (<Shape item={item} key={item.id}
            shapesMapFeatures={shapesMapFeatures}
            remove={remove} change={change} update={update} pan={pan} sendToEditor={sendToEditor} updateFromEditor={updateFromEditor}
            calcStopSequence={calcStopSequence}
            calcShape={calcShape}
        />);
    });
    return (<div className="gtfsList">{items}</div>);
};

class GTFSShapes extends React.Component {
    shapesMapFeatures = null;
    constructor(props) {
        super(props);
        gtfsShapes = this;
        this.shapesMapFeatures = ShapesMapFeatures({});
        this.state = { data: [], shapesVisible: true, simplifyTolerance: 1 };
        this.JSONInputId = "shapesJSONInput";
        this.crudClient = tf.services.CRUDClient({ tableName: this.makeTableName(globalAgencyPrefix), serverURL: CRUDAPI, authForm: gtfsLogin.getAuthForm() });
    };

    makeTableName(agencyPrefix) { return getGTFSTableName(agencyPrefix, "shapes"); }
    getJSON() { return JSON.stringify(this.state.data); };
    dump() { document.getElementById(this.JSONInputId).value = this.getJSON(); };

    updateTableWithJSON(overridePrefix) { return this.doUpdateTableWithJSON(this.getJSON(), overridePrefix); }
    doUpdateTableWithJSON(value, overridePrefix) {
        if (tf.js.GetIsNonEmptyString(value)) {
            try {
                value = JSON.parse(value);
                if (tf.js.GetIsNonEmptyArray(value)) {
                    this.crudClient.Put(notification => {
                        if (!(notification && notification.ok)) {
                            console.log(notification.message);
                        }
                        this.refresh();
                    }, value, this.makeTableName(tf.js.GetNonEmptyString(overridePrefix, globalAgencyPrefix)));
                }
            }
            catch (e) { console.log(e.message); }
        }
    };
    updateFromJSON(value) { return this.doUpdateTableWithJSON(value, undefined); };

    componentDidMount() { this.refresh(); };
    getIdForShapeName(shapeName) {
        for (let i in this.state.data) {
            var d = this.state.data[i];
            if (d.shape_name == shapeName) { return d.id; }
        }
    };
    getShapeNameForId(id) {
        for (let i in this.state.data) {
            var d = this.state.data[i];
            if (d.id == id) { return d.shape_name; }
        }
    };
    notifyStopSequences() {
        if (gtfsStopSequences === undefined) {
            if (gtfsStops !== undefined) { ReactDOM.render(<GTFSStopSequences />, document.getElementById('stopSequencesContainer')); }
        }
        else { gtfsStopSequences.onShapesChanged(); }
    };
    refreshSetState() {
        this.setState(Object.assign({}, this.state));
        this.shapesMapFeatures.Update(this.state.data);
    };
    setStateData(data) {
        this.state.data = data;
        this.refreshSetState();
        this.notifyStopSequences();
    };
    handleUpdate() {
        this.setStateData(this.state.data);
    };
    handlePan(item) {
        this.shapesMapFeatures.PanTo(item);
    };
    sendLineStringToEditor(lineString) {
        this.shapesMapFeatures.SendLineStringToEditor(lineString);
    };
    sendToEditor(item) {
        this.shapesMapFeatures.SendToEditor(item);
    };
    updateFromEditor(item) {
        this.shapesMapFeatures.UpdateFromEditor(item);
        this.handleChange(item);
    };
    show() {
        this.state.shapesVisible = this.shapesMapFeatures.SetVisible(!this.shapesMapFeatures.GetVisible());
        this.refreshSetState();
    };
    simplify() {
        this.shapesMapFeatures.SimplifyEditorLineString(this.state.simplifyTolerance);
    };
    refresh() {
        this.crudClient.Get(notification => {
            if (notification && notification.ok) {
                this.setStateData(notification.data);
            }
            else {
                this.setStateData([]);
                console.log(notification.message);
            }
        });
    };
    clear() {
        this.crudClient.Del(notification => {
            if (!(notification && notification.ok)) {
                console.log(notification.message);
            }
            this.refresh();
        });
    }
    addItem() {
        const record = {
            shape_name: "new shape",
            visible: true,
            shapeClosed: false,
            shape_points: ""
        };
        this.crudClient.Post(notification => {
            if (notification && notification.ok) {
                Array.prototype.push.apply(this.state.data, notification.data);
                this.refreshSetState();
            }
            else {
                console.log(notification.message);
                this.refresh();
            }
        }, record);
    };
    handleRemove(id) {
        const remainder = this.state.data.filter((item) => { if (item.id !== id) return item; });
        this.crudClient.Del(notification => {
            if (notification && notification.ok) {
                this.setStateData(remainder);
            }
            else {
                console.log(notification.message);
                this.refresh();
            }
        }, id);
    };
    handleChange(item) {
        this.crudClient.Put(notification => {
            if (notification && notification.ok) {
                this.refreshSetState();
            }
            else {
                console.log(notification.message);
                this.refresh();
            }
        }, item);
    };
    calcStopSequence(item) {
        let polyCode = new tf.map.PolyCode();
        let shapePoints = polyCode.DecodeLineString(item.shape_points, 6);
        let stops = gtfsStops.state.data, nStops = stops.length;
        let startSegIndex = undefined, startMinProj = undefined, endSegIndex = undefined, acceptDistance = undefined, angleSign = 1, minDistanceDelta = undefined;
        let maxDistanceAccept = 20;
        let foundStops = [];
        for (let i = 0; i < nStops; ++i) {
            let stop = stops[i];
            let stopCoords = [stop.stop_lon, stop.stop_lat];
            let hitTestResult = tf.helpers.HitTestMapCoordinatesArray(shapePoints, stopCoords, startSegIndex, startMinProj, endSegIndex, acceptDistance, angleSign, minDistanceDelta);
            //return { minDistance: minDistance, minDistanceIndex: minDistanceIndex, closestPoint: closestPoint, proj: proj, angle: angle };
            if (hitTestResult.closestPoint && hitTestResult.minDistance < maxDistanceAccept) {
                foundStops.push({ hitTestResult: hitTestResult, stop: stop });
            }
        }
        foundStops.sort((a, b) => {
            let ha = a.hitTestResult, hb = b.hitTestResult;
            if (ha.minDistanceIndex < hb.minDistanceIndex) { return -1; }
            if (ha.minDistanceIndex > hb.minDistanceIndex) { return 1; }
            if (ha.proj < hb.proj) { return -1; }
            if (ha.proj > hb.proj) { return 1; }
            return 0;
        });
        console.log('nstops: ' + foundStops.length);
        for (let i = 0; i < foundStops.length; ++i) {
            let foundStop = foundStops[i];
            let stop = foundStop.stop;
            console.log(stop.id + ':' + stop.stop_name);
        }
    };
    onShapeFromShapeLoaded(notification) {
        if (notification.coordinates) {
            gtfsShapes.sendLineStringToEditor(notification.coordinates);
        }
    };
    calcShape(item) {
        let polyCode = new tf.map.PolyCode();
        let shapePoints = polyCode.DecodeLineString(item.shape_points, 6);
        new GetDirectionShapeFromCoords2By2({ callback: this.onShapeFromShapeLoaded.bind(this), coordinates: shapePoints, isClosed: item.shapeClosed, item: item, theThis: this });
    };
    render() {
        let marginPx = commonStyles.marginPx;
        return (
            <div className="gtfsList">
                <Title title="Shapes" count={this.state.data.length} />
                <label htmlFor="ShapesVisibleId" style={{ margin: marginPx }} title="Show or hide Shapes on the map" ><small>visible</small>
                    <input style={{ marginLeft: '10px' }} className="" type="checkbox" id="ShapesVisibleId"
                        onChange={this.show.bind(this)} checked={this.state.shapesVisible} />
                </label>
                <BarButton value="Add" title="Add new Shape" onClick={this.addItem.bind(this)} />
                <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                <BarButton value="Clear" title="Clear List" onClick={this.clear.bind(this)} />
                <BarButton value="Dump" title="Dump List in JSON format" onClick={this.dump.bind(this)} />
                <BarButton value="Simplify" title="Simplify measure tool polyline" onClick={this.simplify.bind(this)} />

                <LabeledTextInput
                    id={"shapeSimplifyToleranceId"} label={"simplify_tolerance"} title={"tolerance in meters for polyline simplification"} text={this.state.simplifyTolerance} width={"40px"}
                    onBlur={e => {
                        this.state.simplifyTolerance = tf.js.GetFloatNumberInRange(this.state.simplifyTolerance, 0.1, 20.0, 1.0);
                        this.refreshSetState();
                    }}
                    onChange={(event, newValue) => {
                        this.state.simplifyTolerance = newValue;
                        this.refreshSetState();
                    }}
                />

                <SingleLineInputForm
                    inputId={this.JSONInputId}
                    inputLabel="Type or paste JSON and press enter to replace list"
                    sendSubmitValue={this.updateFromJSON.bind(this)}
                />
                <ShapesList
                    data={this.state.data}
                    shapesMapFeatures={this.shapesMapFeatures}
                    remove={this.handleRemove.bind(this)}
                    change={this.handleChange.bind(this)}
                    update={this.handleUpdate.bind(this)}
                    pan={this.handlePan.bind(this)}
                    sendToEditor={this.sendToEditor.bind(this)}
                    updateFromEditor={this.updateFromEditor.bind(this)}
                    calcStopSequence={this.calcStopSequence.bind(this)}
                    calcShape={this.calcShape.bind(this)}
                />
            </div>
        );
    };
};

class GTFSShapeSelect extends React.Component {
    selectedId = null;
    constructor(props) {
        super(props);
        this.state = { data: [], shapeNameListProps: null };
        this.fillListProps();
    };
    componentDidMount() {
    };
    handleUpdate() {
        this.selectedId = undefined;
        this.internalHandleUpdate();
    };
    internalHandleUpdate() {
        this.fillListProps();
        this.setState({ data: this.state.data, shapeNameListProps: this.state.shapeNameListProps });
    };
    render() { return (<ListSelect props={this.state.shapeNameListProps} />); };
    fillListProps() {
        let options = [], index = 0;
        for (let i in gtfsShapes.state.data) {
            let d = gtfsShapes.state.data[i], shape_name = d.shape_name;
            options.push({ key: index, value: d.id, text: shape_name });
            ++index;
        }
        if (this.selectedId == undefined) {
            if (options.length) { this.selectedId = options[0].value; }
            else { this.selectedId = undefined; }
        }
        this.state.shapeNameListProps = {
            name: 'shapeSelect',
            title: 'Select the name of a Shape',
            handleChange: (e) => {
                this.selectedId = e.target.value;
                this.internalHandleUpdate();
            },
            value: this.selectedId,
            options: options
        };
    };
};
