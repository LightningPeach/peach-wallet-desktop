import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { hubOperations } from "modules/hub";
import { filterTypes, filterOperations } from "modules/filter";
import Filter from "components/filter";
import SubHeader from "components/subheader";
import Merchant from "./ui/merchant-item";

class MerchantsPage extends Component {
    renderEmptyList = () => (
        <div className="empty-placeholder">
            <span className="placeholder_text">Here all merchants will be displayed</span>
        </div>
    );

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
                <div className="merchants__content">
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
                        .map(merchant => (
                            <Merchant merchant={merchant} key={merchant.name} />
                        ))
                    }
                </div>
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
