import React, { Component } from "react";
import Legal from "components/legal";

class Agreement extends Component {
    constructor(props) {
        super(props);

        this.state = {
            eula: false,
            ga: false,
        };
    }

    componentDidMount() {
        window.ipcRenderer.on("agreement-wrote", this.ipcSuccess);
        window.ipcRenderer.on("error", this.ipcError);
    }

    componentWillUnmount() {
        window.ipcRenderer.removeListener("agreement-wrote", this.ipcSuccess);
        window.ipcRenderer.removeListener("error", this.ipcError);
    }

    onChange = (e) => {
        this.setState({ [e.target.name]: e.target.checked });
    };

    ipcSuccess = () => {
        window.close();
    };

    ipcError = () => {
        console.error("this should not been occurred");
    };

    process = (e) => {
        e.preventDefault();
        window.ipcRenderer.send("agreement-checked", {
            eulaChecked: this.state.eula,
            gaChecked: this.state.ga,
        });
    };

    render() {
        return (
            <div id="agreement" className="container">
                <div className="row">
                    <div className="col-xs-12">
                        <div className="agreement__titles center-block">
                            <div className="agreement__title">
                                Privacy and policy
                            </div>
                            <div className="agreement__logo">
                                <img src="public/assets/images/logo-black.svg" alt="Lightning peach" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-12">
                        <Legal />
                    </div>
                </div>
                <form className="row agreement__form" onSubmit={this.process}>
                    <div className="col-xs-12">
                        <label className="form-checkbox label_line pull-left js-agreement">
                            <input id="eula-agreement-checkbox" name="eula" type="checkbox" onChange={this.onChange} />
                            <span className="form-checkbox__label">I accept the agreement</span>
                        </label>
                    </div>
                    <div className="col-xs-12">
                        <label className="form-checkbox label_line pull-left channels__custom">
                            <input id="ga-agreement-checkbox" name="ga" type="checkbox" onChange={this.onChange} />
                            <span className="form-checkbox__label">I agree to the personal data processing</span>
                        </label>
                    </div>
                    <div className="col-xs-12">
                        <button
                            type="submit"
                            disabled={!this.state.eula}
                            className="button button__link text-uppercase pull-right agreement__form-submit"
                        >
                            Next
                        </button>
                    </div>
                </form>
            </div>
        );
    }
}

export default Agreement;
