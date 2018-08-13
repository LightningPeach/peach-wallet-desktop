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
} from "routes";

class Header extends Component {
    constructor(props) {
        super(props);
        this.toggleClass = this.toggleClass.bind(this);
        this.hideBurger = this.hideBurger.bind(this);
        this.state = {
            burgerState: "close",
        };
    }

    toggleClass(e) {
        const state = e.currentTarget.classList.contains("burger__open") ? "close" : "open";
        this.setState({ burgerState: state });
    }

    hideBurger() {
        this.setState({ burgerState: "close" });
    }

    render() {
        const { dispatch } = this.props;
        let profileClass = "";
        let lightningClass = "";
        let onchainClass = "";
        let channelsClass = "";
        let addressClass = "";
        let pageName = "";
        const path = this.props.location.pathname;
        if (LightningPanel.includes(path)) {
            pageName = "Lightning";
            lightningClass = "active";
        }
        if (OnchainPanel.includes(path)) {
            pageName = "Lightning";
            onchainClass = "active";
        }
        if (ChannelsPanel.includes(path)) {
            pageName = "Lightning";
            channelsClass = "active";
        }
        if (AddressBookPanel.includes(path)) {
            pageName = "Lightning";
            addressClass = "active";
        }
        if (ProfilePanel.includes(path)) {
            pageName = "Profile";
            profileClass = "active";
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
                            <Link to={WalletPath} className="logo" />
                        </div>
                        <div className="col-xs-9">
                            <nav className={navClass}>
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
                                        // dispatch(channelsActions.updateCreateTutorialStatus(channelsTypes.HIDE));
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
    dispatch: PropTypes.func.isRequired,
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
    location: state.routing.locationBeforeTransitions,
    skipCreateTutorial: state.channels.skipCreateTutorial,
});

export default connect(mapStateToProps)(Header);
