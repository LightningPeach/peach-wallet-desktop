import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router";

import { analytics, helpers, logger } from "additional";
import { channelsTypes as types, channelsOperations as operations, channelsActions as actions } from "modules/channels";
import { streamPaymentSelectors } from "modules/streamPayments";
import { appOperations } from "modules/app";
import { routes } from "config";

import Informer from "components/common/informer";
import PendingChannel from "./pending-channel";
import AwaitingResponseChannel from "./awaiting-response-channel";
import OpenedChannel from "./opened-channel";
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

    editChannel = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        analytics.event({ action: "Edit channel", category: "Channels", label: "Edit" });
        const { dispatch } = this.props;
        dispatch(operations.setCurrentChannel(id));
        dispatch(operations.openEditChannelModal());
    };

    closeChannel = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        analytics.event({ action: "Close channel", category: "Channels", label: "Close Channel" });
        const { dispatch, isActiveStreamRunning } = this.props;
        dispatch(operations.setCurrentChannel(parseInt(id, 10)));
        if (isActiveStreamRunning) {
            dispatch(operations.openStreamWarningModal());
            return;
        }
        dispatch(operations.openDeleteChannelModal());
    };

    copyPubKey = (pubkey) => {
        if (helpers.hasSelection()) {
            return;
        }
        this.props.dispatch(appOperations.copyToClipboard(pubkey, "Lightning ID copied"));
    };

    renderChannels = () => {
        const {
            channels, deleteQueue, creatingNewChannel, prepareNewChannel, contacts,
        } = this.props;
        const channelsList = [];
        channels.forEach((channel, key) => {
            if (channel.status === types.CHANNEL_STATUS_PENDING) {
                channelsList.push(<PendingChannel
                    key={channel.channel_point}
                    clickCopy={() => this.copyPubKey(channel.remote_pubkey)}
                    channel={channel}
                    contacts={contacts}
                />);
            } else {
                channelsList.push(<OpenedChannel
                    key={channel.channel_point}
                    clickClose={e => this.closeChannel(e, key)}
                    clickCopy={() => this.copyPubKey(channel.remote_pubkey)}
                    clickEdit={e => this.editChannel(e, key)}
                    channel={channel}
                    isDeleting={deleteQueue.indexOf(channel.channel_point) !== -1}
                    contacts={contacts}
                />);
            }
        });
        if (creatingNewChannel) {
            channelsList.push(<AwaitingResponseChannel
                key={prepareNewChannel.lightningID}
                clickCopy={() => this.copyPubKey(prepareNewChannel.lightningID)}
                channel={prepareNewChannel}
                contacts={contacts}
            />);
        }
        return channelsList;
    };

    renderEmptyList = () => (
        <div className="page__placeholder page__placeholder--list">
            <span className="page__placeholder-text">Here all your open channels will be displayed</span>
        </div>
    );

    render() {
        const {
            dispatch, channels, skipCreateTutorial, creatingNewChannel,
        } = this.props;
        return (
            <Fragment>
                {
                    !this.state.hideInformer &&
                    <Informer key="channelInformer">
                        To receive Lightning payment you need to have open channel with non-zero &quot;Available to
                        receive&quot;. To increase amount of the &quot;Available to receive&quot; send
                        &nbsp;<Link className="link" to={routes.WalletPath}>Lightning payment</Link>&nbsp;via the
                        channel.
                    </Informer>
                }
                <div className="page channels">
                    <div className="container">
                        {!channels.length && !creatingNewChannel ? this.renderEmptyList() : this.renderChannels()}
                        {skipCreateTutorial === types.SHOW && (
                            <OverlayWithHole
                                class="overlay--create-channel"
                                title="Create channel"
                                content="Create channel for making payments with BTC"
                                onClose={() => dispatch(operations.hideShowCreateTutorial())}
                                closeOnWrapper={false}
                            />
                        )}
                    </div>
                </div>
            </Fragment>
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
    creatingNewChannel: PropTypes.bool,
    deleteQueue: PropTypes.arrayOf(PropTypes.string).isRequired,
    dispatch: PropTypes.func.isRequired,
    isActiveStreamRunning: PropTypes.bool,
    prepareNewChannel: PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
    }),
    skipCreateTutorial: PropTypes.string,
};

const mapStateToProps = state => ({
    channels: state.channels.channels,
    contacts: state.contacts.contacts,
    creatingNewChannel: state.channels.creatingNewChannel,
    deleteQueue: state.channels.deleteQueue,
    isActiveStreamRunning: streamPaymentSelectors.isActiveStreamRunning(state),
    prepareNewChannel: state.channels.prepareNewChannel,
    skipCreateTutorial: state.channels.skipCreateTutorial,
});

export default connect(mapStateToProps)(ChannelsList);
