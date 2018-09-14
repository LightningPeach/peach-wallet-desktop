import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, validators } from "additional";
import ErrorFieldTooltip from "components/ui/error_field_tooltip";
import { accountOperations, accountTypes } from "modules/account";
import {
    streamPaymentOperations as streamOperations,
    streamPaymentTypes,
} from "modules/streamPayments";
import { lightningOperations } from "modules/lightning";
import BtcToUsd from "components/common/btc-to-usd";
import { appOperations } from "modules/app";
import * as statusCodes from "config/status-codes";
import { LIGHTNING_ID_LENGTH, MODAL_ANIMATION_TIMEOUT, ELEMENT_NAME_MAX_LENGTH } from "config/consts";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { channelsSelectors } from "modules/channels";
import { error } from "modules/notifications";
import DigitsField from "components/ui/digitsField";
import ToField from "./ui/to";
import StreamDetails from "./modal/stream-details";

const getInitialState = (params = {}) => {
    const initState = {
        amount: null,
        amountError: null,
        nameError: null,
        textError: null,
        timeError: null,
        toError: null,
        toValue: null,
    };

    return { ...initState, ...params };
};

class StreamPayment extends Component {
    constructor(props) {
        super(props);
        this.delay = 1000;

        this.state = getInitialState();
    }

    setAmount = () => {
        const amount = parseFloat(this.amount.value.trim()) || null;
        const seconds = parseInt(this.time.value.trim(), 10) || null;
        this.setState({
            amount: amount && seconds ? amount * seconds : null,
            amountError: null,
            timeError: null,
        });
    };

    clean = () => {
        this.setState(getInitialState());
        this.form.reset();
        this.amountComponent.reset();
        this.timeComponent.reset();
        this.toField.reset();
    };

    handleTo = (value) => {
        this.setState({
            toError: null,
            toValue: value.trim(),
        });
    };

    _searchContact = (to) => {
        const { contacts } = this.props;
        let isFounded = false;
        let lightningId = null;
        let contactName = null;
        contacts.forEach((contact) => {
            if (contact.name === to || contact.lightningID === to) {
                contactName = contact.name;
                lightningId = contact.lightningID;
                isFounded = true;
            }
        });
        return { contactName, lightningId };
    };

    _validateTime = (time, amount) => {
        const { dispatch, lightningBalance } = this.props;
        if (!time) {
            return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
        } else if (!Number.isFinite(time)) {
            return statusCodes.EXCEPTION_FIELD_DIGITS_ONLY;
        } else if (time <= 0) {
            return statusCodes.EXCEPTION_TIME_NEGATIVE;
        } else if (dispatch(appOperations.convertToSatoshi(time * amount)) > lightningBalance) {
            return statusCodes.EXCEPTION_AMOUNT_LIGHTNING_NOT_ENOUGH_FUNDS;
        }
        return null;
    };

    streamPay = async (e) => {
        e.preventDefault();
        analytics.event({
            action: "Stream Payment",
            category: "Lightning",
            label: "Pay",
        });
        const { isThereActiveChannel, dispatch } = this.props;
        if (!isThereActiveChannel) {
            dispatch(lightningOperations.channelWarningModal());
            return;
        }
        this.setState({ processing: true });
        const contact = this._searchContact(this.state.toValue);
        const name = this.name.value.trim();
        let to = contact.lightningId || this.state.toValue;
        let amount = parseFloat(this.amount.value.trim());
        const time = Math.round(parseInt(this.time.value.trim(), 10));

        const nameError = validators.validateName(name, false, true, true, undefined, true);
        const toError = validators.validateLightning(to);
        const amountError = dispatch(accountOperations.checkAmount(amount));
        const timeError = this._validateTime(time, amount);

        if (nameError || toError || amountError || timeError) {
            this.setState({
                amountError, nameError, processing: false, timeError, toError,
            });
            return;
        }
        to = to.trim();
        this.setState({
            amountError, nameError, timeError, toError,
        });
        amount = dispatch(appOperations.convertToSatoshi(amount));
        const response = await dispatch(streamOperations.prepareStreamPayment(
            to,
            amount,
            this.delay,
            time,
            name,
            contact.contactName,
        ));
        this.setState({ processing: false });
        if (!response.ok) {
            dispatch(error({ message: response.error }));
            return;
        }
        dispatch(streamOperations.openStreamPaymentDetailsModal());
    };

