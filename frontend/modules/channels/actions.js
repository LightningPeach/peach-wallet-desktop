import * as types from "./types";

const setChannels = channels => ({
    payload: channels,
    type: types.SET_CHANNELS,
});

const newChannelPreparing = prepareNewChannel => ({
    payload: prepareNewChannel,
    type: types.NEW_CHANNEL_PREPARING,
});

const clearNewChannelPreparing = () => ({
    type: types.CLEAR_NEW_CHANNEL_PREPARING,
});

const setCurrentChannel = currentChannel => ({
    payload: currentChannel,
    type: types.SET_CURRENT_CHANNEL,
});

const clearCurrentChannel = () => ({
    type: types.CLEAR_CURRENT_CHANNEL,
});

const errorChannels = error => ({
    error,
    type: types.ERROR_CHANNELS,
});

const startCreateNewChannel = () => ({
    type: types.START_CREATE_NEW_CHANNEL,
});

const endCreateNewChannel = () => ({
    type: types.END_CREATE_NEW_CHANNEL,
});

const successCreateNewChannel = expectedBitcoinBalance => ({
    payload: expectedBitcoinBalance,
    type: types.SUCCESS_CREATE_NEW_CHANNEL,
});

const errorCreateNewChannel = error => ({
    payload: {
        newChannelStatus: "failed",
        newChannelStatusDetails: error.error,
    },
    type: types.ERROR_CREATE_NEW_CHANNEL,
});

const updateCreateTutorialStatus = skipCreateTutorial => ({
    payload: skipCreateTutorial,
    type: types.UPDATE_CREATE_TUTORIAL_STATUS,
});

const addToDelete = id => ({
    payload: id,
    type: types.ADD_TO_DELETE,
});

const removeFromDelete = id => ({
    payload: id,
    type: types.REMOVE_FROM_DELETE,
});

export {
    setChannels,
    newChannelPreparing,
    clearNewChannelPreparing,
    errorChannels,
    startCreateNewChannel,
    successCreateNewChannel,
    errorCreateNewChannel,
    endCreateNewChannel,
    setCurrentChannel,
    clearCurrentChannel,
    updateCreateTutorialStatus,
    addToDelete,
    removeFromDelete,
};
