import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router";
import { accountOperations, accountTypes } from "modules/account";
import { channelsActions, channelsTypes } from "modules/channels";
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
    MerchantsFullPath,
    MerchantsPanel,
} from "routes";

class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
            menuState: "close",
            pageAddressList: [
                { fullPath: WalletPath, name: "lightning" },
                { fullPath: OnchainFullPath, name: "onchain" },
                { fullPath: ChannelsFullPath, name: "channels" },
                { fullPath: AddressBookFullPath, name: "address" },
                { fullPath: MerchantsFullPath, name: "merchants" },
                { fullPath: ProfileFullPath, name: "profile" },
            ],
        };
    }

    componentWillReceiveProps(nextProps) {
        const { location } = nextProps;
        const { pageAddressList } = this.state;
        if (location !== this.props.location) {
            const path = location.pathname;
            let index = 0;
            while (index < pageAddressList.length) {
                if (pageAddressList[index].fullPath.includes(path)) {
                    this.wrapper.querySelectorAll("a")[index].focus();
                    break;
                }
                index += 1;
            }
        }
    }

    toggleClass = (e) => {
        const state = e.currentTarget.className.contains("burger__open") ? "close" : "open";
        this.setState({ menuState: state });
    };

    hideBurger = () => {
        this.setState({ menuState: "close" });
    };

    render() {
        const { lndSyncedToChain, walletMode } = this.props;
        const path = this.props.location.pathname;
        return (
            <header className="header">
                <div className="container">
                    <div className="header__row row row--no-col align-center-xs justify-between-xs">
                        <div className="row row--no-col align-center-xs logo-wrapper">
                            <Link
                                to={WalletPath}
                                className={`logo${lndSyncedToChain ? "" : " logo--unsynced"}`}
                            />
                            {walletMode !== accountTypes.WALLET_MODE.PENDING &&
                                <div className="header__wallet-mode">
                                    {walletMode}
                                </div>
                            }
                        </div>
                        <div
                            className={`burger burger__${this.state.menuState}`}
                            onClick={this.toggleClass}
                        >
                            <span />
                            <span />
                            <span />
                        </div>
                        <nav
                            className={`row align-center-xs nav nav--${this.state.menuState}`}
                            ref={(ref) => { this.wrapper = ref }}
                        >
                            <Link
                                to={WalletPath}
                                className={`nav__link ${LightningPanel.includes(path) ? "active" : ""}`}
                                onClick={() => {
                                    this.hideBurger();
                                }}
                            >
                                Lightning
                            </Link>
                            <Link
                                to={OnchainFullPath}
                                className={`nav__link ${OnchainPanel.includes(path) ? "active" : ""}`}
                                onClick={this.hideBurger}
                            >
                                On-chain
                            </Link>
                            <Link
                                to={ChannelsFullPath}
                                className={`nav__link ${ChannelsPanel.includes(path) ? "active" : ""}`}
                                onClick={this.hideBurger}
                            >
                                Channels
                            </Link>
                            <Link
                                to={AddressBookFullPath}
                                className={`nav__link ${
                                    walletMode !== accountTypes.WALLET_MODE.EXTENDED
                                        ? "locked"
                                        : ""
                                } ${AddressBookPanel.includes(path) ? "active" : ""}`}
                                onClick={this.hideBurger}
                            >
                                Contacts
                            </Link>
                            <Link
                                to={MerchantsFullPath}
                                className={`nav__link ${MerchantsPanel.includes(path) ? "active" : ""}`}
                                onClick={this.hideBurger}
                            >
                                Merchants
                            </Link>
                            <span className="separator" />
                            <Link
                                to={ProfileFullPath}
                                className={`nav__link nav__link--profile ${
                                    ProfilePanel.includes(path) ? "active" : ""
                                }`}
                                onClick={this.hideBurger}
                            >
                                Profile
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>
        );
    }
}

Header.propTypes = {
    lndSyncedToChain: PropTypes.bool.isRequired,
    location: PropTypes.shape({
        action: PropTypes.string.isRequired,
        hash: PropTypes.string.isRequired,
        key: PropTypes.string,
        pathname: PropTypes.string.isRequired,
        search: PropTypes.string,
        state: PropTypes.string,
    }).isRequired,
    walletMode: PropTypes.oneOf([
        accountTypes.WALLET_MODE.EXTENDED,
        accountTypes.WALLET_MODE.STANDARD,
        accountTypes.WALLET_MODE.PENDING,
    ]),
};

const mapStateToProps = state => ({
    lndSyncedToChain: state.lnd.lndSyncedToChain,
    location: state.routing.locationBeforeTransitions,
    walletMode: state.account.walletMode,
});

export default connect(mapStateToProps)(Header);
