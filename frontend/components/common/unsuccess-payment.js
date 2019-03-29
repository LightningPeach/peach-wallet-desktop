import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics } from "additional";
import { appOperations } from "modules/app";

import Modal from "components/modal";
import Ellipsis from "components/common/ellipsis";

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
        const { error, showRetryHelper } = this.props;
        return (
            <Modal theme="payment_result payment_result-error" onClose={this.closeModal}>
                <div className="modal__body">
                    <div className="modal__icon" />
                    <div className="block__row row--no-col justify-center-xs">
                        <div className="block__title-lg text-yellow">
                            Oops!
                        </div>
                    </div>
                    <div className="block__row-lg">
                        <div className="col-xs-12 text-center">
                            Your payment was failed!
                        </div>
                    </div>
                    {error &&
                    <div className="block__row">
                        <div className="col-xs-12 text-center">
                            <Ellipsis>
                                {error}
                            </Ellipsis>
                        </div>
                    </div>
                    }
                    {showRetryHelper &&
                    <div className="block__row">
                        <div className="col-xs-12">
                            <span className="helper__header">Please, try the following actions:</span>
                            <ul className="helper__list">
                                <li>Wait for some time and try again later.</li>
                                <li>Open a direct channel with the recipient.</li>
                                <li>Send the on-chain payment to recipient.</li>
                            </ul>
                        </div>
                    </div>
                    }
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__solid button--fullwide"
                                onClick={this.closeModal}
                            >
                                Ok
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
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
