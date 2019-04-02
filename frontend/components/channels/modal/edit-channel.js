import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics, validators, logger, helpers } from "additional";
import { appOperations } from "modules/app";
import { channelsOperations as operations, channelsSelectors as selectors } from "modules/channels";
import { error, info } from "modules/notifications";
import { exceptions, routes, consts, nodeSettings } from "config";

import Modal from "components/modal";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";

class EditChannel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            defaultName: /^CHANNEL [0-9]+$/i.test(props.currentChannel.name)
                ? props.currentChannel.name
                : `CHANNEL ${props.firstEmptyChannelDefaultNumber}`,
            nameError: null,
        };

        analytics.pageview(`${routes.ChannelsFullPath}/edit-channel`, "Edit Channel");
    }

    showErrorNotification = (text) => {
        const { dispatch } = this.props;
        dispatch(error({
            action: {
                callback: () => dispatch(operations.openNewChannelModal()),
                label: "Retry",
            },
            message: helpers.formatNotificationMessage(text),
        }));
    };

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Edit Channel Modal", category: "Channels", label: "Close" });
        dispatch(appOperations.closeModal());
    };

    openDeleteChannel = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Edit Channel Modal", category: "Channels", label: "Delete" });
        dispatch(operations.openDeleteChannelModal());
    };

    editChannel = async (e) => {
        e.preventDefault();
        const { dispatch, currentChannel, channels } = this.props;
        analytics.event({ action: "Edit Channel Modal", category: "Channels", label: "Edit" });
        let name = this.channel__name.value.trim();
        let nameError = validators.validateName(name);
        if (channels) {
            channels.forEach((channel) => {
                if (name === channel.name) {
                    nameError = exceptions.CHANNEL_EDIT_CHANNEL_EXISTS;
                }
            });
        }
        if (nameError) {
            this.setState({
                nameError,
            });
            return;
        }
        name = name || this.state.defaultName;
        dispatch(appOperations.closeModal());
        const response = await dispatch(operations.updateChannelOnServer(
            name,
            currentChannel.channel_point.split(":")[0],
        ));
        if (!response.ok) {
            this.showErrorNotification(response.error);
            return;
        }
        dispatch(operations.getChannels());
    };

    render() {
        const {
            bitcoinMeasureType, toCurMeasure, currentChannel,
        } = this.props;
        if (!currentChannel) {
            logger.log("Cant show Edit channel cause currentChannel not provided");
            return null;
        }
        return (
            <Modal title="Edit channel" theme="body-20" onClose={this.closeModal} showCloseButton>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            <div className="form-label">
                                <label htmlFor="channel__name">Name of channel</label>
                            </div>
                        </div>
                        <div className="col-xs-12">
                            <input
                                id="channel__name"
                                className={`form-text ${this.state.nameError ? "form-text__error" : ""}`}
                                name="channel_name"
                                placeholder={this.state.defaultName}
                                ref={(ref) => {
                                    this.channel__name = ref;
                                }}
                                defaultValue={currentChannel.name}
                                max={consts.ELEMENT_NAME_MAX_LENGTH}
                                maxLength={consts.ELEMENT_NAME_MAX_LENGTH}
                                onChange={() => { this.setState({ nameError: null }) }}
                            />
                            <ErrorFieldTooltip text={this.state.nameError} />
                        </div>
                    </div>
                    <div className="block__row">
                        <div className="col-xs-12">
                            <div className="form-label">
                                <label htmlFor="channel__amount">Amount in {bitcoinMeasureType}</label>
                            </div>
                        </div>
                        <div className="col-xs-12">
                            <input
                                id="channel__amount"
                                className="form-text"
                                name="channel_amount"
                                value={toCurMeasure(currentChannel.capacity)}
                                disabled
                            />
                        </div>
                    </div>
                    <div className="block__row">
                        <div className="col-xs-12">
                            <div className="form-label">
                                <label htmlFor="channel__lightningId">Lightning address</label>
                            </div>
                        </div>
                        <div className="col-xs-12">
                            <input
                                id="channel__lightningId"
                                className="form-text"
                                name="channel_lightningId"
                                value={currentChannel.remote_pubkey}
                                disabled
                            />
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row row--no-col justify-end-xs">
                        <button
                            className="link link--red"
                            type="button"
                            onClick={this.openDeleteChannel}
                        >
                            Close channel
                        </button>
                        <button
                            onClick={this.editChannel}
                            className="button button__solid"
                        >
                            Edit
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }
}

EditChannel.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    channels: PropTypes.arrayOf(PropTypes.shape({
        capacity: PropTypes.number.isRequired,
        channel_point: PropTypes.string.isRequired,
        commit_fee: PropTypes.number.isRequired,
        local_balance: PropTypes.number.isRequired,
        remote_pubkey: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
    })),
    currentChannel: PropTypes.shape({
        capacity: PropTypes.number.isRequired,
        channel_point: PropTypes.string.isRequired,
        commit_fee: PropTypes.number.isRequired,
        local_balance: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        remote_pubkey: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
    }),
    dispatch: PropTypes.func.isRequired,
    firstEmptyChannelDefaultNumber: PropTypes.number,
    toCurMeasure: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    channels: state.channels.channels,
    currentChannel: state.channels.currentChannel,
    firstEmptyChannelDefaultNumber: selectors.getFirstNotInUseDefaultChannelName(state.channels.channels),
});

const mapDispatchToProps = dispatch => ({
    dispatch,
    toCurMeasure: value => dispatch(appOperations.convertSatoshiToCurrentMeasure(value)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditChannel);
