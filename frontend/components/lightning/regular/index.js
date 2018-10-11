import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, validators, helpers } from "additional";
import ErrorFieldTooltip from "components/ui/error_field_tooltip";
import { accountOperations, accountTypes } from "modules/account";
import { lightningOperations, lightningActions, lightningTypes } from "modules/lightning";
import SuccessPayment from "components/common/success-payment";
import UnSuccessPayment from "components/common/unsuccess-payment";
import * as statusCodes from "config/status-codes";
import {
    PAYMENT_REQUEST_LENGTH,
    LIGHTNING_ID_LENGTH,
    MODAL_ANIMATION_TIMEOUT,
    ELEMENT_NAME_MAX_LENGTH,
} from "config/consts";
import BtcToUsd from "components/common/btc-to-usd";
import { appOperations, appTypes } from "modules/app";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { channelsSelectors } from "modules/channels";
import { error } from "modules/notifications";
import DigitsField from "components/ui/digitsField";
import RegularHistory from "./history";
import ToField from "../ui/to";
import LightningDetails from "../modal/lightning-details";

const getInitialState = (params) => {
    const initState = {
        amount: "",
        amountError: null,
        isPayReq: false,
        nameError: null,
        payReqAmount: "",
        processing: false,
        refreshed: false,
        regularName: "",
        toError: null,
        toValue: "",
    };
    return { ...initState, ...params };
};

class RegularPayment extends Component {
    constructor(props) {
        super(props);
        this.state = getInitialState();
    }

    componentDidMount() {
        const { externalPaymentRequest } = this.props;
        if (externalPaymentRequest) {
            this.handleTo(externalPaymentRequest, true);
        }
    }

    componentDidUpdate() {
        const { externalPaymentRequest } = this.props;
        if (externalPaymentRequest) {
            this.handleTo(externalPaymentRequest, true);
        }
    }

    // TODO: check logic with delay around submit, should this check be ontime or async action upon submit
    handleTo = async (value, injectExternal = false) => {
        const toError = null;
        const { dispatch } = this.props;
        let newValue = value.trim();
        if (newValue === this.state.toValue) {
            return;
        }
        if (injectExternal) {
            this.toField.setValue(value);
        }
        if (newValue && newValue.length >= PAYMENT_REQUEST_LENGTH) {
            const payReq = await dispatch(lightningOperations.decodePaymentRequest(newValue));
            if (payReq.ok) {
                const tempNumSatoshi = parseInt(payReq.response.num_satoshis, 10);
                const amount = dispatch(appOperations.convertSatoshiToCurrentMeasure(tempNumSatoshi));
                let description;
                try {
                    const parsedDescription = JSON.parse(payReq.response.description);
                    description = parsedDescription.name ? parsedDescription.name : "";
                } catch (e) {
                    description = payReq.response.description; // eslint-disable-line
                }
                this.setState({
                    isPayReq: true,
                    nameError: null,
                    payReqAmount: amount,
                    payReqLightning: payReq.response.destination,
                    regularName: description,
                    toError,
                    toValue: newValue,
                });
                if (injectExternal) {
                    this.setState({
                        processing: true,
                    });
                    this._payReqPay();
                    dispatch(lightningActions.setExternalPaymentRequest(null));
                }
                return;
            }
        }
        if (injectExternal) {
            dispatch(error({ message: helpers.formatNotificationMessage("Incorrect payment request") }));
            dispatch(lightningActions.setExternalPaymentRequest(null));
            newValue = "";
            this.toField.reset();
        }
        this.setState({
            isPayReq: false,
            toError,
            toValue: newValue,
        });
    };

    _validateTo = (value) => {
        const { lisStatus } = this.props;
        if (!value) {
            return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
        } else if (value.length !== LIGHTNING_ID_LENGTH) {
            return statusCodes.EXCEPTION_LIGHTNING_ID_WRONG_LENGTH_NO_CONTACT;
        } else if (lisStatus === accountTypes.LIS_DOWN) {
            return statusCodes.EXCEPTION_LIS_DOWN_DURING_TX;
        }
        return null;
    };

