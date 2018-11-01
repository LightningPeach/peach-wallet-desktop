import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select from "react-select";
import { analytics, validators, logger, helpers } from "additional";
import { appOperations } from "modules/app";
import {
    streamPaymentActions as actions,
    streamPaymentOperations as operations,
} from "modules/streamPayments";
import { error, info } from "modules/notifications";
import { LightningFullPath } from "routes";
import Modal from "components/modal";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";
import { statusCodes } from "config";
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
import DigitsField from "components/ui/digits-field";
import Checkbox from "components/ui/checkbox";

class EditStream extends Component {
    constructor(props) {
        super(props);
        this.state = {
            amountError: null,
            frequency: 1,
            frequencyError: null,
            isInfinite: props.currentStream.totalParts === STREAM_INFINITE_TIME_VALUE,
            nameError: null,
            textError: null,
            timeCurrency: helpers.formatTimeRange(props.currentStream.delay).split(" ")[1],
            timeError: null,
            toError: null,
            toValue: null,
            totalAmount: null,
            valueCurrency: null,
        };

        analytics.pageview(`${LightningFullPath}/recurring/details`, "Lightning / Recurring Payment / Edit");
    }

    showErrorNotification = (text) => {
        const { dispatch } = this.props;
        dispatch(error({
            action: {
                callback: () => dispatch(operations.openEditStreamModal()),
                label: "Retry",
            },
            message: helpers.formatNotificationMessage(text),
        }));
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

    _validateFrequency = (frequency, measuredMax, measure) => {
        if (!frequency) {
            return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
        } else if (frequency > MAX_INTERVAL_FREUENCY) {
            return statusCodes.EXCEPTION_RECURRING_MORE_MAX_FREQUENCY(measuredMax, measure);
        }
        return null;
    };

    _validateTime = (time) => {
        if (time === STREAM_INFINITE_TIME_VALUE) {
            return null;
        } else if (!time) {
            return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
        } else if (!Number.isFinite(time)) {
            return statusCodes.EXCEPTION_FIELD_DIGITS_ONLY;
        } else if (time <= 0) {
            return statusCodes.EXCEPTION_TIME_NEGATIVE;
        }
        return null;
    };

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Edit Recurring Modal", category: "Lightning", label: "Close" });
        dispatch(actions.setCurrentStream(null));
        dispatch(appOperations.closeModal());
    };

    updateStream = async (e) => {
        e.preventDefault();
        analytics.event({ action: "Edit Recurring Modal", category: "Lightning", label: "Edit" });
    };

    render() {
        console.log("EDIT");
        const { currentStream } = this.props;
        console.log(currentStream);
        const filledFrequency = this.state.frequency;
        const filledAmount = this.amount && this.amount.value.trim();
        if (!currentStream) {
            logger.log("Cant show Edit stream cause currentStream not provided");
            return null;
        }
        return (
            <Modal title="Edit recurring payment" onClose={this.closeModal} showCloseButton>
                <form
                    className="send form"
                    onSubmit={this.updateStream}
                >
                    <div className="modal-body">
                        <div className="row mt-m14">
                            <div className="col-xs-12 col-sm-6">
                                <div className="row mt-14">
                                    <div className="col-xs-12">
                                        <div className="form-label">
                                            <label htmlFor="stream__name">Name of Payment</label>
                                        </div>
                                    </div>
                                    <div className="col-xs-12">
                                        <input
                                            id="stream__name"
                                            className={`form-text ${this.state.nameError ? "form-text__error" : ""}`}
                                            name="stream__name"
                                            placeholder="Enter name"
                                            value={currentStream.name}
                                            ref={(ref) => {
                                                this.name = ref;
                                            }}
                                            onChange={() => this.setState({ nameError: null })}
                                            disabled={this.state.processing}
                                            max={ELEMENT_NAME_MAX_LENGTH}
                                            maxLength={ELEMENT_NAME_MAX_LENGTH}
                                        />
                                    </div>
                                </div>
                                <ErrorFieldTooltip text={this.state.nameError} />
                            </div>
                            <div className="col-xs-12 col-sm-6">
                                <div className="row mt-14">
                                    <div className="col-xs-12">
                                        <div className="form-label">
                                            <label htmlFor="stream__to">To</label>
                                        </div>
                                    </div>
                                    <div className="col-xs-12">
                                        <input
                                            className="form-text"
                                            value={currentStream.tempAddress}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <ErrorFieldTooltip text={this.state.toError} />
                            </div>
                            <div className="col-xs-12 col-sm-4">
                                <div className={`row mt-14 connected-field ${filledFrequency
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
                                                        this.state.frequencyError ? "form-text__error" : ""}`}
                                                    value={helpers.formatTimeRange(currentStream.delay).split(" ")[0]}
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
                            <div className="col-xs-12 col-sm-4">
                                <div className={`row mt-14 connected-field ${filledAmount
                                    ? "connected-field--filled"
                                    : ""}`}
                                >
                                    <div className="col-xs-6">
                                        <div className="row">
                                            <div className="col-xs-12">
                                                <div className="form-label">
                                                    <label htmlFor="stream__amount">
                                                        Price
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
                                                    value={currentStream.price}
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
                                                <input
                                                    className="form-text Select-control"
                                                    value={currentStream.currency}
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ErrorFieldTooltip text={this.state.amountError} />
                            </div>
                            <div className="col-xs-12 col-sm-4">
                                <div className="row mt-14">
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
                                            value={currentStream.totalParts || ""}
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
                                    className="button button__orange button__close"
                                    type="submit"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>
        );
    }
}

EditStream.propTypes = {
    currentStream: PropTypes.shape(),
    dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    currentStream: state.streamPayment.currentStream,
});

export default connect(mapStateToProps)(EditStream);
