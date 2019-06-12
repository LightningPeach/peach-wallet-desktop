import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics, validators, helpers, tooltips } from "additional";
import { appOperations } from "modules/app";
import { channelsOperations as operations, channelsSelectors as selectors } from "modules/channels";
import { error, info } from "modules/notifications";
import { exceptions, nodeSettings, consts, routes } from "config";

import Checkbox from "components/ui/checkbox";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";
import Modal from "components/modal";
import DigitsField from "components/ui/digits-field";

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
        };

        const basePath = this.props.page && this.props.page === "merchants" ?
            routes.MerchantsFullPath :
            routes.ChannelsFullPath;
        analytics.pageview(`${basePath}/create-channel`, "Create Channel");
    }

    setAmount = () => {
        this.setState({ amountError: null });
    };

    showErrorNotification = (text, helper = false, helperText = undefined) => {
        const { dispatch } = this.props;
        dispatch(error({
            action: {
                callback: () => dispatch(operations.openNewChannelModal()),
                label: "Retry",
            },
            message: helpers.formatNotificationMessage(text, helper, helperText),
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
            return exceptions.FIELD_IS_REQUIRED;
        } else if (!Number.isFinite(amount)) {
            return exceptions.FIELD_DIGITS_ONLY;
        }
        const amountInStoshi = dispatch(appOperations.convertToSatoshi(amount));
        if (amountInStoshi < consts.MIN_CHANNEL_SIZE) {
            const channelSize = toCurMeasure(consts.MIN_CHANNEL_SIZE);
            return exceptions.AMOUNT_LESS_MIN_CHANNEL(channelSize, bitcoinMeasureType);
        } else if (amountInStoshi > bitcoinBalance) {
            return exceptions.AMOUNT_ONCHAIN_NOT_ENOUGH_FUNDS;
        } else if (amountInStoshi > consts.MAX_CHANNEL_SIZE) {
            const channelSize = `${toCurMeasure(consts.MAX_CHANNEL_SIZE)} ${bitcoinMeasureType}`;
            return exceptions.AMOUNT_MORE_MAX_CHANNEL(channelSize);
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
                    nameError = exceptions.CHANNEL_CREATE_CHANNEL_EXISTS;
                }
            });
        }
        if (nameError || amountError || lightningError) {
            this.setState({
                amountError, lightningError, nameError, processing: false,
            });
            return;
        }
        let lightningId = nodeSettings.PEACH.pubKey;
        let peer = null;
        this.setState({ amountError, lightningError, nameError });
        if (this.state.custom) {
            const [tempLight, tempPeer] = lightning.split("@");
            lightningId = tempLight;
            peer = tempPeer;
        } else {
            peer = [nodeSettings.PEACH.host, nodeSettings.PEACH.peerPort].join(":");
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
            this.showErrorNotification(response.error, true, ["Try again later.", "Try again after wallet restart."]);
            return;
        }
        dispatch(operations.getChannels());
        dispatch(info({
            message: helpers.formatNotificationMessage(<span>Channel <strong>{name}</strong> added</span>),
        }));
    };

    render() {
        const {
            prepareNewChannel, bitcoinMeasureType, firstEmptyChannelDefaultName, toCurMeasure,
        } = this.props;
        let customLightningHost = null;
        if (prepareNewChannel && prepareNewChannel.custom) {
            customLightningHost = prepareNewChannel.channelInfo
                ? prepareNewChannel.channelInfo
                : `${prepareNewChannel.lightningID}@${prepareNewChannel.host}`;
        }
        return (
            <Modal title="Create channel" onClose={this.closeModal} titleTooltip={tooltips.CREATE_CHANNEL}>
                <div className="modal__body">
                    <form className="form">
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
                                    placeholder={`CHANNEL ${firstEmptyChannelDefaultName}`}
                                    ref={(ref) => {
                                        this.channel__name = ref;
                                    }}
                                    defaultValue={prepareNewChannel ? prepareNewChannel.name : null}
                                    disabled={this.state.processing}
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
                        <div className="block__row">
                            <div className="col-xs-12">
                                <Checkbox
                                    text="Custom channel"
                                    checked={this.state.custom}
                                    onChange={this.toggleCustom}
                                    disabled={this.state.processing}
                                />
                            </div>
                        </div>
                        <div className="block__row-xs">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="channel__lightningId">
                                        {`Lightning address${this.state.custom ? " *" : ""}`}
                                    </label>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <input
                                    id="channel__lightningId"
                                    className={`form-text ${this.state.lightningError ? "form-text__error" : ""}`}
                                    name="channel_lightningId"
                                    placeholder="Lightning ID@Host IP:Port"
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
                    </form>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12 channels__create-actions">
                            <span className="placeholder_text font-12">
                                By default, new channels are opened with the&nbsp;
                                <button
                                    className="link"
                                    onClick={() => window.ELECTRON_SHELL.openExternal(consts.PEACH_NODE_URL)}
                                >
                                    Lightning Peach public node
                                </button>. You can open a custom channel by manually specifying a peer address.
                            </span>
                            <div className="channels__create-buttons">
                                <button
                                    className="button button__link"
                                    type="button"
                                    onClick={this.closeModal}
                                    disabled={this.state.processing}
                                >
                                    Cancel
                                </button>
                                <span className="button__spinner">
                                    <button
                                        className="button button__solid"
                                        disabled={this.state.processing}
                                        onClick={this.addChannel}
                                    >
                                        Create
                                    </button>
                                    {this.state.processing && spinner}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
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
    page: PropTypes.string,
    prepareNewChannel: PropTypes.shape({
        capacity: PropTypes.number,
        channelInfo: (props, propName, componentName) => {
            if (!props.channelInfo && !props.lightningID) {
                return (
                    new Error(`One of props \`prepareNewChannel.channelInfo\` or \`prepareNewChannel.lightningID\` was not specified in '${componentName}'.`) // eslint-disable-line max-len
                );
            }
            const channelInfoType = typeof props.channelInfo;
            if (props.channelInfo && channelInfoType !== "string") {
                return (
                    new Error(`Failed prop type: Invalid prop \`prepareNewChannel.channelInfo\` of type \`${channelInfoType}\` supplied to \`${componentName}\`, expected \`string\``) // eslint-disable-line max-len
                );
            }
            return null;
        },
        custom: PropTypes.bool.isRequired,
        host: PropTypes.string,
        lightningID: (props, propName, componentName) => {
            if (!props.channelInfo && !props.lightningID) {
                return (
                    new Error(`One of props \`prepareNewChannel.channelInfo\` or \`prepareNewChannel.lightningID\` was not specified in '${componentName}'.`) // eslint-disable-line max-len
                );
            }
            const lightningIDType = typeof props.lightningID;
            if (props.lightningID && lightningIDType !== "string") {
                return (
                    new Error(`Failed prop type: Invalid prop \`prepareNewChannel.lightningID\` of type \`${lightningIDType}\` supplied to \`${componentName}\`, expected \`string\``) // eslint-disable-line max-len
                );
            }
            return null;
        },
        name: PropTypes.string,
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
