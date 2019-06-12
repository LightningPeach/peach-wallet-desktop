import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";

import { analytics, helpers } from "additional";
import { lightningOperations, lightningTypes } from "modules/lightning";
import { contactsTypes, contactsOperations, contactsActions } from "modules/contacts";
import { accountTypes } from "modules/account";
import { channelsOperations, channelsSelectors } from "modules/channels";
import { appTypes } from "modules/app";
import { consts, routes } from "config";

import NewContact from "components/contacts/modal/new-contact";
import SubHeader from "components/subheader";
import { ChannelWarning } from "./modal";
import RegularPayment from "./regular";
import RecurringPayment from "./recurring";

class Lightning extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: "regular",
        };
        analytics.pageview(`${routes.LightningFullPath}/regular`, "Lightning / Regular Payment");
    }

    componentWillMount() {
        const { dispatch } = this.props;
        dispatch(lightningOperations.getHistory());
        dispatch(channelsOperations.getChannels());
    }

    componentWillReceiveProps(nextProps) {
        const { activeTab } = this.state;
        if (nextProps.externalPaymentRequest && activeTab !== "regular") {
            this.setState({
                activeTab: "regular",
            });
        }
    }

    componentWillUpdate(nextProps) {
        if (this.props.modalState !== nextProps.modalState && nextProps.modalState === appTypes.CLOSE_MODAL_STATE) {
            this.setTabAnalytics();
        }
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch(contactsActions.newContactAdded(null));
        dispatch(contactsOperations.setContactsSearch(null));
    }

    setTabAnalytics = () => {
        let path;
        let title;
        if (this.state.activeTab === "regular") {
            path = `${routes.LightningFullPath}/regular`;
            title = "Lightning / Regular Payment";
        } else if (this.state.activeTab === "recurring") {
            path = `${routes.LightningFullPath}/recurring`;
            title = "Lightning / Recurring Payment";
        }
        analytics.pageview(path, title);
    };

    handleTabClick = (tab) => {
        if (this.state.activeTab !== tab) {
            this.setTabAnalytics();
        }
        this.setState({ activeTab: tab });
    };

    render() {
        const { modalState, walletMode } = this.props;
        const { activeTab } = this.state;
        let modal;
        switch (modalState) {
            case lightningTypes.MODAL_STATE_CHANNEL_WARNING:
                modal = <ChannelWarning />;
                break;
            case contactsTypes.MODAL_STATE_NEW_CONTACT:
                modal = <NewContact page="lightning" />;
                break;
            default:
                modal = null;
        }
        let tabContent;
        switch (activeTab) {
            case "regular":
                tabContent = <RegularPayment />;
                break;
            case "recurring":
                tabContent = <RecurringPayment />;
                break;
            default:
                tabContent = null;
                break;
        }
        return (
            <Fragment>
                <SubHeader />
                <div className="page lightning">
                    <div className="container">
                        <div className="tabs">
                            <div className="tabs__row">
                                <a
                                    className={`tab-link ${activeTab === "regular" ? "tab-link-active" : ""}`}
                                    onClick={() => this.handleTabClick("regular")}
                                >
                                    Regular payment
                                </a>
                                <a
                                    className={`tab-link ${
                                        activeTab === "recurring" ? "tab-link-active" : ""
                                    } ${walletMode !== accountTypes.WALLET_MODE.EXTENDED
                                        ? "locked"
                                        : ""}`}
                                    onClick={() => this.handleTabClick("recurring")}
                                >
                                    Recurring payment
                                </a>
                            </div>
                            {tabContent}
                        </div>
                    </div>
                </div>
                <ReactCSSTransitionGroup
                    transitionName="modal-transition"
                    transitionEnterTimeout={consts.MODAL_ANIMATION_TIMEOUT}
                    transitionLeaveTimeout={consts.MODAL_ANIMATION_TIMEOUT}
                >
                    {modal}
                </ReactCSSTransitionGroup>
            </Fragment>
        );
    }
}

Lightning.propTypes = {
    dispatch: PropTypes.func.isRequired,
    externalPaymentRequest: PropTypes.string,
    modalState: PropTypes.string,
    walletMode: PropTypes.oneOf(accountTypes.WALLET_MODES_LIST),
};

const mapStateToProps = state => ({
    externalPaymentRequest: state.lightning.externalPaymentRequest,
    modalState: state.app.modalState,
    walletMode: state.account.walletMode,
});

export default connect(mapStateToProps)(Lightning);
