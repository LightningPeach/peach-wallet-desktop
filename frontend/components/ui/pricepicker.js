import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import isEqual from "lodash/isEqual";
import DigitsField from "components/ui/digitsField";

class Pricepicker extends Component {
    constructor(props) {
        super(props);

        const { from, to, currency } = this.props.price;
        this.state = {
            currency: currency || this.props.bitcoinMeasureType,
            from,
            showInput: false,
            to,
        };
    }

    componentDidMount() {
        document.addEventListener("keyup", this.handleKeyUp);
        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("touchend", this.handleTouchEnd);
    }

    componentWillReceiveProps(nextProps) {
        const { from, to, currency } = nextProps.price;
        if (!isEqual(nextProps.price, this.props.price)) {
            this.setState({
                currency: currency || this.props.bitcoinMeasureType,
                from,
                to,
            });
        }
    }

    componentWillUnmount() {
        document.removeEventListener("keyup", this.handleKeyUp);
        document.removeEventListener("mouseup", this.handleMouseUp);
        document.removeEventListener("touchend", this.handleTouchEnd);
    }

    setData = () => {
        this.props.setData({
            currency: this.state.currency,
            from: this.state.from,
            to: this.state.to,
        });
        this.hideInput();
    };

    setFromPrice = () => {
        this.setState({
            from: this.priceFrom.value.trim(),
        });
    };

    setToPrice = () => {
        this.setState({
            to: this.priceTo.value.trim(),
        });
    };

    setCurrency = (e) => {
        this.setState({
            currency: e.target.getAttribute("data-name"),
        });
    };

    handleKeyUp = (e) => {
        if (this.state.showInput && e.keyCode === 27) {
            this.hideInput();
        }
    };

    handleMouseUp = (e) => {
        if (this.state.showInput && !this.input.contains(e.target)) {
            this.hideInput();
        }
    };

    handleTouchEnd = (e) => {
        if (this.state.showInput && !this.input.contains(e.target)) {
            this.hideInput();
        }
    };

    hideInput = () => {
        this.setState({
            showInput: false,
        });
    };

    toggleDateInput = () => {
        this.setState({
            showInput: !this.state.showInput,
        });
    };

    handleCancel = () => {
        const { from, to, currency } = this.props.price;
        const { bitcoinMeasureType } = this.props;
        this.setState({
            currency: currency || bitcoinMeasureType,
            from: from || null,
            to: to || null,
        });
        this.hideInput();
    };

    reset = () => {
        this.props.reset();
        this.priceFromComponent.reset();
        this.priceToComponent.reset();
        this.hideInput();
    };

    render() {
        const { className, bitcoinMeasureType } = this.props;
        return (
            <div className="picker">
                <button
                    className={`button button__hollow picker__target picker__target--price ${className} ${
                        this.state.showInput ? "active" : ""
                    }`}
                    onClick={this.toggleDateInput}
                >
                    Price range
                </button>
                {this.state.showInput &&
                <div
                    className="picker__collapse"
                    ref={(ref) => { this.input = ref }}
                >
                    <div className="picker__row mt-14">
                        <div className="picker__label">
                            From
                        </div>
                        <DigitsField
                            id="price__from"
                            className="form-text form-text--long"
                            value={this.state.from}
                            pattern={this.state.currency === "Satoshi"
                                ? "above_zero_int"
                                : "above_zero_float"}
                            name="price__from"
                            placeholder="0"
                            ref={(ref) => {
                                this.priceFromComponent = ref;
                            }}
                            setRef={(ref) => {
                                this.priceFrom = ref;
                            }}
                            setOnChange={this.setFromPrice}
                        />
                    </div>
                    <div className="picker__row mt-14">
                        <div className="picker__label">
                            To
                        </div>
                        <DigitsField
                            id="price__to"
                            className="form-text form-text--long"
                            value={this.state.to}
                            pattern={this.state.currency === "Satoshi"
                                ? "above_zero_int"
                                : "above_zero_float"}
                            name="price__to"
                            placeholder="0"
                            ref={(ref) => {
                                this.priceToComponent = ref;
                            }}
                            setRef={(ref) => {
                                this.priceTo = ref;
                            }}
                            setOnChange={this.setToPrice}
                        />
                    </div>
                    <div className="picker__row picker__row--end">
                        <button
                            className={`button button__link ${
                                this.state.currency === bitcoinMeasureType
                                    ? "active"
                                    : ""
                            }`}
                            onClick={this.setCurrency}
                            data-name={bitcoinMeasureType}
                        >
                            {bitcoinMeasureType}
                        </button>
                        <button
                            className={`button button__link ${
                                this.state.currency === "USD"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={this.setCurrency}
                            data-name="USD"
                        >
                            USD
                        </button>
                    </div>
                    <div className="picker__row picker__row--controls">
                        <button
                            className="button button__link"
                            onClick={this.reset}
                        >
                            Reset
                        </button>
                        <div className="picker__group">
                            <button
                                className="button button__link"
                                onClick={this.handleCancel}
                            >
                                Cancel
                            </button>
                            <button
                                className="button button__link"
                                onClick={this.setData}
                                disabled={!(
                                    this.state.from
                                    && this.state.to
                                )}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
                }
            </div>
        );
    }
}

Pricepicker.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    className: PropTypes.string,
    price: PropTypes.shape({
        currency: PropTypes.string,
        from: PropTypes.string,
        to: PropTypes.string,
    }).isRequired,
    reset: PropTypes.func.isRequired,
    setData: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
});

export default connect(mapStateToProps)(Pricepicker);
