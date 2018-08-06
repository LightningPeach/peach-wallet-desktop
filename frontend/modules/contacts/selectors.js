function getByLightning(state, lightningId) {
    return state.contacts.contacts.filter(c => c.lightningID === lightningId)[0];
}

export { getByLightning };// eslint-disable-line import/prefer-default-export
