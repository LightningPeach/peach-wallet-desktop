import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { appOperations } from "modules/app";
import BtcToUsd from "components/common/btc-to-usd";

class SuccessPayment extends Component {
    closeModal = () => {
        const { dispatch, category, onClose } = this.props;
        if (onClose) {
            onClose();
        }
        analytics.event({ action: "Success Payment Modal", category, label: "Ok" });
        dispatch(appOperations.closeModal());
    };

    render() {
        const { name, amount } = this.props;
        if (!amount) {
            return null;
        }
        return (
            <div className="modal-wrapper">
                <div className="modal-layout" onClick={this.closeModal} />
                <div className="modal modal-payment_result modal-payment_result__success" tabIndex="-1" role="dialog">
                    <div className="row">
                        <div className="col-xs-12">
                            <img
                                src={`${window.STATIC_FILES}public/assets/images/success.svg`}
                                alt=""
                                className="payment_result__icon"
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12 payment_result__title">
                            Success!
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12 payment_result__info">
                            Your payment was sent
                        </div>
                        {name ?
                            <div className="col-xs-12 payment_result__info">
                                {name}
                            </div> : null
                        }
                        <div className="col-xs-12 payment_result__info">
                            <BtcToUsd satoshi={amount} />
                        </div>
                    </div>
                    <div className="row payment_result__btn-row">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__orange button__close button__side-padding50"
                                onClick={this.closeModal}
                            >
                                Ok
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

SuccessPayment.propTypes = {
    amount: PropTypes.number,
    category: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    name: PropTypes.string,
    onClose: PropTypes.func,
};

export default connect(null)(SuccessPayment);
