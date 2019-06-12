import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics } from "additional";
import { appOperations } from "modules/app";

import BtcToUsd from "components/common/btc-to-usd";
import Ellipsis from "components/common/ellipsis";
import Modal from "components/modal";

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
            <Modal theme="payment_result payment_result-success" onClose={this.closeModal}>
                <div className="modal__body">
                    <div className="modal__icon" />
                    <div className="block__row row--no-col justify-center-xs">
                        <div className="block__title-lg text-yellow">
                            Success!
                        </div>
                    </div>
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            Your payment was sent
                        </div>
                    </div>
                    {name &&
                    <div className="block__row-xs">
                        <div className="col-xs-12">
                            <Ellipsis>
                                {name}
                            </Ellipsis>
                        </div>
                    </div>
                    }
                    <div className="block__row-xs">
                        <div className="col-xs-12">
                            <BtcToUsd amount={amount} />
                        </div>
                    </div>
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

SuccessPayment.propTypes = {
    amount: PropTypes.number,
    category: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    name: PropTypes.string,
    onClose: PropTypes.func,
};

export default connect(null)(SuccessPayment);
