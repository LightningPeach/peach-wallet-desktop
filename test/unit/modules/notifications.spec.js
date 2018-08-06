import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import omit from "lodash/omit";

import { notificationsActions as actions, notificationsTypes as types } from "modules/notifications";
import notificationsReducer, { initStateNotifications } from "modules/notifications/reducers";
import { accountTypes } from "modules/account";
import { DEFAULT_NOTIFICATIONS_POSITION, DEFAULT_NOTIFICATIONS_DISMISS } from "config/consts";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("Notifications Unit Tests", () => {
    describe("Action creators", () => {
        let data;
        let expectedData;
        let response;

        beforeEach(() => {
            data = "foo";
            expectedData = {
                payload: data,
                type: undefined,
            };
            response = "";
        });

        it("should create an action to hide notifications", () => {
            expectedData.type = types.HIDE_NOTIFICATION;
            expect(actions.hideNotification(data)).to.deep.equal(expectedData);
        });

        it("should create an action to remove all notifications", () => {
            expectedData = {
                type: types.REMOVE_ALL_NOTIFICATIONS,
            };
            expect(actions.removeAllNotifications()).to.deep.equal(expectedData);
        });

        it("should create an action to show notification with no parameters", () => {
            expectedData.payload = {
                autoDismiss: DEFAULT_NOTIFICATIONS_DISMISS,
                level: "success",
                position: DEFAULT_NOTIFICATIONS_POSITION,
            };
            expectedData.type = types.SHOW_NOTIFICATION;
            response = actions.showNotification();
            response.payload = omit(response.payload, "uid");
            expect(response).to.deep.equal(expectedData);
        });

        it("should create an action to show notification with success level", () => {
            expectedData.payload = {
                autoDismiss: DEFAULT_NOTIFICATIONS_DISMISS,
                level: "success",
                position: DEFAULT_NOTIFICATIONS_POSITION,
            };
            expectedData.type = types.SHOW_NOTIFICATION;
            response = actions.success();
            response.payload = omit(response.payload, "uid");
            expect(response).to.deep.equal(expectedData);
        });

        it("should create an action to show notification with info level", () => {
            expectedData.payload = {
                autoDismiss: DEFAULT_NOTIFICATIONS_DISMISS,
                level: "info",
                position: DEFAULT_NOTIFICATIONS_POSITION,
            };
            expectedData.type = types.SHOW_NOTIFICATION;
            response = actions.info();
            response.payload = omit(response.payload, "uid");
            expect(response).to.deep.equal(expectedData);
        });

        it("should create an action to show notification with error level", () => {
            expectedData.payload = {
                autoDismiss: 0,
                level: "error",
                position: DEFAULT_NOTIFICATIONS_POSITION,
            };
            expectedData.type = types.SHOW_NOTIFICATION;
            response = actions.error();
            response.payload = omit(response.payload, "uid");
            expect(response).to.deep.equal(expectedData);
        });

        it("should create an action to show notification with warning level", () => {
            expectedData.payload = {
                autoDismiss: DEFAULT_NOTIFICATIONS_DISMISS,
                level: "warning",
                position: DEFAULT_NOTIFICATIONS_POSITION,
            };
            expectedData.type = types.SHOW_NOTIFICATION;
            response = actions.warning();
            response.payload = omit(response.payload, "uid");
            expect(response).to.deep.equal(expectedData);
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
            expectedData = [];
            state = undefined;
        });

        it("should return the initial state", () => {
            expect(notificationsReducer(state, {})).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action.type = accountTypes.LOGOUT_ACCOUNT;
            state = ["some_item"];
            expect(notificationsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle REMOVE_ALL_NOTIFICATIONS action", () => {
            action.type = types.REMOVE_ALL_NOTIFICATIONS;
            state = [];
            state = ["some_item"];
            expect(notificationsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle HIDE_NOTIFICATION action", () => {
            action.type = types.HIDE_NOTIFICATION;
            state = [
                {
                    uid: "bar",
                    data: "data_bar",
                },
                {
                    uid: "foo",
                    data: "data_foo",
                },
            ];
            expectedData = [
                {
                    uid: "bar",
                    data: "data_bar",
                },
            ];
            expect(notificationsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SHOW_NOTIFICATION action (first notification)", () => {
            action.type = types.SHOW_NOTIFICATION;
            data = {
                level: "info",
                uid: "foo",
            };
            action.payload = data;
            expectedData = [data];
            expect(notificationsReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SHOW_NOTIFICATION action ( errors > max )", () => {
            action.type = types.SHOW_NOTIFICATION;
            data = {
                level: "error",
                uid: "quux",
            };
            action.payload = data;
            state = [
                {
                    level: "info",
                    uid: "foo",
                },
                {
                    level: "error",
                    uid: "bar",
                },
                {
                    level: "error",
                    uid: "baz",
                },
                {
                    level: "error",
                    uid: "qux",
                },
            ];
            expectedData = [
                {
                    level: "info",
                    uid: "foo",
                },
                {
                    level: "error",
                    uid: "baz",
                },
                {
                    level: "error",
                    uid: "qux",
                },
                {
                    level: "error",
                    uid: "quux",
                },
            ];
            expect(notificationsReducer(state, action)).to.deep.equal(expectedData);
        });
    });
});
