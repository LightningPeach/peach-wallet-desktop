import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router";
import { accountOperations } from "modules/account";
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
        this.toggleClass = this.toggleClass.bind(this);
        this.hideBurger = this.hideBurger.bind(this);
        this.state = {
            burgerState: "close",
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

    toggleClass(e) {
        const state = e.currentTarget.classList.contains("burger__open") ? "close" : "open";
        this.setState({ burgerState: state });
    }

    hideBurger() {
        this.setState({ burgerState: "close" });
    }

    render() {
        const { lndSyncedToChain } = this.props;
        const path = this.props.location.pathname;
        let navClass = this.state.burgerState;
        if (this.props.skipCreateTutorial === channelsTypes.SHOW) {
            navClass += " --z_index_fix";
        }
        return (
            <header>
                <div className="container">
                    <div className="row">
                        <div className="col-xs-3">
                            <Link
                                to={WalletPath}
                                className={`logo${lndSyncedToChain ? "" : " logo--unsynced"}`}
                            />
                        </div>
                        <div className="col-xs-9">
                            <nav
                                className={`nav ${navClass}`}
                                ref={(ref) => { this.wrapper = ref }}
                            >
                                <div
                                    className={`burger burger__${this.state.burgerState}`}
                                    onClick={this.toggleClass}
                                >
                                    <span />
                                    <span />
                                    <span />
                                </div>
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
                                    Onchain
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
                                    className={`nav__link ${AddressBookPanel.includes(path) ? "active" : ""}`}
                                    onClick={this.hideBurger}
                                >
                                    Address Book
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
    skipCreateTutorial: PropTypes.string,
};

const mapStateToProps = state => ({
    lndSyncedToChain: state.lnd.lndSyncedToChain,
    location: state.routing.locationBeforeTransitions,
    skipCreateTutorial: state.channels.skipCreateTutorial,
});

export default connect(mapStateToProps)(Header);
