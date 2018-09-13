import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import isEqual from "lodash/isEqual";

import { hubOperations } from "modules/hub";

import SubHeader from "components/subheader";

class MerchantsPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            merchants: props.merchants,
            selected: null,
        };
    }

    componentWillMount() {
        this.props.getMerchants();
    }

    componentDidUpdate(preProps) {
        const { merchants } = this.props;
        if (!isEqual(preProps.merchants, merchants)) {
            this.handleUpdate(merchants);
        }
    }

    handleUpdate = merchants => this.setState({ merchants });

    renderEmptyList = () => (
        <div className="empty-placeholder">
            <span className="placeholder_text">Here all merchants will be displayed</span>
        </div>
    );

    renderLogo = (merchant) => {
        if (!merchant.logo) {
            return null;
        }
        return (
            <div className="merchants__logo">
                <img src={merchant.logo} className="merchants__img" alt={merchant.name} />
            </div>
        );
    };

    renderMerchant = (merchant) => {
        const onClick = () => this.setState({ selected: this.state.selected === merchant.name ? null : merchant.name });
        const isSelected = this.state.selected === merchant.name;

        return (
            <div className={`merchants__item ${!isSelected ? "" : "merchants__item--opened"}`} key={merchant.name}>
                <div className="merchants__title" onClick={onClick}>
                    {this.renderLogo(merchant)}
                    <div className="merchants__name">
                        {merchant.name}
                    </div>
                </div>
                <div className="merchants__info">
                    <div className="row">
                        <div className="col-xs-12 merchants__row">
                            <div className="merchants__label">
                                Email:
                            </div>
                            <div className="merchants__value">
                                <a
                                    className="button button__link footer__legal"
                                    href={merchant.website}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.ELECTRON_SHELL.openExternal(merchant.website);
                                    }}
                                >
                                    {merchant.website}
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12 merchants__row">
                            <div className="merchants__label">
                                Description:
                            </div>
                            <div className="merchants__value">
                                {merchant.description}
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12 merchants__row">
                            <div className="merchants__label">
                                Channel info:
                            </div>
                            <div className="merchants__value">
                                {merchant.channel_info}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    renderMerchants = () => {
        const { merchants } = this.state;
        return (
            <div className="container">
                {merchants.map(this.renderMerchant)}
            </div>
        );
    };

    render() {
        const { merchants } = this.state;
        return (
            <Fragment>
                <SubHeader />
                <div className="contacts-page">
                    {!merchants.length ? this.renderEmptyList() : this.renderMerchants()}
                </div>
            </Fragment>
        );
    }
}

MerchantsPage.propTypes = {
    getMerchants: PropTypes.func.isRequired,
    merchants: PropTypes.arrayOf(PropTypes.shape({
        channel_info: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        logo: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        website: PropTypes.string.isRequired,
    })).isRequired,
};

const mapStateToProps = state => ({
    merchants: state.hub.merchantsData,
});

const mapDispatchToProps = dispatch => ({
    getMerchants: () => dispatch(hubOperations.getMerchants()),
});

export default connect(mapStateToProps, mapDispatchToProps)(MerchantsPage);