    _payReqPay = async () => {
        analytics.event({
            action: "Regular Payment",
            category: "Lightning",
            label: "Pay",
        });
        const { contacts, isThereActiveChannel, dispatch } = this.props;
        if (!isThereActiveChannel) {
            this.setState({ processing: false });
            dispatch(lightningOperations.channelWarningModal());
            return;
        }
        const name = this.state.regularName.trim();
        const nameError = validators.validateName(name, false, true, true, undefined, true);
        const to = this.state.payReqLightning;
        const toError = null;
        let amount = parseFloat(this.state.payReqAmount);
        const amountError = dispatch(accountOperations.checkAmount(amount));
        const comment = name;
        const paymentReq = this.state.toValue;
        let contactName = null;
        if (nameError || amountError) {
            this.setState({
                amountError, nameError, processing: false, toError,
            });
            return;
        }
        contacts.forEach((contact) => {
            if (contact.lightningID === to) {
                contactName = contact.name;
            }
        });
        this.setState({ amountError, nameError, toError });
        amount = dispatch(appOperations.convertToSatoshi(amount));
        const response = await dispatch(lightningOperations.preparePayment(
            to,
            amount,
            comment,
            paymentReq,
            name,
            contactName,
        ));
        this.setState({ processing: false });
        if (!response.ok) {
            dispatch(error({ message: helpers.formatNotificationMessage(response.error, true) }));
            return;
        }
        dispatch(lightningOperations.openPaymentDetailsModal());
    };

    _regularPay = async () => {
        analytics.event({
            action: "Regular Payment",
            category: "Lightning",
            label: "Pay",
        });
        const { contacts, isThereActiveChannel, dispatch } = this.props;
        if (!isThereActiveChannel) {
            this.setState({ processing: false });
            dispatch(lightningOperations.channelWarningModal());
            return;
        }
        const name = this.state.regularName.trim();
        const nameError = validators.validateName(name, false, true, true, undefined, true);
        let to = this.state.toValue;
        let toError = null;
        let amount = parseFloat(this.state.amount);
        const amountError = dispatch(accountOperations.checkAmount(amount));
        const comment = name;
        let contactName = null;
        contacts.forEach((contact) => {
            if (contact.name === to || contact.lightningID === to) {
                contactName = contact.name;
                to = contact.lightningID;
            }
        });
        toError = this._validateTo(to);
        if (nameError || toError || amountError) {
            this.setState({
                amountError, nameError, processing: false, toError,
            });
            return;
        }
        this.setState({ amountError, nameError, toError });
        amount = dispatch(appOperations.convertToSatoshi(amount));
        const response = await dispatch(lightningOperations.preparePayment(
            to,
            amount,
            comment,
            null,
            name,
            contactName,
        ));
        this.setState({ processing: false });
        if (!response.ok) {
            dispatch(error({ message: helpers.formatNotificationMessage(response.error, true) }));
            return;
        }
        dispatch(lightningOperations.openPaymentDetailsModal());
    };

