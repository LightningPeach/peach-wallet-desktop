import React, { Component } from "react";
import PropTypes from "prop-types";
import { push } from "react-router-redux";
import { connect } from "react-redux";
import { hashHistory } from "react-router";
import { logger, debounce } from "additional";
import { accountOperations, accountTypes } from "modules/account";
import { channelsOperations, channelsTypes } from "modules/channels";
import { appTypes } from "modules/app";
import { authActions, authTypes } from "modules/auth";
import { pageBlockerHelper } from "components/common/page-blocker";
import Header from "components/header";
import {
    WalletPath,
    OnchainFullPath,
    ChannelsFullPath,
    AddressBookFullPath,
    ProfileFullPath,
    LightningPanel,
    OnchainPanel,
    ChannelsPanel,
    AddressBookPanel,
    ProfilePanel,
    HomeFullPath,
} from "routes";
import Lightning from "components/lightning";
import Onchain from "components/onchain";
import ChannelsPage from "components/channels";
import ContactsPage from "components/contacts";
import ProfilePage from "components/profile";
import Notifications from "components/notifications";
import ForceCloseChannel from "components/channels/modal/force-close-channel";
import ForceLogout from "components/modal/force-logout";
import SystemNotifications from "components/modal/system-notifications";
import { SESSION_EXPIRE_TIMEOUT } from "config/consts";

class WalletPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            pageAddressIndex: 0,
            pageAddressList: [
                {
                    fullPath: WalletPath,
                    panel: LightningPanel,
                },
                {
                    fullPath: OnchainFullPath,
                    panel: OnchainPanel,
                },
                {
                    fullPath: ChannelsFullPath,
                    panel: ChannelsPanel,
                },
                {
                    fullPath: AddressBookFullPath,
                    panel: AddressBookPanel,
                },
                {
                    fullPath: ProfileFullPath,
                    panel: ProfilePanel,
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
            dispatch(push(HomeFullPath));
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

        const isKernelDisconnected = nextProps.kernelConnectIndicator === accountTypes.KERNEL_DISCONNECTED;
        if (isKernelDisconnected) {
            pageBlockerHelper(true);
        } else {
            pageBlockerHelper();
        }
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
        dispatch(push(HomeFullPath));
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
                modal = <ForceCloseChannel />;
                break;
            case appTypes.MODAL_STATE_FORCE_LOGOUT:
                modal = <ForceLogout />;
                break;
            case accountTypes.MODAL_STATE_SYSTEM_NOTIFICATIONS:
                modal = <SystemNotifications />;
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
