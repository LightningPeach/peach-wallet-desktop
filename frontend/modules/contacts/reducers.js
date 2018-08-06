import * as accountTypes from "modules/account/types";
import * as types from "./types";

export const initStateContacts = {
    contacts: [],
    contactsSearch: null,
    currentContact: null,
    newContactAddedName: null,
    newContactDetails: null,
};

const defaultState = JSON.parse(JSON.stringify(initStateContacts));

const contactsReducer = (state = defaultState, action) => {
    switch (action.type) {
        case accountTypes.LOGOUT_ACCOUNT:
            return defaultState;
        case types.SET_CONTACTS:
            return { ...state, contacts: action.payload };
        case types.SET_CONTACTS_SEARCH:
            return { ...state, contactsSearch: action.payload };
        case types.SET_CURRENT_CONTACT:
            return { ...state, currentContact: action.payload };
        case types.ADD_CONTACT:
            return { ...state, contacts: [...state.contacts, action.payload] };
        case types.UPDATE_CURRENT_CONTACT:
            return {
                ...state,
                contacts: state.contacts.map((contact) => {
                    const tempContact = contact;
                    if (tempContact.lightningID === action.payload.lightningID) {
                        tempContact.name = action.payload.name;
                    }
                    return tempContact;
                }),
            };
        case types.PREPARE_NEW_CONTACT:
            return { ...state, newContactDetails: action.payload };
        case types.NEW_CONTACT_ADDED:
            return { ...state, newContactAddedName: action.payload };
        default:
            return state;
    }
};

export default contactsReducer;
