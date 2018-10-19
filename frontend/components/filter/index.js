import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { filterActions, filterTypes } from "modules/filter";
import DebounceInput from "react-debounce-input";
import Datepicker from "components/ui/datepicker";
import Timepicker from "components/ui/timepicker";
import Pricepicker from "components/ui/pricepicker";

class Filter extends Component {
    constructor(props) {
        super(props);
        this.initState = {
            date: {
                from: null,
                to: null,
            },
            price: {
                currency: this.props.bitcoinMeasureType,
                from: null,
                to: null,
            },
            searchValue: "",
            time: {
                from: {
                    hours: null,
                    meridiem: filterTypes.ANTE_MERIDIEM,
                    minutes: null,
                },
                to: {
                    hours: null,
                    meridiem: filterTypes.ANTE_MERIDIEM,
                    minutes: null,
                },
            },
            type: filterTypes.ALL_PAYMENTS,
        };
        this.setFilter = (details = {}) => {
            const { source, dispatch } = this.props;
            switch (source) {
                case filterTypes.TYPE_REGULAR:
                    dispatch(filterActions.setRegularFilterPart(details));
                    break;
                case filterTypes.TYPE_RECURRING:
                    dispatch(filterActions.setRecurringFilterPart(details));
                    break;
                case filterTypes.TYPE_ONCHAIN:
                    dispatch(filterActions.setOnchainFilterPart(details));
                    break;
                default:
                    break;
            }
        };
        this.setFilter(this.initState);

        this.state = this.initState;
    }

    handleSearchChange = (e) => {
        this.setState({
            searchValue: e.target.value.trim(),
        });
    };

    handleTypeChange = (e) => {
        this.setState({
            type: e.target.getAttribute("data-name"),
        });
    };

    handleDateChange = (date) => {
        this.setState({
            date,
        });
        this.setFilter({ date });
    };

    handleTimeChange = (time) => {
        this.setState({
            time,
        });
        this.setFilter({ time });
    };

    handlePriceChange = (price) => {
        this.setState({
            price,
        });
        this.setFilter({ price });
    };

    handleFilterReset = () => {
        const { dispatch } = this.props;
        dispatch(filterActions.clearAllFilters());
        this.setState({
            ...this.initState,
        });
    };

    resetDate = () => {
        this.setState({
            date: this.initState.date,
        });
        this.setFilter({ date: this.initState.date });
    };

    resetTime = () => {
        this.setState({
            time: this.initState.time,
        });
        this.setFilter({ time: this.initState.time });
    };

    resetPrice = () => {
        this.setState({
            price: this.initState.price,
        });
        this.setFilter({ price: this.initState.price });
    };

    renderSearchBar = () => (
        <div className="row">
            <div className="col-xs-12">
                <DebounceInput
                    debounceTimeout={500}
                    onChange={this.handleSearchChange}
                    className="form-text filter__search"
                    placeholder="&nbsp;"
                    value={this.state.searchValue}
                />
            </div>
        </div>
    );

    renderFilters = () => (
        <div className="filter__row mt-16">
            <div className="filter__item filter__item--group">
                <button
                    className={`button button__hollow filter__type-button ${
                        this.state.type === "all" ? "active" : ""
                    }`}
                    data-name={filterTypes.ALL_PAYMENTS}
                    onClick={this.handleTypeChange}
                >
                    {filterTypes.ALL_PAYMENTS}
                </button>
                <button
                    className={`button button__hollow filter__type-button ${
                        this.state.type === "income" ? "active" : ""
                    }`}
                    data-name={filterTypes.INCOMING_PAYMENT}
                    onClick={this.handleTypeChange}
                >
                    {filterTypes.INCOMING_PAYMENT}
                </button>
                <button
                    className={`button button__hollow filter__type-button ${
                        this.state.type === "outcome" ? "active" : ""
                    }`}
                    data-name={filterTypes.OUTGOING_PAYMENT}
                    onClick={this.handleTypeChange}
                >
                    {filterTypes.OUTGOING_PAYMENT}
                </button>
            </div>
            <div className="filter__item">
                <Datepicker
                    setData={this.handleDateChange}
                    reset={this.resetDate}
                    date={this.state.date}
                />
            </div>
            <div className="filter__item">
                <Timepicker
                    setData={this.handleTimeChange}
                    reset={this.resetTime}
                    time={this.state.time}
                />
            </div>
            <div className="filter__item">
                <Pricepicker
                    setData={this.handlePriceChange}
                    reset={this.resetPrice}
                    price={this.state.price}
                />
            </div>
            <div className="filter__item">
                <button
                    className="button button__hollow"
                    onClick={this.handleFilterReset}
                >
                    Reset
                </button>
            </div>
        </div>
    );

    render() {
        return (
            <div className="filter">
                {this.renderSearchBar()}
                {this.renderFilters()}
            </div>
        );
    }
}

Filter.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    source: PropTypes.oneOf([
        filterTypes.TYPE_REGULAR,
        filterTypes.TYPE_RECURRING,
        filterTypes.TYPE_ONCHAIN,
    ]).isRequired,
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
});

export default connect(mapStateToProps)(Filter);
