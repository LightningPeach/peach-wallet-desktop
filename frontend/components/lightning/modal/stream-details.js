import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Tooltip from "rc-tooltip";

import { analytics, tooltips } from "additional";
import { STREAM_INFINITE_TIME_VALUE } from "config/consts";
import { appOperations } from "modules/app";
import { streamPaymentOperations } from "modules/streamPayments";
import { routes } from "config";

import BtcToUsd from "components/common/btc-to-usd";
import BalanceWithMeasure from "components/common/balance-with-measure";
import Modal from "components/modal";
import Ellipsis from "components/common/ellipsis";

class StreamDetails extends Component {
    constructor(props) {
        super(props);
        analytics.pageview(`${routes.LightningFullPath}/recurring/details`, "Lightning / Recurring Payment / Details");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Create Recurring Modal", category: "Lightning", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    addToList = async () => {
        const { dispatch, onClose } = this.props;
        await dispatch(streamPaymentOperations.addStreamPaymentToList());
        dispatch(streamPaymentOperations.clearPrepareStreamPayment());
        if (onClose) {
            onClose();
        }
        analytics.event({ action: "Create Recurring Modal", category: "Lightning", label: "Create" });
        dispatch(appOperations.closeModal());
    };

    render() {
        const { streamDetails, bitcoinMeasureType } = this.props;
        if (!streamDetails) {
            return null;
        }
        const parts = streamDetails.totalParts === STREAM_INFINITE_TIME_VALUE ? 1 : streamDetails.totalParts;
        const amount = streamDetails.price * parts;
        const fee = streamDetails.fee.max * parts;
        const totalAmount = amount + fee;
        return (
            <Modal title="Check your data" onClose={this.closeModal}>
                <div className="modal__body">
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                <span className="send-form__label--text">
                                    Description
                                </span>
                            </div>
                            <div className="send-form__value">
                                {!streamDetails.name ? "-" : streamDetails.name}
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                <span className="send-form__label--text">
                                    Amount in {streamDetails.currency === "USD" ? "USD" : bitcoinMeasureType}
                                </span>
                            </div>
                            <div className="send-form__value">
                                {streamDetails.currency === "USD"
                                    ? `$${amount}`
                                    : <BalanceWithMeasure satoshi={amount} />}
                                {streamDetails.totalParts === STREAM_INFINITE_TIME_VALUE ? " per payment" : null}
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                <span className="send-form__label--text">
                                    Transaction fee
                                    <Tooltip
                                        placement="right"
                                        overlay={tooltips.RECURRING_FEE}
                                        trigger="hover"
                                        arrowContent={
                                            <div className="rc-tooltip-arrow-inner" />
                                        }
                                        prefixCls="rc-tooltip__small rc-tooltip"
                                        mouseLeaveDelay={0}
                                    >
                                        <i
                                            className="tooltip tooltip--info"
                                        />
                                    </Tooltip>
                                </span>
                            </div>
                            <div className="send-form__value">
                                {streamDetails.currency === "USD"
                                    ? <BtcToUsd amount={fee} />
                                    : <BalanceWithMeasure satoshi={fee} />}
                                {streamDetails.totalParts === STREAM_INFINITE_TIME_VALUE ? " per payment" : null}
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label">
                                <span className="send-form__label--text">
                                    To
                                </span>
                            </div>
                            <div className="send-form__value send-form__value--no-overflow">
                                {streamDetails.contact_name ?
                                    <Ellipsis className="send-form__contact_name">
                                        {streamDetails.contact_name}
                                    </Ellipsis>
                                    : ""}
                                <Ellipsis>{streamDetails.lightningID}</Ellipsis>
                            </div>
                        </div>
                    </div>
                    <div className="row send-form__separator separator" />
                    <div className="row send-form__row">
                        <div className="col-xs-12">
                            <div className="send-form__label send-form__summary uppercase">
                                Amount
                            </div>
                            <div className="send-form__value send-form__summary">
                                <BtcToUsd
                                    amount={totalAmount}
                                    reversed={streamDetails.currency === "USD"}
                                />
                                {streamDetails.totalParts === STREAM_INFINITE_TIME_VALUE ? " per payment" : null}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                className="button button__link"
                                type="button"
                                onClick={this.closeModal}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="button button__solid"
                                onClick={this.addToList}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

StreamDetails.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    onClose: PropTypes.func,
    streamDetails: PropTypes.shape({
        contact_name: PropTypes.string,
        date: PropTypes.number.isRequired,
        delay: PropTypes.number.isRequired,
        description: PropTypes.string,
        fee: PropTypes.object.isRequired,
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        partsPaid: PropTypes.number.isRequired,
        price: PropTypes.number.isRequired,
        totalParts: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    streamDetails: state.streamPayment.streamDetails,
});

export default connect(mapStateToProps)(StreamDetails);
