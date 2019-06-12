import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router";

import { accountOperations, accountTypes } from "modules/account";
import { channelsActions, channelsTypes } from "modules/channels";
import { routes } from "config";

class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
            menuState: "close",
            pageAddressList: [
                { fullPath: routes.WalletPath, name: "lightning" },
                { fullPath: routes.OnchainFullPath, name: "onchain" },
                { fullPath: routes.ChannelsFullPath, name: "channels" },
                { fullPath: routes.AddressBookFullPath, name: "address" },
                { fullPath: routes.MerchantsFullPath, name: "merchants" },
                { fullPath: routes.ProfileFullPath, name: "profile" },
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

    toggleClass = () => {
        this.setState({ menuState: this.state.menuState === "close" ? "open" : "close" });
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
                                to={routes.WalletPath}
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
                                to={routes.WalletPath}
                                className={`nav__link ${routes.LightningPanel.includes(path) ? "active" : ""}`}
                                onClick={() => {
                                    this.hideBurger();
                                }}
                            >
                                Lightning
                            </Link>
                            <Link
                                to={routes.OnchainFullPath}
                                className={`nav__link ${routes.OnchainPanel.includes(path) ? "active" : ""}`}
                                onClick={this.hideBurger}
                            >
                                On-chain
                            </Link>
                            <Link
                                to={routes.ChannelsFullPath}
                                className={`nav__link ${routes.ChannelsPanel.includes(path) ? "active" : ""}`}
                                onClick={this.hideBurger}
                            >
                                Channels
                            </Link>
                            <Link
                                to={routes.AddressBookFullPath}
                                className={`nav__link ${
                                    walletMode !== accountTypes.WALLET_MODE.EXTENDED
                                        ? "locked"
                                        : ""
                                } ${routes.AddressBookPanel.includes(path) ? "active" : ""}`}
                                onClick={this.hideBurger}
                            >
                                Contacts
                            </Link>
                            <Link
                                to={routes.MerchantsFullPath}
                                className={`nav__link ${routes.MerchantsPanel.includes(path) ? "active" : ""}`}
                                onClick={this.hideBurger}
                            >
                                Merchants
                            </Link>
                            <span className="separator" />
                            <Link
                                to={routes.ProfileFullPath}
                                className={`nav__link nav__link--profile ${
                                    routes.ProfilePanel.includes(path) ? "active" : ""
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
    walletMode: PropTypes.oneOf(accountTypes.WALLET_MODES_LIST),
};

const mapStateToProps = state => ({
    lndSyncedToChain: state.lnd.lndSyncedToChain,
    location: state.routing.locationBeforeTransitions,
    walletMode: state.account.walletMode,
});

export default connect(mapStateToProps)(Header);
