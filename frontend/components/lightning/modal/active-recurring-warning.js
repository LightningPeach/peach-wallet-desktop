import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { appOperations } from "modules/app";
import { streamPaymentOperations } from "modules/streamPayments";
import { LightningFullPath } from "routes";
import Modal from "components/modal";

class ActiveRecurringWarning extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${LightningFullPath}/active-recurring-warning`, "Attention. Active recurring payment");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Active Recurring Warning Modal", category: "Lightning", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    handlePause = () => {
        const { dispatch, currentStream } = this.props;
        analytics.event({ action: "Active Recurring Modal", category: "Lightning", label: "Pause stream" });
        dispatch(streamPaymentOperations.pauseStreamPayment(currentStream.streamId));
        dispatch(streamPaymentOperations.openEditStreamModal());
    };

    render() {
        return (
            <Modal title="Attention!" onClose={this.closeModal} showCloseButton>
                <div className="modal-body text-center text-16">
                    <div className="row">
                        <div className="col-xs-12">
                            Recurring payment must be paused before making any changes.
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
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
                                type="button"
                                className="button button__orange button__close"
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
