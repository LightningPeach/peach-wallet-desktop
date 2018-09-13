import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { appOperations } from "modules/app";
import { streamPaymentOperations } from "modules/streamPayments";
import BtcToUsd from "components/common/btc-to-usd";
import BalanceWithMeasure from "components/common/balance-with-measure";
import { LightningFullPath } from "routes";
import Modal from "components/modal";
import Ellipsis from "components/common/ellipsis";

class StreamDetails extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${LightningFullPath}/stream/details`, "Lightning / Stream Payment / Details");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Stream Payment Modal", category: "Lightning", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    addToList = async () => {
        const { dispatch, onClose } = this.props;
        await dispatch(streamPaymentOperations.addStreamPaymentToList());
        dispatch(streamPaymentOperations.clearPrepareStreamPayment());
        if (onClose) {
            onClose();
        }
        analytics.event({ action: "Stream Payment Modal", category: "Lightning", label: "Pay" });
        dispatch(appOperations.closeModal());
    };

    render() {
        const { streamDetails } = this.props;
        if (!streamDetails) {
            return null;
        }
        const amount = (streamDetails.price * streamDetails.totalParts)
            + (streamDetails.totalParts * streamDetails.fee.max);
        return (
            <Modal title="Check your data" onClose={this.closeModal}>
                <div className="modal-body send-form">
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                Name of payment
                            </div>
                            <div className="send-form__value">
                                {!streamDetails.name ? "-" : streamDetails.name}
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                Amount in BTC
                            </div>
                            <div className="send-form__value">
                                <BalanceWithMeasure satoshi={streamDetails.price * streamDetails.totalParts} />
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                Transaction fee
                            </div>
                            <div className="send-form__value">
                                <BalanceWithMeasure satoshi={streamDetails.totalParts * streamDetails.fee.max} />
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                To
                            </div>
                            <div className="send-form__value send-form__value--no-overflow">
                                {streamDetails.contact_name ?
                                    <Ellipsis classList="send-form__contact_name">
                                        {streamDetails.contact_name}
                                    </Ellipsis>
                                    : ""}
                                <Ellipsis>{streamDetails.lightningID}</Ellipsis>
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__separator separator" />
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label send-form__summary uppercase">
                                Amount
                            </div>
                            <div className="send-form__value send-form__summary">
                                <BtcToUsd satoshi={amount} />
                            </div>
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
                                className="button button__orange button__close button__side-padding45"
                                onClick={this.addToList}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

StreamDetails.propTypes = {
    dispatch: PropTypes.func.isRequired,
    onClose: PropTypes.func,
    streamDetails: PropTypes.shape({
        contact_name: PropTypes.string,
        currentPart: PropTypes.number.isRequired,
        date: PropTypes.number.isRequired,
        delay: PropTypes.number.isRequired,
        description: PropTypes.string,
        fee: PropTypes.object.isRequired,
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        totalParts: PropTypes.number.isRequired,
    }),
};

const mapStateToProps = state => ({
    streamDetails: state.streamPayment.streamDetails,
});

export default connect(mapStateToProps)(StreamDetails);
