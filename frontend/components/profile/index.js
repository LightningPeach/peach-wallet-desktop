import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select from "react-select";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import Tooltip from "rc-tooltip";

import { analytics, helpers, tooltips } from "additional";
import { accountOperations, accountTypes } from "modules/account";
import { appOperations, appTypes, appActions } from "modules/app";
import { exceptions, consts, routes } from "config";
import { lightningOperations } from "modules/lightning";

import ErrorFieldTooltip from "components/ui/error-field-tooltip";
import Footer from "components/footer";
import SubHeader from "components/subheader";
import DigitsField from "components/ui/digits-field";
import ConfirmLogout from "./modal/logout";
import Legal from "./modal/law";
import ConnectRemoteQR from "./modal/connect-remote-qr";
import PasswordRemoteQR from "./modal/password-remote-qr";

class Profile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            analytics: props.analytics === accountTypes.ANALYTICS_MODE.ENABLED,
            notifications: (props.systemNotifications >> 2) & 1, // eslint-disable-line
            payReqAmountError: null,
            sound: (props.systemNotifications >> 1) & 1, // eslint-disable-line
        };

        analytics.pageview(routes.ProfileFullPath, "Profile");
    }

    componentWillMount() {
        let initMeasure;
        for (let i = 0; i < consts.ALL_MEASURES.length; i += 1) {
            if (consts.ALL_MEASURES[i].btc === this.props.bitcoinMeasureType) {
                initMeasure = consts.ALL_MEASURES[i].btc;
            }
        }
        this.setState({ measureValue: initMeasure });
    }

    componentWillUpdate(nextProps) {
        if (this.props.modalState !== nextProps.modalState && nextProps.modalState === appTypes.CLOSE_MODAL_STATE) {
            analytics.pageview(routes.ProfileFullPath, "Profile");
        }
    }

    setPayReqAmount = () => {
        this.setState({ payReqAmountError: null });
    };

    _validateAmount = (value) => {
        const { bitcoinMeasureType, dispatch } = this.props;
        const amount = parseFloat(value);
        if (!amount) {
            return exceptions.FIELD_IS_REQUIRED;
        } else if (!Number.isFinite(amount)) {
            return exceptions.FIELD_DIGITS_ONLY;
        }
        const amountInStoshi = dispatch(appOperations.convertToSatoshi(amount));
        if (amountInStoshi === 0) {
            return exceptions.AMOUNT_EQUAL_ZERO;
        } else if (amountInStoshi < 0) {
            return exceptions.AMOUNT_NEGATIVE;
        } else if (amountInStoshi > consts.MAX_PAYMENT_REQUEST) {
            return exceptions.AMOUNT_MORE_MAX(
                dispatch(appOperations.convertSatoshiToCurrentMeasure(consts.MAX_PAYMENT_REQUEST)),
                bitcoinMeasureType,
            );
        }
        return null;
    };

    generatePayReq = async (e) => {
        e.preventDefault();
        analytics.event({
            action: "Payment Request",
            category: "Profile",
            label: "Generate",
        });
        const { dispatch } = this.props;
        const amount = this.pay_req_amount.value.trim();
        const payReqAmountError = this._validateAmount(amount);
        if (payReqAmountError) {
            this.setState({ payReqAmountError });
            return;
        }
        this.setState({ payReqAmountError });
        const response = await dispatch(lightningOperations.generatePaymentRequest(amount));
        if (!response.ok) {
            this.setState({ payReqAmountError: response.error });
        }
    };

    sendSetDefaultStatus = () => {
        const { dispatch } = this.props;
        window.ipcRenderer.send("setDefaultLightningApp");
        dispatch(appActions.setAppAsDefaultStatus(true));
    };

    toggleNotifications = () => {
        const { dispatch, systemNotifications } = this.props;
        this.setState({
            notifications: !this.state.notifications,
        });
        dispatch(accountOperations.setSystemNotificationsStatus(systemNotifications ^ 4)); // eslint-disable-line
    };

    toggleSound = () => {
        if (this.state.notifications) {
            const { dispatch, systemNotifications } = this.props;
            this.setState({
                sound: !this.state.sound,
            });
            dispatch(accountOperations.setSystemNotificationsStatus(systemNotifications ^ 2)); // eslint-disable-line
        }
    };

    toggleAnalytics = () => {
        const { dispatch } = this.props;
        this.setState({
            analytics: !this.state.analytics,
        });
        const analyticsToggled =
            this.props.analytics === accountTypes.ANALYTICS_MODE.ENABLED ?
                accountTypes.ANALYTICS_MODE.DISABLED :
                accountTypes.ANALYTICS_MODE.ENABLED;
        dispatch(accountOperations.setAnalyticsMode(analyticsToggled));
    };

    renderProfile = () => {
        const { dispatch, login } = this.props;
        let BTCAddress = null;
        if (this.props.bitcoinAccount[0]) {
            BTCAddress = this.props.bitcoinAccount[0].address;
        }
        return (
            <div className="profile__block">
                <div className="row">
                    <div className="col-xs-12">
                        <div className="profile__title profile__title--wallet-name">
                            Your wallet
                        </div>
                    </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label">
                                Wallet Name
                            </div>
                            <div className="profile__value">
                                {login}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label">
                                Lightning ID
                            </div>
                            <div className="profile__value">
                                <span className="profile__value_ellipsis">
                                    {this.props.lightningID}
                                </span>
                                <span className="profile__value_utils">
                                    <Tooltip
                                        placement="bottom"
                                        overlay={tooltips.COPY_TO_CLIPBOARD}
                                        trigger="hover"
                                        arrowContent={
                                            <div className="rc-tooltip-arrow-inner" />}
                                        prefixCls="rc-tooltip__small rc-tooltip"
                                        mouseLeaveDelay={0}
                                    >
                                        <span
                                            className="copy profile__copy"
                                            onClick={() => {
                                                analytics.event({
                                                    action: "LightningID",
                                                    category: "Profile",
                                                    label: "Copy",
                                                });
                                                dispatch(appOperations.copyToClipboard(this.props.lightningID));
                                            }}
                                        />
                                    </Tooltip>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label">
                                BTC Address
                            </div>
                            <div className="profile__value">
                                <span className="profile__value_ellipsis">
                                    {BTCAddress}
                                </span>
                                <span className="profile__value_utils">
                                    <Tooltip
                                        placement="bottom"
                                        overlay={tooltips.GENERATE_BTC_ADDRESS}
                                        trigger="hover"
                                        arrowContent={
                                            <div className="rc-tooltip-arrow-inner" />}
                                        prefixCls="rc-tooltip__small rc-tooltip"
                                        mouseLeaveDelay={0}
                                    >
                                        <span
                                            className="reload profile__reload"
                                            onClick={() => {
                                                analytics.event({
                                                    action: "BTC Address",
                                                    category: "Profile",
                                                    label: "New",
                                                });
                                                dispatch(accountOperations.createNewBitcoinAccount());
                                            }}
                                        />
                                    </Tooltip>
                                    <Tooltip
                                        placement="bottom"
                                        overlay={tooltips.COPY_TO_CLIPBOARD}
                                        trigger="hover"
                                        arrowContent={
                                            <div className="rc-tooltip-arrow-inner" />
                                        }
                                        prefixCls="rc-tooltip__small rc-tooltip"
                                        mouseLeaveDelay={0}
                                    >
                                        <span
                                            className="copy profile__copy"
                                            onClick={() => {
                                                analytics.event({
                                                    action: "BTC Address",
                                                    category: "Profile",
                                                    label: "Copy",
                                                });
                                                dispatch(appOperations.copyToClipboard(BTCAddress));
                                            }}
                                        />
                                    </Tooltip>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    renderPaymentRequest = () => {
        const {
            bitcoinMeasureType, dispatch, paymentRequest, paymentRequestAmount,
        } = this.props;
        const payReqAmount = dispatch(appOperations.convertSatoshiToCurrentMeasure(paymentRequestAmount));
        const payReqPlaceholder = `${bitcoinMeasureType === "Satoshi" ? "0" : "0.0"} ${bitcoinMeasureType}`;
        return (
            <div className="profile__block">
                <div className="row">
                    <div className="col-xs-12">
                        <div className="profile__title profile__title--pay_req">
                            Payment Request
                        </div>
                    </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="pay_req_amount">
                                Amount of {bitcoinMeasureType}
                            </label>
                            <Tooltip
                                placement="right"
                                overlay={tooltips.GENERATE_PAYMENT_REQUEST}
                                trigger="hover"
                                arrowContent={
                                    <div className="rc-tooltip-arrow-inner" />
                                }
                                prefixCls="rc-tooltip__small rc-tooltip"
                                mouseLeaveDelay={0}
                            >
                                <i className="tooltip tooltip--info" />
                            </Tooltip>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label">
                                <DigitsField
                                    id="pay_req_amount"
                                    className={`form-text ${
                                        this.state.payReqAmountError ? "form-text__error" : ""
                                    }`}
                                    name="pay_req_amount"
                                    placeholder={payReqPlaceholder}
                                    ref={(ref) => {
                                        this.pay_req_component = ref;
                                    }}
                                    setRef={(input) => {
                                        this.pay_req_amount = input;
                                    }}
                                    setOnChange={this.setPayReqAmount}
                                    type="text"
                                />
                            </div>
                            <div className="profile__value">
                                <button
                                    className="button button__solid"
                                    type="button"
                                    onClick={this.generatePayReq}
                                >
                                    Generate request
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <ErrorFieldTooltip
                            text={this.state.payReqAmountError}
                            class="text-left"
                        />
                    </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label profile__label--normal">
                                {paymentRequestAmount ?
                                    `Your payment request for ${payReqAmount} ${bitcoinMeasureType}` :
                                    "Your payment request"}
                            </div>
                            <div className="profile__value">
                                <span className="profile__value_ellipsis">
                                    {paymentRequest ||
                                        <span className="text-grey">
                                            This will display your payment request
                                        </span>
                                    }
                                </span>
                                {paymentRequest &&
                                    <span className="profile__value_utils">
                                        <span
                                            className="copy profile__copy"
                                            onClick={() => {
                                                analytics.event({
                                                    action: "Payment Request",
                                                    category: "Profile",
                                                    label: "Copy",
                                                });
                                                dispatch(appOperations.copyToClipboard(paymentRequest));
                                            }}
                                        />
                                    </span>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    renderSettings = () => {
        const { dispatch, appAsDefaultStatus, walletMode } = this.props;
        return (
            <div className="profile__block">
                <div className="row">
                    <div className="col-xs-12">
                        <div className="profile__title profile__title--settings">
                            Settings
                        </div>
                    </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label">
                                Wallet Privacy Mode
                            </div>
                            <div className="profile__value profile__value--start">
                                <span className="profile__button-label">
                                    {walletMode}
                                </span>
                                <button
                                    className="link"
                                    onClick={() => dispatch(accountOperations.openWalletModeModal())}
                                >
                                    Change Mode
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label" />
                            <div className="profile__value">
                                <span className="text-grey">
                                    {walletMode === accountTypes.WALLET_MODE.EXTENDED
                                        ? tooltips.MODE_EXTENDED
                                        : tooltips.MODE_STANDARD
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="profile__currency">
                                Change unit
                            </label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <div className="prifile__line">
                            <div className="profile__label profile__label--normal">
                                <Select
                                    id="profile__currency"
                                    value={this.state.measureValue}
                                    searchable={false}
                                    options={consts.ALL_MEASURES.map(item => ({
                                        label: item.btc, toFixed: item.toFixed, value: item.btc,
                                    }))}
                                    onChange={(newOption) => {
                                        dispatch(accountOperations.setBitcoinMeasure(newOption.value));
                                        this.setState({
                                            measureValue: newOption.value,
                                            payReqAmountError: null,
                                        });
                                        this.pay_req_component.reset();
                                        analytics.event({
                                            action: "Change unit",
                                            category: "Profile",
                                            label: "Change",
                                            value: newOption.toFixed,
                                        });
                                    }}
                                    clearable={false}
                                    ref={(ref) => {
                                        this.stateSelect = ref;
                                    }}
                                    arrowRenderer={({ onMouseDown, isOpen }) => (<span
                                        role="switch"
                                        tabIndex={0}
                                        aria-checked={false}
                                        onMouseDown={() => {
                                            !isOpen ? this.stateSelect.focus() : null; // eslint-disable-line
                                        }}
                                        className="Select-arrow"
                                    />)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className="profile__line-center">
                            <div className="profile__label">
                                System notifications
                            </div>
                            <div className="profile__value">
                                <button
                                    className={`switcher ${this.state.notifications ? "active" : ""}`}
                                    onClick={this.toggleNotifications}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label" />
                            <div className="profile__value">
                                <span className="text-grey">
                                    {tooltips.SYSTEM_NOTIFICATIONS}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className={`profile__line-center ${this.state.notifications ? "" : "disabled"}`}>
                            <div className="profile__label">
                                Sounds
                            </div>
                            <div className="profile__value">
                                <button
                                    className={`switcher ${this.state.sound ? "active" : ""}`}
                                    onClick={this.toggleSound}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label" />
                            <div className="profile__value">
                                <span className="text-grey">
                                    {tooltips.SYSTEM_NOTIFICATIONS_SOUNDS}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className="profile__line-center">
                            <div className="profile__label">
                                App Analytics
                            </div>
                            <div className="profile__value">
                                <button
                                    className={`switcher ${this.state.analytics ? "active" : ""}`}
                                    onClick={this.toggleAnalytics}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label" />
                            <div className="profile__value">
                                <span className="text-grey">
                                    {tooltips.APP_ANALYTICS}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className="profile__line profile__line--center justify-between-xs">
                            {
                                appAsDefaultStatus ?
                                    <span className="profile__app-status">
                                        Peach Wallet is your default lightning wallet
                                    </span> :
                                    <button
                                        type="button"
                                        className="button button__link profile__app-status"
                                        onClick={this.sendSetDefaultStatus}
                                    >
                                        Set <b>Peach Wallet</b> as your default lightning wallet
                                    </button>
                            }
                            <button
                                className="link link--red link--logout"
                                type="button"
                                onClick={() => {
                                    analytics.event({
                                        action: "Logout",
                                        category: "Profile",
                                    });
                                    dispatch(appOperations.openLogoutModal());
                                }}
                            >
                                Switch to another wallet
                            </button>
                        </div>
                        </div>
                </div>
                <div className="profile__row">
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label">
                                Mobile app access
                            </div>
                            <div className="profile__value profile__value--start">
                                <button
                                    className="profile__button-label link"
                                    onClick={() => {
                                        analytics.event({
                                            action: "RemoteAccess",
                                            category: "Profile",
                                        });
                                        dispatch(appOperations.openConnectRemoteQRModal());
                                    }}
                                >
                                    Show QR
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <div className="profile__line">
                            <div className="profile__label" />
                            <div className="profile__value">
                                <span className="text-grey">
                                    Using QR code you can control your wallet remotely using the Peach Wallet mobile app.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                </div>

        );
    };

    render() {
        let modal;
        switch (this.props.modalState) {
            case appTypes.LOGOUT_MODAL_STATE:
                modal = <ConfirmLogout />;
                break;
            case appTypes.MODAL_STATE_LEGAL:
                modal = <Legal />;
                break;
            case appTypes.MODAL_STATE_CONNECT_REMOTE_QR:
                modal = <ConnectRemoteQR />;
                break;
            case appTypes.MODAL_STATE_PASSWORD_REMOTE_QR:
                modal = <PasswordRemoteQR />;
                break;
            default:
                modal = null;
        }
        return (
            <Fragment>
                <SubHeader />
                <div className="page page--top-none profile">
                    <div className="container">
                        {this.renderProfile()}
                        {this.renderPaymentRequest()}
                        {this.renderSettings()}
                    </div>
                </div>
                <Footer />
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

Profile.propTypes = {
    analytics: PropTypes.oneOf(accountTypes.ANALYTICS_MODES_LIST),
    appAsDefaultStatus: PropTypes.bool.isRequired,
    bitcoinAccount: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.shape({ address: PropTypes.string.isRequired }),
        PropTypes.string,
    ])).isRequired,
    bitcoinMeasureType: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    lightningID: PropTypes.string.isRequired,
    login: PropTypes.string.isRequired,
    modalState: PropTypes.string.isRequired,
    paymentRequest: PropTypes.string,
    paymentRequestAmount: PropTypes.number,
    systemNotifications: PropTypes.number.isRequired,
    walletMode: PropTypes.oneOf(accountTypes.WALLET_MODES_LIST),
};

const mapStateToProps = state => ({
    analytics: state.account.analyticsMode,
    appAsDefaultStatus: state.app.appAsDefaultStatus,
    bitcoinAccount: state.account.bitcoinAccount,
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    lightningID: state.account.lightningID,
    login: state.account.login,
    modalState: state.app.modalState,
    paymentRequest: state.lightning.paymentRequest,
    paymentRequestAmount: state.lightning.paymentRequestAmount,
    systemNotifications: state.account.systemNotifications,
    walletMode: state.account.walletMode,
});

export default connect(mapStateToProps)(Profile);
