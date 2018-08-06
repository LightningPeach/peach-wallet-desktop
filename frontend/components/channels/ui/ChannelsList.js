import React, { Component } from "react";
import PropTypes from "prop-types";
import { analytics, helpers } from "additional";
import { connect } from "react-redux";
import { Link } from "react-router";
import { channelsTypes as types, channelsOperations as operations, channelsActions as actions } from "modules/channels";
import { streamPaymentSelectors } from "modules/streamPayments";
import { appOperations } from "modules/app";
import { WalletPath } from "routes";
import Informer from "components/common/informer";
import PendingChannel from "./pendingChannel";
import OpenedChannel from "./openedChannel";
import OverlayWithHole from "./overlay-with-hole";

class ChannelsList extends Component {
    constructor(props) {
        super(props);

        this.state = { hideInformer: false };
    }

    componentWillMount() {
        const { dispatch, channels, skipCreateTutorial } = this.props;
        dispatch(operations.getChannels());
        this.showNotification(channels);
        if (channels.length < 1 && skipCreateTutorial === types.PENDING) {
            dispatch(actions.updateCreateTutorialStatus(types.SHOW));
        }
    }

    componentWillReceiveProps(nextProps) {
        const { channels } = nextProps;
        this.showNotification(channels);
    }


    showNotification = (channels) => {
        if (!channels.length) {
            this.setState({ hideInformer: true });
            return;
        }
        const activeChannels = channels.filter(channel => channel.status !== types.CHANNEL_STATUS_PENDING);
        const hideInformer = !activeChannels.length ? true : activeChannels
            .reduce((show, channel) => show || channel.remote_balance > 0, false);
        this.setState({ hideInformer });
    };

    closeChannel = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        analytics.event({ action: "Close channel", category: "Channels", label: "Close Channel" });
        const { dispatch, isActiveStreamRunning } = this.props;
        if (isActiveStreamRunning) {
            dispatch(operations.streamWarningModal());
            return;
        }
        dispatch(operations.setCurrentChannel(parseInt(id, 10)));
        dispatch(operations.openDeleteChannelModal());
    };

    copyPubKey = (pubkey) => {
        if (helpers.hasSelection()) {
            return;
        }
        this.props.dispatch(appOperations.copyToClipboard(pubkey, "Lightning ID copied"));
    };

    renderChannels = () => {
        const { channels, deleteQueue } = this.props;
        const channelsList = [];
        channels.forEach((channel, key) => {
            if (channel.status === types.CHANNEL_STATUS_PENDING) {
                channelsList.push(<PendingChannel
                    key={channel.channel_point}
                    channel={channel}
                    {...this.props}
                />);
            } else {
                channelsList.push(<OpenedChannel
                    key={channel.channel_point}
                    clickClose={e => this.closeChannel(e, key)}
                    clickCopy={() => this.copyPubKey(channel.remote_pubkey)}
                    channel={channel}
                    isDeleting={deleteQueue.indexOf(channel.channel_point) !== -1}
                    {...this.props}
                />);
            }
        });
        return channelsList;
    };

    renderEmptyList = () => (
        <div className="empty-placeholder">
            <span className="placeholder_text">Here all your open channels will be displayed</span>
        </div>
    );

    render() {
        console.log("CHANNELS LIST RENDERING");
        const {
            dispatch, channels, skipCreateTutorial, skipLightningTutorial,
        } = this.props;
        let overlay;
        if (skipLightningTutorial === types.SHOW) {
            overlay = (<OverlayWithHole
                key={3}
                class="overlay__lightning"
                title="Make payment"
                content="Make fast payments with minimal commission"
                onClose={() => dispatch(actions.updateLightningTutorialStatus(types.HIDE))}
                closeOnWrapper={false}
            />);
        }
        if (skipCreateTutorial === types.SHOW) {
            overlay = (<OverlayWithHole
                key={3}
                class="overlay__create"
                title="Create channel"
                content="Create channel for making payments with BTC"
                onClose={() => dispatch(operations.hideShowCreateTutorial())}
                closeOnWrapper={false}
            />);
        }
        return (
            <div className="channels-page">
                {
                    !this.state.hideInformer &&
                    <Informer key="channelInformer">
                        To receive Lightning payment you need to have open channel with non-zero &quot;Available to
                        receive&quot;. To increase amount of the &quot;Available to receive&quot; send
                        &nbsp;<Link to={WalletPath}>Lightning payment</Link>&nbsp;via the channel.
                    </Informer>
                }
                <div className="container">
                    {!channels.length ? this.renderEmptyList() : this.renderChannels()}
                    {overlay}
                </div>
            </div>
        );
    }
}

ChannelsList.propTypes = {
    channels: PropTypes.arrayOf(PropTypes.shape({
        capacity: PropTypes.number.isRequired,
        channel_point: PropTypes.string.isRequired,
        commit_fee: PropTypes.number.isRequired,
        local_balance: PropTypes.number.isRequired,
        remote_pubkey: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
    })),
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    deleteQueue: PropTypes.arrayOf(PropTypes.string).isRequired,
    dispatch: PropTypes.func.isRequired,
    isActiveStreamRunning: PropTypes.bool,
    skipCreateTutorial: PropTypes.string,
    skipLightningTutorial: PropTypes.string,
};

const mapStateToProps = state => ({
    channels: state.channels.channels,
    contacts: state.contacts.contacts,
    deleteQueue: state.channels.deleteQueue,
    isActiveStreamRunning: streamPaymentSelectors.isActiveStreamRunning(state),
    skipCreateTutorial: state.channels.skipCreateTutorial,
    skipLightningTutorial: state.channels.skipLightningTutorial,
});

export default connect(mapStateToProps)(ChannelsList);
