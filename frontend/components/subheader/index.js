import React, { PureComponent } from "react";
import Tooltip from "rc-tooltip";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { tooltips } from "additional";

import BtcToUsd from "components/common/btc-to-usd";

class SubHeader extends PureComponent {
    render() {
        const {
            button, bitcoinBalance, unConfirmedBitcoinBalance, lightningBalance,
        } = this.props;
        return (
            <section className="subheader">
                <div className="container">
                    <div className="row row--no-col justify-between-xs align-center-xs">
                        <div className="balance">
                            <div className="balance__row">
                                <span className="balance__title">
                                    Lightning balance:
                                </span>
                                <span className="balance__value">
                                    <BtcToUsd amount={lightningBalance} />
                                </span>
                            </div>
                            <div className="balance__row">
                                <span className="balance__title">
                                    On-chain balance:
                                </span>
                                <span className="balance__value"><BtcToUsd amount={bitcoinBalance} /></span>
                            </div>
                            <div className="balance__row">
                                <Tooltip
                                    placement="right"
                                    overlay={tooltips.LOCKED_BALANCE}
                                    trigger="hover"
                                    arrowContent={
                                        <div className="rc-tooltip-arrow-inner" />
                                    }
                                    prefixCls="rc-tooltip__small rc-tooltip"
                                    mouseLeaveDelay={0}
                                >
                                    <i className="tooltip tooltip--left tooltip--info" />
                                </Tooltip>
                                <span className="balance__title">
                                    Locked On-chain balance:
                                </span>
                                <span className="balance__value">
                                    <BtcToUsd amount={unConfirmedBitcoinBalance} />
                                </span>
                            </div>
                        </div>
                        <div className="row row--no-col align-center-xs">
                            <div className="exchange_rate">
                                1BTC <BtcToUsd amount={100000000} hideBase />
                            </div>
                            {button || null}
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
