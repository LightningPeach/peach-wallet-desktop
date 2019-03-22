import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import bitcoin from "bitcoinjs-lib";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";

import { analytics, helpers, validators } from "additional";
import { exceptions, consts, routes, nodeSettings } from "config";
import { onChainOperations as operations, onChainTypes as types } from "modules/onchain";
import { filterTypes } from "modules/filter";
import { appOperations, appTypes } from "modules/app";
import { accountOperations } from "modules/account";

import SubHeader from "components/subheader";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";
import SuccessPayment from "components/common/success-payment";
import UnSuccessPayment from "components/common/unsuccess-payment";
import BtcToUsd from "components/common/btc-to-usd";
import DigitsField from "components/ui/digits-field";
import OnChainDetails from "./modal/details";
import OnchainWarning from "./modal/warning";
import OnchainHistory from "./history";

class Onchain extends Component {
    constructor(props) {
        super(props);
        this.state = {
            amount: null,
            amountError: null,
            nameError: null,
            toError: null,
        };
        analytics.pageview(routes.OnchainFullPath, "On-chain");
    }

    componentWillMount() {
        this.props.dispatch(operations.getOnchainHistory());
    }

    componentWillUpdate(nextProps) {
        if (this.props.modalState !== nextProps.modalState && nextProps.modalState === appTypes.CLOSE_MODAL_STATE) {
            analytics.pageview(routes.OnchainFullPath, "On-chain");
        }
    }

    onChainPay = async (e) => {
        e.preventDefault();
        analytics.event({ action: "Payment", category: "On-chain", label: "Pay" });
        const { dispatch } = this.props;
        const name = this.name.value.trim();
        const to = this.to.value.trim();
        let amount = parseFloat(this.amount.value.trim());
        const nameError = validators.validateName(name, false, true, true, undefined, true);
        const toError = this.validateTo(to);
        const amountError = dispatch(accountOperations.checkAmount(amount, "bitcoin"));

        if (nameError || toError || amountError) {
            this.setState({ amountError, nameError, toError });
            return;
        }

        this.setState({ amountError, nameError, toError });
        amount = dispatch(appOperations.convertToSatoshi(amount));
        const response = await dispatch(operations.prepareSendCoins(to, amount, name));
        if (!response.ok) {
            this.setState({ amountError: response.error });
            return;
        }
        if (to.length === consts.LIGHTNING_ID_LENGTH) {
            dispatch(operations.openWarningModal());
            return;
        }
        dispatch(operations.openSendCoinsModal());
    };

    getNetwork = () => {
        if (nodeSettings.BITCOIN_SETTINGS.network === "testnet") {
            return bitcoin.networks.testnet;
        } else if (nodeSettings.BITCOIN_SETTINGS.network === "simnet") {
            return consts.SIMNET_NETWORK;
        }
        return bitcoin.networks.bitcoin;
    };

    validateTo = (to) => {
        if (!to) {
            return exceptions.FIELD_IS_REQUIRED;
        }
        const network = this.getNetwork();
        return validators.validateBitcoinAddr(to, network);
    };

    successPaymentCallback = () => {
        const { dispatch } = this.props;
        dispatch(operations.clearSendCoinsDetails());
        this.setState({ amount: null });
        this.form.reset();
        this.amountComponent.reset();
    };

