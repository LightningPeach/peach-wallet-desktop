import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { filterActions, filterTypes } from "modules/filter";
import { initStatePartial as initState } from "modules/filter/reducers";
import DebounceInput from "react-debounce-input";
import Datepicker from "components/ui/datepicker";
import Timepicker from "components/ui/timepicker";
import Pricepicker from "components/ui/pricepicker";

class Filter extends Component {
    constructor(props) {
        super(props);
        this.state = this.props.filter;
    }

    setFilterPart = (details = {}) => {
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

    handleSearchChange = (e) => {
        this.setState({
            search: e.target.value.trim(),
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
        this.setFilterPart({ date });
    };

    handleTimeChange = (time) => {
        this.setState({
            time,
        });
        this.setFilterPart({ time });
    };

    handlePriceChange = (price) => {
        this.setState({
            price,
        });
        this.setFilterPart({ price });
    };

    handleFilterReset = () => {
        const { dispatch } = this.props;
        dispatch(filterActions.clearAllFilters());
        this.setState({
            ...initState,
        });
    };

    resetDate = () => {
        this.setState({
            date: initState.date,
        });
        this.setFilterPart({ date: this.initState.date });
    };

    resetTime = () => {
        this.setState({
            time: initState.time,
        });
        this.setFilterPart({ time: this.initState.time });
    };

    resetPrice = () => {
        this.setState({
            price: initState.price,
        });
        this.setFilterPart({ price: this.initState.price });
    };

    renderSearchBar = () => (
        <div className="row">
            <div className="col-xs-12">
                <DebounceInput
                    debounceTimeout={500}
                    onChange={this.handleSearchChange}
                    className="form-text filter__search"
                    placeholder="&nbsp;"
                    value={this.state.search}
                />
            </div>
        </div>
    );

    renderFilters = () => (
        <div className="filter__row mt-16">
            <div className="filter__item filter__item--group">
                <button
                    className={`button button__hollow filter__type-button ${
                        this.state.type === filterTypes.ALL_PAYMENTS ? "active" : ""
                    }`}
                    data-name={filterTypes.ALL_PAYMENTS}
                    onClick={this.handleTypeChange}
                >
                    {filterTypes.ALL_PAYMENTS}
                </button>
                <button
                    className={`button button__hollow filter__type-button ${
                        this.state.type === filterTypes.INCOMING_PAYMENT ? "active" : ""
                    }`}
                    data-name={filterTypes.INCOMING_PAYMENT}
                    onClick={this.handleTypeChange}
                >
                    {filterTypes.INCOMING_PAYMENT}
                </button>
                <button
                    className={`button button__hollow filter__type-button ${
                        this.state.type === filterTypes.OUTGOING_PAYMENT ? "active" : ""
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
    dispatch: PropTypes.func.isRequired,
    filter: PropTypes.shape(),
    source: PropTypes.oneOf([
        filterTypes.TYPE_REGULAR,
        filterTypes.TYPE_RECURRING,
        filterTypes.TYPE_ONCHAIN,
    ]).isRequired,
};

const mapStateToProps = (state, props) => {
    let filter;
    switch (props.source) {
        case filterTypes.TYPE_REGULAR:
            filter = state.filter.regular;
            break;
        case filterTypes.TYPE_RECURRING:
            filter = state.filter.recurring;
            break;
        case filterTypes.TYPE_ONCHAIN:
            filter = state.filter.onchain;
            break;
        default:
            break;
    }
    return {
        filter,
    };
};

export default connect(mapStateToProps)(Filter);
