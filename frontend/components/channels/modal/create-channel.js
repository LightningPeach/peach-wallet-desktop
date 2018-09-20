import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, validators, helpers } from "additional";
import { appOperations } from "modules/app";
import Checkbox from "components/ui/checkbox";
import ErrorFieldTooltip from "components/ui/error_field_tooltip";
import { channelsOperations as operations, channelsSelectors as selectors } from "modules/channels";
import { error, info } from "modules/notifications";
import { MAX_CHANNEL_SIZE, ELEMENT_NAME_MAX_LENGTH, MIN_CHANNEL_SIZE } from "config/consts";
import * as statusCodes from "config/status-codes";
import { PEACH } from "config/node-settings";
import { ChannelsFullPath } from "routes";
import Modal from "components/modal";
import DigitsField from "components/ui/digitsField";

const spinner = <div className="spinner" />;

class CreateChannel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            amountError: null,
            custom: this.props.prepareNewChannel ? this.props.prepareNewChannel.custom : false,
            lightningError: null,
            nameError: null,
            processing: false,
            tooltips: {
                createChannel: [
                    "The payment channel allows users to make payments between",
                    "each other without broadcasting such transactions to the",
                    "Bitcoin blockchain. Creating a channel can take some time",
                    "as opening transaction should be confirmed on the Bitcoin",
                    "blockchain.",
                ],
            },
        };

        analytics.pageview(`${ChannelsFullPath}/create-channel`, "Create Channel");
    }

    setAmount = () => {
        this.setState({ amountError: null });
    };

    showErrorNotification = (text) => {
        const { dispatch } = this.props;
        dispatch(error({
            action: {
                callback: () => dispatch(operations.openNewChannelModal()),
                label: "Retry",
            },
            message: helpers.formatLndErrorRetryMessage(text),
        }));
    };

    closeModal = () => {
        const { dispatch } = this.props;
        if (this.state.processing) {
            return;
        }
        analytics.event({ action: "Create Channel Modal", category: "Channels", label: "Cancel" });
        dispatch(appOperations.closeModal());
    };

    toggleCustom = (e) => {
        this.setState({
            amountError: null,
            custom: e.target.checked,
            lightningError: null,
        });
    };

    _validateAmount = (amount) => {
        const {
            bitcoinMeasureType, bitcoinBalance, dispatch, toCurMeasure,
        } = this.props;
        if (!amount) {
            return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
        } else if (!Number.isFinite(amount)) {
            return statusCodes.EXCEPTION_FIELD_DIGITS_ONLY;
        }
        const amountInStoshi = dispatch(appOperations.convertToSatoshi(amount));
        if (amountInStoshi < MIN_CHANNEL_SIZE) {
            const channelSize = toCurMeasure(MIN_CHANNEL_SIZE);
            return statusCodes.EXCEPTION_AMOUNT_LESS_MIN_CHANNEL(channelSize, bitcoinMeasureType);
        } else if (amountInStoshi > bitcoinBalance) {
            return statusCodes.EXCEPTION_AMOUNT_ONCHAIN_NOT_ENOUGH_FUNDS;
        } else if (amountInStoshi > MAX_CHANNEL_SIZE) {
            const channelSize = `${toCurMeasure(MAX_CHANNEL_SIZE)} ${bitcoinMeasureType}`;
            return statusCodes.EXCEPTION_AMOUNT_MORE_MAX_CHANNEL(channelSize);
        }
        return null;
    };

    addChannel = async (e) => {
        e.preventDefault();
        const { dispatch, firstEmptyChannelDefaultName, channels } = this.props;
        this.setState({ processing: true });
        analytics.event({ action: "Create Channel Modal", category: "Channels", label: "Create" });
        let name = this.channel__name.value.trim();
        let amount = parseFloat(this.channel__amount.value.trim());
        const lightning = this.channel__lightningId.value.trim();
        let nameError = validators.validateName(name);
        const amountError = this._validateAmount(amount);
        const lightningError = this.state.custom ? validators.validateChannelHost(lightning) : null;
        if (channels) {
            channels.forEach((channel) => {
                if (name === channel.name) {
                    nameError = statusCodes.EXCEPTION_CHANNEL_CREATE_CHANNEL_EXISTS;
                }
            });
        }
        if (nameError || amountError || lightningError) {
            this.setState({
                amountError, lightningError, nameError, processing: false,
            });
            return;
        }
        let lightningId = PEACH.pubKey;
        let peer = null;
        this.setState({ amountError, lightningError, nameError });
        if (this.state.custom) {
            const [tempLight, tempPeer] = lightning.split("@");
            lightningId = tempLight;
            peer = tempPeer;
        } else {
            peer = [PEACH.host, PEACH.peerPort].join(":");
        }
        amount = dispatch(appOperations.convertToSatoshi(amount));
        name = name || `CHANNEL ${firstEmptyChannelDefaultName}`;
        dispatch(appOperations.closeModal());
        let response = await dispatch(operations.prepareNewChannel(lightningId, amount, peer, name, this.state.custom));
        if (!response.ok) {
            this.showErrorNotification(response.error);
            return;
        }
        response = await dispatch(operations.createNewChannel());
        if (!response.ok) {
            this.showErrorNotification(response.error);
            return;
        }
        dispatch(operations.getChannels());
        dispatch(info({ message: <span>Channel <strong>{name}</strong> added</span> }));
    };

    render() {
        const {
            prepareNewChannel, bitcoinMeasureType, firstEmptyChannelDefaultName, toCurMeasure,
        } = this.props;
        let customLightningHost = null;
        let helpText = "* To create a channel, you need to specify the amount you want to transfer from Onchain";
        if (prepareNewChannel && prepareNewChannel.custom) {
            customLightningHost = `${prepareNewChannel.lightningID}@${prepareNewChannel.host}`;
        }
        if (this.state.custom) {
            helpText += ", Lightning ID and IP address of counterparty";
        }
        helpText += ".";
        return (
            <Modal title="Create channel" onClose={this.closeModal} titleTooltip={this.state.tooltips.createChannel}>
                <form onSubmit={this.addChannel}>
                    <div className="modal-body">
                        <div className="row form-row">
                            <div className="col-xs-12">
                                <Checkbox
                                    text="Custom channel"
                                    checked={this.state.custom}
                                    onChange={this.toggleCustom}
                                    class="label_line pull-right channels__custom"
                                    disabled={this.state.processing}
                                />
                                <div className="form-label">
                                    <label htmlFor="channel__name">Name of channel</label>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <input
                                    id="channel__name"
                                    className={`form-text ${this.state.nameError ? "form-text__error" : ""}`}
                                    name="channel_name"
                                    placeholder={`CHANNEL ${firstEmptyChannelDefaultName}`}
                                    ref={(ref) => {
                                        this.channel__name = ref;
                                    }}
                                    defaultValue={prepareNewChannel ? prepareNewChannel.name : null}
                                    disabled={this.state.processing}
                                    max={ELEMENT_NAME_MAX_LENGTH}
                                    maxLength={ELEMENT_NAME_MAX_LENGTH}
                                    onChange={() => { this.setState({ nameError: null }) }}
                                />
                                <ErrorFieldTooltip text={this.state.nameError} />
                            </div>
                        </div>
                        <div className="row form-row">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="channel__amount">Amount in {bitcoinMeasureType} *</label>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <DigitsField
                                    id="channel__amount"
                                    className={`form-text ${this.state.amountError ? "form-text__error" : ""}`}
                                    name="channel_amount"
                                    placeholder={`${bitcoinMeasureType === "Satoshi" ?
                                        "0" :
                                        "0.0"} ${bitcoinMeasureType}`}
                                    setRef={(ref) => {
                                        this.channel__amount = ref;
                                    }}
                                    value={prepareNewChannel ? toCurMeasure(prepareNewChannel.capacity) : null}
                                    disabled={this.state.processing}
                                    setOnChange={this.setAmount}
                                />
                                <ErrorFieldTooltip text={this.state.amountError} />
                            </div>
                        </div>
                        <div className="row form-row">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="channel__lightningId">Lightning address *</label>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <input
                                    id="channel__lightningId"
                                    className={`form-text ${this.state.lightningError ? "form-text__error" : ""}`}
                                    name="channel_lightningId"
                                    placeholder="Lightning ID@Host IP"
                                    ref={(ref) => {
                                        this.channel__lightningId = ref;
                                    }}
                                    defaultValue={customLightningHost}
                                    disabled={this.state.processing || !this.state.custom}
                                    onChange={() => { this.setState({ lightningError: null }) }}
                                />
                                <ErrorFieldTooltip text={this.state.lightningError} />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <div className="row">
                            <div className="col-xs-12 channels__create-actions">
                                <span className="placeholder_text font-12">
                                    {helpText}
                                </span>
                                <div className="channels__create-buttons">
                                    <button
                                        className="button button__link text-uppercase"
                                        type="button"
                                        onClick={this.closeModal}
                                        disabled={this.state.processing}
                                    >
                                        Cancel
                                    </button>
                                    <span className="button_with_spinner">
                                        <button
                                            type="submit"
                                            className="button button__orange button__create"
                                            disabled={this.state.processing}
                                        >
                                            Create
                                        </button>
                                        {this.state.processing && spinner}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>
        );
    }
}

