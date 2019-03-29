import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics } from "additional";
import { appOperations, appActions, appTypes } from "modules/app";
import { lightningOperations } from "modules/lightning";
import { routes } from "config";

import BtcToUsd from "components/common/btc-to-usd";
import BalanceWithMeasure from "components/common/balance-with-measure";
import Modal from "components/modal";
import Ellipsis from "components/common/ellipsis";

const spinner = <div className="spinner" />;

class LightningDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            processing: false,
        };

        analytics.pageview(`${routes.LightningFullPath}/regular/details`, "Lightning / Regular Payment / Details");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        if (this.state.processing) {
            return;
        }
        analytics.event({ action: "Regular Payment Modal", category: "Lightning", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    sendLightning = async () => {
        const { dispatch } = this.props;
        this.setState({ processing: true });
        analytics.event({ action: "Regular Payment Modal", category: "Lightning", label: "Pay" });
        const response = await dispatch(lightningOperations.makePayment());
        dispatch(lightningOperations.getHistory());
        this.setState({ processing: false });
        if (!response.ok) {
            dispatch(appActions.setModalState(appTypes.FAIL_SEND_PAYMENT));
        } else {
            dispatch(appActions.setModalState(appTypes.SUCCESS_SEND_PAYMENT));
        }
    };

    render() {
        const { paymentDetails, bitcoinMeasureType } = this.props;
        return (
            <Modal title="Check your data" onClose={this.closeModal}>
                <div className="modal__body">
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                Description
                            </div>
                            <div className="send-form__value">
                                {!paymentDetails[0].name ? "-" : paymentDetails[0].name}
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                Amount in {bitcoinMeasureType}
                            </div>
                            <div className="send-form__value">
                                <BalanceWithMeasure satoshi={paymentDetails[0].amount} />
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                Transaction fee
                            </div>
                            <div className="send-form__value">
                                ~ <BalanceWithMeasure satoshi={paymentDetails[0].fee.max} />
                                &nbsp;({
                                    Math.round((paymentDetails[0].fee.max * 10000) / paymentDetails[0].amount) / 100
                                }%)
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                To
                            </div>
                            <div className="send-form__value send-form__value--no-overflow">
                                {paymentDetails[0].contact_name ?
                                    <Ellipsis className="send-form__contact_name">
                                        {paymentDetails[0].contact_name}
                                    </Ellipsis>
                                    : ""}
                                <Ellipsis>{paymentDetails[0].lightningID}</Ellipsis>
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
                                <BtcToUsd amount={paymentDetails[0].amount + paymentDetails[0].fee.max} />
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
                                    onClick={this.sendLightning}
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

LightningDetails.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    paymentDetails: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        comment: PropTypes.string.isRequired,
        contact_name: PropTypes.string,
        fee: PropTypes.object.isRequired,
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        pay_req: PropTypes.string,
        pay_req_decoded: PropTypes.shape(),
    }).isRequired).isRequired,
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    paymentDetails: state.lightning.paymentDetails,
});

export default connect(mapStateToProps)(LightningDetails);
