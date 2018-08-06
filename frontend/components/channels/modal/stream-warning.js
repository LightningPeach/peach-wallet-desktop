import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router";
import { analytics } from "additional";
import { appOperations } from "modules/app";
import { ChannelsFullPath, WalletPath } from "routes";
import Modal from "components/modal";

class StreamWarning extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${ChannelsFullPath}/stream-warning`, "Attention. Stream payment");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Stream Warning Modal", category: "Channels", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    goToStreamHandler = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Stream Warning Modal", category: "Channels", label: "Pause Stream payment" });
        dispatch(appOperations.closeModal());
    };

    render() {
        return (
            <Modal title="Attention!" onClose={this.closeModal} showCloseButton>
                <div className="modal-body text-center text-16">
                    <div className="row">
                        <div className="col-xs-12">
                            To close channel you must <strong>stop all stream payments!</strong>
                        </div>
                    </div>
                </div>
                <div className="modal-footer text-center">
                    <div className="row">
                        <div className="col-xs-12">
                            <Link
                                className="button button__orange button__close"
                                to={WalletPath}
                                onClick={this.goToStreamHandler}
                            >
                                Stop Streams
                            </Link>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

StreamWarning.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect(null)(StreamWarning);
