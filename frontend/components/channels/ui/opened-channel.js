import React from "react";
import PropTypes from "prop-types";
import BalanceWithMeasure from "components/common/balance-with-measure";
import { channelsTypes } from "modules/channels";

const OpenedChannel = ({ channel, contacts, isDeleting, clickCopy, clickClose, clickEdit }) => { // eslint-disable-line
    const contact = contacts.filter(c => c.lightningID === channel.remote_pubkey)[0];
    const active = channel.status === channelsTypes.CHANNEL_STATUS_ACTIVE;
    let channelClass = `channel channel__${active ? "active" : "not-active"}`;
    const deleting = isDeleting;
    if (deleting) {
        channelClass += " channel__deleting";
    }
    const sendPercent = (channel.local_balance * 100) / (channel.remote_balance + channel.local_balance);
    const tempName = contact ? contact.name : channel.remote_pubkey;
    let name;
    let subName;
    let bottomText;
    if (channel.name) {
        name = <span className="channel__firstname">{channel.name}</span>;
        subName = (<span className="channel__subname">(<span>{tempName}</span>)</span>);
    } else {
        name = <span className="channel__firstname">{tempName}</span>;
    }

    if (!active) {
        bottomText = <div className="channel__text channel__text--warning text-center">Channel is not active</div>;
    } else {
        bottomText = [
            <div className="channel__text channel__text--balance" key="channelLBalance">
                My balance: <BalanceWithMeasure satoshi={channel.local_balance} />
            </div>,
            <div className="channel__text channel__text--receive text-right" key="channelRBalance">
                Available to receive: <BalanceWithMeasure satoshi={channel.remote_balance} />
            </div>,
        ];
    }

    return (
        <div
            className={channelClass}
            onClick={clickCopy}
        >
            <div className="row row--no-col justify-between-xs">
                <div className="channel__name">
                    {name}{subName}
                </div>
                {!deleting &&
                <div className="channel__buttons">
                    <button
                        type="button"
                        className="pull-right channel__button channel__button--close"
                        onClick={clickClose}
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        className="pull-right channel__button channel__button--edit"
                        onClick={clickEdit}
                    >
                        Edit
                    </button>
                </div>
                }
            </div>
            <div className="row">
                <div className="col-xs-12">
                    <progress max={100} value={sendPercent} className="channel__progress" />
                </div>
            </div>
            <div className="row">
                <div className="col-xs-12 channel__bottom">
                    {bottomText}
                </div>
            </div>
        </div>
    );
};

OpenedChannel.propTypes = {
    channel: PropTypes.shape({
        capacity: PropTypes.number.isRequired,
        channel_point: PropTypes.string.isRequired,
        commit_fee: PropTypes.number.isRequired,
        local_balance: PropTypes.number.isRequired,
        remote_balance: PropTypes.number.isRequired,
        remote_pubkey: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
    }).isRequired,
    clickClose: PropTypes.func.isRequired,
    clickCopy: PropTypes.func.isRequired,
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })).isRequired,
    isDeleting: PropTypes.bool,
};

export default OpenedChannel;
