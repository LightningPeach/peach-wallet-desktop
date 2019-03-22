import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Slider from "react-slick";
import { push } from "react-router-redux";

import { routes } from "config";
import { accountOperations } from "modules/account";
import { appTypes, appActions, appOperations } from "modules/app";

import ForceLogout from "components/modal/window/force-logout";

class GuidePage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            readyToOpen: false,
            slideIndex: 0,
        };
    }

    componentDidMount() {
        this.initAccount();
    }

    initAccount = async () => {
        const { dispatch, walletName } = this.props;
        const response = await dispatch(accountOperations.initAccount(walletName, true));
        if (!response.ok) {
            dispatch(appOperations.openForceLogoutModal());
            dispatch(appActions.setForceLogoutError(response.error));
            return;
        }
        this.setState({ readyToOpen: true });
    };

    status = () => {
        const { networkBlocks, dispatch, lndBlocks } = this.props;
        let currentPercent = networkBlocks < 1 ? 0 : Math.min(Math.round((lndBlocks * 100) / networkBlocks), 99);
        if (this.state.readyToOpen) {
            currentPercent = 100;
            return (
                <button
                    className="tourgide__top-btn"
                    onClick={() => {
                        dispatch(push(routes.WalletPath));
                    }}
                >
                    Open wallet
                </button>
            );
        }
        return `Synchronization - ${currentPercent}%`;
    };

    firstSlide = () => (
        <div className="guide__slide">
            <div className="guide__header">
                <h2 className="guide__title">
                    Channel creation
                </h2>
                <div className="guide__status">{this.status()}</div>
            </div>
            <div className="guide__img">
                <div className="s-channels">
                    <nav className="s-channels__nav">
                        <div className="s-channels__item">
                            LIGHTNING
                        </div>
                        <div className="s-channels__item">
                            ONCHAIN
                        </div>
                        <div className="s-channels__item s-channels__item--active">
                            CHANNELS
                        </div>
                        <div className="s-channels__item">
                            ADDRESS BOOK
                        </div>
                        <div className="s-channels__item">
                            Profile
                        </div>
                    </nav>
                    <div className="s-channels__header">
                        <div className="tourgide__background" />
                        <div className="s-channels__btc">1BTC ~ $6,934.98</div>
                        <div className="s-channels__btn button button__solid">CREATE CHANNEL</div>
                    </div>
                </div>
            </div>
            <div className="guide__description">
                Lightning channel should be created to make payments within the Lightning Network. This can be done by
                clicking the <span className="guide__orange">CREATE CHANNEL</span> button on
                the <span className="guide__orange">CHANNELS</span> page.
            </div>
        </div>
    );

    secondSlide = () => (
        <div className="guide__slide">
            <div className="guide__header">
                <h2 className="guide__title">Regular Lightning payments</h2>
                <div className="guide__status">{this.status()}</div>
            </div>
            <div className="guide__img">
                <div className="s-regular">
                    <h4 className="s-regular__title">History</h4>
                    <div className="s-regular__table">
                        <div className="tourgide__background" />
                        <div className="s-regular__column s-regular__column--5">
                            <div className="s-regular__row text-semibold">
                                Description
                            </div>
                            <div className="s-regular__row">
                                Spanish Lessons
                            </div>
                            <div className="s-regular__row">
                                Pizza Margherita
                            </div>
                            <div className="s-regular__row s-regular__row--bordered">
                                Music Video Clip
                            </div>
                        </div>
                        <div className="s-regular__column s-regular__column--20">
                            <div className="s-regular__row text-semibold">
                                Amount
                            </div>
                            <div className="s-regular__row">
                                0.001 BTC
                            </div>
                            <div className="s-regular__row">
                                0.002 BTC
                            </div>
                            <div className="s-regular__row">
                                0.0000047 BTC
                            </div>
                        </div>
                        <div className="s-regular__column s-regular__column--25">
                            <div className="s-regular__row text-semibold">
                                To
                            </div>
                            <div className="s-regular__row">
                                Language School
                            </div>
                            <div className="s-regular__row">
                                Pizzeria
                            </div>
                            <div className="s-regular__row">
                                Video Service
                            </div>
                        </div>
                        <div className="s-regular__column s-regular__column--22">
                            <div className="s-regular__row text-semibold">
                                <span className="s-regular__sortable">Date</span>
                            </div>
                            <div className="s-regular__row">
                                23.07.18 12:03:00
                            </div>
                            <div className="s-regular__row">
                                11.06.18 17:12:50
                            </div>
                            <div className="s-regular__row">
                                03.06.18 02:33:21
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="guide__description">
                <span className="guide__orange guide__inline-hack">REGULAR</span>
                Lightning payments are available to user, if a channel is already opened. All transactions are displayed
                in the history section.
            </div>
        </div>
    );

    thirdSlide = () => (
        <div className="guide__slide">
            <div className="guide__header">
                <h2 className="guide__title">Recurring Lightning payments</h2>
                <div className="guide__status">{this.status()}</div>
            </div>
            <div className="guide__img">
                <div className="s-stream">
                    <div className="s-stream__tabs">
                        <h4 className="s-stream__tabname">REGULAR PAYMENT</h4>
                        <h4 className="s-stream__tabname s-stream__tabname--active">RECURRING PAYMENT</h4>
                    </div>
                    <div className="s-stream__row">
                        <div className="s-stream__label">Description</div>
                        <div className="s-stream__input">
                            <span>Spanish Lessons</span>
                        </div>
                    </div>
                    <div className="s-stream__row">
                        <div className="s-stream__label">To</div>
                        <div className="s-stream__input s-stream__input--to">
                            <span>029e3d4d7d6fd4395643b3c8c22e3a29cd3964ad05100d7bf72d072be1508b5ae1</span>
                        </div>
                    </div>
                    <div className="s-stream__row s-stream__row--flexed">
                        <div className="s-stream__row-50">
                            <div className="s-stream__label">Price per second in BTC</div>
                            <div className="s-stream__input s-stream__input--no-before">
                                <span>0.0003</span>
                            </div>
                        </div>
                        <div className="s-stream__row-50">
                            <div className="s-stream__label">Time limit in seconds</div>
                            <div className="s-stream__input s-stream__input--active">
                                <div className="tourgide__background" />
                                <span>3600|</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="guide__description">
                Apart from regular Lightning payments, there is a possibility to
                make <span className="guide__orange">RECURRING</span> Lightning payments. This type of payment can be
                used in services based on spent time (for example, online lessons).
            </div>
        </div>
    );

    fourthSlide = () => (
        <div className="guide__slide">
            <div className="guide__header">
                <h2 className="guide__title">Profile</h2>
                <div className="guide__status">{this.status()}</div>
            </div>
            <div className="guide__img">
                <div className="s-profile">
                    <div className="s-profile__block">
                        <div className="tourgide__background" />
                        <div className="s-profile__head">
                            <img src={`${window.STATIC_FILES}public/assets/images/user-white.svg`} alt="" />
                            <h3 className="s-profile__title">Your Name</h3>
                        </div>
                        <div className="s-profile__row">
                            <div className="s-profile__label">Lightning ID</div>
                            <div className="s-profile__value">
                                hdks4j239932bhhf88302020nmldjwdkfdjsjiwww732Hkskowokfl3959
                            </div>
                            <div className="s-profile__btns">
                                <div className="s-profile__copy" />
                            </div>
                        </div>
                        <div className="s-profile__row">
                            <div className="s-profile__label">BTC Address</div>
                            <div className="s-profile__value">Kpks4j239932bhhf8HD02020nmldjwdkfdjsjiwww222y</div>
                            <div className="s-profile__btns">
                                <div className="s-profile__refresh" />
                                <div className="s-profile__copy" />
                            </div>
                        </div>
                    </div>
                    <div className="s-profile__block">
                        <div className="tourgide__background" />
                        <div className="s-profile__head">
                            <img src={`${window.STATIC_FILES}public/assets/images/payment-request-white.svg`} alt="" />
                            <h3 className="s-profile__title">Payment Request</h3>
                        </div>
                        <div className="s-profile__uplabel">Amount of BTC</div>
                        <div className="s-profile__pay_req">
                            <div className="s-profile__input">0.0 BTC</div>
                            <div className="s-profile__button">Generate request</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="guide__description">
                On the <span className="guide__orange">PROFILE</span> page users can find their Lightning ID and BTC
                Address, generate a payment request for another Lightning Network participant to pay it, and other
                options.
            </div>
        </div>
    );

    prevButton = () => {
        let btnClass = "";
        let btnFunc = () => null;
        if (this.state.slideIndex === 0) {
            btnClass = "tourgide__btn--disabled";
        } else {
            btnFunc = () => {
                this.slider.slickGoTo(this.state.slideIndex - 1);
            };
        }
        return (
            <div className={`tourgide__btn tourgide__btn--prev ${btnClass}`}>
                <button className="button button__link" onClick={btnFunc}>BACK</button>
            </div>
        );
    };

    nextButton = () => {
        const { dispatch } = this.props;
        let btnText = "NEXT";
        let btnFunc = () => {
            this.slider.slickGoTo(this.state.slideIndex + 1);
        };
        const disabled = this.state.slideIndex === 3 && !this.state.readyToOpen;
        if (this.state.slideIndex === 3) {
            btnText = "OPEN WALLET";
            btnFunc = () => {
                dispatch(push(routes.WalletPath));
            };
        }
        return (
            <div className="tourgide__btn tourgide__btn--next">
                <button className="button button__link" onClick={btnFunc} disabled={disabled}>{btnText}</button>
            </div>
        );
    };

    render() {
        const modal = this.props.modalState;
        return (
            <section className="tourgide">
                <div className="container tourgide__container">
                    <Slider
                        appendDots={dots => (
                            <nav>
                                {this.prevButton()}
                                <ul className="tourgide__dots">{dots}</ul>
                                {this.nextButton()}
                            </nav>
                        )}
                        arrows={false}
                        beforeChange={(oldIndex, newIndex) => this.setState({ slideIndex: newIndex })}
                        centerMode
                        centerPadding={0}
                        className="tourgide__slider"
                        dots
                        dotsClass="tourgide__nav"
                        infinite={false}
                        ref={(slider) => {
                            this.slider = slider;
                        }}
                    >
                        {this.firstSlide()}
                        {this.secondSlide()}
                        {this.thirdSlide()}
                        {this.fourthSlide()}
                    </Slider>
                </div>
                { modal === appTypes.MODAL_STATE_FORCE_LOGOUT ? <ForceLogout /> : null }
            </section>
        );
    }
}

GuidePage.propTypes = {
    dispatch: PropTypes.func.isRequired,
    lndBlocks: PropTypes.number.isRequired,
    modalState: PropTypes.string.isRequired,
    networkBlocks: PropTypes.number.isRequired,
    walletName: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    lndBlocks: state.lnd.lndBlocks,
    modalState: state.app.modalState,
    networkBlocks: state.server.networkBlocks,
    walletName: state.auth.tempWalletName,
});

export default connect(mapStateToProps)(GuidePage);
