import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics } from "additional";
import { appOperations } from "modules/app";
import { streamPaymentOperations } from "modules/streamPayments";
import { routes } from "config";

import Modal from "components/modal";

class ActiveRecurringWarning extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(
            `${routes.LightningFullPath}/active-recurring-warning`,
            "Attention. Active recurring payment",
        );
    }

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Active Recurring Warning Modal", category: "Lightning", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    handlePause = () => {
        const { dispatch, currentStream } = this.props;
        analytics.event({ action: "Active Recurring Modal", category: "Lightning", label: "Pause stream" });
        dispatch(streamPaymentOperations.pauseStreamPayment(currentStream.id));
        dispatch(streamPaymentOperations.openEditStreamModal());
    };

    render() {
        return (
            <Modal title="Attention!" onClose={this.closeModal} showCloseButton>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            Recurring payment must be paused before making any changes.
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                className="button button__link"
                                type="button"
                                onClick={this.closeModal}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="button button__solid"
                                onClick={this.handlePause}
                            >
                                Pause
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

ActiveRecurringWarning.propTypes = {
    currentStream: PropTypes.shape(),
    dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    currentStream: state.streamPayment.currentStream,
});

export default connect(mapStateToProps)(ActiveRecurringWarning);
