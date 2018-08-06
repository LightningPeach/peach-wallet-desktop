import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { BTC_MEASURE } from "config/consts";
import BalanceWithMeasure from "components/common/balance-with-measure";

class BtcToUsd extends Component {
    static converSatoshiToBtc(amount) {
        return parseFloat((amount * BTC_MEASURE.multiplier).toFixed(BTC_MEASURE.toFixed));
    }

    render() {
        const { satoshi, hideBtc, usdPerBtc } = this.props;
        if (!Number.isFinite(satoshi)) {
            return null;
        }
        const btcBalance = BtcToUsd.converSatoshiToBtc(satoshi);
        const usdBalance = parseFloat((btcBalance * usdPerBtc).toFixed(2))
            .toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (hideBtc) {
            return `~ $${usdBalance}`;
        }
        const value = <BalanceWithMeasure satoshi={satoshi} />;
        return <span>{value}<span className="usd-part"> ~ ${usdBalance}</span></span>;
    }
}

BtcToUsd.propTypes = {
    hideBtc: PropTypes.bool,
    satoshi: PropTypes.number.isRequired,
    usdPerBtc: PropTypes.number,
};

const mapStateToProps = state => ({
    usdPerBtc: state.app.usdPerBtc,
});

export default connect(mapStateToProps)(BtcToUsd);
