import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { filterActions, filterTypes } from "modules/filter";
import { initStatePartial as initState } from "modules/filter/reducers";
import DebounceInput from "components/ui/debounce-input";
import Datepicker from "components/ui/datepicker";
import Timepicker from "components/ui/timepicker";
import Pricepicker from "components/ui/pricepicker";

class Filter extends Component {
    constructor(props) {
        super(props);
        this.state = this.props.filter;
    }

    setFilterPart = (details = {}) => {
        const { source, dispatch, onChange } = this.props;
        if (onChange) {
            onChange();
        }
        switch (source) {
            case filterTypes.FILTER_REGULAR:
                dispatch(filterActions.setRegularFilterPart(details));
                break;
            case filterTypes.FILTER_RECURRING:
                dispatch(filterActions.setRecurringFilterPart(details));
                break;
            case filterTypes.FILTER_ONCHAIN:
                dispatch(filterActions.setOnchainFilterPart(details));
                break;
            case filterTypes.FILTER_CONTACTS:
                dispatch(filterActions.setContactsFilterPart(details));
                break;
            case filterTypes.FILTER_MERCHANTS:
                dispatch(filterActions.setMerchantsFilterPart(details));
                break;
            default:
                break;
        }
    };

    handleSearchChange = (value) => {
        const search = value;
        this.setState({
            search,
        });
        this.setFilterPart({ search });
    };

    handleTypeChange = (e) => {
        const type = e.target.getAttribute("data-name");
        this.setState({
            type,
        });
        this.setFilterPart({ type });
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
        this.setFilterPart({ date: initState.date });
    };

    resetTime = () => {
        this.setState({
            time: initState.time,
        });
        this.setFilterPart({ time: initState.time });
    };

    resetPrice = () => {
        this.setState({
            price: initState.price,
        });
        this.setFilterPart({ price: initState.price });
    };

    renderSearchBar = () => {
        const { searchPlaceholder } = this.props;
        return (
            <div className="row">
                <div className="col-xs-12">
                    <DebounceInput
                        timeout={500}
                        onChange={this.handleSearchChange}
                        className="form-text filter__search"
                        placeholder={searchPlaceholder || ""}
                        value={this.state.search || ""}
                    />
                </div>
            </div>
        );
    };

    renderFilters = () => {
        const { filterKinds } = this.props;
        return (
            <div className="filter__row filter__row--items mt-16">
                {filterKinds.includes(filterTypes.FILTER_KIND_TYPE) &&
                    <div className="filter__item filter__item--group">
                        <button
                            className={`button button__hollow filter__type-button ${
                                this.state.type === filterTypes.TYPE_PAYMENT_ALL ? "active" : ""
                            }`}
                            data-name={filterTypes.TYPE_PAYMENT_ALL}
                            onClick={this.handleTypeChange}
                        >
                            {filterTypes.TYPE_PAYMENT_ALL}
                        </button>
                        <button
                            className={`button button__hollow filter__type-button ${
                                this.state.type === filterTypes.TYPE_PAYMENT_INCOMING ? "active" : ""
                            }`}
                            data-name={filterTypes.TYPE_PAYMENT_INCOMING}
                            onClick={this.handleTypeChange}
                        >
                            {filterTypes.TYPE_PAYMENT_INCOMING}
                        </button>
                        <button
                            className={`button button__hollow filter__type-button ${
                                this.state.type === filterTypes.TYPE_PAYMENT_OUTCOMING ? "active" : ""
                            }`}
                            data-name={filterTypes.TYPE_PAYMENT_OUTCOMING}
                            onClick={this.handleTypeChange}
                        >
                            {filterTypes.TYPE_PAYMENT_OUTCOMING}
                        </button>
                    </div>
                }
                {filterKinds.includes(filterTypes.FILTER_KIND_DATE) &&
                    <div className="filter__item">
                        <Datepicker
                            setData={this.handleDateChange}
                            reset={this.resetDate}
                            date={this.state.date}
                        />
                    </div>
                }
                {filterKinds.includes(filterTypes.FILTER_KIND_TIME) &&
                    <div className="filter__item">
                        <Timepicker
                            setData={this.handleTimeChange}
                            reset={this.resetTime}
                            time={this.state.time}
                        />
                    </div>
                }
                {filterKinds.includes(filterTypes.FILTER_KIND_PRICE) &&
                    <div className="filter__item">
                        <Pricepicker
                            setData={this.handlePriceChange}
                            reset={this.resetPrice}
                            price={this.state.price}
                        />
                    </div>
                }
                <div className="filter__item">
                    <button
                        className="button button__hollow button__hollow--red"
                        onClick={this.handleFilterReset}
                    >
                        Reset All
                    </button>
                </div>
            </div>
        );
    };

    render() {
        const { filterKinds } = this.props;
        return (
            <div className="filter">
                {filterKinds.includes(filterTypes.FILTER_KIND_SEARCH) && this.renderSearchBar()}
                {filterKinds.filter(item => item !== filterTypes.FILTER_KIND_SEARCH).length > 0
                    && this.renderFilters()}
            </div>
        );
    }
}

Filter.propTypes = {
    dispatch: PropTypes.func.isRequired,
    filter: PropTypes.shape(),
    filterKinds: PropTypes.arrayOf(PropTypes.oneOf(filterTypes.FILTER_KIND_LIST)),
    onChange: PropTypes.func,
    searchPlaceholder: PropTypes.string,
    source: PropTypes.oneOf(filterTypes.FILTER_SOURCES).isRequired,
};

const mapStateToProps = (state, props) => {
    let filter;
    switch (props.source) {
        case filterTypes.FILTER_REGULAR:
            filter = state.filter.regular;
            break;
        case filterTypes.FILTER_RECURRING:
            filter = state.filter.recurring;
            break;
        case filterTypes.FILTER_ONCHAIN:
            filter = state.filter.onchain;
            break;
        case filterTypes.FILTER_CONTACTS:
            filter = state.filter.contacts;
            break;
        case filterTypes.FILTER_MERCHANTS:
            filter = state.filter.merchants;
            break;
        default:
            break;
    }
    return {
        filter,
    };
};

export default connect(mapStateToProps)(Filter);
