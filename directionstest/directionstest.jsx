"use strict";

const DirectionsItem = ({ item, remove, change, update, setFromAddress, setToAddress }) => {
    let marginPx = commonStyles.marginPx;

    return (
        <div className="gtfsListItem">

            <label style={{ margin: marginPx }} htmlFor={item.id + 'id'}><small>id</small>
                <div style={{ display: 'inline-block', margin: marginPx, minWidth: '16px', fontSize: '110%' }} className="" id={item.id + 'id'}>{item.id}</div>
            </label>

            <label style={{ margin: marginPx }} htmlFor={ item.id + 'address' }><small>address</small>
                <input style={{ margin: marginPx, width: '280px' }} value={item.address} className="" id={item.id + 'address'}
                    onBlur={() => { if (item._needChange) { delete item._needChange; change(item); } }}
                    onChange={(event) => {
                        if (item.address != event.target.value) { item._needChange = true; item.address = event.target.value; update(); }
                    }} />
            </label>

            <input style={{ margin: marginPx }} type="button" onClick={() => { setFromAddress(item) }} value="From" title="Set From address" />
            <input style={{ margin: marginPx }} type="button" onClick={() => { setToAddress(item) }} value="To" title="Set To address" />

            <input className="delButton" type="button" onClick={() => { remove(item.id) }} value="Del" title="Delete without confirmation!" />

        </div>
    );
};

const DirectionsList = ({ data, remove, change, update, setFromAddress, setToAddress }) => {
    const items = data.map((item) => {
        return (<DirectionsItem
            item={item}
            key={item.id}
            remove={remove}
            change={change}
            update={update}
            setFromAddress={setFromAddress}
            setToAddress={setToAddress}
        />);
    });
    return (<div style={{ maxHeight: "initial" }} className="gtfsList">{items}</div>);
};

