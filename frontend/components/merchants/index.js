import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import isEqual from "lodash/isEqual";
import { hubOperations } from "modules/hub";
import { filterTypes, filterOperations } from "modules/filter";
import Filter from "components/filter";
import SubHeader from "components/subheader";

class MerchantsPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selected: null,
        };
    }

    renderEmptyList = () => (
        <div className="empty-placeholder">
            <span className="placeholder_text">Here all merchants will be displayed</span>
        </div>
    );

    renderMerchant = (merchant, index) => {
        const onClick = () => this.setState({ selected: this.state.selected === merchant.name ? null : merchant.name });
        const isSelected = this.state.selected === merchant.name;

        return (
            <div className={`merchants__item ${!isSelected ? "" : "merchants__item--opened"}`} key={merchant.name}>
                <div className="merchants__title" onClick={onClick}>
                    {merchant.logo &&
                        <div className="merchants__logo">
                            <img src={merchant.logo} className="merchants__img" alt={merchant.name} />
                        </div>
                    }
                    <div className="merchants__name">
                        {merchant.name}
                    </div>
                </div>
                <div className="merchants__info">
                    <div className="row">
                        <div className="col-xs-12 merchants__row">
                            <div className="merchants__label">
                                Email:
                            </div>
                            <div className="merchants__value">
                                <a
                                    className="button button__link"
                                    href={merchant.website}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.ELECTRON_SHELL.openExternal(merchant.website);
                                    }}
                                >
                                    {merchant.website}
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12 merchants__row">
                            <div className="merchants__label">
                                Description:
                            </div>
                            <div className="merchants__value">
                                {merchant.description}
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12 merchants__row">
                            <div className="merchants__label">
                                Channel info:
                            </div>
                            <div className="merchants__value">
                                {merchant.channel_info}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    renderMerchants = () => {
        const { dispatch, filter, merchants } = this.props;
        return (
            <div className="container">
                <div className="merchants__header">Merchants list</div>
                <Filter
                    source={filterTypes.FILTER_MERCHANTS}
                    filterKinds={[
                        filterTypes.FILTER_KIND_SEARCH,
                    ]}
                />
                {merchants
                    .filter(merchant => dispatch(filterOperations.filter(
                        filter,
                        {
                            search: [
                                merchant.name,
                                merchant.website,
                                merchant.description,
                                merchant.channel_info,
                            ],
                        },
                    )))
                    .map(this.renderMerchant)}
            </div>
        );
    };

    render() {
        const { merchants } = this.props;
        return (
            <Fragment>
                <SubHeader />
                <div className="merchants">
                    {!merchants.length ? this.renderEmptyList() : this.renderMerchants()}
                </div>
            </Fragment>
        );
    }
}

MerchantsPage.propTypes = {
    dispatch: PropTypes.func.isRequired,
    filter: PropTypes.shape().isRequired,
    merchants: PropTypes.arrayOf(PropTypes.shape({
        channel_info: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        logo: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        website: PropTypes.string.isRequired,
    })).isRequired,
};

const mapStateToProps = state => ({
    filter: state.filter.merchants,
    merchants: state.hub.merchantsData,
});

export default connect(mapStateToProps)(MerchantsPage);
