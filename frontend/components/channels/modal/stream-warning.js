import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics } from "additional";
import { appOperations } from "modules/app";
import { channelsOperations as operations } from "modules/channels";
import { routes } from "config";

import Modal from "components/modal";

class StreamWarning extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${routes.ChannelsFullPath}/stream-warning`, "Attention. Recurring payment");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Recurring Warning Modal", category: "Channels", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    openCloseChannelModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Recurring Warning Modal", category: "Channels", label: "Proceed" });
        dispatch(operations.openDeleteChannelModal());
    };

    render() {
        return (
            <Modal title="Attention!" onClose={this.closeModal} showCloseButton>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            You have <strong>active recurring payments</strong>. Channel closing may lead to errors.
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                type="button"
                                className="button button__link"
                                onClick={this.closeModal}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="button button__solid"
                                onClick={this.openCloseChannelModal}
                            >
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

StreamWarning.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect(null)(StreamWarning);