let gGarages = {
    "features": [
        {
            "geometry": {
                "type": "Polygon"
            },
            "type": "Feature",
            "properties": {
                "identifier": "107 Ave Entrance",
                "is_active": true,
                "total_level": 1,
                "parking_site_type_name": "parking lot",
                "parking_site_id": 1,
                "parking_site_type_id": 2,
                "capacity": 262
            }
        }, {
            "geometry": {
                "coordinates": [[[-80.1433002949, 25.9098604201], [-80.1428067684, 25.9101016799], [-80.1427263021, 25.9099858753], [-80.1417553425, 25.9097832169], [-80.1429569721, 25.9092234919], [-80.1433002949, 25.9098604201]]],
                "type": "Polygon"
            },
            "type": "Feature",
            "properties": {
                "identifier": "3-West of AC-2",
                "is_active": true,
                "total_level": 1,
                "parking_site_type_name": "parking lot",
                "centroid": [-80.14270929441406, 25.909667357103686],
                "parking_site_id": 2,
                "parking_site_type_id": 2,
                "capacity": 213
            }
        }, { "geometry": { "coordinates": [[[-80.1427638531, 25.909204191], [-80.141428113, 25.9097204892], [-80.1411223412, 25.9096336355], [-80.1405590773, 25.9083452974], [-80.1420986652, 25.9077807403], [-80.1427638531, 25.909204191]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "4-West of AC-2", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.1416685973163, 25.908789165880037], "parking_site_id": 3, "parking_site_type_id": 2, "capacity": 765 } }, { "geometry": { "coordinates": [[[-80.3704994917, 25.7587640653], [-80.3707194328, 25.758773728], [-80.3707194328, 25.7583195788], [-80.370644331, 25.7580925036], [-80.3706014156, 25.7579523931], [-80.3707301617, 25.7579330675], [-80.3706872463, 25.7575610492], [-80.3702741861, 25.7575658806], [-80.3702688217, 25.7578895849], [-80.3699040413, 25.7581359861], [-80.3701347113, 25.7585080026], [-80.3705585003, 25.7583630613], [-80.3704994917, 25.7587640653]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Apartments", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.37029668826794, 25.75816847823505], "parking_site_id": 4, "parking_site_type_id": 2, "capacity": 381 } }, { "geometry": { "coordinates": [[[-80.37863, 25.758], [-80.37786, 25.75846], [-80.37751, 25.75854], [-80.37759, 25.75761], [-80.37818, 25.75763], [-80.37863, 25.758]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Arena Loading Area", "is_active": false, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.37798194036439, 25.757981326600373], "parking_site_id": 5, "parking_site_type_id": 2, "capacity": 21 } }, { "geometry": { "coordinates": [[[-80.3711003065, 25.7570440868], [-80.3718996048, 25.757024761], [-80.3719210625, 25.7573484668], [-80.3717333078, 25.7573629611], [-80.3717333078, 25.7573098154], [-80.3710788488, 25.7573098154], [-80.3711003065, 25.7570440868]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Between Lot 32 & 33 ", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.37149601623665, 25.757220463180815], "parking_site_id": 6, "parking_site_type_id": 2, "capacity": 80 } }, { "geometry": { "coordinates": [[[-80.3718298674, 25.7553385778], [-80.3718352318, 25.7554497024], [-80.3714221716, 25.7559328514], [-80.3708052635, 25.7561454364], [-80.3702580929, 25.7559231885], [-80.3700649738, 25.7557299291], [-80.3699630499, 25.7554593654], [-80.3699737787, 25.7552419477], [-80.3702688217, 25.7546138499], [-80.3704726696, 25.7545268823], [-80.3707355261, 25.7545268823], [-80.3718298674, 25.7553385778]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Bookstore/GC", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.37060050115541, 25.755198409214884], "parking_site_id": 7, "parking_site_type_id": 2, "capacity": 340 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Central Utilities", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 8, "parking_site_type_id": 2, "capacity": 29 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Central Utilities", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 9, "parking_site_type_id": 2, "capacity": 0 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Cover Area", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 10, "parking_site_type_id": 2, "capacity": 138 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "CSC Compound", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 11, "parking_site_type_id": 2, "capacity": 78 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "CSC Staff Lot", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 12, "parking_site_type_id": 2, "capacity": 184 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "E & W side FIU Stad.", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 13, "parking_site_type_id": 2, "capacity": 19 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "E. Aquatic Cntr", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 14, "parking_site_type_id": 2, "capacity": 0 } }, { "geometry": { "coordinates": [[[-80.1432305574, 25.912586627], [-80.1427692175, 25.9127217294], [-80.1426780224, 25.9123936233], [-80.1431339979, 25.9122971213], [-80.1432305574, 25.912586627]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "E. of Central Rec.", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.14292387113528, 25.912465944853096], "parking_site_id": 15, "parking_site_type_id": 2, "capacity": 62 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "East of  W-5 & W-6", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 16, "parking_site_type_id": 2, "capacity": 83 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "East of Building", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 17, "parking_site_type_id": 2, "capacity": 175 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "East of lot 2", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 18, "parking_site_type_id": 2, "capacity": 199 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "East of OU", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 19, "parking_site_type_id": 2, "capacity": 10 } }, { "geometry": { "coordinates": [[[-80.3719854355, 25.7531933704], [-80.3720390797, 25.7531112333], [-80.3720068932, 25.752434808], [-80.3691208363, 25.7525845882], [-80.3691798449, 25.7529904433], [-80.3692817688, 25.7530097697], [-80.3693944216, 25.7530532541], [-80.3707462549, 25.7529904433], [-80.3707623482, 25.7530580857], [-80.3712397814, 25.7531402229], [-80.3715187311, 25.7531015701], [-80.3717386723, 25.7531402229], [-80.3719854355, 25.7531933704]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "East of PAC", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.37118967265997, 25.752743921660283], "parking_site_id": 20, "parking_site_type_id": 2, "capacity": 535 } }, { "geometry": { "coordinates": [[[-80.3716742992, 25.7533238233], [-80.3716742992, 25.7534591076], [-80.3714811802, 25.753604055], [-80.3711700439, 25.7542031688], [-80.3705263138, 25.7541451902], [-80.3704082966, 25.7539809173], [-80.3709447384, 25.7534591076], [-80.3713846207, 25.7532755074], [-80.3716742992, 25.7533238233]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "East of PG-2", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.3708958085, 25.753939665477887], "parking_site_id": 21, "parking_site_type_id": 2, "capacity": 202 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "East of W-10", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 22, "parking_site_type_id": 2, "capacity": 62 } }, { "geometry": { "coordinates": [[[-80.3814375401, 25.7532271915], [-80.3814697266, 25.7535267498], [-80.3812122345, 25.7535557392], [-80.3810191154, 25.7532851706], [-80.3809225559, 25.7532658442], [-80.3807401657, 25.7533238233], [-80.3798389435, 25.7529372957], [-80.379152298, 25.7529372957], [-80.379152298, 25.7525797566], [-80.381244421, 25.7525990831], [-80.381244421, 25.7529276325], [-80.3809332848, 25.7530049381], [-80.3814375401, 25.7532271915]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "East of W-2", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.38043792934332, 25.752801900969246], "parking_site_id": 23, "parking_site_type_id": 2, "capacity": 378 } }, { "geometry": { "coordinates": [[[-80.3718298674, 25.7569619523], [-80.3712880611, 25.7569716152], [-80.3712773323, 25.7565561108], [-80.3718405962, 25.7565657737], [-80.3718298674, 25.7569619523]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "GC Space-by-Space", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.37155896425, 25.756763863000003], "parking_site_id": 24, "parking_site_type_id": 2, "capacity": 69 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Greek Housing", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 25, "parking_site_type_id": 2, "capacity": 7 } }, { "geometry": { "coordinates": [[[-80.1418840885, 25.9127699802], [-80.1416105032, 25.9132524874], [-80.1407200098, 25.9139424692], [-80.1410257816, 25.9131752864], [-80.1413422823, 25.9133152132], [-80.141428113, 25.9131608112], [-80.1410847902, 25.9129967588], [-80.1413208246, 25.9125190757], [-80.1418840885, 25.9127699802]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Housing Lot", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.14146474943118, 25.912900202517406], "parking_site_id": 26, "parking_site_type_id": 2, "capacity": 0 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Loading Area AC-2", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 27, "parking_site_type_id": 2, "capacity": 1 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Loading Area GC", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 28, "parking_site_type_id": 2, "capacity": 3 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Loading Area PAC", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 29, "parking_site_type_id": 2, "capacity": 4 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Loading Area PC", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 30, "parking_site_type_id": 2, "capacity": 13 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "North of OE", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 31, "parking_site_type_id": 2, "capacity": 9 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "North of W-7", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 32, "parking_site_type_id": 2, "capacity": 2 } }, { "geometry": { "coordinates": [[[-80.3766202927, 25.7553434093], [-80.3761696815, 25.7553917244], [-80.3757512569, 25.7553144203], [-80.3757727146, 25.7549955405], [-80.3759121895, 25.7549472253], [-80.3765773773, 25.7549568884], [-80.3766524792, 25.7550535187], [-80.3766202927, 25.7553434093]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "North Univ Towers", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.37620799881428, 25.755143246699998], "parking_site_id": 33, "parking_site_type_id": 2, "capacity": 95 } }, { "geometry": { "coordinates": [[[-80.3773766756, 25.7548650894], [-80.3771674633, 25.7548602579], [-80.3771567345, 25.753918107], [-80.3773981333, 25.7539567595], [-80.3773766756, 25.7548650894]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "PARKVIEW PARK. GARAGE", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.377274751675, 25.75440005345], "parking_site_id": 34, "parking_site_type_id": 2, "capacity": 292 } }, { "geometry": { "coordinates": [[[-80.3725165129, 25.7551791381], [-80.3716474771, 25.7551646435], [-80.3716206551, 25.7551259914], [-80.3716099262, 25.7545848607], [-80.3716957569, 25.7545172192], [-80.372505784, 25.7545123877], [-80.3725326061, 25.7545558715], [-80.3725165129, 25.7551791381]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "PG-1 GOLD", "is_active": true, "total_level": 5, "parking_site_type_name": "parking garage", "centroid": [-80.37206961885235, 25.754698099079377], "parking_site_id": 35, "parking_site_type_id": 1, "capacity": 1002 } }, { "geometry": { "coordinates": [[[-80.3725272417, 25.7541451902], [-80.3724628687, 25.7542031688], [-80.3716742992, 25.7541935057], [-80.3716367483, 25.7541403586], [-80.3716260195, 25.7535847287], [-80.3717011213, 25.7535460761], [-80.3724682331, 25.7535460761], [-80.3725326061, 25.7535895603], [-80.3725272417, 25.7541451902]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "PG-2 BLUE", "is_active": true, "total_level": 5, "parking_site_type_name": "parking garage", "centroid": [-80.37207035169558, 25.753739284108903], "parking_site_id": 36, "parking_site_type_id": 1, "capacity": 1002 } }, { "geometry": { "coordinates": [[[-80.3803217411, 25.758097335], [-80.3803217411, 25.7587833907], [-80.3793668747, 25.7587833907], [-80.3793668747, 25.758097335], [-80.3803217411, 25.758097335]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "PG-3 PANTHER", "is_active": true, "total_level": 6, "parking_site_type_name": "parking garage", "centroid": [-80.3798443079, 25.75844036285], "parking_site_id": 37, "parking_site_type_id": 1, "capacity": 1441 } }, { "geometry": { "coordinates": [[[-80.3736591339, 25.7604888502], [-80.3726345301, 25.760503344], [-80.3726291656, 25.7598172982], [-80.3736644983, 25.7598172982], [-80.3736591339, 25.7604888502]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "PG-4 RED", "is_active": true, "total_level": 6, "parking_site_type_name": "parking garage", "centroid": [-80.373146831975, 25.760156697650004], "parking_site_id": 38, "parking_site_type_id": 1, "capacity": 1438 } }, { "geometry": { "coordinates": [[[-80.3721570969, 25.7605709822], [-80.3710520267, 25.7605613196], [-80.3710520267, 25.7597303344], [-80.3721785545, 25.759768985], [-80.3721570969, 25.7605709822]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "PG-5 MARKET STATION", "is_active": true, "total_level": 7, "parking_site_type_name": "parking garage", "centroid": [-80.37156609640077, 25.760145772810404], "parking_site_id": 39, "parking_site_type_id": 1, "capacity": 1950 } }, { "geometry": { "coordinates": [[[-80.375225544, 25.7603197547], [-80.3744637966, 25.7605419944], [-80.3737342358, 25.7605130066], [-80.3737664223, 25.7597786477], [-80.374506712, 25.759768985], [-80.3749787807, 25.7595853945], [-80.375225544, 25.7603197547]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "PG-6 TECH STATION", "is_active": true, "total_level": 7, "parking_site_type_name": "parking garage", "centroid": [-80.37449506864503, 25.760107122331206], "parking_site_id": 40, "parking_site_type_id": 1, "capacity": 1950 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "President House", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 41, "parking_site_type_id": 2, "capacity": 56 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Pub. Safety", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 42, "parking_site_type_id": 2, "capacity": 19 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Royal Caribbean", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 43, "parking_site_type_id": 2, "capacity": 28 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "So. Phys. Plant", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 44, "parking_site_type_id": 2, "capacity": 0 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "South Koven", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 45, "parking_site_type_id": 2, "capacity": 0 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "South of AHC1", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 46, "parking_site_type_id": 2, "capacity": 8 } }, { "geometry": { "coordinates": [[[-80.3817272186, 25.7565995939], [-80.3817486763, 25.7571310526], [-80.3814804554, 25.7572759954], [-80.3812658787, 25.7575755434], [-80.381115675, 25.7577977883], [-80.3802573681, 25.7578267767], [-80.3802466393, 25.7576238576], [-80.3807294369, 25.7575368921], [-80.3812122345, 25.7566962229], [-80.3817272186, 25.7565995939]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "South of PG-3", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.38138354882211, 25.75705380892481], "parking_site_id": 47, "parking_site_type_id": 2, "capacity": 221 } }, { "geometry": { "coordinates": [[[-80.3783476353, 25.7554690284], [-80.3779399395, 25.7557879069], [-80.3776931763, 25.755749255], [-80.3773713112, 25.7558265588], [-80.3770601749, 25.7558941996], [-80.3768134117, 25.7556043103], [-80.3774678707, 25.7552467792], [-80.3778862953, 25.7552564422], [-80.3783476353, 25.7554690284]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "South of REC", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.3775724768625, 25.75560431005], "parking_site_id": 48, "parking_site_type_id": 2, "capacity": 194 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "South of W-9", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 49, "parking_site_type_id": 2, "capacity": 41 } }, { "geometry": { "coordinates": [[[-80.3766900301, 25.7530919069], [-80.3764486313, 25.7530339277], [-80.3737664223, 25.7530580857], [-80.3735303879, 25.7531112333], [-80.3734070063, 25.7531547176], [-80.3734284639, 25.7528454952], [-80.3739005327, 25.7528599901], [-80.373916626, 25.7526570625], [-80.3766953945, 25.7526087463], [-80.3766900301, 25.7530919069]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Student Housing", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.37524517269048, 25.75284055382616], "parking_site_id": 50, "parking_site_type_id": 2, "capacity": 386 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Tower", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 51, "parking_site_type_id": 2, "capacity": 27 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "W-2 Compound", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 52, "parking_site_type_id": 2, "capacity": 37 } }, { "geometry": { "coordinates": [[[-80.141953826, 25.9116457308], [-80.1411706209, 25.9115251026], [-80.1410901546, 25.9115299277], [-80.140414238, 25.9118049599], [-80.1401245594, 25.9112162937], [-80.1401352882, 25.9109026589], [-80.1402908564, 25.9106951769], [-80.1405698061, 25.9105890232], [-80.1408004761, 25.9105697225], [-80.1412135363, 25.9106421], [-80.1421952248, 25.9108351066], [-80.141953826, 25.9116457308]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "W. of Library", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.14111069784121, 25.91113421137821], "parking_site_id": 53, "parking_site_type_id": 2, "capacity": 245 } }, { "geometry": { "coordinates": [[[-80.1423829794, 25.9106614007], [-80.1405966282, 25.9103188133], [-80.1405322552, 25.9101209807], [-80.1411491632, 25.9097108388], [-80.1426780224, 25.9100244768], [-80.1427799463, 25.9101595822], [-80.1423829794, 25.9106614007]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "West of AC-1", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.14163641080812, 25.910169177724313], "parking_site_id": 54, "parking_site_type_id": 2, "capacity": 422 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "West of ESC", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 55, "parking_site_type_id": 2, "capacity": 22 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "West of Green Lib", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 56, "parking_site_type_id": 2, "capacity": 17 } }, { "geometry": { "coordinates": [[[-80.140709281, 25.9074236686], [-80.140017271, 25.9076552828], [-80.1394969225, 25.9065020327], [-80.1401942968, 25.9062607655], [-80.140709281, 25.9074236686]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "West of Koven", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.140104442825, 25.906960437400002], "parking_site_id": 57, "parking_site_type_id": 2, "capacity": 230 } }, { "geometry": { "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "West of OU", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "parking_site_id": 58, "parking_site_type_id": 2, "capacity": 39 } }, { "geometry": { "coordinates": [[[-80.37863, 25.758], [-80.37894, 25.75845], [-80.37882, 25.75897], [-80.37844, 25.75926], [-80.37791, 25.75936], [-80.3772, 25.75922], [-80.3772, 25.75863], [-80.37751, 25.75853], [-80.37759, 25.75762], [-80.37819, 25.75763], [-80.37863, 25.758]]], "type": "Polygon" }, "type": "Feature", "properties": { "identifier": "Parking lot 9", "is_active": true, "total_level": 1, "parking_site_type_name": "parking lot", "centroid": [-80.3780798738504, 25.758525722639646], "parking_site_id": 59, "parking_site_type_id": 2, "capacity": 589 } }], "type": "FeatureCollection"
};

class DirectionsTest extends React.Component {
    constructor(props) {
        super(props);
        this.JSONInputId = "directionsJSONInput";
        this.crudClient = tf.services.CRUDClient({ tableName: 'addresses', serverURL: CRUDAPI, authForm: gtfsLogin.getAuthForm() });
        this.state = { data: [] };
        gtfsAddresses = this;
    };
    importITPAGarages() {
        /*
        {
            pkey:,
            id:,
            type_id:,
            identifier:,
            polygon:,
            number_of_levels:,
            centroid:,
            capacity: 0,
            is_active: 1
        }
        */
        /*
        [{
            "pkey":1,
            "id":1,
            "type_id":2,
            "identifier":"107 Ave Entrance",
            "number_of_levels":1,
            "is_active":true
        },{
            "pkey":2,
            "id":2,
            "type_id":2,
            "identifier":"3-West of AC-2",
            "polygon":[[[-80.1433002949,25.9098604201],[-80.1428067684,25.9101016799],[-80.1427263021,25.9099858753],[-80.1417553425,25.9097832169],[-80.1429569721,25.9092234919],[-80.1433002949,25.9098604201]]],
            "number_of_levels":1,
            "centroid":[-80.14270929441406,25.909667357103686],
            "is_active":true
            },
            {"pkey":3,"id":3,"type_id":2,"identifier":"4-West of AC-2","polygon":[[[-80.1427638531,25.909204191],[-80.141428113,25.9097204892],[-80.1411223412,25.9096336355],[-80.1405590773,25.9083452974],[-80.1420986652,25.9077807403],[-80.1427638531,25.909204191]]],"number_of_levels":1,"centroid":[-80.1416685973163,25.908789165880037],"is_active":true},{"pkey":4,"id":4,"type_id":2,"identifier":"Apartments","polygon":[[[-80.3704994917,25.7587640653],[-80.3707194328,25.758773728],[-80.3707194328,25.7583195788],[-80.370644331,25.7580925036],[-80.3706014156,25.7579523931],[-80.3707301617,25.7579330675],[-80.3706872463,25.7575610492],[-80.3702741861,25.7575658806],[-80.3702688217,25.7578895849],[-80.3699040413,25.7581359861],[-80.3701347113,25.7585080026],[-80.3705585003,25.7583630613],[-80.3704994917,25.7587640653]]],"number_of_levels":1,"centroid":[-80.37029668826794,25.75816847823505],"is_active":true},{"pkey":5,"id":5,"type_id":2,"identifier":"Arena Loading Area","polygon":[[[-80.37863,25.758],[-80.37786,25.75846],[-80.37751,25.75854],[-80.37759,25.75761],[-80.37818,25.75763],[-80.37863,25.758]]],"number_of_levels":1,"centroid":[-80.37798194036439,25.757981326600373],"is_active":false},{"pkey":6,"id":6,"type_id":2,"identifier":"Between Lot 32 & 33 ","polygon":[[[-80.3711003065,25.7570440868],[-80.3718996048,25.757024761],[-80.3719210625,25.7573484668],[-80.3717333078,25.7573629611],[-80.3717333078,25.7573098154],[-80.3710788488,25.7573098154],[-80.3711003065,25.7570440868]]],"number_of_levels":1,"centroid":[-80.37149601623665,25.757220463180815],"is_active":true},{"pkey":7,"id":7,"type_id":2,"identifier":"Bookstore/GC","polygon":[[[-80.3718298674,25.7553385778],[-80.3718352318,25.7554497024],[-80.3714221716,25.7559328514],[-80.3708052635,25.7561454364],[-80.3702580929,25.7559231885],[-80.3700649738,25.7557299291],[-80.3699630499,25.7554593654],[-80.3699737787,25.7552419477],[-80.3702688217,25.7546138499],[-80.3704726696,25.7545268823],[-80.3707355261,25.7545268823],[-80.3718298674,25.7553385778]]],"number_of_levels":1,"centroid":[-80.37060050115541,25.755198409214884],"is_active":true},{"pkey":8,"id":8,"type_id":2,"identifier":"Central Utilities","number_of_levels":1,"is_active":true},{"pkey":9,"id":9,"type_id":2,"identifier":"Central Utilities","number_of_levels":1,"is_active":true},{"pkey":10,"id":10,"type_id":2,"identifier":"Cover Area","number_of_levels":1,"is_active":true},{"pkey":11,"id":11,"type_id":2,"identifier":"CSC Compound","number_of_levels":1,"is_active":true},{"pkey":12,"id":12,"type_id":2,"identifier":"CSC Staff Lot","number_of_levels":1,"is_active":true},{"pkey":13,"id":13,"type_id":2,"identifier":"E & W side FIU Stad.","number_of_levels":1,"is_active":true},{"pkey":14,"id":14,"type_id":2,"identifier":"E. Aquatic Cntr","number_of_levels":1,"is_active":true},{"pkey":15,"id":15,"type_id":2,"identifier":"E. of Central Rec.","polygon":[[[-80.1432305574,25.912586627],[-80.1427692175,25.9127217294],[-80.1426780224,25.9123936233],[-80.1431339979,25.9122971213],[-80.1432305574,25.912586627]]],"number_of_levels":1,"centroid":[-80.14292387113528,25.912465944853096],"is_active":true},{"pkey":16,"id":16,"type_id":2,"identifier":"East of  W-5 & W-6","number_of_levels":1,"is_active":true},{"pkey":17,"id":17,"type_id":2,"identifier":"East of Building","number_of_levels":1,"is_active":true},{"pkey":18,"id":18,"type_id":2,"identifier":"East of lot 2","number_of_levels":1,"is_active":true},{"pkey":19,"id":19,"type_id":2,"identifier":"East of OU","number_of_levels":1,"is_active":true},{"pkey":20,"id":20,"type_id":2,"identifier":"East of PAC","polygon":[[[-80.3719854355,25.7531933704],[-80.3720390797,25.7531112333],[-80.3720068932,25.752434808],[-80.3691208363,25.7525845882],[-80.3691798449,25.7529904433],[-80.3692817688,25.7530097697],[-80.3693944216,25.7530532541],[-80.3707462549,25.7529904433],[-80.3707623482,25.7530580857],[-80.3712397814,25.7531402229],[-80.3715187311,25.7531015701],[-80.3717386723,25.7531402229],[-80.3719854355,25.7531933704]]],"number_of_levels":1,"centroid":[-80.37118967265997,25.752743921660283],"is_active":true},{"pkey":21,"id":21,"type_id":2,"identifier":"East of PG-2","polygon":[[[-80.3716742992,25.7533238233],[-80.3716742992,25.7534591076],[-80.3714811802,25.753604055],[-80.3711700439,25.7542031688],[-80.3705263138,25.7541451902],[-80.3704082966,25.7539809173],[-80.3709447384,25.7534591076],[-80.3713846207,25.7532755074],[-80.3716742992,25.7533238233]]],"number_of_levels":1,"centroid":[-80.3708958085,25.753939665477887],"is_active":true},{"pkey":22,"id":22,"type_id":2,"identifier":"East of W-10","number_of_levels":1,"is_active":true},{"pkey":23,"id":23,"type_id":2,"identifier":"East of W-2","polygon":[[[-80.3814375401,25.7532271915],[-80.3814697266,25.7535267498],[-80.3812122345,25.7535557392],[-80.3810191154,25.7532851706],[-80.3809225559,25.7532658442],[-80.3807401657,25.7533238233],[-80.3798389435,25.7529372957],[-80.379152298,25.7529372957],[-80.379152298,25.7525797566],[-80.381244421,25.7525990831],[-80.381244421,25.7529276325],[-80.3809332848,25.7530049381],[-80.3814375401,25.7532271915]]],"number_of_levels":1,"centroid":[-80.38043792934332,25.752801900969246],"is_active":true},{"pkey":24,"id":24,"type_id":2,"identifier":"GC Space-by-Space","polygon":[[[-80.3718298674,25.7569619523],[-80.3712880611,25.7569716152],[-80.3712773323,25.7565561108],[-80.3718405962,25.7565657737],[-80.3718298674,25.7569619523]]],"number_of_levels":1,"centroid":[-80.37155896425,25.756763863000003],"is_active":true},{"pkey":25,"id":25,"type_id":2,"identifier":"Greek Housing","number_of_levels":1,"is_active":true},{"pkey":26,"id":26,"type_id":2,"identifier":"Housing Lot","polygon":[[[-80.1418840885,25.9127699802],[-80.1416105032,25.9132524874],[-80.1407200098,25.9139424692],[-80.1410257816,25.9131752864],[-80.1413422823,25.9133152132],[-80.141428113,25.9131608112],[-80.1410847902,25.9129967588],[-80.1413208246,25.9125190757],[-80.1418840885,25.9127699802]]],"number_of_levels":1,"centroid":[-80.14146474943118,25.912900202517406],"is_active":true},{"pkey":27,"id":27,"type_id":2,"identifier":"Loading Area AC-2","number_of_levels":1,"is_active":true},{"pkey":28,"id":28,"type_id":2,"identifier":"Loading Area GC","number_of_levels":1,"is_active":true},{"pkey":29,"id":29,"type_id":2,"identifier":"Loading Area PAC","number_of_levels":1,"is_active":true},{"pkey":30,"id":30,"type_id":2,"identifier":"Loading Area PC","number_of_levels":1,"is_active":true},{"pkey":31,"id":31,"type_id":2,"identifier":"North of OE","number_of_levels":1,"is_active":true},{"pkey":32,"id":32,"type_id":2,"identifier":"North of W-7","number_of_levels":1,"is_active":true},{"pkey":33,"id":33,"type_id":2,"identifier":"North Univ Towers","polygon":[[[-80.3766202927,25.7553434093],[-80.3761696815,25.7553917244],[-80.3757512569,25.7553144203],[-80.3757727146,25.7549955405],[-80.3759121895,25.7549472253],[-80.3765773773,25.7549568884],[-80.3766524792,25.7550535187],[-80.3766202927,25.7553434093]]],"number_of_levels":1,"centroid":[-80.37620799881428,25.755143246699998],"is_active":true},{"pkey":34,"id":34,"type_id":2,"identifier":"PARKVIEW PARK. GARAGE","polygon":[[[-80.3773766756,25.7548650894],[-80.3771674633,25.7548602579],[-80.3771567345,25.753918107],[-80.3773981333,25.7539567595],[-80.3773766756,25.7548650894]]],"number_of_levels":1,"centroid":[-80.377274751675,25.75440005345],"is_active":true},{"pkey":35,"id":35,"type_id":1,"identifier":"PG-1 GOLD","polygon":[[[-80.3725165129,25.7551791381],[-80.3716474771,25.7551646435],[-80.3716206551,25.7551259914],[-80.3716099262,25.7545848607],[-80.3716957569,25.7545172192],[-80.372505784,25.7545123877],[-80.3725326061,25.7545558715],[-80.3725165129,25.7551791381]]],"number_of_levels":5,"centroid":[-80.37206961885235,25.754698099079377],"is_active":true},{"pkey":36,"id":36,"type_id":1,"identifier":"PG-2 BLUE","polygon":[[[-80.3725272417,25.7541451902],[-80.3724628687,25.7542031688],[-80.3716742992,25.7541935057],[-80.3716367483,25.7541403586],[-80.3716260195,25.7535847287],[-80.3717011213,25.7535460761],[-80.3724682331,25.7535460761],[-80.3725326061,25.7535895603],[-80.3725272417,25.7541451902]]],"number_of_levels":5,"centroid":[-80.37207035169558,25.753739284108903],"is_active":true},{"pkey":37,"id":37,"type_id":1,"identifier":"PG-3 PANTHER","polygon":[[[-80.3803217411,25.758097335],[-80.3803217411,25.7587833907],[-80.3793668747,25.7587833907],[-80.3793668747,25.758097335],[-80.3803217411,25.758097335]]],"number_of_levels":6,"centroid":[-80.3798443079,25.75844036285],"is_active":true},{"pkey":38,"id":38,"type_id":1,"identifier":"PG-4 RED","polygon":[[[-80.3736591339,25.7604888502],[-80.3726345301,25.760503344],[-80.3726291656,25.7598172982],[-80.3736644983,25.7598172982],[-80.3736591339,25.7604888502]]],"number_of_levels":6,"centroid":[-80.373146831975,25.760156697650004],"is_active":true},{"pkey":39,"id":39,"type_id":1,"identifier":"PG-5 MARKET STATION","polygon":[[[-80.3721570969,25.7605709822],[-80.3710520267,25.7605613196],[-80.3710520267,25.7597303344],[-80.3721785545,25.759768985],[-80.3721570969,25.7605709822]]],"number_of_levels":7,"centroid":[-80.37156609640077,25.760145772810404],"is_active":true},{"pkey":40,"id":40,"type_id":1,"identifier":"PG-6 TECH STATION","polygon":[[[-80.375225544,25.7603197547],[-80.3744637966,25.7605419944],[-80.3737342358,25.7605130066],[-80.3737664223,25.7597786477],[-80.374506712,25.759768985],[-80.3749787807,25.7595853945],[-80.375225544,25.7603197547]]],"number_of_levels":7,"centroid":[-80.37449506864503,25.760107122331206],"is_active":true},{"pkey":41,"id":41,"type_id":2,"identifier":"President House","number_of_levels":1,"is_active":true},{"pkey":42,"id":42,"type_id":2,"identifier":"Pub. Safety","number_of_levels":1,"is_active":true},{"pkey":43,"id":43,"type_id":2,"identifier":"Royal Caribbean","number_of_levels":1,"is_active":true},{"pkey":44,"id":44,"type_id":2,"identifier":"So. Phys. Plant","number_of_levels":1,"is_active":true},{"pkey":45,"id":45,"type_id":2,"identifier":"South Koven","number_of_levels":1,"is_active":true},{"pkey":46,"id":46,"type_id":2,"identifier":"South of AHC1","number_of_levels":1,"is_active":true},{"pkey":47,"id":47,"type_id":2,"identifier":"South of PG-3","polygon":[[[-80.3817272186,25.7565995939],[-80.3817486763,25.7571310526],[-80.3814804554,25.7572759954],[-80.3812658787,25.7575755434],[-80.381115675,25.7577977883],[-80.3802573681,25.7578267767],[-80.3802466393,25.7576238576],[-80.3807294369,25.7575368921],[-80.3812122345,25.7566962229],[-80.3817272186,25.7565995939]]],"number_of_levels":1,"centroid":[-80.38138354882211,25.75705380892481],"is_active":true},{"pkey":48,"id":48,"type_id":2,"identifier":"South of REC","polygon":[[[-80.3783476353,25.7554690284],[-80.3779399395,25.7557879069],[-80.3776931763,25.755749255],[-80.3773713112,25.7558265588],[-80.3770601749,25.7558941996],[-80.3768134117,25.7556043103],[-80.3774678707,25.7552467792],[-80.3778862953,25.7552564422],[-80.3783476353,25.7554690284]]],"number_of_levels":1,"centroid":[-80.3775724768625,25.75560431005],"is_active":true},{"pkey":49,"id":49,"type_id":2,"identifier":"South of W-9","number_of_levels":1,"is_active":true},{"pkey":50,"id":50,"type_id":2,"identifier":"Student Housing","polygon":[[[-80.3766900301,25.7530919069],[-80.3764486313,25.7530339277],[-80.3737664223,25.7530580857],[-80.3735303879,25.7531112333],[-80.3734070063,25.7531547176],[-80.3734284639,25.7528454952],[-80.3739005327,25.7528599901],[-80.373916626,25.7526570625],[-80.3766953945,25.7526087463],[-80.3766900301,25.7530919069]]],"number_of_levels":1,"centroid":[-80.37524517269048,25.75284055382616],"is_active":true},{"pkey":51,"id":51,"type_id":2,"identifier":"Tower","number_of_levels":1,"is_active":true},{"pkey":52,"id":52,"type_id":2,"identifier":"W-2 Compound","number_of_levels":1,"is_active":true},{"pkey":53,"id":53,"type_id":2,"identifier":"W. of Library","polygon":[[[-80.141953826,25.9116457308],[-80.1411706209,25.9115251026],[-80.1410901546,25.9115299277],[-80.140414238,25.9118049599],[-80.1401245594,25.9112162937],[-80.1401352882,25.9109026589],[-80.1402908564,25.9106951769],[-80.1405698061,25.9105890232],[-80.1408004761,25.9105697225],[-80.1412135363,25.9106421],[-80.1421952248,25.9108351066],[-80.141953826,25.9116457308]]],"number_of_levels":1,"centroid":[-80.14111069784121,25.91113421137821],"is_active":true},{"pkey":54,"id":54,"type_id":2,"identifier":"West of AC-1","polygon":[[[-80.1423829794,25.9106614007],[-80.1405966282,25.9103188133],[-80.1405322552,25.9101209807],[-80.1411491632,25.9097108388],[-80.1426780224,25.9100244768],[-80.1427799463,25.9101595822],[-80.1423829794,25.9106614007]]],"number_of_levels":1,"centroid":[-80.14163641080812,25.910169177724313],"is_active":true},{"pkey":55,"id":55,"type_id":2,"identifier":"West of ESC","number_of_levels":1,"is_active":true},{"pkey":56,"id":56,"type_id":2,"identifier":"West of Green Lib","number_of_levels":1,"is_active":true},{"pkey":57,"id":57,"type_id":2,"identifier":"West of Koven","polygon":[[[-80.140709281,25.9074236686],[-80.140017271,25.9076552828],[-80.1394969225,25.9065020327],[-80.1401942968,25.9062607655],[-80.140709281,25.9074236686]]],"number_of_levels":1,"centroid":[-80.140104442825,25.906960437400002],"is_active":true},{"pkey":58,"id":58,"type_id":2,"identifier":"West of OU","number_of_levels":1,"is_active":true},{"pkey":59,"id":59,"type_id":2,"identifier":"Parking lot 9","polygon":[[[-80.37863,25.758],[-80.37894,25.75845],[-80.37882,25.75897],[-80.37844,25.75926],[-80.37791,25.75936],[-80.3772,25.75922],[-80.3772,25.75863],[-80.37751,25.75853],[-80.37759,25.75762],[-80.37819,25.75763],[-80.37863,25.758]]],"number_of_levels":1,"centroid":[-80.3780798738504,25.758525722639646],"is_active":true}]
        */

        //let features = [];
        let gfeatures = gGarages.features, count = gfeatures.length;
        let allStr = "";
        for (let i = 0; i < count; ++i) {
            let gf = gfeatures[i], gfp = gf.properties, gfg = gf.geometry;
            let pkey = i + 1;
            let id = gfp.parking_site_id;
            let type_id = gfp.parking_site_type_id;
            let identifier = gfp.identifier;
            let polygon = gfg.coordinates;
            let number_of_levels = gfp.total_level;
            let centroid = gfp.centroid;
            let capacity = gfp.capacity;
            let is_active = gfp.is_active ? '1' : '0';

            //let f = { pkey: pkey, id: id, type_id: type_id, identifier: identifier, polygon: polygon, number_of_levels: number_of_levels, centroid: centroid, capacity: capacity, is_active: is_active }
            //features.push(f);

            let fcentroid = centroid ? "POINT(" + centroid[0] + " " + centroid[1] + ")" : 'null';
            let fpolygon = null;

            if (polygon) {
                fpolygon = "POLYGON(";
                let np = polygon.length;
                for (let j = 0; j < np; ++j) {
                    let subp = polygon[j];
                    let nsubp = subp.length;
                    if (nsubp > 0) {
                        fpolygon += "("
                        for (let k = 0; k < nsubp; ++k) {
                            let thisp = subp[k];
                            let thisps = thisp[0] + " " + thisp[1];
                            if (k < nsubp - 1) { thisps += ","; }
                            fpolygon += thisps;
                        }
                        fpolygon += ")"
                        if (j < np - 1) { fpolygon += ","; }
                    }
                }
                fpolygon += ")"
            }

            let str = "(";
            str += pkey + ',' + id + ',' + type_id + ',\'' + identifier + '\',GeomFromText("' + fpolygon + '"),' + number_of_levels +
                ',GeomFromText("' + fcentroid + '"),' + capacity + ',' + is_active;
            str += ")";
            if (i < count - 1) {
                str += ",";
            }
            allStr += str;
        }
        allStr += ";"
        console.log(allStr);
        //console.log(JSON.stringify(features));
    };
    componentDidMount() {
        //this.importITPAGarages();
        this.refresh();
    };
    setStateData(data) { this.state.data = data; this.refreshSetState(); };
    refreshSetState() { this.setState(Object.assign({}, this.state)); };
    handleUpdate() { this.refreshSetState(); };
    addAddress(value) {
        const record = { address: value };
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
    handleRemove(id) {
        const remainder = this.state.data.filter((item) => { if (item.id !== id) { return item; } });
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
    setAddress(theAddress, isFrom) {
        let mapApp = getGlobalMapApp();
        if (mapApp) { mapApp.GetContent().SetDirectionsAddress(theAddress, isFrom); }
    };
    setFromAddress(item) { this.setAddress(item.address, true); };
    setToAddress(item) { this.setAddress(item.address, false); };
    dump() {
        document.getElementById(this.JSONInputId).value = JSON.stringify(this.state.data);
    };
    updateFromJSON(value) {
        if (tf.js.GetIsNonEmptyString(value)) {
            try {
                value = JSON.parse(value);
                if (tf.js.GetIsNonEmptyArray(value)) {
                    this.crudClient.Put(notification => {
                        if (!(notification && notification.ok)) {
                            console.log(notification.message);
                        }
                        this.refresh();
                    }, value);
                }
            }
            catch (e) { console.log(e.message); }
        }
    };
    //updateEmail(newEmail) { };
    //updatePassword(newPassword) { };
    render() {
/*
                 <SingleLineInputForm
                    inputId="emailInput"
                    inputLabel="Email address"
                    sendSubmitValue={this.updateEmail.bind(this)}
                />
                <SingleLineInputForm
                    inputId="passwordInput"
                    inputLabel="Password"
                    sendSubmitValue={this.updatePassword.bind(this)}
                    inputType="password"
                />
*/
        return (
            <div>
                <Title title="Addresses" count={this.state.data.length} />
                <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                <BarButton value="Dump" title="Dump List JSON into editor" onClick={this.dump.bind(this)} />
                <p></p>
                <SingleLineInputForm
                    inputId={this.JSONInputId}
                    inputLabel="Type or paste JSON and press enter to replace list"
                    sendSubmitValue={this.updateFromJSON.bind(this)}
                />
                <SingleLineInputForm
                    inputId="newAddress"
                    inputLabel="Type a new address and press enter to add it"
                    sendSubmitValue={this.addAddress.bind(this)}
                />
                <DirectionsList
                    data={this.state.data}
                    remove={this.handleRemove.bind(this)}
                    change={this.handleChange.bind(this)}
                    update={this.handleUpdate.bind(this)}
                    setFromAddress={this.setFromAddress.bind(this)}
                    setToAddress={this.setToAddress.bind(this)}
                />
            </div>
        );
    };
};

/*
[{"id":"1","address":"11200 SW 8 St, Miami, FL 33199"},{"id":"2","address":"900 S Miami Ave, Miami FL 33130"},{"id":"3","address":"450 Bird Rd, Coral Gables, FL 33146"},{"id":"4","address":"Dolphin Mall, Sweetwater FL"},{"id":"5","address":"8635 NW 8 St, Miami, FL 33126"},{"id":"6","address":"5701 SW 72 St, Miami, Florida 33143"},{"id":"7","address":"7707 Camino Real, Miami FL 33143"},{"id":"8","address":"11401 NW 12th St, Miami, FL 33172"},{"id":"9","address":"3443 Segovia St, Coral Gables, FL 33134"},{"id":"10","address":"Dadeland Mall, Miami FL"},{"id":"11","address":"Dolphin Mall, Miami FL"},{"id":"12","address":"Government Center, Miami FL"},{"id":"13","address":"1455 NW 107th Ave, Doral, FL 33172"},{"id":"14","address":"Miami Dade College, Kendal Campus, 11011 SW 104 St, Miami, FL 33176"},{"id":"15","address":"1595 SW 112th Ave, Miami, FL 33174"},{"id":"16","address":"1601 SW 107 Ave, Miami, Florida 33165"},{"id":"17","address":"11040 SW 14th St, Miami, FL 33165"},{"id":"18","address":"2100 NW 42nd Ave, Miami, FL 33126"},{"id":"19","address":"8900 N Kendall Dr, Miami, FL 33176"},{"id":"20","address":"1611 NW 12th Ave, Miami, FL 33136"},{"id":"21","address":"11750 SW 40th St, Miami, FL 33175"},{"id":"23","address":"Miami International Airport"},{"id":"24","address":"512 SW 109th Ave, Miami FL 33174"},{"id":"25","address":"11401 W Flagler St, Miami, FL 33174"},{"id":"26","address":"1201 NW 16th St, Miami, FL 33125"},{"id":"27","address":"E Campus Cir, Miami FL 33174"},{"id":"28","address":"FIU Maidique Campus Bus Terminal, University Park, FL 33165"},{"id":"29","address":"7031 SW 62 AVE, South Miami, FL 33143"},{"id":"30","address":"Marlins Park, Miami, FL, 33125"},{"id":"31","address":"Dolphin Mall Bus Station, Sweetwater FL 33172"},{"id":"33","address":"1351 NW 12 ST, Miami FL 33125"},{"id":"34","address":"Southland Mall, Miami FL"},{"id":"35","address":"FIU Maidique Campus Bus Terminal, University Park, FL 33165"},{"id":"36","address":"19330 SW 292nd St, Homestead, FL 33030"},{"id":"37","address":"3801 NW 21 St, Miami, FL 33142"},{"id":"38","address":"3797 NW 21 Street Miami, Florida 33142"},{"id":"39","address":"3737 NW 43 ST, Miami FL 33147"},{"id":"40","address":"73 W Flagler St, Miami, FL 33130"},{"id":"41","address":"1633 NW 12 St, Miami, FL 33125"}]
*/
