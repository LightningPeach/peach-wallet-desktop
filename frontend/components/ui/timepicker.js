import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import isEqual from "lodash/isEqual";
import DigitsField from "components/ui/digits-field";
import Popper from "components/ui/popper";

class Timepicker extends Component {
    constructor(props) {
        super(props);

        const { from, to } = this.props.time;
        this.state = {
            from: {
                hours: from.hours,
                meridiem: from.meridiem,
                minutes: from.minutes,
            },
            showInput: false,
            to: {
                hours: to.hours,
                meridiem: to.meridiem,
                minutes: to.minutes,
            },
        };
    }

    componentWillReceiveProps(nextProps) {
        const { from, to } = nextProps.time;
        if (!isEqual(nextProps.time, this.props.time)) {
            this.setState({
                from,
                to,
            });
        }
    }

    setFromMeridiem = (e) => {
        this.setState({
            from: {
                ...this.state.from,
                meridiem: e.target.getAttribute("data-name"),
            },
        });
    };

    setFromHours = () => {
        this.setState({
            from: {
                ...this.state.from,
                hours: this.dateFromHours.value.trim(),
            },
        });
    };

    setFromMinutes = () => {
        this.setState({
            from: {
                ...this.state.from,
                minutes: this.dateFromMinutes.value.trim(),
            },
        });
    };

    setToMeridiem = (e) => {
        this.setState({
            to: {
                ...this.state.to,
                meridiem: e.target.getAttribute("data-name"),
            },
        });
    };

    setToHours = () => {
        this.setState({
            to: {
                ...this.state.to,
                hours: this.dateToHours.value.trim(),
            },
        });
    };

    setToMinutes = () => {
        this.setState({
            to: {
                ...this.state.to,
                minutes: this.dateToMinutes.value.trim(),
            },
        });
    };

    setData = () => {
        this.props.setData({
            from: this.state.from,
            to: this.state.to,
        });
        this.hideInput();
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
        const { from, to } = this.props.time;
        this.setState({
            from: {
                hours: from.hours,
                meridiem: from.meridiem,
                minutes: from.minutes,
            },
            to: {
                hours: to.hours,
                meridiem: to.meridiem,
                minutes: to.minutes,
            },
        });
        this.hideInput();
    };

    reset = () => {
        this.props.reset();
        this.dateFromHoursComponent.reset();
        this.dateFromMinutesComponent.reset();
        this.dateToHoursComponent.reset();
        this.dateToMinutesComponent.reset();
        this.hideInput();
    };

