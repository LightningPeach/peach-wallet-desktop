import * as types from "./types";

function isThereActiveChannel(state) {
    const { deleteQueue, channels } = state.channels;
    const isActive = status => status === types.CHANNEL_STATUS_ACTIVE;
    const notDeleting = channel => deleteQueue.indexOf(channel.channel_point) === -1;
    return channels.reduce((active, channel) => active || (isActive(channel.status) && notDeleting(channel)), false);
}

function getFirstNotInUseDefaultChannelName(channels = []) {
    const getNum = (ch) => {
        const defaultNamed = /^CHANNEL [0-9]+$/i.test(ch.name);
        if (defaultNamed) {
            return parseInt(ch.name.replace(/[^0-9.]/g, ""), 10);
        }
        return 0;
    };
    const sort = (a, b) => a < b ? -1 : 1;
    const sortedNums = [0, ...channels.map(getNum)].sort(sort);
    const sortedLength = sortedNums.length;
    let index = -1;
    for (let i = 1; i < sortedLength; i += 1) {
        if (sortedNums[i] - sortedNums[i - 1] > 1) {
            index = sortedNums[i - 1] + 1;
            break;
        }
    }
    return index === -1 ? sortedNums[sortedLength - 1] + 1 : index;
}

export {
    isThereActiveChannel,
    getFirstNotInUseDefaultChannelName,
};
