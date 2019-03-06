import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { MODAL_ANIMATION_TIMEOUT } from "config/consts";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { filterTypes, filterOperations } from "modules/filter";
import { appTypes } from "modules/app";
import { channelsTypes, channelsOperations } from "modules/channels";
import SubHeader from "components/subheader";
import CreateChannel from "components/channels/modal/create-channel";
import RecordsList from "components/records/list";
import Merchant from "./ui/merchant-item";

class MerchantsPage extends Component {
    componentDidUpdate(prevProps) {
        const { dispatch, modalState } = this.props;
        if (
            prevProps.modalState === channelsTypes.MODAL_STATE_NEW_CHANNEL &&
            modalState === appTypes.CLOSE_MODAL_STATE
        ) {
            dispatch(channelsOperations.clearNewChannel());
        }
    }

    getMerchantsData = () => {
        const { merchants, filter, dispatch } = this.props;
        return merchants
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
            ));
    };

    renderEmptyList = () => (
        <div className="page__placeholder page__placeholder--book">
            <span className="page__placeholder-text">
                Here all merchants will be displayed
            </span>
        </div>
    );

    renderMerchants = () => (
        <div className="container">
            <div className="block__header">Merchants list</div>
            <RecordsList
                data={this.getMerchantsData()}
                source={filterTypes.FILTER_MERCHANTS}
                withoutTitle
                filters={[
                    filterTypes.FILTER_KIND_SEARCH,
                ]}
                emptyPlaceholder="No merchants found"
                searchPlaceholder="Name, Website, Description, Channel info"
            />
        </div>
    );

    render() {
        const { merchants, modalState } = this.props;
        let modal;
        switch (modalState) {
            case channelsTypes.MODAL_STATE_NEW_CHANNEL:
                modal = <CreateChannel page="merchants" />;
                break;
            default:
                modal = null;
                break;
        }
        return (
            <Fragment>
                <SubHeader />
                <div className="page merchants">
                    {!merchants.length ? this.renderEmptyList() : this.renderMerchants()}
                </div>
                <ReactCSSTransitionGroup
                    transitionName="modal-transition"
                    transitionEnterTimeout={MODAL_ANIMATION_TIMEOUT}
                    transitionLeaveTimeout={MODAL_ANIMATION_TIMEOUT}
                    key={2}
                >
                    {modal}
                </ReactCSSTransitionGroup>,
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
    modalState: PropTypes.string,
};

const mapStateToProps = state => ({
    filter: state.filter.merchants,
    merchants: state.server.merchantsData,
    modalState: state.app.modalState,
});

export default connect(mapStateToProps)(MerchantsPage);
