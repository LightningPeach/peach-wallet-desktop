import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { BTC_MEASURE } from "config/consts";
import { appOperations } from "modules/app";
import BalanceWithMeasure from "components/common/balance-with-measure";

// Default currency is satoshi as base
// and USD as currency for conversion

class BtcToUsd extends Component {
    static converSatoshiToBtc(amount) {
        return parseFloat((amount * BTC_MEASURE.multiplier).toFixed(BTC_MEASURE.toFixed));
    }

    render() {
        const {
            amount, hideBase, usdPerBtc, reversed, dispatch,
        } = this.props;
        if (!Number.isFinite(amount)) {
            return null;
        }
        const base = !reversed
            ? <BalanceWithMeasure satoshi={amount} />
            : `$${amount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
        const converted = !reversed
            ? `$${parseFloat((BtcToUsd.converSatoshiToBtc(amount) * usdPerBtc).toFixed(2))
                .toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
            : <BalanceWithMeasure satoshi={dispatch(appOperations.convertUsdToSatoshi(amount))} />;
        if (hideBase) {
            return `~ ${converted}`;
        }
        return <span>{base}<span className="converted-part"> ~ {converted}</span></span>;
    }
}

BtcToUsd.propTypes = {
    amount: PropTypes.number.isRequired,
    dispatch: PropTypes.func.isRequired,
    hideBase: PropTypes.bool,
    reversed: PropTypes.bool,
    usdPerBtc: PropTypes.number,
};

const mapStateToProps = state => ({
    usdPerBtc: state.app.usdPerBtc,
});

export default connect(mapStateToProps)(BtcToUsd);
