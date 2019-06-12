import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";

import { analytics, logger } from "additional";
import Button from "components/ui/button";
import {
    channelsOperations as operations,
    channelsTypes as types,
} from "modules/channels";
import { appTypes } from "modules/app";
import { consts, routes } from "config";

import SubHeader from "components/subheader";
import { CreateChannel, EditChannel, CloseChannel, StreamWarning } from "./modal";
import ChannelsList from "./ui/channels-list";

class ChannelsPage extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(routes.ChannelsFullPath, "Channels");
    }

    componentWillUpdate(nextProps) {
        if (this.props.modalState !== nextProps.modalState && nextProps.modalState === appTypes.CLOSE_MODAL_STATE) {
            analytics.pageview(routes.ChannelsFullPath, "Channels");
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
        logger.log("CHANNELS CONTAINER RENDERING");
        const { modalState } = this.props;
        let modal;
        switch (modalState) {
            case types.MODAL_STATE_NEW_CHANNEL:
                modal = <CreateChannel />;
                break;
            case types.MODAL_STATE_DELETE_CHANNEL:
                modal = <CloseChannel />;
                break;
            case types.MODAL_STATE_EDIT_CHANNEL:
                modal = <EditChannel />;
                break;
            case types.MODAL_WARNING:
                modal = <StreamWarning />;
                break;
            default:
                modal = null;
                break;
        }
        return (
            <Fragment>
                <SubHeader
                    button={
                        <Button
                            class="button__solid overlay__item"
                            onClick={this.createChannel}
                            text={this.props.creatingNewChannel ? "Channel creating" : "Create Channel"}
                            disabled={this.props.creatingNewChannel}
                        />
                    }
                />
                <ChannelsList />
                <ReactCSSTransitionGroup
                    transitionName="modal-transition"
                    transitionEnterTimeout={consts.MODAL_ANIMATION_TIMEOUT}
                    transitionLeaveTimeout={consts.MODAL_ANIMATION_TIMEOUT}
                >
                    {modal}
                </ReactCSSTransitionGroup>
            </Fragment>
        );
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
