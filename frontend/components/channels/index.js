import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import SubHeader from "components/subheader";
import Button from "components/ui/button";
import {
    channelsOperations as operations,
    channelsTypes as types,
} from "modules/channels";
import { appTypes } from "modules/app";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { MODAL_ANIMATION_TIMEOUT } from "config/consts";
import { ChannelsFullPath } from "routes";
import CreateChannel from "./modal/create-channel";
import CloseChannel from "./modal/close-channel";
import StreamWarning from "./modal/stream-warning";
import ChannelsList from "./ui/ChannelsList";

class ChannelsPage extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(ChannelsFullPath, "Channels");
    }

    componentWillUpdate(nextProps) {
        if (this.props.modalState !== nextProps.modalState && nextProps.modalState === appTypes.CLOSE_MODAL_STATE) {
            analytics.pageview(ChannelsFullPath, "Channels");
        }
    }

    createChannel = () => {
        analytics.event({
            action: "Subheader",
            category: "Channels",
            label: "Create Channel",
        });
        const { dispatch } = this.props;
        dispatch(operations.hideShowCreateTutorial());
        dispatch(operations.clearCurrentChannel());
        dispatch(operations.openNewChannelModal());
    };

    render() {
        console.log("CHANNELS CONTAINER RENDERING");
        const { modalState } = this.props;
        let modal;
        switch (modalState) {
            case types.MODAL_STATE_NEW_CHANNEL:
                modal = <CreateChannel />;
                break;
            case types.MODAL_STATE_DELETE_CHANNEL:
                modal = <CloseChannel />;
                break;
            case types.MODAL_WARNING:
                modal = <StreamWarning />;
                break;
            default:
                modal = null;
                break;
        }
        return [
            <SubHeader
                key="subHeader"
                button={
                    <Button
                        class="button__orange overlay__item"
                        onClick={this.createChannel}
                        text={this.props.creatingNewChannel ? "Channel creating" : "Create Channel"}
                        disabled={this.props.creatingNewChannel}
                    />
                }
            />,
            <ChannelsList key="channelList" />,
            <ReactCSSTransitionGroup
                transitionName="modal-transition"
                transitionEnterTimeout={MODAL_ANIMATION_TIMEOUT}
                transitionLeaveTimeout={MODAL_ANIMATION_TIMEOUT}
                key="channelsModals"
            >
                {modal}
            </ReactCSSTransitionGroup>,
        ];
    }
}

ChannelsPage.propTypes = {
    creatingNewChannel: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
    modalState: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    creatingNewChannel: state.channels.creatingNewChannel,
    modalState: state.app.modalState,
});

export default connect(mapStateToProps)(ChannelsPage);