    renderForm = () => {
        const { dispatch, bitcoinMeasureType, lisStatus } = this.props;
        const usdRender = amount => (
            <span className="form-usd">
                <BtcToUsd
                    amount={dispatch(appOperations.convertToSatoshi(amount))}
                    hideBase
                />
            </span>
        );
        const toPlaceholder = `${lisStatus === accountTypes.LIS_UP ? "Lightning ID / " : ""}Payment request`;
        const usd = !this.state.isPayReq && !this.state.amount ? null
            : (this.state.isPayReq ? usdRender(this.state.payReqAmount) : usdRender(this.state.amount));

        return (
            <form
                className="send narrow"
                onSubmit={(e) => {
                    e.preventDefault();
                    this.setState({ processing: true });
                    // TODO: check logic
                    // Let's give some time for trying to decode pay_req if it is it
                    setTimeout(() => {
                        this.state.isPayReq ? this._payReqPay() : this._regularPay();
                    }, 200);
                }}
                key={0}
                ref={(el) => {
                    this.form = el;
                }}
            >
                <div className="row">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="regular__name">
                                Name of payment
                            </label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <input
                            id="regular__name"
                            className={`form-text ${this.state.nameError ? "form-text__error" : ""}`}
                            name="regular__name"
                            placeholder="Enter name"
                            ref={(el) => {
                                this.regularName = el;
                            }}
                            onChange={e => this.setState({
                                nameError: null,
                                regularName: e.target.value,
                            })}
                            value={this.state.regularName}
                            disabled={this.state.processing}
                            max={ELEMENT_NAME_MAX_LENGTH}
                            maxLength={ELEMENT_NAME_MAX_LENGTH}
                        />
                        <ErrorFieldTooltip text={this.state.nameError} />
                    </div>
                </div>
                <div className="row mt-14">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="regular__to">To</label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <ToField
                            id="regular__to"
                            class={`form-text ${this.state.toError ? "form-text__error" : ""}`}
                            placeholder={toPlaceholder}
                            onChange={this.handleTo}
                            disabled={this.state.processing}
                            onRef={(ref) => {
                                this.toField = ref;
                            }}
                        />
                        <ErrorFieldTooltip text={this.state.toError} />
                    </div>
                </div>
                <div className="row mt-14">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="regular__amount">
                                Amount in {bitcoinMeasureType}
                            </label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        {this.state.isPayReq && <input
                            className="form-text"
                            name="regular__name"
                            value={this.state.payReqAmount}
                            disabled
                        />}
                        <DigitsField
                            hidden={this.state.isPayReq}
                            id="regular__amount"
                            className={`form-text ${this.state.amountError ? "form-text__error" : ""}`}
                            name="regular__amount"
                            placeholder={`${bitcoinMeasureType === "Satoshi" ? "0" : "0.0"} ${bitcoinMeasureType}`}
                            ref={(ref) => {
                                this.amountComponent = ref;
                            }}
                            setRef={(el) => {
                                this.amount = el;
                            }}
                            setOnChange={e => this.setState({
                                amount: e.target.value.trim(),
                                amountError: null,
                            })}
                            disabled={this.state.processing || this.state.isPayReq}
                            value={this.state.isPayReq ? this.state.payReqAmount : this.state.amount}
                        />
                        <ErrorFieldTooltip text={this.state.amountError} />
                    </div>
                    <div className="col-xs-12" />
                </div>
                <div className="row mt-30">
                    <div className="col-xs-12 text-right">
                        {usd}
                        <button
                            type="submit"
                            className="button button__orange button__side-padding45"
                            disabled={this.state.processing}
                        >
                            Pay
                        </button>
                    </div>
                </div>
            </form>
        );
    };

    render() {
        const { dispatch, modalState, paymentDetails } = this.props;
        let modal;
        switch (modalState) {
            case lightningTypes.MODAL_STATE_PAYMENT_DETAILS:
                modal = <LightningDetails />;
                break;
            case appTypes.FAIL_SEND_PAYMENT:
                modal = (
                    <UnSuccessPayment
                        error={this.props.paymentStatusDetails}
                        category="Lightning"
                        showRetryHelper
                    />
                );
                break;
            case appTypes.SUCCESS_SEND_PAYMENT:
                modal = (<SuccessPayment
                    name={paymentDetails[0].name}
                    amount={paymentDetails[0].amount}
                    category="Lightning"
                    onClose={() => {
                        dispatch(lightningOperations.clearSinglePayment());
                        this.setState(getInitialState());
                        this.form.reset();
                        this.amountComponent.reset();
                        this.toField.reset();
                    }}
                />);
                break;
            default:
                modal = null;
                break;
        }
        return [
            this.renderForm(),
            <RegularHistory />,
            <ReactCSSTransitionGroup
                transitionName="modal-transition"
                transitionEnterTimeout={MODAL_ANIMATION_TIMEOUT}
                transitionLeaveTimeout={MODAL_ANIMATION_TIMEOUT}
                key="lightningRegularModal"
            >
                {modal}
            </ReactCSSTransitionGroup>,
        ];
    }
}

RegularPayment.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    dispatch: PropTypes.func.isRequired,
    externalPaymentRequest: PropTypes.string,
    isThereActiveChannel: PropTypes.bool,
    lisStatus: PropTypes.string.isRequired,
    modalState: PropTypes.string.isRequired,
    paymentDetails: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        comment: PropTypes.string,
        contact_name: PropTypes.string,
        fee: PropTypes.shape,
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string,
        pay_req: PropTypes.string,
    })).isRequired,
    paymentStatusDetails: PropTypes.string,
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    contacts: state.contacts.contacts,
    externalPaymentRequest: state.lightning.externalPaymentRequest,
    isThereActiveChannel: channelsSelectors.isThereActiveChannel(state),
    lisStatus: state.account.lisStatus,
    modalState: state.app.modalState,
    paymentDetails: state.lightning.paymentDetails,
    paymentStatusDetails: state.lightning.paymentStatusDetails,
});

export default connect(mapStateToProps)(RegularPayment);
