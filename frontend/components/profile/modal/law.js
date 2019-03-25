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
            <Modal onClose={this.closeModal} theme="legal" showCloseButton>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            <Legal fromProfile />
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
