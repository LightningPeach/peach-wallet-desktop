import configureStore from "redux-mock-store";
import thunk from "redux-thunk";

import {
    contactsActions as actions,
    contactsTypes as types,
    contactsOperations as operations,
    contactsSelectors as selectors,
} from "modules/contacts";
import contactsReducer, { initStateContacts } from "modules/contacts/reducers";
import { accountTypes } from "modules/account";
import { appTypes } from "modules/app";
import { db, errorPromise, successPromise } from "additional";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("Contacts Unit Tests", () => {
    describe("Action creators", () => {
        let data;
        let expectedData;

        beforeEach(() => {
            data = "foo";
            expectedData = {
                payload: data,
                type: undefined,
            };
        });

        it("should create an action to set contact", () => {
            expectedData.type = types.SET_CONTACTS;
            expect(actions.setContacts(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set contacts search", () => {
            expectedData.type = types.SET_CONTACTS_SEARCH;
            expect(actions.setContactsSearch(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set current contact", () => {
            expectedData.type = types.SET_CURRENT_CONTACT;
            expect(actions.setCurrentContact(data)).to.deep.equal(expectedData);
        });

        it("should create an action to add contact", () => {
            expectedData.type = types.ADD_CONTACT;
            expect(actions.addContact(data)).to.deep.equal(expectedData);
        });

        it("should create an action to update current contact", () => {
            data = {
                name: "foo",
                lightningID: "bar",
            };
            expectedData = {
                payload: data,
                type: types.UPDATE_CURRENT_CONTACT,
            };
            expect(actions.updateCurrentContact(data.name, data.lightningID)).to.deep.equal(expectedData);
        });

        it("should create an action to prepare new contact", () => {
            expectedData.type = types.PREPARE_NEW_CONTACT;
            expect(actions.prepareNewContact(data)).to.deep.equal(expectedData);
        });

        it("should create an action to new contact added", () => {
            expectedData.type = types.NEW_CONTACT_ADDED;
            expect(actions.newContactAdded(data)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        const lightningID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        const name = "waldo";
        let data;
        let store;
        let initState;
        let expectedActions;
        let expectedData;
        let errorResp;
        let successResp;
        let fakeDB;
        let fakeDispatchReturnError;
        let fakeDispatchReturnSuccess;

        beforeEach(async () => {
            errorResp = await errorPromise("foo", { name: undefined });
            successResp = await successPromise();
            fakeDispatchReturnError = () => errorResp;
            fakeDispatchReturnSuccess = () => successResp;
            fakeDB = sinon.stub(db);
            window.ipcClient.resetHistory();
            window.ipcRenderer.send.resetHistory();
            data = {
                contactsBuilder: {
                    getMany: sinon.stub(),
                    insert: sinon.stub(),
                    values: sinon.stub(),
                    execute: sinon.stub(),
                    update: sinon.stub(),
                    set: sinon.stub(),
                    where: sinon.stub(),
                    delete: sinon.stub(),
                    whereParam: "lightningID = :lightningID",
                },
            };
            expectedData = data;
            initState = {
                contacts: {
                    ...initStateContacts,
                    currentContact: {
                        lightningID,
                    },
                },
            };
            expectedData = undefined;
            expectedActions = [];
            store = mockStore(initState);
        });

        afterEach(() => {
            sinon.restore();
        });

        describe("Contacts search", () => {
            beforeEach(() => {
                expectedData = { type: types.SET_CONTACTS_SEARCH };
            });

            it("clearContactsSearch()", async () => {
                expectedData.payload = null;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.clearContactsSearch())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("setContactsSearch()", async () => {
                data = "foo";
                expectedData = {
                    payload: data,
                    type: types.SET_CONTACTS_SEARCH,
                };
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.setContactsSearch(data))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        describe("Modal windows", () => {
            beforeEach(() => {
                expectedData = { type: appTypes.SET_MODAL_STATE };
            });

            it("openNewContactModal()", async () => {
                expectedData.payload = types.MODAL_STATE_NEW_CONTACT;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openNewContactModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openEditContactModal()", async () => {
                expectedData.payload = types.MODAL_STATE_EDIT_CONTACT;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openEditContactModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });

            it("openDeleteContactModal()", async () => {
                expectedData.payload = types.MODAL_STATE_DELETE_CONTACT;
                expectedActions = [expectedData];
                expect(await store.dispatch(operations.openDeleteContactModal())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
            });
        });

        describe("getContacts()", () => {
            beforeEach(() => {
                data.response = [{ data: "foo" }];
                fakeDB.contactsBuilder.returns({
                    getMany: data.contactsBuilder.getMany.returns(data.response),
                });
            });

            it("db error", async () => {
                fakeDB.contactsBuilder.throws(new Error("foo"));
                expectedData = {
                    ...errorResp,
                    f: "Error",
                };
                expect(await store.dispatch(operations.getContacts())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.contactsBuilder).to.be.calledOnce;
                expect(data.contactsBuilder.getMany).not.to.be.called;
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: data.response,
                        type: types.SET_CONTACTS,
                    },
                ];
                expect(await store.dispatch(operations.getContacts())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.contactsBuilder).to.be.calledOnce;
                expect(data.contactsBuilder.getMany).to.be.calledOnce;
                expect(data.contactsBuilder.getMany).to.be.calledImmediatelyAfter(fakeDB.contactsBuilder);
            });
        });

        describe("addNewContact()", () => {
            beforeEach(() => {
                data.response = [{ data: "foo" }];
                fakeDB.contactsBuilder.returns({
                    insert: data.contactsBuilder.insert.returns({
                        values: data.contactsBuilder.values.returns({
                            execute: data.contactsBuilder.execute.returns(data.response),
                        }),
                    }),
                });
            });

            it("db error", async () => {
                fakeDB.contactsBuilder.throws(new Error("foo"));
                expectedData = {
                    ...errorResp,
                    f: "addNewContact",
                };
                expect(await store.dispatch(operations.addNewContact(name, lightningID))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.contactsBuilder).to.be.calledOnce;
                expect(data.contactsBuilder.insert).not.to.be.called;
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        payload: {
                            lightningID,
                            name,
                        },
                        type: types.ADD_CONTACT,
                    },
                ];
                expect(await store.dispatch(operations.addNewContact(name, lightningID))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.contactsBuilder).to.be.calledOnce;
                expect(data.contactsBuilder.insert).to.be.calledOnce;
                expect(data.contactsBuilder.insert).to.be.calledImmediatelyAfter(fakeDB.contactsBuilder);
                expect(data.contactsBuilder.values).to.be.calledOnce;
                expect(data.contactsBuilder.values).to.be.calledImmediatelyAfter(data.contactsBuilder.insert);
                expect(data.contactsBuilder.values).to.be.calledWith({ lightningID, name });
                expect(data.contactsBuilder.execute).to.be.calledOnce;
                expect(data.contactsBuilder.execute).to.be.calledImmediatelyAfter(data.contactsBuilder.values);
            });
        });

        describe("updateContactOnServer()", () => {
            beforeEach(() => {
                data.response = [{ data: "foo" }];
                fakeDB.contactsBuilder.returns({
                    update: data.contactsBuilder.update.returns({
                        set: data.contactsBuilder.set.returns({
                            where: data.contactsBuilder.where.returns({
                                execute: data.contactsBuilder.execute.returns(data.response),
                            }),
                        }),
                    }),
                });
            });

            it("db error", async () => {
                fakeDB.contactsBuilder.throws(new Error("foo"));
                expectedData = {
                    ...errorResp,
                    f: "updateContactOnServer",
                };
                expect(await store.dispatch(operations.updateContactOnServer(
                    name,
                    lightningID,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.contactsBuilder).to.be.calledOnce;
                expect(data.contactsBuilder.update).not.to.be.called;
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expect(await store.dispatch(operations.updateContactOnServer(
                    name,
                    lightningID,
                ))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.contactsBuilder).to.be.calledOnce;
                expect(data.contactsBuilder.update).to.be.calledOnce;
                expect(data.contactsBuilder.update).to.be.calledImmediatelyAfter(fakeDB.contactsBuilder);
                expect(data.contactsBuilder.set).to.be.calledOnce;
                expect(data.contactsBuilder.set).to.be.calledImmediatelyAfter(data.contactsBuilder.update);
                expect(data.contactsBuilder.set).to.be.calledWith({ name });
                expect(data.contactsBuilder.where).to.be.calledOnce;
                expect(data.contactsBuilder.where).to.be.calledImmediatelyAfter(data.contactsBuilder.set);
                expect(data.contactsBuilder.where).to.be.calledWith(data.contactsBuilder.whereParam, { lightningID });
                expect(data.contactsBuilder.execute).to.be.calledOnce;
                expect(data.contactsBuilder.execute).to.be.calledImmediatelyAfter(data.contactsBuilder.where);
            });
        });

        describe("deleteCurrentContact()", () => {
            beforeEach(() => {
                store = mockStore(initState);
                data.response = [{ data: "foo" }];
                fakeDB.contactsBuilder.returns({
                    delete: data.contactsBuilder.delete.returns({
                        where: data.contactsBuilder.where.returns({
                            execute: data.contactsBuilder.execute.returns(data.response),
                        }),
                    }),
                });
            });

            it("no current contact", async () => {
                initState.contacts.currentContact = null;
                store = mockStore(initState);
                expectedData = {
                    ...errorResp,
                    error: "No current contact",
                    f: "deleteCurrentContact",
                };
                expect(await store.dispatch(operations.deleteCurrentContact())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.contactsBuilder).not.to.be.called;
            });

            it("db error", async () => {
                fakeDB.contactsBuilder.throws(new Error("foo"));
                expectedData = {
                    ...errorResp,
                    f: "deleteCurrentContact",
                };
                expect(await store.dispatch(operations.deleteCurrentContact())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.contactsBuilder).to.be.calledOnce;
                expect(data.contactsBuilder.delete).not.to.be.called;
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expect(await store.dispatch(operations.deleteCurrentContact())).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeDB.contactsBuilder).to.be.calledOnce;
                expect(data.contactsBuilder.delete).to.be.calledOnce;
                expect(data.contactsBuilder.delete).to.be.calledImmediatelyAfter(fakeDB.contactsBuilder);
                expect(data.contactsBuilder.where).to.be.calledOnce;
                expect(data.contactsBuilder.where).to.be.calledImmediatelyAfter(data.contactsBuilder.delete);
                expect(data.contactsBuilder.where).to.be.calledWith(data.contactsBuilder.whereParam, { lightningID });
                expect(data.contactsBuilder.execute).to.be.calledOnce;
                expect(data.contactsBuilder.execute).to.be.calledImmediatelyAfter(data.contactsBuilder.where);
            });
        });
    });

    describe("Reducer actions", () => {
        let data;
        let action;
        let expectedData;
        let state;

        beforeEach(() => {
            data = "foo";
            action = {
                payload: data,
                type: undefined,
            };
            expectedData = JSON.parse(JSON.stringify(initStateContacts));
            state = undefined;
        });

        it("should return the initial state", () => {
            expect(contactsReducer(state, {})).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action.type = accountTypes.LOGOUT_ACCOUNT;
            state = JSON.parse(JSON.stringify(initStateContacts));
            state.contacts = ["foo"];
            state.currentContact = "bar";
            expect(contactsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_CONTACTS action", () => {
            action.type = types.SET_CONTACTS;
            expectedData.contacts = data;
            expect(contactsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_CONTACTS_SEARCH action", () => {
            action.type = types.SET_CONTACTS_SEARCH;
            expectedData.contactsSearch = data;
            expect(contactsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_CURRENT_CONTACT action", () => {
            action.type = types.SET_CURRENT_CONTACT;
            expectedData.currentContact = data;
            expect(contactsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ADD_CONTACT action", () => {
            action.type = types.ADD_CONTACT;
            expectedData.contacts = [data];
            expect(contactsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ADD_CONTACT action (correct LightningID)", () => {
            state = JSON.parse(JSON.stringify(initStateContacts));
            state.contacts = [{
                name: "foo",
                lightningID: "bar",
            }];
            action = {
                payload: {
                    name: "bar",
                    lightningID: "bar",
                },
                type: types.UPDATE_CURRENT_CONTACT,
            };
            expectedData.contacts = [{
                name: "bar",
                lightningID: "bar",
            }];
            expect(contactsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle ADD_CONTACT action (incorrect LightningID)", () => {
            state = JSON.parse(JSON.stringify(initStateContacts));
            state.contacts = [{
                name: "foo",
                lightningID: "bar",
            }];
            action = {
                payload: {
                    name: "bar",
                    lightningID: "foo",
                },
                type: types.UPDATE_CURRENT_CONTACT,
            };
            expectedData.contacts = [{
                name: "foo",
                lightningID: "bar",
            }];
            expect(contactsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle PREPARE_NEW_CONTACT action", () => {
            action.type = types.PREPARE_NEW_CONTACT;
            expectedData.newContactDetails = data;
            expect(contactsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle NEW_CONTRACT_ADDED action", () => {
            action.type = types.NEW_CONTACT_ADDED;
            expectedData.newContactAddedName = data;
            expect(contactsReducer(state, action)).to.deep.equal(expectedData);
        });
    });

    describe("Selectors Unit Tests", () => {
        const lightningID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        let state;
        let expectedData;

        beforeEach(() => {
            state = {
                contacts: {
                    ...initStateContacts,
                    contacts: [],
                },
            };
            expectedData = {};
        });

        it("getByLightning()", () => {
            state.contacts.contacts = [
                {
                    lightningID,
                    extra: "foo",
                },
                {
                    lightningID: "bar",
                    extra: "bar",
                },
            ];
            expectedData = {
                lightningID,
                extra: "foo",
            };
            expect(selectors.getByLightning(state, lightningID)).to.deep.equal(expectedData);
        });
    });
});
