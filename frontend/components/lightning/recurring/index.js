import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, validators, helpers } from "additional";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";
import { accountOperations, accountTypes } from "modules/account";
import {
    streamPaymentOperations as streamOperations,
    streamPaymentTypes,
} from "modules/streamPayments";
import Select from "react-select";
import { lightningOperations } from "modules/lightning";
import BtcToUsd from "components/common/btc-to-usd";
import { appOperations } from "modules/app";
import { exceptions } from "config";
import {
    LIGHTNING_ID_LENGTH,
    MODAL_ANIMATION_TIMEOUT,
    ELEMENT_NAME_MAX_LENGTH,
    STREAM_INFINITE_TIME_VALUE,
    BTC_MEASURE,
    MBTC_MEASURE,
    SATOSHI_MEASURE,
    TIME_RANGE_MEASURE,
    MAX_INTERVAL_FREUENCY,
} from "config/consts";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { channelsSelectors } from "modules/channels";
import { error } from "modules/notifications";
import DigitsField from "components/ui/digits-field";
import Checkbox from "components/ui/checkbox";
import RecurringHistory from "./history";
import ToField from "../ui/to";
import { StreamDetails, EditStream, ActiveRecurringWarning } from "../modal";

const getInitialState = (params = {}) => {
    const initState = {
        amountError: null,
        frequency: 1,
        frequencyError: null,
        isInfinite: false,
        nameError: null,
        timeCurrency: TIME_RANGE_MEASURE[0].measure,
        timeError: null,
        toError: null,
        toValue: null,
        totalAmount: null,
        valueCurrency: null,
    };

    return { ...initState, ...params };
};

class RecurringPayment extends Component {
    constructor(props) {
        super(props);

        this.state = getInitialState({ valueCurrency: props.bitcoinMeasureType });
    }

    setName = () => {
        this.setState({
            nameError: null,
        });
    };

    setAmount = () => {
        this.setState({
            amountError: null,
        });
        this.setTotalAmount();
    };

    setTime = () => {
        this.setState({
            timeError: null,
        });
        this.setTotalAmount();
    };

    setTotalAmount = (isInfinite = this.state.isInfinite) => {
        const amount = parseFloat(this.amount.value.trim()) || null;
        const time = isInfinite
            ? STREAM_INFINITE_TIME_VALUE
            : Math.round(parseInt(this.time.value.trim(), 10)) || null;
        this.setState({
            totalAmount: time === STREAM_INFINITE_TIME_VALUE
                ? amount
                : amount && time ? amount * time : null,
        });
    };

    setFrequency = () => {
        const frequency = parseFloat(this.frequency.value.trim()) || null;
        this.setState({
            frequency,
            frequencyError: null,
        });
    };

