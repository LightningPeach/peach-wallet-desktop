import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, helpers } from "additional";
import SubHeader from "components/subheader";
import { accountOperations } from "modules/account";
import { appOperations, appTypes, appActions } from "modules/app";
import ErrorFieldTooltip from "components/ui/error_field_tooltip";
import * as statusCodes from "config/status-codes";
import { ALL_MEASURES, MODAL_ANIMATION_TIMEOUT, MAX_PAYMENT_REQUEST } from "config/consts";
import Tooltip from "rc-tooltip";
import { lightningOperations } from "modules/lightning";
import Footer from "components/footer";
import Select from "react-select";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { ProfileFullPath } from "routes";
import Ellipsis from "components/common/ellipsis";
import DigitsField from "components/ui/digitsField";
import ChangePassword from "./modal/change-password";
import ConfirmLogout from "./modal/logout";
import Legal from "./modal/law";

class Profile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            payReqAmountError: null,
            tooltips: {
                address: "Generate new BTC address",
                copy: "Copy to clipboard",
                payReq: [
                    "Create new payment request by specifying amount",
                    "of it in the filed below. Other users of the",
                    "Lightning Network will have possibility to pay",
                    "generated invoice (one payment for each request).",
                ],
            },
        };
        this.cachedSelection = {
            end: 0,
            start: 0,
        };

        analytics.pageview(ProfileFullPath, "Profile");
    }

    componentWillMount() {
        let initMeasure;
        for (let i = 0; i < ALL_MEASURES.length; i += 1) {
            if (ALL_MEASURES[i].btc === this.props.bitcoinMeasureType) {
                initMeasure = ALL_MEASURES[i].btc;
            }
        }
        this.setState({ measureValue: initMeasure });
    }

    componentWillUpdate(nextProps) {
        if (this.props.modalState !== nextProps.modalState && nextProps.modalState === appTypes.CLOSE_MODAL_STATE) {
            analytics.pageview(ProfileFullPath, "Profile");
        }
    }

    setPayReqAmount = () => {
        this.setState({ payReqAmountError: null });
    };

    _validateAmount = (value) => {
        const { bitcoinMeasureType, dispatch } = this.props;
        const amount = parseFloat(value);
        if (!amount) {
            return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
        } else if (!Number.isFinite(amount)) {
            return statusCodes.EXCEPTION_FIELD_DIGITS_ONLY;
        }
        const amountInStoshi = dispatch(appOperations.convertToSatoshi(amount));
        if (amountInStoshi === 0) {
            return statusCodes.EXCEPTION_AMOUNT_EQUAL_ZERO;
        } else if (amountInStoshi < 0) {
            return statusCodes.EXCEPTION_AMOUNT_NEGATIVE;
        } else if (amountInStoshi > MAX_PAYMENT_REQUEST) {
            return statusCodes.EXCEPTION_AMOUNT_MORE_MAX(
                dispatch(appOperations.convertSatoshiToCurrentMeasure(MAX_PAYMENT_REQUEST)),
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

    renderProfile = () => {
        const { dispatch } = this.props;
        let BTCAddress = null;
        if (this.props.bitcoinAccount[0]) {
            BTCAddress = this.props.bitcoinAccount[0].address;
        }
        return (
            <div className="profile__block">
                <div className="row">
                    <div className="col-xs-12">
                        <div className="profile__title profile__title--username">
                            <img src={`${window.STATIC_FILES}public/assets/images/user.svg`} alt="" />
                            {this.props.login}
                        </div>
                    </div>
                </div>
                <div className="row profile__row">
                    <div className="col-xs-12 profile__flex js-lightningId">
                        <div className="profile__label">
                            Lightning ID
                        </div>
                        <div className="profile__value">
                            <span className="profile__value_value">
                                {this.props.lightningID}
                            </span>
                            <span className="profile__utils_btns">
                                <Tooltip
                                    placement="bottom"
                                    overlay={helpers.formatTooltips(this.state.tooltips.copy)}
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
                <div className="row profile__row">
                    <div className="col-xs-12 profile__flex js-btcAddress">
                        <div className="profile__label">
                            BTC Address
                        </div>
                        <div className="profile__value">
                            <span className="profile__value_value">
                                {BTCAddress}
                            </span>
                            <span className="profile__utils_btns">
                                <Tooltip
                                    placement="bottom"
                                    overlay={helpers.formatTooltips(this.state.tooltips.address)}
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
                                    overlay={helpers.formatTooltips(this.state.tooltips.copy)}
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
        );
    };

    renderPaymentRequest = () => {
        const {
            bitcoinMeasureType, dispatch, paymentRequest, paymentRequestAmount,
        } = this.props;
        const payReqAmount = dispatch(appOperations.convertSatoshiToCurrentMeasure(paymentRequestAmount));
        const payReqPlaceholder = `${bitcoinMeasureType === "Satoshi" ? "0" : "0.0"} ${bitcoinMeasureType}`;
        const payReqCopy = (
            <span className="pay_req__button">
                <span
                    role="button"
                    tabIndex={0}
                    className="copy profile__copy"
                    onClick={() => dispatch(appOperations.copyToClipboard(paymentRequest))}
                />
            </span>
        );
        return (
            <div className="profile__block">
                <div className="row">
                    <div className="col-xs-12">
                        <div className="profile__title profile__title--pay_req">
                            <img src={`${window.STATIC_FILES}public/assets/images/payment-request.svg`} alt="" />
                            Payment Request
                        </div>
                    </div>
                </div>
                <div className="row form-row">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="pay_req_amount">
                                Amount of {bitcoinMeasureType}
                            </label>
                            <Tooltip
                                placement="right"
                                overlay={helpers.formatTooltips(this.state.tooltips.payReq)}
                                trigger="hover"
                                arrowContent={
                                    <div className="rc-tooltip-arrow-inner" />
                                }
                                prefixCls="rc-tooltip__small rc-tooltip"
                                mouseLeaveDelay={0}
                            >
                                <i className="form-label__icon form-label__icon--info" />
                            </Tooltip>
                        </div>
                    </div>
                    <div className="col-xs-12 col-small-right-padding">
                        <DigitsField
                            id="pay_req_amount"
                            className={`form-text ${this.state.payReqAmountError ? "form-text__error" : ""}`}
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
                        <ErrorFieldTooltip
                            text={this.state.payReqAmountError}
                            class="text-left"
                        />
                        <button
                            className="button button__link"
                            type="button"
                            onClick={this.generatePayReq}
                        >
                            Generate request
                        </button>
                    </div>
                </div>
                <div className="row profile__row profile__row--top-double">
                    <div className="col-xs-4">
                        {paymentRequestAmount ?
                            `Your payment request for ${payReqAmount} ${bitcoinMeasureType}` :
                            "Your payment request"}
                    </div>
                    <div className="col-xs-8">
                        <span className="pay_req__value">
                            {paymentRequest ?
                                <Ellipsis>{paymentRequest}</Ellipsis> :
                                <span className="placeholder_text">This will display your payment request</span>}
                        </span>
                        {paymentRequest ? payReqCopy : null}
                    </div>
                </div>
            </div>
        );
    };

    renderSettings = () => {
        const { dispatch, appAsDefaultStatus } = this.props;
        return (
            <div className="profile__block">
                <div className="row">
                    <div className="col-xs-12">
                        <div className="profile__title profile__title--settings">
                            <img src={`${window.STATIC_FILES}public/assets/images/settings.svg`} alt="" />
                            Settings
                        </div>
                    </div>
                </div>
                <div className="row form-row">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="profile__currency">
                                Bitcoin denomination
                            </label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <Select
                            id="profile__currency"
                            value={this.state.measureValue}
                            searchable={false}
                            options={ALL_MEASURES.map(item => ({
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
                                    action: "Bitcoin denomination",
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
                <div className="row profile__row profile__row profile__row--wrap">
                    <div className="col-xs-12 profile__flex">
                        {
                            appAsDefaultStatus ?
                                <span className="profile__app-status">
                                    <b>LightningPeach</b> is your default lightning wallet
                                </span> :
                                <button
                                    type="button"
                                    className="button button__link profile__app-status"
                                    onClick={this.sendSetDefaultStatus}
                                >
                                    Set <b>LightningPeach</b> as your default lightning wallet
                                </button>
                        }
                        <button
                            className="button button__link button__link--logout"
                            type="button"
                            onClick={() => {
                                analytics.event({
                                    action: "Logout",
                                    category: "Profile",
                                });
                                dispatch(appOperations.openLogoutModal());
                            }}
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    render() {
        let modal;
        switch (this.props.modalState) {
            case appTypes.PROFILE_CHANGE_PASS_MODAL_STATE:
                modal = <ChangePassword />;
                break;
            case appTypes.LOGOUT_MODAL_STATE:
                modal = <ConfirmLogout />;
                break;
            case appTypes.MODAL_STATE_LEGAL:
                modal = <Legal />;
                break;
            default:
                modal = null;
        }
        return [
            <SubHeader key={1} />,
            <div key={2} className="profile js-profileContent">
                <div className="container">
                    {this.renderProfile()}
                    {this.renderPaymentRequest()}
                    {this.renderSettings()}
                </div>
            </div>,
            <Footer key={3} />,
            <ReactCSSTransitionGroup
                transitionName="modal-transition"
                transitionEnterTimeout={MODAL_ANIMATION_TIMEOUT}
                transitionLeaveTimeout={MODAL_ANIMATION_TIMEOUT}
                key={4}
            >
                {modal}
            </ReactCSSTransitionGroup>,
        ];
    }
}

Profile.propTypes = {
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
};

const mapStateToProps = state => ({
    appAsDefaultStatus: state.app.appAsDefaultStatus,
    bitcoinAccount: state.account.bitcoinAccount,
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    lightningID: state.account.lightningID,
    login: state.account.login,
    modalState: state.app.modalState,
    paymentRequest: state.lightning.paymentRequest,
    paymentRequestAmount: state.lightning.paymentRequestAmount,
});

export default connect(mapStateToProps)(Profile);
