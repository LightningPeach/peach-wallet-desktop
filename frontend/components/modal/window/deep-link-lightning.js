import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { appOperations, appActions } from "modules/app";
import { HomePath } from "routes";
import Modal from "components/modal";

class DeepLinkLightning extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${HomePath}/set-default-lighning-app`, "Set default lightning app");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Default App Modal", category: "Modal Windows", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    sendConfirmation = () => {
        const { dispatch } = this.props;
        window.ipcRenderer.send("setDefaultLightningApp");
        dispatch(appActions.setAppAsDefaultStatus(true));
        dispatch(appOperations.closeModal());
    };

    render() {
        return (
            <Modal title="Default lightning application" onClose={this.closeModal} showCloseButton>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            Would you like to use <b>Peach Wallet</b> as a default one for making
                            lightning payments?
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                className="button button__link text-uppercase"
                                type="button"
                                onClick={this.closeModal}
                            >
                                Cancel
                            </button>
                            <button
                                className="button button__solid"
                                type="button"
                                onClick={this.sendConfirmation}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

DeepLinkLightning.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(DeepLinkLightning);
