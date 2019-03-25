import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics, logger, helpers } from "additional";
import { appOperations } from "modules/app";
import { channelsOperations as operations } from "modules/channels";
import { error, info } from "modules/notifications";
import { routes } from "config";

import Modal from "components/modal";

class ForceCloseChannel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            processing: false,
        };

        analytics.pageview(`${routes.ChannelsFullPath}/force-close-channel`, "Force Close Channel");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        if (this.state.processing) {
            return;
        }
        analytics.event({ action: "Force Close Channel Modal", category: "Channels", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    closeChannel = async () => {
        const { dispatch, currentChannel } = this.props;
        analytics.event({ action: "Force Close Channel Modal", category: "Channels", label: "Close" });
        dispatch(appOperations.closeModal());
        const response = await dispatch(operations.closeChannel(currentChannel, true));
        if (!response.ok) {
            dispatch(error({ message: helpers.formatNotificationMessage(response.error) }));
            return;
        }
        const tempName = currentChannel.name || currentChannel.remote_pubkey;
        dispatch(operations.clearCurrentChannel());
        dispatch(operations.getChannels());
        dispatch(info({
            message: helpers.formatNotificationMessage(<span>Channel <strong>{tempName}</strong> deleted</span>),
        }));
    };

    render() {
        const { currentChannel } = this.props;
        if (!currentChannel) {
            logger.log("FORCE CLOSE CHANNEL: No current channel");
            return null;
        }
        const title = currentChannel.name || currentChannel.remote_pubkey;
        return (
            <Modal title="Force Close Channel" onClose={this.closeModal}>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12 channel-close__text">
                            Cooperative close of <strong title={title}>{title}</strong> is failed. You can close channel
                            not cooperatively and receive you funds in 24 hours.
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
                                disabled={this.state.processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="button button__solid"
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
