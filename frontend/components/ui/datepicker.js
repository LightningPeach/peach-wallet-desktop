import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import isEqual from "lodash/isEqual";
import moment from "moment";
import DatePicker from "react-datepicker";

class Datepicker extends Component {
    constructor(props) {
        super(props);

        this.state = {
            from: this.props.date.from || moment().startOf("day"),
            showInput: false,
            to: this.props.date.to || moment().startOf("day"),
        };
    }

    componentDidMount() {
        document.addEventListener("keyup", this.handleKeyUp);
        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("touchend", this.handleTouchEnd);
    }

    componentWillReceiveProps(nextProps) {
        const { from, to } = nextProps.date;
        if (!isEqual(nextProps.date, this.props.date)) {
            this.setState({
                from: from || moment().startOf("day"),
                to: to || moment().startOf("day"),
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
            from: this.state.from,
            to: this.state.to,
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

    handleDateChange = (value) => {
        const date = moment(value);
        let { from, to } = this.state;
        if (from.isSame(to, "day")) {
            if (date.isBefore(from, "day")) {
                from = date;
            } else {
                to = date;
            }
        } else if (from.isSame(date, "day")) {
            from = to;
        } else if (to.isSame(date, "day")) {
            to = from;
        } else if (date.isBefore(from)) {
            from = date;
        } else {
            to = date;
        }
        this.setState({
            from,
            to,
        });
        this.hideInput();
    };

    handleCancel = () => {
        const { from, to } = this.props.date;
        this.setState({
            from: from || moment().startOf("day"),
            to: to || moment().startOf("day"),
        });
        this.hideInput();
    };

    reset = () => {
        this.props.reset();
        this.hideInput();
    };

    render() {
        const { className } = this.props;
        return (
            <div className="picker">
                <button
                    className={`button button__hollow picker__target picker__target--date ${className} ${
                        this.state.showInput ? "active" : ""
                    }`}
                    onClick={this.toggleDateInput}
                >
                    Date range
                </button>
                {this.state.showInput &&
                    <div
                        className="picker__collapse"
                        ref={(ref) => { this.input = ref }}
                    >
                        <DatePicker
                            startDate={this.state.from}
                            endDate={this.state.to}
                            onChange={this.handleDateChange}
                            shouldCloseOnSelect={false}
                            inline
                        >
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
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </DatePicker>
                    </div>
                }
            </div>
        );
    }
}

Datepicker.propTypes = {
    className: PropTypes.string,
    date: PropTypes.shape({
        from: PropTypes.instanceOf(moment),
        to: PropTypes.instanceOf(moment),
    }).isRequired,
    reset: PropTypes.func.isRequired,
    setData: PropTypes.func.isRequired,
};

export default connect(null)(Datepicker);
