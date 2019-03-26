import React, { Component } from "react";
import PropTypes from "prop-types";
import { push } from "react-router-redux";
import { connect } from "react-redux";
import { hashHistory } from "react-router";

import { logger, debounce, clearIntervalLong, setAsyncIntervalLong } from "additional";
import { routes } from "config";
import { accountOperations, accountTypes } from "modules/account";
import { channelsOperations, channelsTypes } from "modules/channels";
import { authActions, authTypes } from "modules/auth";
import { appOperations, appTypes } from "modules/app";
import { serverOperations } from "modules/server";
import { lndOperations } from "modules/lnd";

import { pageBlockerHelper } from "components/common/page-blocker";
import Header from "components/header";
import Lightning from "components/lightning";
import Onchain from "components/onchain";
import ChannelsPage from "components/channels";
import ContactsPage from "components/contacts";
import ProfilePage from "components/profile";
import MerchantsPage from "components/merchants";
import Notifications from "components/notifications";
import ForceCloseChannelModal from "components/channels/modal/force-close-channel";
import ForceLogoutModal from "components/modal/window/force-logout";
import SystemNotificationsModal from "components/modal/window/system-notifications";
import WalletModeModal from "components/modal/window/wallet-mode";
import TermsAndConditionsModal from "components/modal/window/terms-and-conditions";

import {
    BALANCE_INTERVAL_TIMEOUT,
    CHANNELS_INTERVAL_TIMEOUT,
    USD_PER_BTC_INTERVAL_TIMEOUT,
    LND_SYNC_STATUS_INTERVAL_TIMEOUT,
    GET_MERCHANTS_INTERVAL_TIMEOUT,
    SESSION_EXPIRE_TIMEOUT,
} from "config/consts";

class WalletPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            pageAddressIndex: 0,
            pageAddressList: [
                {
                    fullPath: routes.WalletPath,
                    panel: routes.LightningPanel,
                },
                {
                    fullPath: routes.OnchainFullPath,
                    panel: routes.OnchainPanel,
                },
                {
                    fullPath: routes.ChannelsFullPath,
                    panel: routes.ChannelsPanel,
                },
                {
                    fullPath: routes.AddressBookFullPath,
                    panel: routes.AddressBookPanel,
                },
                {
                    fullPath: routes.MerchantsFullPath,
                    panel: routes.MerchantsPanel,
                },
                {
                    fullPath: routes.ProfileFullPath,
                    panel: routes.ProfilePanel,
                },
            ],
        };
    }

    componentWillMount() {
        const { dispatch, isLogined, isIniting } = this.props;
        if (!isLogined && !isIniting) {
            logger.log("LOGOUT FROM componentWillMount WITH !IS_LOGINED");
            dispatch(accountOperations.logout());
        }
    }

    componentDidMount() {
        const { dispatch, sessionStatus } = this.props;
        if (sessionStatus === authTypes.SESSION_EXPIRED) {
            dispatch(push(routes.HomeFullPath));
            return;
        }
        this.continueSession();
        document.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("keydown", this.continueSession);
        document.addEventListener("mousemove", this.continueSession);
        document.addEventListener("click", this.continueSession);
        document.addEventListener("touchmove", this.continueSession);
        document.addEventListener("touchstart", this.continueSession);
        document.addEventListener("scroll", this.continueSession);
        document.addEventListener("resize", this.continueSession);
        document.addEventListener("keydown", this.onKeyClick, false);
    }

    componentWillReceiveProps(nextProps) {
        const { dispatch, isIniting, isLogined } = this.props;
        const { location } = nextProps;
        const { pageAddressList } = this.state;
        if (!nextProps.isLogined && !isIniting && !this.props.isLogouting) {
            dispatch(accountOperations.logout());
            return;
        }
        if (isLogined) {
            dispatch(accountOperations.checkBalance());
            dispatch(channelsOperations.getChannels());
        }

        if (location !== this.props.location) {
            const path = location.pathname;
            let index = -1;
            while (index < pageAddressList.length) {
                index += 1;
                if (pageAddressList[index].panel.includes(path)) {
                    break;
                }
            }
            this.setState({
                pageAddressIndex: index,
            });
        }

        pageBlockerHelper(nextProps.kernelConnectIndicator === accountTypes.KERNEL_DISCONNECTED);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.onKeyDown);
        document.removeEventListener("keydown", this.continueSession);
        document.removeEventListener("mousemove", this.continueSession);
        document.removeEventListener("click", this.continueSession);
        document.removeEventListener("touchmove", this.continueSession);
        document.removeEventListener("touchstart", this.continueSession);
        document.removeEventListener("scroll", this.continueSession);
        document.removeEventListener("resize", this.continueSession);
        document.removeEventListener("keydown", this.onKeyClick, false);
        this.continueSession.cancel();
    }

    onKeyDown = (e) => {
        if (e.ctrlKey && e.key === "Tab") {
            const { pageAddressIndex, pageAddressList } = this.state;
            const index = e.shiftKey
                ? (pageAddressIndex + (pageAddressList.length - 1)) % pageAddressList.length
                : (pageAddressIndex + 1) % pageAddressList.length;
            this.setState({
                pageAddressIndex: index,
            });
            hashHistory.push(pageAddressList[index].fullPath);
        }
    };

    continueSession = debounce(() => {
        const { dispatch } = this.props;
        dispatch(authActions.setCurrentForm(authTypes.RESTORE_SESSION_FORM));
        dispatch(authActions.setSessionStatus(authTypes.SESSION_EXPIRED));
        dispatch(push(routes.HomeFullPath));
    }, SESSION_EXPIRE_TIMEOUT);

    render() {
        const {
            isLogined, modalState,
        } = this.props;
        const { pageAddressIndex } = this.state;
        if (!isLogined) {
            return null;
        }
        let modal;
        switch (modalState) {
            case channelsTypes.MODAL_STATE_FORCE_DELETE_CHANNEL:
                modal = <ForceCloseChannelModal />;
                break;
            case appTypes.MODAL_STATE_FORCE_LOGOUT:
                modal = <ForceLogoutModal />;
                break;
            case accountTypes.MODAL_STATE_SYSTEM_NOTIFICATIONS:
                modal = <SystemNotificationsModal />;
                break;
            case accountTypes.MODAL_STATE_WALLET_MODE:
                modal = <WalletModeModal />;
                break;
            case accountTypes.MODAL_STATE_TERMS_AND_CONDITIONS:
                modal = <TermsAndConditionsModal />;
                break;
            default:
                modal = null;
        }
        let Panel = null;
        switch (pageAddressIndex) {
            case 0:
                Panel = <Lightning />;
                break;
            case 1:
                Panel = <Onchain />;
                break;
            case 2:
                Panel = <ChannelsPage />;
                break;
            case 3:
                Panel = <ContactsPage />;
                break;
            case 4:
                Panel = <MerchantsPage />;
                break;
            case 5:
                Panel = <ProfilePage />;
                break;
            default:
                break;
        }

        return (
            <div id="wallet-page">
                <Header />
                {Panel}
                <Notifications
                    notifications={this.props.notifications}
                    style={false} // eslint-disable-line
                />
                {modal}
            </div>
        );
    }
}

WalletPage.propTypes = {
    dispatch: PropTypes.func.isRequired,
    isIniting: PropTypes.bool.isRequired,
    isLogined: PropTypes.bool.isRequired,
    isLogouting: PropTypes.bool.isRequired,
    kernelConnectIndicator: PropTypes.string.isRequired,
    location: PropTypes.shape({
        action: PropTypes.string.isRequired,
        hash: PropTypes.string,
        key: PropTypes.string,
        pathname: PropTypes.string,
        query: PropTypes.object,
        search: PropTypes.string,
        state: PropTypes.any,
    }).isRequired,
    modalState: PropTypes.string.isRequired,
    notifications: PropTypes.arrayOf(PropTypes.shape({ // eslint-disable-line
        autoDismiss: PropTypes.number,
        level: PropTypes.string.isRequired,
        message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
        position: PropTypes.string.isRequired,
        uid: PropTypes.any.isRequired,
    })),
    sessionStatus: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    isIniting: state.account.isIniting,
    isLogined: state.account.isLogined,
    isLogouting: state.account.isLogouting,
    kernelConnectIndicator: state.account.kernelConnectIndicator,
    modalState: state.app.modalState,
    notifications: state.notifications,
    sessionStatus: state.auth.sessionStatus,
});

export default connect(mapStateToProps)(WalletPage);
