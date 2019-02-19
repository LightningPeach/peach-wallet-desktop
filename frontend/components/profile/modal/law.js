import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { appOperations } from "modules/app";
import Modal from "components/modal";
import Legal from "components/legal";

class Law extends Component {
    closeModal = () => {
        const { dispatch } = this.props;
        dispatch(appOperations.closeModal());
    };

    render() {
        return (
            <Modal onClose={this.closeModal} styleSet="legal" showCloseButton>
                <div className="modal-body">
                    <div className="row">
                        <div className="col-xs-12">
                            <Legal fromProfile />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                type="button"
                                className="button button__solid"
                                onClick={this.closeModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

Law.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(Law);
