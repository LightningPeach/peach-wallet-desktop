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
        let profileClass = "";
        let lightningClass = "";
        let onchainClass = "";
        let channelsClass = "";
        let addressClass = "";
        let merchantsClass = "";
        const path = this.props.location.pathname;
        if (LightningPanel.includes(path)) {
            lightningClass = "active";
        }
        if (OnchainPanel.includes(path)) {
            onchainClass = "active";
        }
        if (ChannelsPanel.includes(path)) {
            channelsClass = "active";
        }
        if (AddressBookPanel.includes(path)) {
            addressClass = "active";
        }
        if (ProfilePanel.includes(path)) {
            profileClass = "active";
        }
        if (MerchantsPanel.includes(path)) {
            merchantsClass = "active";
        }
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
                                className={navClass}
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
                                    className={`nav__lightning ${lightningClass}`}
                                    onClick={() => {
                                        this.hideBurger();
                                    }}
                                >
                                    Lightning
                                </Link>
                                <Link
                                    to={OnchainFullPath}
                                    className={`onchain ${onchainClass}`}
                                    onClick={this.hideBurger}
                                >
                                    Onchain
                                </Link>
                                <Link
                                    to={ChannelsFullPath}
                                    className={`channels ${channelsClass}`}
                                    onClick={this.hideBurger}
                                >
                                    Channels
                                </Link>
                                <Link
                                    to={AddressBookFullPath}
                                    className={`contacts ${addressClass}`}
                                    onClick={this.hideBurger}
                                >
                                    Address Book
                                </Link>
                                <Link
                                    to={MerchantsFullPath}
                                    className={`merchants ${merchantsClass}`}
                                    onClick={this.hideBurger}
                                >
                                    Merchants
                                </Link>
                                <span className="separator" />
                                <Link
                                    to={ProfileFullPath}
                                    className={`profile ${profileClass}`}
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
