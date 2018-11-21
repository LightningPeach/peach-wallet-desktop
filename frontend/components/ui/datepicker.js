import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import isEqual from "lodash/isEqual";
import moment from "moment";
import DatePicker from "react-datepicker";
import Popper from "components/ui/popper";

class Datepicker extends Component {
    constructor(props) {
        super(props);

        this.state = {
            from: this.props.date.from || moment().startOf("day"),
            showInput: false,
            to: this.props.date.to || moment().startOf("day"),
        };
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
        const { className, date } = this.props;
        const filled = date.from && date.to;
        return (
            <div className="picker">
                <button
                    className={`button button__hollow picker__target picker__target--date ${className} ${
                        this.state.showInput || filled
                            ? "active" : ""
                    }`}
                    onClick={this.toggleDateInput}
                >
                    {filled
                        ? (
                            <div className="picker__target--fill">
                                <span>{date.from.format("DD.MM.YYYY")}</span>
                                {!date.from.isSame(date.to, "day") &&
                                    <Fragment>
                                        <br />
                                        <span>{date.to.format("DD.MM.YYYY")}</span>
                                    </Fragment>
                                }
                            </div>
                        )
                        : "Date range"
                    }
                </button>
                {this.state.showInput &&
                    <Popper
                        className="picker__collapse"
                        onClose={this.hideInput}
                        closeWithEsc
                        verticalDiff={46}
                        horizontalDiff={130}
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
                    </Popper>
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
