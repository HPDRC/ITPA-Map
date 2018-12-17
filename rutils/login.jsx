"use strict";

class GTFSLogin extends React.Component {
    constructor(props) {
        super(props);
        let authForm = { email: "", password: "", apiversion: 5 };
        this.emailInputId = "emailInputId";
        this.passwordInputId = "passwordInputId";
        this.state = { authForm: authForm, canAdmin: false };
        gtfsLogin = this;
    };
    getAuthForm() { return this.state.authForm; };
    componentDidMount() {
    };
    refreshSetState() { this.setState(Object.assign({}, this.state)); };
    extractEmailPassword() {
        this.state.authForm.email = document.getElementById(this.emailInputId).value;
        this.state.authForm.password = document.getElementById(this.passwordInputId).value, true;

        this.state.authForm.email = "apiadmin@itpa.cs.fiu.edu";
        this.state.authForm.password = "ITPA4more";
        console.log('REMOVE ME BEFORE PUBLISHING!!!!');

        this.refreshSetState();
    };
    login() {
        try {
            //let url = "http://utma-api.cs.fiu.edu/api/v1/users/ca";
            let url = "http://utma-api2.cs.fiu.edu/api/v1/users/ca";
            this.extractEmailPassword();
            var payloadStr = JSON.stringify(this.state.authForm);
            new tf.ajax.JSONGet().Request(url, function (notification) {
                this.afterLogin(tf.js.GetIsValidObject(notification) && tf.js.GetIsValidObject(notification.data) && notification.data.status == true);
            }, this, undefined, false, undefined, undefined, payloadStr);
        }
        catch (e) {
            console.log(e);
            this.state.canAdmin = false; this.afterLogin();
        }
    };
    afterLogin(canAdminSet) {
        this.state.canAdmin = canAdminSet;
        this.refreshSetState();
        if (this.state.canAdmin) {
            if (this.props.afterLogin) { this.props.afterLogin.call({ sender: this }); }
        }
    };
    render() {
        return this.state.canAdmin ? (
            <div>
                <Title title="Login" />
                <label style={{ margin: commonStyles.marginPx }} ><small>email address</small>
                    <div style={{ display: 'inline-block', margin: commonStyles.marginPx, minWidth: '100px', fontSize: '110%' }} className="" >{this.state.authForm.email}</div>
                </label>
            </div>
            ) :
            (
            <div>
                <Title title="Login" />
                <EmailPasswordInputForm
                    emailId={this.emailInputId}
                    passwordId={this.passwordInputId}
                    sendSubmitValue={this.login.bind(this)}
                />
            </div>
        );
    };
};