CreateChannel.propTypes = {
    bitcoinBalance: PropTypes.number.isRequired,
    bitcoinMeasureType: PropTypes.string.isRequired,
    channels: PropTypes.arrayOf(PropTypes.shape({
        capacity: PropTypes.number.isRequired,
        channel_point: PropTypes.string.isRequired,
        commit_fee: PropTypes.number.isRequired,
        local_balance: PropTypes.number.isRequired,
        remote_pubkey: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
    })),
    dispatch: PropTypes.func.isRequired,
    firstEmptyChannelDefaultName: PropTypes.number,
    prepareNewChannel: PropTypes.shape({
        capacity: PropTypes.number.isRequired,
        custom: PropTypes.bool.isRequired,
        host: PropTypes.string,
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }),
    toCurMeasure: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    bitcoinBalance: state.account.bitcoinBalance,
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    channels: state.channels.channels,
    firstEmptyChannelDefaultName: selectors.getFirstNotInUseDefaultChannelName(state.channels.channels),
    prepareNewChannel: state.channels.prepareNewChannel,
});

const mapDispatchToProps = dispatch => ({
    dispatch,
    toCurMeasure: value => dispatch(appOperations.convertSatoshiToCurrentMeasure(value)),
});

export default connect(mapStateToProps, mapDispatchToProps)(CreateChannel);
