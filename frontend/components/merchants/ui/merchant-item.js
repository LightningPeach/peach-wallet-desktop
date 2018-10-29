import React from "react";
import PropTypes from "prop-types";

const Merchant = ({ merchant }) => (
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
            <div className="merchants__row">
                {merchant.description}
            </div>
            <div className="merchants__row merchants__row--channel-info">
                <div className="merchants__label">
                    Channel info:
                </div>
                <div className="merchants__value">
                    {merchant.channel_info}
                </div>
            </div>
            <div className="merchants__row">
                <div className="merchants__label">
                    Website:
                </div>
                <div className="merchants__value">
                    <button
                        className="button button__link merchants__link"
                        onClick={(e) => {
                            e.preventDefault();
                            window.ELECTRON_SHELL.openExternal(merchant.website);
                        }}
                    >
                        {merchant.website}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

Merchant.propTypes = {
    merchant: PropTypes.shape({
        channel_info: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        logo: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        website: PropTypes.string.isRequired,
    }).isRequired,
};

export default Merchant;
