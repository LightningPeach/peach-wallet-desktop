import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import moment from "moment";
import DatePicker from "react-datepicker";

class Datepicker extends Component {
    constructor(props) {
        super(props);

        this.currentTime = moment().startOf("day");
        this.state = {
            from: this.currentTime,
            showInput: false,
            to: this.currentTime,
        };
    }

    componentDidMount() {
        document.addEventListener("keyup", this.handleKeyUp);
        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("touchend", this.handleTouchEnd);
    }

    componentWillUnmount() {
        document.removeEventListener("keyup", this.handleKeyUp);
        document.removeEventListener("mouseup", this.handleMouseUp);
        document.removeEventListener("touchend", this.handleTouchEnd);
    }

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
    };

    reset = () => {
        this.currentTime = moment().startOf("day");
        this.setState({
            from: this.currentTime,
            to: this.currentTime,
        });
    };

    render() {
        const { className } = this.props;
        return (
            <div className="picker">
                <button
                    className={`button button__hollow picker__target ${className} ${
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
                                        onClick={this.hideInput}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="button button__link"
                                        onClick={this.hideInput}
                                    >
                                        Ok
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
};

export default connect(null)(Datepicker);
