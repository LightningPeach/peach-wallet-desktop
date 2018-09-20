import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, logger } from "additional";
import { appOperations } from "modules/app";
import { channelsOperations as operations } from "modules/channels";
import { error, info } from "modules/notifications";
import { ChannelsFullPath } from "routes";
import Modal from "components/modal";

class CloseChannel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            processing: false,
        };

        analytics.pageview(`${ChannelsFullPath}/close-channel`, "Close Channel");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        if (this.state.processing) {
            return;
        }
        analytics.event({ action: "Close Channel Modal", category: "Channels", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    closeChannel = async () => {
        const { dispatch, currentChannel } = this.props;
        analytics.event({ action: "Close Channel Modal", category: "Channels", label: "Close" });
        dispatch(appOperations.closeModal());
        const response = await dispatch(operations.closeChannel(currentChannel));
        if (!response.ok) {
            dispatch(operations.openForceDeleteChannelModal());
            dispatch(error({ message: response.error }));
            return;
        }
        const tempName = currentChannel.name || currentChannel.remote_pubkey;
        dispatch(operations.clearCurrentChannel());
        dispatch(operations.getChannels());
        dispatch(info({ message: <span>Channel <strong>{tempName}</strong> deleted</span> }));
    };

    render() {
        const { currentChannel } = this.props;
        if (!currentChannel) {
            logger.log("CLOSE CHANNEL: No current channel");
            return null;
        }
        const title = currentChannel.name || currentChannel.remote_pubkey;
        const spinner = this.state.processing ? <div className="spinner" /> : null;
        return (
            <Modal title="Close Channel" onClose={this.closeModal}>
                <div className="modal-body">
                    <div className="row form-row">
                        <div className="col-xs-12 channel-close__text">
                            Are you sure you want to close <strong title={title}>{title}</strong> cooperatively?
                            All your bitcoins will send to ONCHAIN balance.
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                type="button"
                                className="button button__link text-uppercase"
                                onClick={this.closeModal}
                                disabled={this.state.processing}
                            >
                                Cancel
                            </button>
                            <span className="button_with_spinner">
                                <button
                                    type="button"
                                    className="button button__orange button__close"
                                    onClick={this.closeChannel}
                                    disabled={this.state.processing}
                                >
                                    Close
                                </button>
                                {spinner}
                            </span>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

CloseChannel.propTypes = {
    currentChannel: PropTypes.shape({
        capacity: PropTypes.number.isRequired,
        channel_point: PropTypes.string.isRequired,
        commit_fee: PropTypes.number.isRequired,
        local_balance: PropTypes.number.isRequired,
        remote_pubkey: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
    }),
    dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    currentChannel: state.channels.currentChannel,
});

export default connect(mapStateToProps)(CloseChannel);
