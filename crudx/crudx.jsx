"use strict";

const CRUDXMapFeatures = function (options) {
    let theThis = this; if (!(theThis instanceof CRUDXMapFeatures)) { return new CRUDXMapFeatures(options); }
    let map, layer;
    let mapFeatures, lastDragged;

    this.SetVisible = (bool) => { if (layer) { layer.SetVisible(bool); } return theThis.GetVisible() };
    this.GetVisible = () => { return layer ? layer.GetIsVisible() : true };

    this.PanTo = item => {
        if (item && tf.js.GetIsArrayWithMinLength(item.center, 2)) {
            map.AnimatedSetCenterIfDestVisible(item.center);
        }
    };

    const initialize = () => {
        let layerSettings = {
            name: "agencies", isVisible: true, isHidden: true,
            useClusters: false,
            /*clusterFeatureDistance: settings.clusterFeatureDistance,
            clusterStyle: settings.clusterStyle,
            clusterLabelStyle: settings.clusterLabelStyle,*/
            zIndex: 10
        };

        let mapApp = getGlobalMapApp();
        let content = mapApp.GetContent();
        map = content.GetMap();
        layer = content.CreateCustomMapLayer(layerSettings, false);
        //map.AddListener(tf.consts.mapFeatureClickEvent, onMapFeatureClick);
    };

    const tryInitialize = () => {
        if (getGlobalMapApp()) { initialize(); } else { setTimeout(() => { return tryInitialize(); }, 500); }
    };

    tryInitialize();
};

const Table = ({ item, remove, change, update, panTo, edit }) => {
    let marginPx = commonStyles.marginPx;
    return (
        <div className="gtfsListItem">

            <label title="Table name" htmlFor={item.name} style={{ margin: marginPx }}><small>table_name</small>
                <input style={{ margin: marginPx, width: '280px' }} value={item.name} className="" type="text" id={item.name}
                    onBlur={() => { if (item._needChange) { delete item._needChange; change(item); } }}
                    onChange={(event) => { if (item.name != event.target.value) { item._needChange = true; item.name = event.target.value; update(); } }} />
            </label>

            <input className="delButton" type="button" id="{item.id + 'delete'}" onClick={() => { remove(item) }} value="Del" title="Delete without confirmation!" />

        </div>
    );
};

const TablesList = ({ data, remove, change, update }) => {
    const items = data.map((item) => {
        return (<Table item={item} key={item.currentName}
            remove={remove}
            change={change}
            update={update}
        />);
    });
    return (<div style={{ maxHeight: "initial" }} className="gtfsList">{items}</div>);
};

class CRUDX extends React.Component {

    constructor(props) {
        super(props);
        this.emailInputId = "emailInputId";
        this.passwordInputId = "passwordInputId";
        this.newAgencyInputId = "newAgencyInputId";
        this.mapFeatures = CRUDXMapFeatures({ });
        this.state = { data: [] };
        this.crudClient = tf.services.CRUDClient({ tableName: undefined, serverURL: CRUDAPI, authForm: gtfsLogin.getAuthForm() });
        crudx = this;
    };
    onDrag = (notification) => {
        return;
    };
    componentDidMount() { this.refresh(); };
    setStateData(data) { this.state.data = data; this.refreshSetState(); };
    refreshSetState() {
        this.setState(Object.assign({}, this.state));
    };
    refresh() {
        this.crudClient.ListTables(
            notification => {
                let data = notification && notification.data && tf.js.GetIsNonEmptyArray(notification.data) ? notification.data : [];
                for (let i in data) {
                    let d = data[i];
                    d.currentName = d.name;
                }
                this.setStateData(data);
            }
        );
    };
    handleChange(item) {
        this.crudClient.RenameTable(
            notification => {
                this.refresh();
            }, item.currentName, item.name
        );
    };
    handleRemove(item) {
        this.crudClient.Del(
            notification => {
                this.refresh();
            }, undefined, undefined, item.name
        );
    };
    handleUpdate() {
        this.refreshSetState();
    };
    render() {
        return (
            <div>
                <Title title="CRUDX" count={this.state.data.length} />
                <BarButton value="Refresh" title="Refresh List" onClick={this.refresh.bind(this)} />
                <TablesList
                    data={this.state.data}
                    remove={this.handleRemove.bind(this)}
                    change={this.handleChange.bind(this)}
                    update={this.handleUpdate.bind(this)}
                />
            </div>
        );
    };
};
