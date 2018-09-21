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
import Select from "react-select";
import { lightningOperations } from "modules/lightning";
import BtcToUsd from "components/common/btc-to-usd";
import { appOperations } from "modules/app";
import * as statusCodes from "config/status-codes";
import {
    LIGHTNING_ID_LENGTH,
    MODAL_ANIMATION_TIMEOUT,
    USERNAME_MAX_LENGTH,
    STREAM_INFINITE_TIME_VALUE,
} from "config/consts";
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
        frequencyError: null,
        nameError: null,
        textError: null,
        timeCurrency: "seconds",
        timeError: null,
        toError: null,
        toValue: null,
        valueCurrency: null,
    };

    return { ...initState, ...params };
};

class NewStreamPayment extends Component {
    constructor(props) {
        super(props);

        this.state = getInitialState({ valueCurrency: props.bitcoinMeasureType });
    }

    setAmount = () => {
        const amount = parseFloat(this.amount.value.trim()) || null;
        const time = parseInt(this.time.value.trim(), 10) || null;
        this.setState({
            amount: amount && time ? amount * time : null,
            amountError: null,
            timeError: null,
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

    _validateFrequency = (frequency) => {
        if (!frequency) {
            return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
        }
        return null;
    };

    _validateTime = (time) => {
        if (time === STREAM_INFINITE_TIME_VALUE) {
            return null;
        } else if (!Number.isFinite(time)) {
            return statusCodes.EXCEPTION_FIELD_DIGITS_ONLY;
        } else if (time <= 0) {
            return statusCodes.EXCEPTION_TIME_NEGATIVE;
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
        const time = Math.round(parseInt(this.time.value.trim(), 10)) || STREAM_INFINITE_TIME_VALUE;
        const frequency = parseInt(this.frequency.value.trim(), 10) || 0;

        const nameError = validators.validateName(name, false, true, true, undefined, true);
        const toError = validators.validateLightning(to);
        const amountError = dispatch(accountOperations.checkAmount(amount));
        const timeError = this._validateTime(time);
        const frequencyError = this._validateFrequency(frequency);

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
        amount = dispatch(appOperations.convertToSatoshi(amount));
        let delay = 1000;
        switch (this.state.timeCurrency) {
            case "seconds":
                delay *= 1;
                break;
            case "minutes":
                delay *= 60;
                break;
            case "hours":
                delay *= 60 * 60;
                break;
            case "days":
                delay *= 60 * 60 * 24;
                break;
            case "weeks":
                delay *= 60 * 60 * 24 * 7;
                break;
            case "months":
                delay *= 60 * 60 * 24 * 7 * 30;
                break;
            default:
        }
        delay *= frequency;
        const response = await dispatch(streamOperations.prepareStreamPayment(
            to,
            amount,
            delay,
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
        const formClass =
            `send form new-stream ${(lisStatus !== accountTypes.LIS_UP && "stream__form--disabled") || ""}`;
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
                    <div className="col-xs-12 col-md-8">
                        <div className="row form-row">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="stream__name">New Stream Name</label>
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
                                    max={USERNAME_MAX_LENGTH}
                                    maxLength={USERNAME_MAX_LENGTH}
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
                    </div>
                    <div className="col-xs-12 col-md-4">
                        <div className="row form-row">
                            <div className="col-xs-12">
                                <div className="row">
                                    <div className="col-xs-12">
                                        <div className="form-label">
                                            <label htmlFor="stream__amount">
                                                Time unit
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-xs-12">
                                        <Select
                                            id="stream__currency--time"
                                            value={this.state.timeCurrency}
                                            searchable={false}
                                            options={[
                                                { label: "seconds", value: "seconds" },
                                                { label: "minutes", value: "minutes" },
                                                { label: "hours", value: "hours" },
                                                { label: "days", value: "days" },
                                                { label: "weeks", value: "weeks" },
                                                { label: "months", value: "months" },
                                            ]}
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
                        <div className="row form-row">
                            <div className="col-xs-12">
                                <div className="row">
                                    <div className="col-xs-12">
                                        <div className="form-label">
                                            <label htmlFor="stream__amount">
                                                Value unit
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-xs-12">
                                        <Select
                                            id="stream__currency--time"
                                            value={this.state.valueCurrency}
                                            searchable={false}
                                            options={[
                                                { label: "USD", value: "USD" },
                                                { label: bitcoinMeasureType, value: bitcoinMeasureType },
                                            ]}
                                            onChange={(newOption) => {
                                                this.setDelay(newOption.value);
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
                    </div>
                </div>
                <div className="row form-row">
                    <div className="col-xs-12 col-md-8">
                        <div className="row">
                            <div className="col-xs-6 stream__price-time">
                                <div className="row">
                                    <div className="col-xs-12">
                                        <div className="form-label">
                                            <label htmlFor="stream__amount">
                                                Price per payment in {this.state.valueCurrency}
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
                                            pattern={this.state.valueCurrency === "Satoshi"
                                                ? "above_zero_int"
                                                : "above_zero_float"}
                                            placeholder={`${
                                                this.state.valueCurrency === "Satoshi"
                                                || this.state.valueCurrency === "USD"
                                                    ? "0"
                                                    : "0.0"
                                            } ${this.state.valueCurrency}`}
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
                                                Number of payments
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
                                            pattern="above_zero_int"
                                            placeholder={STREAM_INFINITE_TIME_VALUE}
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
                            <div className="col-xs-6 stream__price-time">
                                <div className="row">
                                    <div className="col-xs-12">
                                        <div className="form-label">
                                            <label htmlFor="stream__amount">
                                                Frequency
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-xs-12">
                                        <DigitsField
                                            id="stream__frequency"
                                            className={`form-text ${this.state.frequencyError
                                                ? "form-text__error"
                                                : ""
                                            }`}
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
                                        <ErrorFieldTooltip text={this.state.frequencyError} />
                                    </div>
                                </div>
                            </div>
                        </div>
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

NewStreamPayment.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    dispatch: PropTypes.func.isRequired,
    isThereActiveChannel: PropTypes.bool,
    lisStatus: PropTypes.string.isRequired,
    modalState: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    contacts: state.contacts.contacts,
    isThereActiveChannel: channelsSelectors.isThereActiveChannel(state),
    lisStatus: state.account.lisStatus,
    modalState: state.app.modalState,
});

export default connect(mapStateToProps)(NewStreamPayment);

