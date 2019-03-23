import configureStore from "redux-mock-store";
import thunk from "redux-thunk";

import { exceptions } from "config";
import { authActions as actions, authTypes as types, authOperations as operations } from "modules/auth";
import authReducer, { initStateAuth } from "modules/auth/reducers";
import { accountTypes, accountOperations } from "modules/account";
import { lndOperations } from "modules/lnd";
import { appOperations } from "modules/app";
import { errorPromise, successPromise, unsuccessPromise, helpers } from "additional";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("Auth Unit Tests", () => {
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

        it("should create an action to set current form", () => {
            expectedData.type = types.SET_CURRENT_FORM;
            expect(actions.setCurrentForm(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set temporary wallet name", () => {
            expectedData.type = types.SET_TEMP_WALLET_NAME;
            expect(actions.setTempWalletName(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set auth step", () => {
            expectedData.type = types.SET_REGISTRATION_STEP;
            expect(actions.setAuthStep(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set password", () => {
            expectedData.type = types.SET_PASSWORD;
            expect(actions.setPassword(data)).to.deep.equal(expectedData);
        });

        it("should create an action to set session status", () => {
            expectedData.type = types.SET_SESSION_STATUS;
            expect(actions.setSessionStatus(data)).to.deep.equal(expectedData);
        });
    });

    describe("Operations tests", () => {
        let data;
        let store;
        let initState;
        let expectedActions;
        let expectedData;
        let errorResp;
        let successResp;
        let unsuccessResp;
        let fakeAccount;
        let fakeApp;
        let fakeLnd;
        let fakeDispatchReturnError;
        let fakeDispatchReturnSuccess;

        beforeEach(async () => {
            errorResp = await errorPromise(undefined, { name: undefined });
            successResp = await successPromise();
            unsuccessResp = await unsuccessPromise({ name: undefined });
            fakeDispatchReturnError = () => errorResp;
            fakeDispatchReturnSuccess = () => successResp;
            window.ipcClient.resetHistory();
            fakeApp = sinon.stub(appOperations);
            fakeApp.openDb.returns(fakeDispatchReturnSuccess);
            fakeApp.closeDb.returns(fakeDispatchReturnSuccess);
            fakeAccount = sinon.stub(accountOperations);
            fakeLnd = sinon.stub(lndOperations);
            data = {
                walletName: "testWalletName",
                password: "testPassword",
                seed: "testMnemonic",
                setClearLndData: {
                    errMsg: "setClearLndData error",
                    success: async () => successPromise(),
                    error: async () => errorPromise(data.setClearLndData.errMsg, "setClearLndData"),
                },
                startLnd: {
                    errMsg: "startLnd error",
                    success: async () => successPromise(),
                    error: async () => errorPromise(data.startLnd.errMsg, "startLnd"),
                },
                clearLndData: {
                    errMsg: "clearLndData error",
                    success: async () => successPromise(),
                    error: async () => errorPromise(data.clearLndData.errMsg, "clearLndData"),
                },
                initAccount: {
                    errMsg: "initAccount error",
                    success: async () => successPromise(),
                    error: async () => errorPromise(data.initAccount.errMsg, "initAccount"),
                },
            };
            initState = {};
            expectedData = {};
            expectedActions = [];
            store = mockStore({
                auth: initStateAuth,
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it("setForm()", async () => {
            data.form = "Test form";
            expectedData = {
                payload: data.form,
                type: types.SET_CURRENT_FORM,
            };
            expectedActions = [expectedData];
            expect(await store.dispatch(operations.setForm(data.form))).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        it("setAuthStep()", async () => {
            data.step = "Test reg step";
            expectedData = {
                payload: data.step,
                type: types.SET_REGISTRATION_STEP,
            };
            expectedActions = [expectedData];
            expect(await store.dispatch(operations.setAuthStep(data.step))).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        it("setHashedPassword()", async () => {
            data.password = "Password12345";
            expectedData = {
                payload: helpers.hash(data.password),
                type: types.SET_PASSWORD,
            };
            expectedActions = [expectedData];
            expect(await store.dispatch(operations.setHashedPassword(data.password))).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        it("setTempWalletName()", async () => {
            data.walletName = "Test walletName";
            expectedData = {
                payload: data.walletName,
                type: types.SET_TEMP_WALLET_NAME,
            };
            expectedActions = [expectedData];
            expect(await store.dispatch(operations.setTempWalletName(data.walletName))).to.deep.equal(expectedData);
            expect(store.getActions()).to.deep.equal(expectedActions);
        });

        describe("regStartLnd()", () => {
            beforeEach(() => {
                window.ipcClient
                    .withArgs("checkUser")
                    .returns({ ok: false });
                fakeLnd.setClearLndData.returns(data.setClearLndData.success);
                fakeLnd.startLnd.returns(data.startLnd.success);
            });

            it("error checkUser()", async () => {
                data.error = "User already exist";
                window.ipcClient
                    .withArgs("checkUser")
                    .returns({ ok: true });
                fakeLnd.setClearLndData.returns(data.setClearLndData.error);
                fakeLnd.startLnd.returns(data.startLnd.error);
                fakeLnd.clearLndData.returns(data.clearLndData.error);
                expectedData = { ...errorResp, f: "regStartLnd", error: data.error };
                expectedActions = [
                    {
                        type: accountTypes.CREATE_ACCOUNT,
                    },
                    {
                        payload: data.error,
                        type: accountTypes.ERROR_CREATE_NEW_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.regStartLnd(data.walletName))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("checkUser", { walletName: data.walletName });
                expect(fakeLnd.setClearLndData).to.be.calledOnce;
                expect(fakeLnd.setClearLndData).to.be.calledWith(true);
                expect(fakeLnd.startLnd).to.be.callCount(0);
            });

            it("error startLnd()", async () => {
                fakeLnd.setClearLndData.returns(data.setClearLndData.error);
                fakeLnd.startLnd.returns(data.startLnd.error);
                fakeLnd.clearLndData.returns(data.clearLndData.error);
                expectedData = { ...errorResp, f: "regStartLnd", error: data.startLnd.errMsg };
                expectedActions = [
                    {
                        type: accountTypes.CREATE_ACCOUNT,
                    },
                    {
                        payload: data.startLnd.errMsg,
                        type: accountTypes.ERROR_CREATE_NEW_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.regStartLnd(data.walletName))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("checkUser", { walletName: data.walletName });
                expect(fakeLnd.setClearLndData).to.be.calledOnce;
                expect(fakeLnd.setClearLndData).to.be.calledWith(true);
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName, false);
                expect(fakeLnd.clearLndData).to.be.calledOnce;
                expect(fakeLnd.clearLndData).to.be.calledWith();
            });

            it("success startLnd()", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: accountTypes.CREATE_ACCOUNT,
                    },
                    {
                        type: accountTypes.SUCCESS_CREATE_NEW_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.regStartLnd(data.walletName))).to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("checkUser", { walletName: data.walletName });
                expect(fakeLnd.setClearLndData).to.be.calledOnce;
                expect(fakeLnd.setClearLndData).to.be.calledWith(true);
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName, false);
            });
        });

        describe("regFinish()", () => {
            beforeEach(() => {
                data.walletName = "testWalletName";
                data.password = "testPassword";
                data.seed = "testMnemonic";
                fakeLnd.setClearLndData.returns(fakeDispatchReturnSuccess);
                window.ipcClient
                    .withArgs("createLndWallet")
                    .returns({ ok: true });
            });

            it("error", async () => {
                data.error = { error: "Can't start lnd" };
                window.ipcClient
                    .withArgs("createLndWallet")
                    .returns({ ok: false, ...data.error });
                expectedData = {
                    ...errorResp,
                    ...data.error,
                    f: "regFinish",
                };
                expectedActions = [
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                    {
                        type: accountTypes.FINISH_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.regFinish(data.walletName, data.password, data.seed)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient)
                    .to
                    .be
                    .calledWith("createLndWallet", {
                        seed: data.seed, password: data.password, recovery: false,
                    });
            });

            it("error openDb:recovery=false", async () => {
                expectedData = {
                    ...errorResp,
                    f: "regFinish",
                };
                fakeApp.openDb.returns(fakeDispatchReturnError);
                expectedActions = [
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                    {
                        type: accountTypes.FINISH_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.regFinish(data.walletName, data.password, data.seed)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient)
                    .to
                    .be
                    .calledWith("createLndWallet", {
                        seed: data.seed, password: data.password, recovery: false,
                    });
                expect(fakeLnd.setClearLndData).to.be.callCount(0);
                expect(fakeApp.openDb).to.be.calledOnce;
                expect(fakeApp.openDb).to.be.calledWith(data.walletName, data.password);
            });

            it("success recovery=false", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.regFinish(data.walletName, data.password, data.seed)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient)
                    .to
                    .be
                    .calledWith("createLndWallet", {
                        seed: data.seed, password: data.password, recovery: false,
                    });
                expect(fakeLnd.setClearLndData).to.be.calledOnce;
                expect(fakeLnd.setClearLndData).to.be.calledWith(false);
                expect(fakeApp.openDb).to.be.calledOnce;
                expect(fakeApp.openDb).to.be.calledWith(data.walletName, data.password);
            });

            it("success recovery=true", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.regFinish(data.walletName, data.password, data.seed, true)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient)
                    .to
                    .be
                    .calledWith("createLndWallet", {
                        seed: data.seed, password: data.password, recovery: true,
                    });
                expect(fakeLnd.setClearLndData).to.be.calledOnce;
                expect(fakeLnd.setClearLndData).to.be.calledWith(false);
                expect(fakeApp.openDb).to.be.callCount(0);
            });
        });

        describe("restore()", () => {
            beforeEach(() => {
                fakeLnd.setClearLndData.returns(data.setClearLndData.success);
                fakeLnd.startLnd.returns(data.startLnd.success);
                fakeLnd.clearLndData.returns(data.startLnd.success);
                fakeAccount.initAccount.returns(data.initAccount.success);
                window.ipcClient
                    .withArgs("createLndWallet")
                    .returns({ ok: true })
                    .withArgs("checkUser")
                    .returns({ ok: false });
            });

            it("error checkUser()", async () => {
                data.error = "User already exist";
                window.ipcClient
                    .withArgs("checkUser")
                    .returns({ ok: true });
                fakeLnd.setClearLndData.returns(data.setClearLndData.error);
                fakeLnd.startLnd.returns(data.startLnd.error);
                fakeLnd.clearLndData.returns(data.startLnd.error);
                expectedData = { ...errorResp, f: "restore", error: data.error };
                expectedActions = [
                    {
                        type: accountTypes.CREATE_ACCOUNT,
                    },
                    {
                        payload: data.error,
                        type: accountTypes.ERROR_CREATE_NEW_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.restore(data.walletName, data.password, data.seed)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("checkUser", { walletName: data.walletName });
                expect(fakeLnd.setClearLndData).to.be.calledOnce;
                expect(fakeLnd.setClearLndData).to.be.calledWith(true);
                expect(fakeLnd.startLnd).to.be.callCount(0);
            });

            it("error regStartLnd()", async () => {
                window.ipcClient
                    .withArgs("createLndWallet")
                    .returns({ ok: false, ...data.error });
                fakeLnd.setClearLndData.returns(data.setClearLndData.error);
                fakeLnd.startLnd.returns(data.startLnd.error);
                fakeLnd.clearLndData.returns(data.startLnd.error);
                expectedData = { ...errorResp, f: "restore", error: data.startLnd.errMsg };
                expectedActions = [
                    {
                        type: accountTypes.CREATE_ACCOUNT,
                    },
                    {
                        payload: data.startLnd.errMsg,
                        type: accountTypes.ERROR_CREATE_NEW_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.restore(data.walletName, data.password, data.seed)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient).to.be.calledWith("checkUser", { walletName: data.walletName });
                expect(fakeLnd.setClearLndData).to.be.calledOnce;
                expect(fakeLnd.setClearLndData).to.be.calledWith(true);
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName, false);
                expect(fakeLnd.clearLndData).to.be.calledOnce;
                expect(fakeLnd.clearLndData).to.be.calledWith();
            });

            it("error regFinish()", async () => {
                data.error = "Can't start lnd";
                window.ipcClient
                    .withArgs("createLndWallet")
                    .returns({ ok: false, error: data.error });
                expectedData = { ...errorResp, error: data.error, f: "restore" };
                expectedActions = [
                    {
                        type: accountTypes.CREATE_ACCOUNT,
                    },
                    {
                        type: accountTypes.SUCCESS_CREATE_NEW_ACCOUNT,
                    },
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                    {
                        type: accountTypes.FINISH_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.restore(data.walletName, data.password, data.seed)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("checkUser", { walletName: data.walletName });
                expect(window.ipcClient)
                    .to
                    .be
                    .calledWith("createLndWallet", {
                        seed: data.seed, password: data.password, recovery: true,
                    });
                expect(fakeLnd.setClearLndData).to.be.calledOnce;
                expect(fakeLnd.setClearLndData).to.be.calledWith(true);
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName, false);
                expect(fakeLnd.clearLndData).to.be.calledOnce;
                expect(fakeLnd.clearLndData).to.be.calledWith();
            });

            it("error openDb()", async () => {
                fakeApp.openDb.returns(fakeDispatchReturnError);
                expectedData = { ...errorResp, f: "restore" };
                expectedActions = [
                    {
                        type: accountTypes.CREATE_ACCOUNT,
                    },
                    {
                        type: accountTypes.SUCCESS_CREATE_NEW_ACCOUNT,
                    },
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                    {
                        type: accountTypes.FINISH_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.restore(data.walletName, data.password, data.seed)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("checkUser", { walletName: data.walletName });
                expect(window.ipcClient)
                    .to
                    .be
                    .calledWith("createLndWallet", {
                        seed: data.seed, password: data.password, recovery: true,
                    });
                expect(fakeLnd.setClearLndData).to.be.calledTwice;
                expect(fakeLnd.setClearLndData).to.be.calledWith(true);
                expect(fakeLnd.setClearLndData).to.be.calledWith(false);
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName, false);
                expect(fakeApp.openDb).to.be.calledOnce;
                expect(fakeApp.openDb).to.be.calledWith(data.walletName, data.password);
            });

            it("error initAccount()", async () => {
                fakeAccount.initAccount.returns(data.initAccount.error);
                expectedData = { ...errorResp, error: data.initAccount.errMsg, f: "restore" };
                expectedActions = [
                    {
                        type: accountTypes.CREATE_ACCOUNT,
                    },
                    {
                        type: accountTypes.SUCCESS_CREATE_NEW_ACCOUNT,
                    },
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.restore(data.walletName, data.password, data.seed)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("checkUser", { walletName: data.walletName });
                expect(window.ipcClient)
                    .to
                    .be
                    .calledWith("createLndWallet", {
                        seed: data.seed, password: data.password, recovery: true,
                    });
                expect(fakeLnd.setClearLndData).to.be.calledTwice;
                expect(fakeLnd.setClearLndData).to.be.calledWith(true);
                expect(fakeLnd.setClearLndData).to.be.calledWith(false);
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName, false);
                expect(fakeApp.openDb).to.be.calledOnce;
                expect(fakeApp.openDb).to.be.calledWith(data.walletName, data.password);
                expect(fakeAccount.initAccount).to.be.calledOnce;
                expect(fakeAccount.initAccount).to.be.calledWith(data.walletName, true);
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: accountTypes.CREATE_ACCOUNT,
                    },
                    {
                        type: accountTypes.SUCCESS_CREATE_NEW_ACCOUNT,
                    },
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.restore(data.walletName, data.password, data.seed)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledTwice;
                expect(window.ipcClient).to.be.calledWith("checkUser", { walletName: data.walletName });
                expect(window.ipcClient)
                    .to
                    .be
                    .calledWith("createLndWallet", {
                        seed: data.seed, password: data.password, recovery: true,
                    });
                expect(fakeLnd.setClearLndData).to.be.calledTwice;
                expect(fakeLnd.setClearLndData).to.be.calledWith(true);
                expect(fakeLnd.setClearLndData).to.be.calledWith(false);
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName, false);
                expect(fakeApp.openDb).to.be.calledOnce;
                expect(fakeApp.openDb).to.be.calledWith(data.walletName, data.password);
                expect(fakeAccount.initAccount).to.be.calledOnce;
                expect(fakeAccount.initAccount).to.be.calledWith(data.walletName, true);
            });
        });

        describe("login()", () => {
            beforeEach(() => {
                data.walletName = "testWalletName";
                data.password = "testPassword";
                data.seed = "testMnemonic";
                fakeApp.openDb.returns(fakeDispatchReturnSuccess);
                fakeLnd.startLnd.returns(data.startLnd.success);
                fakeAccount.initAccount.returns(data.initAccount.success);
                window.ipcClient
                    .withArgs("unlockLnd")
                    .returns({ ok: true });
            });

            it("error startInitAccount()", async () => {
                fakeLnd.startLnd.returns(data.startLnd.error);
                expectedData = { ...errorResp, f: "login", error: data.startLnd.errMsg };
                expectedActions = [
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                    {
                        type: accountTypes.FINISH_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.login(data.walletName, data.password)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName);
                expect(window.ipcClient).not.to.be.called;
            });

            it("error unlockLnd()", async () => {
                data.error = "unlockLnd error";
                window.ipcClient
                    .withArgs("unlockLnd")
                    .returns({ ok: false, error: data.error });
                expectedData = {
                    ...errorResp,
                    error: exceptions.WALLET_NAME_PASSWORD_WRONG,
                    f: "login",
                };
                expectedActions = [
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                    {
                        type: accountTypes.FINISH_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.login(data.walletName, data.password)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient)
                    .to.be.calledWith("unlockLnd", { password: data.password });
            });

            it("error openDb()", async () => {
                data.error = "unlockLnd error";
                fakeApp.openDb.returns(fakeDispatchReturnError);
                expectedData = {
                    ...errorResp,
                    f: "login",
                };
                expectedActions = [
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                    {
                        type: accountTypes.FINISH_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.login(data.walletName, data.password)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient)
                    .to.be.calledWith("unlockLnd", { password: data.password });
                expect(fakeApp.openDb).to.be.calledOnce;
                expect(fakeApp.openDb).to.be.calledWith(data.walletName, data.password);
            });

            it("error initAccount()", async () => {
                fakeAccount.initAccount.returns(data.initAccount.error);
                expectedData = { ...errorResp, error: data.initAccount.errMsg };
                expectedActions = [
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.login(data.walletName, data.password)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName);
                expect(fakeApp.openDb).to.be.calledOnce;
                expect(fakeApp.openDb).to.be.calledWith(data.walletName, data.password);
                expect(fakeAccount.initAccount).to.be.calledOnce;
                expect(fakeAccount.initAccount).to.be.calledWith(data.walletName);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient)
                    .to.be.calledWith("unlockLnd", { password: data.password });
            });

            it("success", async () => {
                expectedData = { ...successResp };
                expectedActions = [
                    {
                        type: accountTypes.START_INIT_ACCOUNT,
                    },
                ];
                expect(await store.dispatch(operations.login(data.walletName, data.password)))
                    .to.deep.equal(expectedData);
                expect(store.getActions()).to.deep.equal(expectedActions);
                expect(window.ipcClient).to.be.calledOnce;
                expect(window.ipcClient)
                    .to.be.calledWith("unlockLnd", { password: data.password });
                expect(fakeLnd.startLnd).to.be.calledOnce;
                expect(fakeLnd.startLnd).to.be.calledWith(data.walletName);
                expect(fakeApp.openDb).to.be.calledOnce;
                expect(fakeApp.openDb).to.be.calledWith(data.walletName, data.password);
                expect(fakeAccount.initAccount).to.be.calledOnce;
                expect(fakeAccount.initAccount).to.be.calledWith(data.walletName);
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
            expectedData = JSON.parse(JSON.stringify(initStateAuth));
            state = undefined;
        });

        it("should return the initial state", () => {
            expect(authReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle LOGOUT_ACCOUNT action", () => {
            action.type = accountTypes.LOGOUT_ACCOUNT;
            state = JSON.parse(JSON.stringify(initStateAuth));
            state.tempWalletName = "bar";
            expect(authReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_CURRENT_FORM action", () => {
            action.type = types.SET_CURRENT_FORM;
            expectedData.currentForm = data;
            expect(authReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_REGISTRATION_STEP action", () => {
            action.type = types.SET_REGISTRATION_STEP;
            expectedData.authStep = data;
            expect(authReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_TEMP_WALLET_NAME action", () => {
            action.type = types.SET_TEMP_WALLET_NAME;
            expectedData.tempWalletName = data;
            expect(authReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_PASSWORD action", () => {
            action.type = types.SET_PASSWORD;
            expectedData.password = data;
            expect(authReducer(state, action)).to.deep.equal(expectedData);
        });

        it("should handle SET_SESSION_STATUS action", () => {
            action.type = types.SET_SESSION_STATUS;
            expectedData.sessionStatus = data;
            expect(authReducer(state, action)).to.deep.equal(expectedData);
        });
    });
});
