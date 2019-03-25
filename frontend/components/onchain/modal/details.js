import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics, tooltips } from "additional";
import { routes } from "config";
import { appOperations, appActions, appTypes } from "modules/app";
import { onChainOperations as operations } from "modules/onchain";

import BtcToUsd from "components/common/btc-to-usd";
import BalanceWithMeasure from "components/common/balance-with-measure";
import Modal from "components/modal";
import Ellipsis from "components/common/ellipsis";

const spinner = <div className="spinner" />;

class OnChainDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            processing: false,
        };

        analytics.pageview(`${routes.OnchainFullPath}/details`, "Payment details");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        if (this.state.processing) {
            return;
        }
        analytics.event({ action: "Details Modal", category: "On-chain", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    sendCoins = async () => {
        const { dispatch } = this.props;
        this.setState({ processing: true });
        analytics.event({ action: "Details Modal", category: "On-chain", label: "Pay" });
        const response = await dispatch(operations.sendCoins());
        dispatch(operations.getOnchainHistory());
        this.setState({ processing: false });
        if (!response.ok) {
            analytics.pageview(`${routes.OnchainFullPath}/unsuccess`, "Unsuccess Payment details");
            dispatch(appActions.setModalState(appTypes.FAIL_SEND_PAYMENT));
            return;
        }
        analytics.pageview(`${routes.OnchainFullPath}/success`, "Success Payment details");
        dispatch(appActions.setModalState(appTypes.SUCCESS_SEND_PAYMENT));
    };

    render() {
        const { sendCoinsDetails } = this.props;
        return (
            <Modal title="Check your data" onClose={this.closeModal} titleTooltip={tooltips.TRANSACTION_PROCESSING}>
                <div className="modal__body">
                    {sendCoinsDetails.name ?
                        <div className="row send-form__row">
                            <div className="col-xs-12">
                                <div className="send-form__label">
                                    Description
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
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                className="button button__link"
                                type="button"
                                onClick={this.closeModal}
                                disabled={this.state.processing}
                            >
                                Cancel
                            </button>
                            <span className="button__spinner">
                                <button
                                    type="button"
                                    className="button button__solid"
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
        name: PropTypes.string,
        recepient: PropTypes.string.isRequired,
    }).isRequired,
};

const mapStateToProps = state => ({
    fee: state.onchain.fee,
    sendCoinsDetails: state.onchain.sendCoinsDetails,
});

export default connect(mapStateToProps)(OnChainDetails);
