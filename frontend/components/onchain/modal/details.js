import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { appOperations, appActions, appTypes } from "modules/app";
import { onChainOperations as operations } from "modules/onchain";
import BtcToUsd from "components/common/btc-to-usd";
import BalanceWithMeasure from "components/common/balance-with-measure";
import { OnchainFullPath } from "routes";
import Modal from "components/modal";
import Ellipsis from "components/common/ellipsis";

const spinner = <div className="spinner" />;

class OnChainDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            processing: false,
            tooltips: {
                processing: [
                    "You need to wait for transaction processing.",
                    "Your payment will be processed when it is",
                    "confirmed on the Bitcoin blockchain",
                ],
            },
        };

        analytics.pageview(`${OnchainFullPath}/details`, "Payment details");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        if (this.state.processing) {
            return;
        }
        analytics.event({ action: "Details Modal", category: "Onchain", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    sendCoins = async () => {
        const { dispatch } = this.props;
        this.setState({ processing: true });
        analytics.event({ action: "Details Modal", category: "Onchain", label: "Pay" });
        const response = await dispatch(operations.sendCoins());
        dispatch(operations.getOnchainHistory());
        this.setState({ processing: false });
        if (!response.ok) {
            analytics.pageview(`${OnchainFullPath}/unsuccess`, "Unsuccess Payment details");
            dispatch(appActions.setModalState(appTypes.FAIL_SEND_PAYMENT));
            return;
        }
        analytics.pageview(`${OnchainFullPath}/success`, "Success Payment details");
        dispatch(appActions.setModalState(appTypes.SUCCESS_SEND_PAYMENT));
    };

    render() {
        const { sendCoinsDetails } = this.props;
        return (
            <Modal title="Check your data" onClose={this.closeModal} titleTooltip={this.state.tooltips.processing}>
                <div className="modal-body send-form">
                    {sendCoinsDetails.name ?
                        <div className="row send-form__row">
                            <div className="col-xs-12">
                                <div className="send-form__label">
                                    Name of payment
                                </div>
                                <div className="send-form__value">
                                    {sendCoinsDetails.name}
                                </div>
                            </div>
                        </div> : null
                    }
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                Amount in BTC
                            </div>
                            <div className="send-form__value">
                                <BalanceWithMeasure satoshi={sendCoinsDetails.amount} />
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                Transaction fee
                            </div>
                            <div className="send-form__value">
                                ~ <BalanceWithMeasure satoshi={this.props.fee} />
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                Blocks confirmation
                            </div>
                            <div className="send-form__value">
                                {this.props.sendCoinsDetails.confTarget}
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                To
                            </div>
                            <div className="send-form__value send-form__value--no-overflow">
                                <Ellipsis>{` ${sendCoinsDetails.recepient}`}</Ellipsis>
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
                                <BtcToUsd amount={(sendCoinsDetails.amount + this.props.fee)} />
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
                                disabled={this.state.processing}
                            >
                                Cancel
                            </button>
                            <span className="button_with_spinner">
                                <button
                                    type="button"
                                    className="button button__orange button__close button__side-padding45"
                                    onClick={this.sendCoins}
                                    disabled={this.state.processing}
                                >
                                Pay
                                </button>
                                {this.state.processing && spinner}
                            </span>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

OnChainDetails.propTypes = {
    dispatch: PropTypes.func.isRequired,
    fee: PropTypes.number.isRequired,
    sendCoinsDetails: PropTypes.shape({
        amount: PropTypes.number.isRequired,
        confTarget: PropTypes.number.isRequired,
        name: PropTypes.string,
        recepient: PropTypes.string.isRequired,
    }).isRequired,
};

const mapStateToProps = state => ({
    fee: state.onchain.fee,
    sendCoinsDetails: state.onchain.sendCoinsDetails,
});

export default connect(mapStateToProps)(OnChainDetails);