    clean = () => {
        this.setState(getInitialState({ valueCurrency: this.props.bitcoinMeasureType }));
        this.form.reset();
        this.frequencyComponent.reset();
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

    toggleInfinite = () => {
        const isInfinite = !this.state.isInfinite;
        this.setState({
            isInfinite,
            timeError: null,
        });
        this.setTotalAmount(isInfinite);
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

    _validateFrequency = (frequency, measuredMax, measure) => {
        if (!frequency) {
            return exceptions.FIELD_IS_REQUIRED;
        } else if (frequency > MAX_INTERVAL_FREUENCY) {
            return exceptions.RECURRING_MORE_MAX_FREQUENCY(measuredMax, measure);
        }
        return null;
    };

    _validateTime = (time) => {
        if (time === STREAM_INFINITE_TIME_VALUE) {
            return null;
        } else if (!time) {
            return exceptions.FIELD_IS_REQUIRED;
        } else if (!Number.isFinite(time)) {
            return exceptions.FIELD_DIGITS_ONLY;
        } else if (time <= 0) {
            return exceptions.TIME_NEGATIVE;
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
        const time = this.state.isInfinite
            ? STREAM_INFINITE_TIME_VALUE
            : Math.round(parseInt(this.time.value.trim(), 10)) || 0;
        const frequency = Math.round(parseInt(this.frequency.value.trim(), 10)) || 0;
        let currency;
        switch (this.state.valueCurrency) {
            case "USD":
                currency = "USD";
                break;
            case BTC_MEASURE.btc:
            case MBTC_MEASURE.btc:
            case SATOSHI_MEASURE.btc:
                currency = "BTC";
                break;
            default:
                currency = "BTC";
                break;
        }
        let delayRange = 1000;
        TIME_RANGE_MEASURE.forEach((item) => {
            if (this.state.timeCurrency === item.measure) {
                delayRange = item.range;
            }
        });
        const delay = frequency * delayRange;

        const nameError = validators.validateName(name, false, true, true, undefined, true);
        const toError = validators.validateLightning(to);
        const amountError = dispatch(accountOperations.checkAmount(currency === "USD"
            ? dispatch(appOperations.convertUsdToCurrentMeasure(amount))
            : amount));
        const timeError = this._validateTime(time);
        const frequencyError = this._validateFrequency(
            delay,
            Math.floor(MAX_INTERVAL_FREUENCY / delayRange),
            this.state.timeCurrency,
        );

        if (nameError || toError || amountError || timeError || frequencyError) {
            this.setState({
                amountError, frequencyError, nameError, processing: false, timeError, toError,
            });
            return;
        }
        to = to.trim();
        this.setState({
            amountError, nameError, timeError, toError,
        });
        if (currency === "BTC") {
            amount = dispatch(appOperations.convertToSatoshi(amount));
        }

        const response = await dispatch(streamOperations.prepareStreamPayment(
            to,
            amount,
            delay,
            time,
            name,
            contact.contactName,
            currency,
        ));
        this.setState({ processing: false });
        if (!response.ok) {
            dispatch(error({ message: helpers.formatNotificationMessage(response.error) }));
            return;
        }
        dispatch(streamOperations.openStreamPaymentDetailsModal());
    };

    renderForm = () => {
        const { dispatch, bitcoinMeasureType, lisStatus } = this.props;
        const filledFrequency = this.state.frequency;
        const filledAmount = this.amount && this.amount.value.trim();
        return (
            <div className="block__row-xs">
                <div className="col-xs-12">
                    <form
                        className={`form form--recurring ${
                            (lisStatus !== accountTypes.LIS_UP && "stream__form--disabled") || ""
                        }`}
                        onSubmit={this.streamPay}
                        key={0}
                        ref={(ref) => {
                            this.form = ref;
                        }}
                    >
                        <div className="row">
                            <div className="col-xs-12 col-md-6">
                                <div className="block__row">
                                    <div className="col-xs-12">
                                        <div className="form-label">
                                            <label htmlFor="stream__name">Description</label>
                                        </div>
                                    </div>
                                    <div className="col-xs-12">
                                        <input
                                            id="stream__name"
                                            className={`form-text ${this.state.nameError ? "form-text__error" : ""}`}
                                            name="stream__name"
                                            placeholder="Optional"
                                            ref={(ref) => {
                                                this.name = ref;
                                            }}
                                            onChange={this.setName}
                                            disabled={this.state.processing}
                                            max={ELEMENT_NAME_MAX_LENGTH}
                                            maxLength={ELEMENT_NAME_MAX_LENGTH}
                                        />
                                    </div>
                                </div>
                                <ErrorFieldTooltip text={this.state.nameError} />
                            </div>
                            <div className="col-xs-12 col-md-6">
                                <div className="block__row">
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
                                    </div>
                                </div>
                                <ErrorFieldTooltip text={this.state.toError} />
                            </div>
                            <div className="col-xs-12 col-md-4">
                                <div className={`block__row connected-field ${filledFrequency
                                    ? "connected-field--filled"
                                    : ""}`}
                                >
                                    <div className="col-xs-6">
                                        <div className="row">
                                            <div className="col-xs-12">
                                                <div className="form-label">
                                                    <label htmlFor="stream__frequency">
                                                        Frequency
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-xs-12">
                                                <DigitsField
                                                    id="stream__frequency"
                                                    className={`connected-field__input form-text ${
                                                        this.state.frequencyError
                                                            ? "form-text__error"
                                                            : ""}`}
                                                    defaultValue="1"
                                                    pattern="above_zero_int"
                                                    name="stream__frequency"
                                                    placeholder="0"
                                                    ref={(ref) => {
                                                        this.frequencyComponent = ref;
                                                    }}
                                                    setRef={(ref) => {
                                                        this.frequency = ref;
                                                    }}
                                                    setOnChange={this.setFrequency}
                                                    disabled={this.state.processing}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xs-6">
                                        <div className="row">
                                            <div className="col-xs-12">
                                                <div className="form-label">
                                                    <label htmlFor="stream__frequency--currency">
                                                        Time unit
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-xs-12">
                                                <Select
                                                    id="stream__frequency--currency"
                                                    value={this.state.timeCurrency}
                                                    searchable={false}
                                                    options={TIME_RANGE_MEASURE.map(item => ({
                                                        label: item.measure,
                                                        value: item.measure,
                                                    }))}
                                                    onChange={(newOption) => {
                                                        this.setState({
                                                            timeCurrency: newOption.value,
                                                        });
                                                    }}
                                                    clearable={false}
                                                    ref={(ref) => {
                                                        this.timeCurrencySelect = ref;
                                                    }}
                                                    arrowRenderer={({ onMouseDown, isOpen }) => (<span
                                                        role="switch"
                                                        tabIndex={0}
                                                        aria-checked={false}
                                                        onMouseDown={() => {
                                                            !isOpen ? this.timeCurrencySelect.focus() : null; // eslint-disable-line
                                                        }}
                                                        className="Select-arrow"
                                                    />)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ErrorFieldTooltip text={this.state.frequencyError} />
                            </div>
                            <div className="col-xs-12 col-md-4">
                                <div className={`block__row connected-field ${filledAmount
                                    ? "connected-field--filled"
                                    : ""}`}
                                >
                                    <div className="col-xs-6">
                                        <div className="row">
                                            <div className="col-xs-12">
                                                <div className="form-label">
                                                    <label htmlFor="stream__amount">
                                                        Price per payment
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-xs-12">
                                                <DigitsField
                                                    id="stream__amount"
                                                    className={`form-text connected-field__input ${
                                                        this.state.amountError
                                                            ? "form-text__error"
                                                            : ""}`}
                                                    name="stream__amount"
                                                    pattern={this.state.valueCurrency === "Satoshi"
                                                        ? "above_zero_int"
                                                        : "above_zero_float"}
                                                    placeholder={this.state.valueCurrency === "Satoshi"
                                                        ? "0"
                                                        : "0.0"}
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
                                    <div className="col-xs-6">
                                        <div className="row">
                                            <div className="col-xs-12">
                                                <div className="form-label">
                                                    <label htmlFor="stream__amount--currency">
                                                        Value unit
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-xs-12">
                                                <Select
                                                    id="stream__amount--currency"
                                                    value={this.state.valueCurrency}
                                                    searchable={false}
                                                    options={[
                                                        { label: "USD", value: "USD" },
                                                        { label: bitcoinMeasureType, value: bitcoinMeasureType },
                                                    ]}
                                                    onChange={(newOption) => {
                                                        this.setState({
                                                            valueCurrency: newOption.value,
                                                        });
                                                    }}
                                                    clearable={false}
                                                    ref={(ref) => {
                                                        this.valueCurrencySelect = ref;
                                                    }}
                                                    arrowRenderer={({ onMouseDown, isOpen }) => (<span
                                                        role="switch"
                                                        tabIndex={0}
                                                        aria-checked={false}
                                                        onMouseDown={() => {
                                                            !isOpen ? this.valueCurrencySelect.focus() : null; // eslint-disable-line
                                                        }}
                                                        className="Select-arrow"
                                                    />)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ErrorFieldTooltip text={this.state.amountError} />
                            </div>
                            <div className="col-xs-12 col-md-4">
                                <div className="block__row">
                                    <div className="col-xs-12">
                                        <div className="form-label">
                                            <label htmlFor="stream__payments-number">
                                                Number of payments
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className={`col-xs-12 check-input ${this.state.isInfinite
                                        ? "check-input--checked"
                                        : ""}`}
                                    >
                                        <DigitsField
                                            id="stream__payments-number"
                                            className={`form-text ${this.state.timeError ? "form-text__error" : ""}`}
                                            name="stream__payments-number"
                                            pattern="above_zero_int"
                                            placeholder="0"
                                            ref={(ref) => {
                                                this.timeComponent = ref;
                                            }}
                                            setRef={(ref) => {
                                                this.time = ref;
                                            }}
                                            setOnChange={this.setTime}
                                            disabled={this.state.isInfinite}
                                        />
                                        <Checkbox
                                            text="Infinite"
                                            checked={this.state.isInfinite}
                                            onChange={this.toggleInfinite}
                                            class="check-input__checkbox"
                                        />
                                    </div>
                                </div>
                                <ErrorFieldTooltip text={this.state.timeError} />
                            </div>
                        </div>
                        <div className="block__row-xs">
                            <div className="col-xs-12 col-md-8">
                                {this.state.totalAmount &&
                                <div className="block__row row--no-col justify-end-xs">
                                    <span className="form-usd">
                                        <BtcToUsd
                                            amount={this.state.valueCurrency === "USD"
                                                ? this.state.totalAmount
                                                : dispatch(appOperations.convertToSatoshi(this.state.totalAmount))}
                                            reversed={this.state.valueCurrency === "USD"}
                                        />
                                        {this.state.isInfinite && " per payment"}
                                    </span>
                                </div>
                                }
                            </div>
                            <div className="col-xs-12 col-md-4">
                                <div className="block__row">
                                    <div className="col-xs-12">
                                        <button
                                            type="submit"
                                            className="button button__solid button--fullwide"
                                            disabled={this.state.processing}
                                        >
                                            Create payment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {lisStatus !== accountTypes.LIS_UP && (
                            <div className="stream__disabled">
                                <span>Recurring payment temporarily disabled</span>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        );
    };

    renderStandardBody = () => {
        const { dispatch } = this.props;
        return (
            <div className="block__row-lg">
                <div className="col-xs-12">
                    Recurring Payments are only available in the&nbsp;
                    <button
                        className="link"
                        onClick={() => dispatch(accountOperations.openWalletModeModal())}
                    >
                        Extended Mode
                    </button>.
                </div>
            </div>
        );
    };

    render() {
        const { modalState, walletMode } = this.props;
        let modal;
        switch (modalState) {
            case streamPaymentTypes.MODAL_STATE_STREAM_PAYMENT_DETAILS:
                modal = <StreamDetails onClose={this.clean} />;
                break;
            case streamPaymentTypes.MODAL_STATE_ACTIVE_RECURRING_WARNING:
                modal = <ActiveRecurringWarning />;
                break;
            case streamPaymentTypes.MODAL_STATE_EDIT_STREAM_PAYMENT:
                modal = <EditStream />;
                break;
            default:
                modal = null;
        }
        return (
            <Fragment>
                {walletMode === accountTypes.WALLET_MODE.EXTENDED
                    ? this.renderForm()
                    : this.renderStandardBody()
                }
                <RecurringHistory />
                <ReactCSSTransitionGroup
                    transitionName="modal-transition"
                    transitionEnterTimeout={MODAL_ANIMATION_TIMEOUT}
                    transitionLeaveTimeout={MODAL_ANIMATION_TIMEOUT}
                    key="streamsModals"
                >
                    {modal}
                </ReactCSSTransitionGroup>
            </Fragment>
        );
    }
}

RecurringPayment.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    dispatch: PropTypes.func.isRequired,
    isThereActiveChannel: PropTypes.bool,
    lisStatus: PropTypes.string.isRequired,
    modalState: PropTypes.string.isRequired,
    walletMode: PropTypes.oneOf(accountTypes.WALLET_MODES_LIST),
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    contacts: state.contacts.contacts,
    isThereActiveChannel: channelsSelectors.isThereActiveChannel(state),
    lisStatus: state.account.lisStatus,
    modalState: state.app.modalState,
    walletMode: state.account.walletMode,
});

export default connect(mapStateToProps)(RecurringPayment);

