import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { filterActions } from "modules/filter";
import DebounceInput from "react-debounce-input";
import Datepicker from "components/ui/datepicker";
import Timepicker from "components/ui/timepicker";
import Pricepicker from "components/ui/pricepicker";

const getInitialState = (params = {}) => {
    const initState = {
        price: false,
        searchValue: "",
        time: false,
        type: "all",
    };
    return { ...initState, ...params };
};

class Filter extends Component {
    constructor(props) {
        super(props);

        this.state = getInitialState();
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

    handleTimeChange = (e) => {
        this.setState({
            time: !this.state.time,
        });
    };

    handlePriceChange = (e) => {
        this.setState({
            price: !this.state.price,
        });
    };

    handleFilterReset = () => {
        const { dispatch } = this.props;
        dispatch(filterActions.clearAllFilters());
        this.datepicker.reset();
        this.timepicker.reset();
        this.pricepicker.reset();
        this.setState({
            ...getInitialState(),
        });
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
                    data-name="all"
                    onClick={this.handleTypeChange}
                >
                    All
                </button>
                <button
                    className={`button button__hollow filter__type-button ${
                        this.state.type === "income" ? "active" : ""
                    }`}
                    data-name="income"
                    onClick={this.handleTypeChange}
                >
                    Income
                </button>
                <button
                    className={`button button__hollow filter__type-button ${
                        this.state.type === "outcome" ? "active" : ""
                    }`}
                    data-name="outcome"
                    onClick={this.handleTypeChange}
                >
                    Outcome
                </button>
            </div>
            <div className="filter__item">
                <Datepicker
                    onChange={this.handleDateChange}
                    ref={(ref) => { this.datepicker = ref }}
                />
            </div>
            <div className="filter__item">
                <Timepicker
                    onChange={this.handleTimeChange}
                    ref={(ref) => { this.timepicker = ref }}
                />
            </div>
            <div className="filter__item">
                <Pricepicker
                    onChange={this.handlePriceChange}
                    ref={(ref) => { this.pricepicker = ref }}
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
};

export default connect(null)(Filter);