    renderForm = () => {
        const { dispatch, bitcoinMeasureType, lisStatus } = this.props;
        let usd = null;
        if (this.state.amount) {
            usd = (
                <span className="form-usd">
                    <BtcToUsd satoshi={dispatch(appOperations.convertToSatoshi(this.state.amount))} hideBtc />
                </span>
            );
        }
        const formClass = `send form ${(lisStatus !== accountTypes.LIS_UP && "stream__form--disabled") || ""}`;
        return (
            <form
                className={formClass}
                onSubmit={this.streamPay}
                key={0}
                ref={(ref) => {
                    this.form = ref;
                }}
            >
                <div className="row form-row">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="stream__name">Stream Name</label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <input
                            id="stream__name"
                            className={`form-text ${this.state.nameError ? "form-text__error" : ""}`}
                            name="stream__name"
                            placeholder="Enter name"
                            ref={(ref) => {
                                this.name = ref;
                            }}
                            onChange={() => this.setState({ nameError: null })}
                            disabled={this.state.processing}
                            max={ELEMENT_NAME_MAX_LENGTH}
                            maxLength={ELEMENT_NAME_MAX_LENGTH}
                        />
                        <ErrorFieldTooltip text={this.state.nameError} />
                    </div>
                </div>
                <div className="row form-row">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="stream__to">To</label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <ToField
                            id="stream__to_field"
                            class={`form-text ${this.state.toError ? "form-text__error" : ""}`}
                            onChange={this.handleTo}
                            placeholder="Lightning ID"
                            disabled={this.state.processing}
                            onRef={(ref) => {
                                this.toField = ref;
                            }}
                        />
                        <ErrorFieldTooltip text={this.state.toError} />
                    </div>
                </div>
                <div className="row form-row">
                    <div className="col-xs-6 stream__price-time">
                        <div className="row">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="stream__amount">
                                        Price per second in {bitcoinMeasureType}
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-xs-12">
                                <DigitsField
                                    id="stream__amount"
                                    className={`form-text ${this.state.amountError ? "form-text__error" : ""}`}
                                    name="stream__amount"
                                    placeholder={`${bitcoinMeasureType === "Satoshi" ?
                                        "0" :
                                        "0.0"} ${bitcoinMeasureType}`}
                                    ref={(ref) => {
                                        this.amountComponent = ref;
                                    }}
                                    setRef={(ref) => {
                                        this.amount = ref;
                                    }}
                                    setOnChange={this.setAmount}
                                    disabled={this.state.processing}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-6 stream__time">
                        <div className="row">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="stream__time">
                                        Time limit in seconds
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-xs-12">
                                <DigitsField
                                    id="stream__time"
                                    className={`form-text ${this.state.timeError ? "form-text__error" : ""}`}
                                    name="stream__time"
                                    placeholder="0 sec"
                                    ref={(ref) => {
                                        this.timeComponent = ref;
                                    }}
                                    setRef={(ref) => {
                                        this.time = ref;
                                    }}
                                    setOnChange={this.setAmount}
                                    disabled={this.state.processing}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <ErrorFieldTooltip text={this.state.amountError || this.state.timeError} />
                    </div>
                </div>
                <div className="row form-row__footer">
                    <div className="col-xs-12 text-right">
                        {usd}
                        <button
                            type="submit"
                            className="button button__orange button__side-padding45"
                            disabled={this.state.processing}
                        >
                            Create
                        </button>
                    </div>
                </div>
                {lisStatus !== accountTypes.LIS_UP && (
                    <div className="stream__disabled" key="streamDisabledPlaceholder">
                        <span>Stream payment temporarily disabled</span>
                    </div>
                )}
            </form>
        );
    };

    render() {
        const { modalState } = this.props;
        return [
            this.renderForm(),
            modalState === streamPaymentTypes.MODAL_STATE_STREAM_PAYMENT_DETAILS &&
            (
                <ReactCSSTransitionGroup
                    transitionName="modal-transition"
                    transitionEnterTimeout={MODAL_ANIMATION_TIMEOUT}
                    transitionLeaveTimeout={MODAL_ANIMATION_TIMEOUT}
                    key="streamsModals"
                >
                    <StreamDetails onClose={this.clean} />
                </ReactCSSTransitionGroup>
            ),
        ];
    }
}

StreamPayment.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    dispatch: PropTypes.func.isRequired,
    isThereActiveChannel: PropTypes.bool,
    lightningBalance: PropTypes.number.isRequired,
    lisStatus: PropTypes.string.isRequired,
    modalState: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    contacts: state.contacts.contacts,
    isThereActiveChannel: channelsSelectors.isThereActiveChannel(state),
    lightningBalance: state.account.lightningBalance,
    lisStatus: state.account.lisStatus,
    modalState: state.app.modalState,
});

export default connect(mapStateToProps)(StreamPayment);

