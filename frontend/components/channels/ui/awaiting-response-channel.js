import React from "react";
import PropTypes from "prop-types";

const AwaitingResponseChannel = ({ channel, contacts, clickCopy }) => {
    const contact = contacts.filter(c => c.lightningID === channel.lightningID)[0];
    let name;
    let subName;
    const tempName = contact ? contact.name : channel.lightningID;
    if (channel.name) {
        name = <span className="channel__firstname">{channel.name}</span>;
        subName = <span className="channel__subname">(<span>{tempName}</span>)</span>;
    } else {
        name = <span className="channel__firstname">{contact ? contact.name : channel.lightningID}</span>;
    }
    return (
        <div
            className="channel channel__pending"
            onClick={clickCopy}
        >
            <div className="row">
                <div className="col-xs-10 channel__name">
                    {name}{subName}
                </div>
            </div>
            <div className="row">
                <div className="col-xs-12 channel__line">
                    <div className="channel__line--awaiting" />
                </div>
            </div>
            <div className="row">
                <div className="col-xs-12 channel__text">
                    <div className="text-center channel__text--opening">
                        Connecting to remote peer
                    </div>
                </div>
            </div>
        </div>
    );
};

AwaitingResponseChannel.propTypes = {
    channel: PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
    }).isRequired,
    clickCopy: PropTypes.func.isRequired,
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })).isRequired,
};

export default AwaitingResponseChannel;
