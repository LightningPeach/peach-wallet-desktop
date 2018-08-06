import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import BtcToUsd from "components/common/btc-to-usd";

class SubHeader extends PureComponent {
    render() {
        const {
            button, bitcoinBalance, unConfirmedBitcoinBalance, lightningBalance,
        } = this.props;
        return (
            <section className="subheader">
                <div className="container">
                    <div className="row">
                        <div className="col-xs-12">
                            <div className="balance">
                                <div className="balance__row">
                                    <span className="balance__title">Lightning balance:</span>
                                    <span className="balance__value">
                                        <BtcToUsd satoshi={lightningBalance} />
                                    </span>
                                </div>
                                <div className="balance__row">
                                    <span className="balance__title">Onchain balance:</span>
                                    <span className="balance__value"><BtcToUsd satoshi={bitcoinBalance} /></span>
                                </div>
                                <div className="balance__row">
                                    <span className="balance__title">Locked Onchain balance:</span>
                                    <span className="balance__value">
                                        <BtcToUsd satoshi={unConfirmedBitcoinBalance} />
                                    </span>
                                </div>
                            </div>
                            <div className="subheader__exchange_rate">
                                <div className={`exchange_rate ${button ? "exchange_rate--with_btn" : ""}`}>
                                    1BTC <BtcToUsd satoshi={100000000} hideBtc />
                                </div>
                                {button || null}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}

SubHeader.propTypes = {
    bitcoinBalance: PropTypes.number.isRequired,
    button: PropTypes.element,
    lightningBalance: PropTypes.number.isRequired,
    unConfirmedBitcoinBalance: PropTypes.number.isRequired,
};

const mapStateToProps = state => ({
    bitcoinBalance: state.account.bitcoinBalance,
    lightningBalance: state.account.lightningBalance,
    unConfirmedBitcoinBalance: state.account.unConfirmedBitcoinBalance,
});

export default connect(mapStateToProps)(SubHeader);
