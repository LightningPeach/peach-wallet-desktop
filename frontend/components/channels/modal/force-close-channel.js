import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, logger, helpers } from "additional";
import { appOperations } from "modules/app";
import { channelsOperations as operations } from "modules/channels";
import { error, info } from "modules/notifications";
import { ChannelsFullPath } from "routes";
import Modal from "components/modal";

class ForceCloseChannel extends Component {
    constructor(props) {
        super(props);
        this.closeModal = this.closeModal.bind(this);
        this.closeChannel = this.closeChannel.bind(this);
        this.state = {
            processing: false,
        };

        analytics.pageview(`${ChannelsFullPath}/force-close-channel`, "Force Close Channel");
    }

    closeModal() {
        const { dispatch } = this.props;
        if (this.state.processing) {
            return;
        }
        analytics.event({ action: "Force Close Channel Modal", category: "Channels", label: "Cancel" });
        dispatch(appOperations.closeModal());
    }

    async closeChannel() {
        const { dispatch, currentChannel } = this.props;
        analytics.event({ action: "Force Close Channel Modal", category: "Channels", label: "Close" });
        dispatch(appOperations.closeModal());
        const response = await dispatch(operations.closeChannel(currentChannel, true));
        if (!response.ok) {
            dispatch(error({ message: helpers.formatLndErrorRetryMessage(response.error) }));
            return;
        }
        const tempName = currentChannel.name || currentChannel.remote_pubkey;
        dispatch(operations.clearCurrentChannel());
        dispatch(operations.getChannels());
        dispatch(info({ message: <span>Channel <strong>{tempName}</strong> deleted</span> }));
    }

    render() {
        const { currentChannel } = this.props;
        if (!currentChannel) {
            logger.log("FORCE CLOSE CHANNEL: No current channel");
            return null;
        }
        const title = currentChannel.name || currentChannel.remote_pubkey;
        return (
            <Modal title="Force Close Channel" onClose={this.closeModal}>
                <div className="modal-body">
                    <div className="row form-row">
                        <div className="col-xs-12 channel-close__text">
                            Cooperative close of <strong title={title}>{title}</strong> is failed. You can close channel
                            not cooperatively and receive you funds in 24 hours.
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                className="button button__link text-uppercase"
                                type="button"
                                onClick={this.closeModal}
                                disabled={this.state.processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="button button__orange button__close"
                                onClick={this.closeChannel}
                                disabled={this.state.processing}
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

ForceCloseChannel.propTypes = {
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

export default connect(mapStateToProps)(ForceCloseChannel);
