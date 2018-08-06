import * as types from "./types";

function isThereActiveChannel(state) {
    const { deleteQueue, channels } = state.channels;
    const isActive = status => status === types.CHANNEL_STATUS_ACTIVE;
    const notDeleting = channel => deleteQueue.indexOf(channel.channel_point) === -1;
    return channels.reduce((active, channel) => active || (isActive(channel.status) && notDeleting(channel)), false);
}

function getCountNamelessChannels(channels = []) {
    const getNum = (ch) => {
        const defaultNamed = /^CHANNEL [0-9]+$/i.test(ch.name);
        if (defaultNamed) {
            return parseInt(ch.name.replace(/[^0-9.]/g, ""), 10);
        }
        return 0;
    };
    return Math.max(...[
        0,
        ...channels.map(getNum),
    ]);
}

export {
    isThereActiveChannel,
    getCountNamelessChannels,
};
