import { appActions } from "modules/app";
import { db, successPromise, errorPromise } from "additional";
import * as actions from "./actions";
import * as types from "./types";

function clearContactsSearch() {
    return dispatch => dispatch(actions.setContactsSearch(null));
}

function setContactsSearch(name) {
    return dispatch => dispatch(actions.setContactsSearch(name));
}

function openNewContactModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_NEW_CONTACT));
}

function openEditContactModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_EDIT_CONTACT));
}

function openDeleteContactModal() {
    return dispatch => dispatch(appActions.setModalState(types.MODAL_STATE_DELETE_CONTACT));
}

function getContacts() {
    return async (dispatch) => {
        try {
            const contacts = await db.contactsBuilder()
                .getMany();
            dispatch(actions.setContacts(contacts));
            return successPromise();
        } catch (e) {
            return errorPromise(e.message, e);
        }
    };
}

function addNewContact(name, lightningID) {
    return async (dispatch) => {
        try {
            await db.contactsBuilder()
                .insert()
                .values({ lightningID, name })
                .execute();
            dispatch(actions.addContact({ lightningID, name }));
            return successPromise();
        } catch (e) {
            return errorPromise(e.message, addNewContact);
        }
    };
}

function updateContactOnServer(name, lightningID) {
    return async (dispatch, getState) => {
        try {
            await db.contactsBuilder()
                .update()
                .set({ name })
                .where("lightningID = :lightningID", { lightningID })
                .execute();
            return successPromise();
        } catch (e) {
            return errorPromise(e.message, updateContactOnServer);
        }
    };
}

function deleteCurrentContact() {
    return async (dispatch, getState) => {
        if (!getState().contacts.currentContact) {
            return errorPromise("No current contact", deleteCurrentContact);
        }
        const { lightningID } = getState().contacts.currentContact;
        try {
            await db.contactsBuilder()
                .delete()
                .where("lightningID = :lightningID", { lightningID })
                .execute();
            return successPromise();
        } catch (e) {
            return errorPromise(e.message, deleteCurrentContact);
        }
    };
}

export {
    clearContactsSearch,
    setContactsSearch,
    openNewContactModal,
    openEditContactModal,
    openDeleteContactModal,
    getContacts,
    addNewContact,
    updateContactOnServer,
    deleteCurrentContact,
};
