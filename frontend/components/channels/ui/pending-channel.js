import React from "react";
import PropTypes from "prop-types";
import BlocksLoader from "components/ui/blocks-loader";

const PendingChannel = ({ channel, contacts, clickCopy }) => {
    const contact = contacts.filter(c => c.lightningID === channel.remote_pubkey)[0];
    let name;
    let subName;
    const tempName = contact ? contact.name : channel.remote_pubkey;
    if (channel.name) {
        name = <span className="channel__firstname">{channel.name}</span>;
        subName = <span className="channel__subname">(<span>{tempName}</span>)</span>;
    } else {
        name = <span className="channel__firstname">{contact ? contact.name : channel.remote_pubkey}</span>;
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
                    <BlocksLoader countBlocks={channel.maturity} />
                </div>
            </div>
            <div className="row">
                <div className="col-xs-12 channel__text">
                    <div className="text-center channel__text--opening">
                        Channel opening In Progress
                    </div>
                </div>
            </div>
        </div>
    );
};

PendingChannel.propTypes = {
    channel: PropTypes.shape({
        capacity: PropTypes.number.isRequired,
        channel_point: PropTypes.string.isRequired,
        commit_fee: PropTypes.number.isRequired,
        local_balance: PropTypes.number.isRequired,
        maturity: PropTypes.number.isRequired,
        remote_pubkey: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
    }).isRequired,
    clickCopy: PropTypes.func.isRequired,
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })).isRequired,
};

export default PendingChannel;