    renderOnchain = () => {
        const { dispatch, bitcoinMeasureType } = this.props;
        return (
            <Fragment>
                <div className="tabs">
                    <div className="tabs__row">
                        <div className="tab-link tab-link-active tab-link__no-hover">
                            On-chain payment
                        </div>
                    </div>
                </div>
                <div className="block__row-lg">
                    <div className="col-xs-12 col-md-6">
                        <form
                            className="form form--onchain"
                            onSubmit={this.onChainPay}
                            key={0}
                            ref={(ref) => {
                                this.form = ref;
                            }}
                        >
                            <div className="row">
                                <div className="col-xs-12">
                                    <div className="form-label">
                                        <label htmlFor="send-coins__name">Description</label>
                                    </div>
                                </div>
                                <div className="col-xs-12">
                                    <input
                                        id="send-coins__name"
                                        className={`form-text ${this.state.nameError ? "form-text__error" : ""}`}
                                        name="send-coins__name"
                                        placeholder="Optional"
                                        ref={(ref) => {
                                            this.name = ref;
                                        }}
                                        onChange={() => this.setState({ nameError: null })}
                                        max={consts.ELEMENT_NAME_MAX_LENGTH}
                                        maxLength={consts.ELEMENT_NAME_MAX_LENGTH}
                                    />
                                    <ErrorFieldTooltip text={this.state.nameError} />
                                </div>
                            </div>
                            <div className="block__row">
                                <div className="col-xs-12">
                                    <div className="form-label">
                                        <label htmlFor="send-coins__to">To</label>
                                    </div>
                                </div>
                                <div className="col-xs-12">
                                    <input
                                        id="send-coins__to"
                                        className={`form-text ${this.state.toError ? "form-text__error" : ""}`}
                                        name="send-coins__to"
                                        placeholder="Bitcoin Address"
                                        ref={(ref) => {
                                            this.to = ref;
                                        }}
                                        onChange={() => this.setState({ toError: null })}
                                    />
                                    <ErrorFieldTooltip text={this.state.toError} />
                                </div>
                            </div>
                            <div className="block__row align-end-xs">
                                <div className="col-xs-8">
                                    <div className="row">
                                        <div className="col-xs-12">
                                            <div className="row row--no-col justify-between-xs">
                                                <div className="form-label">
                                                    <label htmlFor="send-coins__amount">
                                                        Amount in {bitcoinMeasureType}
                                                    </label>
                                                </div>
                                                {this.state.amount &&
                                                <div className="form-usd form-usd--label">
                                                    <BtcToUsd
                                                        amount={dispatch(appOperations
                                                            .convertToSatoshi(this.state.amount))}
                                                        hideBase
                                                    />
                                                </div>
                                                }
                                            </div>
                                        </div>
                                        <div className="col-xs-12">
                                            <DigitsField
                                                id="send-coins__amount"
                                                className={`form-text ${
                                                    this.state.amountError ? "form-text__error" : ""}`}
                                                name="send-coins__amount"
                                                placeholder={`${
                                                    bitcoinMeasureType === "Satoshi" ? "0" : "0.0"
                                                } ${bitcoinMeasureType}`}
                                                ref={(ref) => {
                                                    this.amountComponent = ref;
                                                }}
                                                setRef={(ref) => {
                                                    this.amount = ref;
                                                }}
                                                setOnChange={e => this.setState({
                                                    amount: e.target.value,
                                                    amountError: null,
                                                })}
                                            />
                                            <ErrorFieldTooltip text={this.state.amountError} />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xs-4">
                                    <button type="submit" className="button button__solid button--fullwide">
                                        Pay
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Fragment>
        );
    };

    render() {
        const { dispatch, modalState, sendCoinsDetails } = this.props;
        let modal;
        switch (modalState) {
            case types.MODAL_STATE_SEND_COINS:
                modal = <OnChainDetails />;
                break;
            case appTypes.FAIL_SEND_PAYMENT:
                modal = (
                    <UnSuccessPayment
                        error={this.props.sendCoinsPaymentDetails}
                        category="On-chain"
                        onClose={() => dispatch(operations.clearSendCoinsError())}
                    />
                );
                break;
            case appTypes.SUCCESS_SEND_PAYMENT:
                modal = (
                    <SuccessPayment
                        name={sendCoinsDetails.name}
                        amount={sendCoinsDetails.amount}
                        category="On-chain"
                        onClose={this.successPaymentCallback}
                    />
                );
                break;
            case types.MODAL_STATE_WARNING:
                modal = <OnchainWarning />;
                break;
            default:
                modal = null;
                break;
        }
        return (
            <Fragment>
                <SubHeader />
                <div className="page onchain">
                    <div className="container">
                        {this.renderOnchain()}
                        <OnchainHistory />
                    </div>
                </div>
                <ReactCSSTransitionGroup
                    transitionName="modal-transition"
                    transitionEnterTimeout={consts.MODAL_ANIMATION_TIMEOUT}
                    transitionLeaveTimeout={consts.MODAL_ANIMATION_TIMEOUT}
                >
                    {modal}
                </ReactCSSTransitionGroup>,
            </Fragment>
        );
    }
}

Onchain.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    modalState: PropTypes.string.isRequired,
    sendCoinsDetails: PropTypes.shape({
        amount: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        recepient: PropTypes.string.isRequired,
    }),
    sendCoinsPaymentDetails: PropTypes.string,
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    history: state.onchain.history,
    lightningID: state.account.lightningID,
    modalState: state.app.modalState,
    sendCoinsDetails: state.onchain.sendCoinsDetails,
    sendCoinsPaymentDetails: state.onchain.sendCoinsPaymentDetails,
});

export default connect(mapStateToProps)(Onchain);
