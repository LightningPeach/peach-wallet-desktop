import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { appOperations } from "modules/app";

class UnSuccessPayment extends Component {
    closeModal = () => {
        const { dispatch, category, onClose } = this.props;
        if (onClose) {
            onClose();
        }
        analytics.event({ action: "Unsuccess Payment Modal", category, label: "Ok" });
        dispatch(appOperations.closeModal());
    };

    render() {
        const errorMsg = this.props.error ?
            <div className="col-xs-12 payment_result__info text-center">{this.props.error}</div> : null;
        return (
            <div className="modal-wrapper">
                <div className="modal-layout" onClick={this.closeModal} />
                <div className="modal modal-payment_result modal-payment_result__fail" tabIndex="-1" role="dialog">
                    <div className="row">
                        <div className="col-xs-12">
                            <img
                                src={`${window.STATIC_FILES}public/assets/images/failed.svg`}
                                alt=""
                                className="payment_result__icon"
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12 payment_result__title">
                            Oops!
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12 text-center payment_result__info">
                            Your payment was failed!
                        </div>
                        {errorMsg}
                        {this.props.showRetryHelper &&
                        <span className="col-xs-12 payment_result__info payment_result__info--helper">
                            <span className="helper__header">Please, try the following actions:</span>
                            <ul className="helper__list">
                                <li>Wait for some time and try again later.</li>
                                <li>Open a direct channel with the recipient.</li>
                                <li>Send the onchain payment to recipient.</li>
                            </ul>
                        </span>}
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

UnSuccessPayment.propTypes = {
    category: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    error: PropTypes.string,
    onClose: PropTypes.func,
    showRetryHelper: PropTypes.bool,
};

export default connect(null)(UnSuccessPayment);
