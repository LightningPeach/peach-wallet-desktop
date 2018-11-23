import * as types from "./types";

const setCurrentForm = payload => ({
    payload,
    type: types.SET_CURRENT_FORM,
});

const setTempUsername = payload => ({
    payload,
    type: types.SET_TEMP_USERNAME,
});

const setPassword = payload => ({
    payload,
    type: types.SET_PASSWORD,
});

const setAuthStep = payload => ({
    payload,
    type: types.SET_REGISTRATION_STEP,
});

const setSessionStatus = payload => ({
    payload,
    type: types.SET_SESSION_STATUS,
});

export {
    setCurrentForm,
    setAuthStep,
    setPassword,
    setTempUsername,
    setSessionStatus,
};
