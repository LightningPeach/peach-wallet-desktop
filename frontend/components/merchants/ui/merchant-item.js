import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { channelsOperations, channelsActions } from "modules/channels";

class Merchant extends Component {
    openCreateChannelModal = () => {
        const { merchant, dispatch } = this.props;
        dispatch(channelsActions.newChannelPreparing({
            channelInfo: merchant.channel_info,
            custom: true,
        }));
        dispatch(channelsOperations.openNewChannelModal());
    };

    openWebsiteExternal = (e) => {
        e.preventDefault();
        const { merchant } = this.props;
        window.ELECTRON_SHELL.openExternal(merchant.website);
    };

    render() {
        const { merchant } = this.props;
        return (
            <div className="merchants__item">
                {merchant.logo &&
                    <div className="merchants__logo">
                        <img src={merchant.logo} className="merchants__logo-img" alt={merchant.name} />
                    </div>
                }
                <div className="merchants__body">
                    <div className="merchants__row merchants__row--name">
                        {merchant.name}
                    </div>
                    {merchant.description &&
                        <div className="merchants__row merchants__row--description">
                            {merchant.description}
                        </div>
                    }
                    {merchant.channel_info &&
                        <div className="merchants__row merchants__row--channel-info">
                            <div className="merchants__label">
                                Channel info:
                            </div>
                            <button
                                className="button button__link merchants__link"
                                onClick={this.openCreateChannelModal}
                            >
                                {merchant.channel_info}
                            </button>
                        </div>
                    }
                    {merchant.website &&
                        <div className="merchants__row merchants__row--website">
                            <div className="merchants__label">
                                Website:
                            </div>
                            <div className="merchants__value">
                                <button
                                    className="button button__link merchants__link"
                                    onClick={this.openWebsiteExternal}
                                >
                                    {merchant.website}
                                </button>
                            </div>
                        </div>
                    }
                </div>
            </div>
        );
    }
}

Merchant.propTypes = {
    dispatch: PropTypes.func.isRequired,
    merchant: PropTypes.shape({
        channel_info: PropTypes.string,
        description: PropTypes.string,
        logo: PropTypes.string,
        name: PropTypes.string.isRequired,
        website: PropTypes.string,
    }).isRequired,
};

export default connect(null)(Merchant);
