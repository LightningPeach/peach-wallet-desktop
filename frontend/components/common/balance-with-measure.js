import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { appOperations } from "modules/app";

const BalanceWithMeasure = ({ bitcoinMeasureType, dispatch, satoshi }) => {
    const coins = dispatch(appOperations.convertSatoshiToCurrentMeasure(satoshi));
    return `${coins} ${bitcoinMeasureType}`;
};

BalanceWithMeasure.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    satoshi: PropTypes.number.isRequired,
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
});

export default connect(mapStateToProps)(BalanceWithMeasure);
