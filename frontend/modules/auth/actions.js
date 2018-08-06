import * as types from "./types";

const setCurrentForm = payload => ({
    payload,
    type: types.SET_CURRENT_FORM,
});

const setTempUsername = payload => ({
    payload,
    type: types.SET_TEMP_USERNAME,
});

const setAuthStep = payload => ({
    payload,
    type: types.SET_REGISTRATION_STEP,
});

export {
    setCurrentForm,
    setAuthStep,
    setTempUsername,
};
