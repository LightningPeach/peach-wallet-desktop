import * as types from "./types";

const setContacts = contacts => ({
    payload: contacts,
    type: types.SET_CONTACTS,
});

const setContactsSearch = contactsSearch => ({
    payload: contactsSearch,
    type: types.SET_CONTACTS_SEARCH,
});

const setCurrentContact = currentContact => ({
    payload: currentContact,
    type: types.SET_CURRENT_CONTACT,
});

const addContact = payload => ({
    payload,
    type: types.ADD_CONTACT,
});

const updateCurrentContact = (name, lightningID) => ({
    payload: {
        lightningID,
        name,
    },
    type: types.UPDATE_CURRENT_CONTACT,
});

const prepareNewContact = newContactDetails => ({
    payload: newContactDetails,
    type: types.PREPARE_NEW_CONTACT,
});

const newContactAdded = newContactAddedName => ({
    payload: newContactAddedName,
    type: types.NEW_CONTACT_ADDED,
});

export {
    setContacts,
    setContactsSearch,
    setCurrentContact,
    addContact,
    updateCurrentContact,
    prepareNewContact,
    newContactAdded,
};
