import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import DebounceInput from "react-debounce-input";
import Datepicker from "components/ui/datepicker";
import Timepicker from "components/ui/timepicker";
import Pricepicker from "components/ui/pricepicker";

class Filter extends Component {
    constructor(props) {
        super(props);

        this.state = {
            price: false,
            searchValue: "",
            time: false,
            type: "all",
        };
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
                    className="filter__type-button"
                    onChange={this.handleDateChange}
                />
            </div>
            <div className="filter__item">
                <Timepicker
                    className="filter__type-button"
                    onChange={this.handleTimeChange}
                />
            </div>
            <div className="filter__item">
                <Pricepicker
                    className="filter__type-button"
                    onChange={this.handlePriceChange}
                />
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
};

export default connect(null)(Filter);