    render() {
        const { className, time } = this.props;
        const filled = (time.from.minutes && time.from.hours) || (time.to.minutes && time.to.hours);
        return (
            <div className="picker">
                <button
                    className={`button button__hollow picker__target  picker__target--time ${className} ${
                        this.state.showInput || filled
                            ? "active" : ""
                    }`}
                    onClick={this.toggleDateInput}
                >
                    {filled
                        ? (
                            <div className="picker__target--fill">
                                <span>{`${time.from.hours}:${time.from.minutes} ${time.from.meridiem}`}</span>
                                <br />
                                <span>{`${time.to.hours}:${time.to.minutes} ${time.to.meridiem}`}</span>
                            </div>
                        )
                        : "Time range"
                    }
                </button>
                {this.state.showInput &&
                    <Popper
                        className="picker__collapse"
                        onClose={this.hideInput}
                        closeWithEsc
                    >
                        <div className="picker__row mt-14">
                            <div className="picker__label">
                                From
                            </div>
                            <div className="picker__group">
                                <DigitsField
                                    id="date__from-hours"
                                    className="form-text form-text--right"
                                    value={this.state.from.hours}
                                    pattern={/^(0?[0-9]|1[0-1])$/}
                                    name="date__from-hours"
                                    placeholder="00"
                                    ref={(ref) => {
                                        this.dateFromHoursComponent = ref;
                                    }}
                                    setRef={(ref) => {
                                        this.dateFromHours = ref;
                                    }}
                                    setOnChange={this.setFromHours}
                                />
                                <span className="picker__text--xl">:</span>
                                <DigitsField
                                    id="date__from-minutes"
                                    className="form-text"
                                    value={this.state.from.minutes}
                                    pattern={/^([0-5]?[0-9])$/}
                                    name="date__from-minutes"
                                    placeholder="00"
                                    ref={(ref) => {
                                        this.dateFromMinutesComponent = ref;
                                    }}
                                    setRef={(ref) => {
                                        this.dateFromMinutes = ref;
                                    }}
                                    setOnChange={this.setFromMinutes}
                                />
                            </div>
                            <div className="picker__group picker__group--vertical">
                                <button
                                    className={`button button__link ${this.state.from.meridiem === "AM"
                                        ? "active" : ""}`}
                                    onClick={this.setFromMeridiem}
                                    data-name="AM"
                                >
                                    AM
                                </button>
                                <button
                                    className={`button button__link ${this.state.from.meridiem === "PM"
                                        ? "active" : ""}`}
                                    onClick={this.setFromMeridiem}
                                    data-name="PM"
                                >
                                    PM
                                </button>
                            </div>
                        </div>
                        <div className="picker__row mt-14">
                            <div className="picker__label">
                                To
                            </div>
                            <div className="picker__group">
                                <DigitsField
                                    id="date__to-hours"
                                    className="form-text form-text--right"
                                    value={this.state.to.hours}
                                    pattern={/^(0?[0-9]|1[0-1])$/}
                                    name="date__to-hours"
                                    placeholder="00"
                                    ref={(ref) => {
                                        this.dateToHoursComponent = ref;
                                    }}
                                    setRef={(ref) => {
                                        this.dateToHours = ref;
                                    }}
                                    setOnChange={this.setToHours}
                                />
                                <span className="picker__text--xl">:</span>
                                <DigitsField
                                    id="date__to-minutes"
                                    className="form-text"
                                    value={this.state.to.minutes}
                                    pattern={/^([0-5]?[0-9])$/}
                                    name="date__to-minutes"
                                    placeholder="00"
                                    ref={(ref) => {
                                        this.dateToMinutesComponent = ref;
                                    }}
                                    setRef={(ref) => {
                                        this.dateToMinutes = ref;
                                    }}
                                    setOnChange={this.setToMinutes}
                                />
                            </div>
                            <div className="picker__group picker__group--vertical">
                                <button
                                    className={`button button__link ${this.state.to.meridiem === "AM"
                                        ? "active" : ""}`}
                                    onClick={this.setToMeridiem}
                                    data-name="AM"
                                >
                                    AM
                                </button>
                                <button
                                    className={`button button__link ${this.state.to.meridiem === "PM"
                                        ? "active" : ""}`}
                                    onClick={this.setToMeridiem}
                                    data-name="PM"
                                >
                                    PM
                                </button>
                            </div>
                        </div>
                        <div className="picker__row picker__row--controls mt-14">
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
                                        (this.state.from.minutes
                                        && this.state.from.hours)
                                        || (this.state.to.minutes
                                        && this.state.to.hours)
                                    )}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </Popper>
                }
            </div>
        );
    }
}

Timepicker.propTypes = {
    className: PropTypes.string,
    reset: PropTypes.func.isRequired,
    setData: PropTypes.func.isRequired,
    time: PropTypes.shape({
        from: PropTypes.shape({
            hours: PropTypes.string,
            meridiem: PropTypes.oneOf(["AM", "PM"]).isRequired,
            minutes: PropTypes.string,
        }).isRequired,
        to: PropTypes.shape({
            hours: PropTypes.string,
            meridiem: PropTypes.oneOf(["AM", "PM"]).isRequired,
            minutes: PropTypes.string,
        }).isRequired,
    }).isRequired,
};

export default connect(null)(Timepicker);
