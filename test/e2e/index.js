/* eslint-env node, mocha */
/* eslint-disable prefer-arrow-callback */
require("babel-polyfill");
const { Application } = require("spectron");
const path = require("path");
const assert = require("assert");
const config = require("./config");
const utils = require("./utilities");
const rimraf = require("rimraf");
const electronPath = require("electron");
const registrationScreen = require("./screens/registrationScreen");
const seedConfirmationScreen = require("./screens/seedConfimationScreen");
const loginScreen = require("./screens/loginScreen");

// construct path
const baseDir = path.join(__dirname, "..", "..");

describe("Application launch", function () { // eslint-disable-line func-names
    this.timeout(config.testTimeout);
    const testParams = { baseDir, userPath: "" };

    const app = new Application({
        path: electronPath,
        args: [baseDir],
    });

    before(async function () { // eslint-disable-line func-names
        this.timeout(0);
        rimraf.sync(path.join(__dirname, "test_data"));
        await utils.beforeTestPrepare(testParams);
        await app.start();
        const userDataPath = await app.electron.remote.app.getPath("userData");
        testParams.userPath = path.join(userDataPath, ".lnd", config.username);
        rimraf.sync(testParams.userPath);
    });

    after(async () => {
        const userDataPath = await app.electron.remote.app.getPath("userData");
        // delete agreement.ini
        testParams.agreementDirPath = path.join(userDataPath, ".lnd", config.agreementFile);
        rimraf.sync(testParams.agreementDirPath);
        // deleted agreement.ini
        if (!app || !app.isRunning()) {
            utils.afterTestClear(testParams);
            return;
        }
        await app.stop();
        utils.afterTestClear(testParams);
        assert.equal(app.isRunning(), false, "App stopped");
    });

    describe("Agreement window", () => {
        it("should show window", async () => {
            const count = await app.client.getWindowCount();
            assert.equal(count, 1, "should be opened only one window without devtools");
        });

        it("should can't proceed without accept eula", async () => {
            await app.client.click("#submit-button");
            const licenseExists = await app.client.isExisting(".license__text");
            assert.equal(licenseExists, true, "license should exists");
        });

        it("should proceed with eula", async () => {
            await app.client.click(".js-agreement");
            await app.client.click("#submit-button");
            await utils.sleep(config.timeoutForAgreement);
            await app.client.windowByIndex(0);
            await app.client.waitUntilWindowLoaded();
            const count = await app.client.getWindowCount();
            assert.equal(count, 1, "should open second window");
        });
    });

    describe("Login form", () => {
        it("Change to registration window", async () => {
            await app.client.setValue(loginScreen.loginUsername, config.username);
            await app.client.setValue(loginScreen.loginPassword, config.password);
            await app.client.click(loginScreen.signin);
            await app.client.waitForVisible(".notification-message");
            const loginError = await app.client.getText(".notification-message");
            assert.equal(loginError, "User doesn't exist", "should show error for not exists user");
        });
    });

    describe("Registration", () => {
        let seed;

        it("TC:565: Username length validation", async () => {
            await app.client.click(loginScreen.signup);
            await app.client.setValue(
                registrationScreen.registraionUsernameID,
                config.veryLongUsernameOne + config.veryLongUsernameTwo,
            );
            const username = await app.client.getValue(registrationScreen.registraionUsernameID);
            assert.equal(username, config.veryLongUsernameOne + config.veryLongUsernameOne);
        });

        it("TC:564: Signup with special characters for username", async () => {
            await app.client.setValue(registrationScreen.registraionUsernameID, config.usernameWithSpace);
            await app.client.setValue(registrationScreen.registrationPasswordId, config.password);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.password);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(".form-error"),
                config.timeoutForElementChecks,
            );
            const error = await app.client.getText(".form-error");
            assert.equal(error, "Only letters and numbers are allowed.");
            await app.client.setValue(registrationScreen.registraionUsernameID, config.usernameWithSpace);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(".form-error"),
                config.timeoutForElementChecks,
            );
            assert.equal(error, "Only letters and numbers are allowed.");
        });

        it("TC:562: Password complexity verification", async () => {
            await app.client.setValue(registrationScreen.registraionUsernameID, config.username);
            await app.client.setValue(registrationScreen.registrationPasswordId, config.lowercasePassword);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.lowercasePassword);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(".form-error"),
                config.timeoutForElementChecks,
            );
            const error = await app.client.getText(".form-error");
            assert.equal(error, "Must contain digit, uppercase and lowercase letter.");
            await app.client.setValue(registrationScreen.registrationPasswordId, config.uppercasePasswordNoDigits);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.uppercasePasswordNoDigits);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(".form-error"),
                config.timeoutForElementChecks,
            );
            assert.equal(error, "Must contain digit, uppercase and lowercase letter.");
            await app.client.setValue(registrationScreen.registrationPasswordId, config.onlyDigitsPassword);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.onlyDigitsPassword);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(".form-error"),
                config.timeoutForElementChecks,
            );
            assert.equal(error, "Must contain digit, uppercase and lowercase letter.");
        });

        it("TC:560: Password length verification during signup", async () => {
            await app.client.setValue(registrationScreen.registrationPasswordId, config.shortPassword);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.shortPassword);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(".form-error"),
                config.timeoutForElementChecks,
            );
            const error = await app.client.getText(".form-error");
            assert.equal(error, "Invalid length. Minimum allowed length is 8 characters.");
        });

        it("TC:578: Password mismatch verification", async () => {
            await app.client.setValue(registrationScreen.registrationPasswordId, config.password);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.wrongPassword);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(".form-error"),
                config.timeoutForElementChecks,
            );
            const error = await app.client.getText(".form-error");
            assert.equal(error, "Password mismatch.");
        });

        it("TC:579: Unhide password possibility", async () => {
            await app.client.setValue(registrationScreen.registrationPasswordId, config.password);
            await app.client.click(".form-text__icon--eye_open");
            const password = await app.client.getValue(registrationScreen.registrationPasswordId);
            assert.equal(password, config.password);
        });

        it("Step 1: correct password and username", async () => {
            await app.client.setValue(registrationScreen.registraionUsernameID, config.username);
            await app.client.setValue(registrationScreen.registrationPasswordId, config.password);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.password);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(async () => app.client.isExisting("#seed"), config.timeoutForElementChecks);
            const seedExists = await app.client.isExisting("#seed");
            assert.equal(seedExists, true, "should show seed");
        });

        it("Step 2 should reload seed", async () => {
            const oldSeed = await app.client.getText("#seed");
            await app.client.click(".seed__reload");
            await utils.sleep(1000);
            seed = await app.client.getText("#seed");
            assert.notEqual(seed, oldSeed);
        });

        it("Step 2 should proceed to confirmation seed", async () => {
            await app.client.click("button=Next");
            await app.client.waitUntil(
                async () => app.client.isExisting("#verify-seed"),
                config.timeoutForElementChecks,
            );
            const seedVerifyExists = await app.client.isExisting("#verify-seed");
            assert.equal(seedVerifyExists, true, "should show seed verify form");
        });

        it("TC:567: Return possibility to seed words generation", async () => {
            await app.client.click(seedConfirmationScreen.backButtonId);
            await app.client.waitUntil(async () => app.client.isExisting("#seed"), config.timeoutForElementChecks);
            const seedExists = await app.client.isExisting("#seed");
            assert.equal(seedExists, true, "should show seed");
        });

        it("Step 3 should return error for wrong seed", async () => {
            await app.client.click("button=Next");
            await app.client.waitUntil(
                async () => app.client.isExisting("#verify-seed"),
                config.timeoutForElementChecks,
            );
            const seedVerifyExists = await app.client.isExisting("#verify-seed");
            assert.equal(seedVerifyExists, true, "should show seed verify form");
            await app.client.setValue("#verify-seed", config.randomSeed);
            await app.client.click("button=Sign up");
            await app.client.waitUntil(
                async () => app.client.isExisting(".form-error"),
                config.timeoutForElementChecks,
            );
            const error = await app.client.getText(".form-error");
            assert.equal(error, "Seed mismatch.");
        });

        it("Step 3 should proceed to tourgide", async () => {
            await app.client.setValue("#verify-seed", seed);
            await app.client.click("button=Sign up");
            const disabled = await app.client.getAttribute(".button__orange", "disabled") === "true";
            assert.equal(disabled, true, "should have disabled button");
        });
    });

    describe("Tourgide", () => {
        it("should show tourgide", async () => {
            await utils.sleep(3000);
            await app.client.waitUntil(async () => app.client.isExisting(".tourgide"), config.timeoutForElementChecks);
            const title = await app.client.getText(".guide__title");
            assert.equal(title[0], "CHANNEL CREATION");
        });

        it("should show 4 slides", async () => {
            const dots = await app.client.elements(".tourgide__dots > li");
            assert.equal(dots.value.length, 4);
        });

        it("should open wallet", async () => {
            await app.client.click(".tourgide__btn--next .button");
            await utils.sleep(1000);
            await app.client.click(".tourgide__btn--next .button");
            await utils.sleep(1000);
            await app.client.click(".tourgide__btn--next .button");
            await utils.sleep(1000);
            await app.client.waitUntil(
                async () => !(await app.client.getAttribute(".tourgide__btn--next .button", "disabled")),
                config.timeoutForElementChecks,
            );
            await app.client.click(".tourgide__btn--next .button");
            const activeMenu = await app.client.getText(".nav__lightning.active");
            assert.equal(activeMenu, "LIGHTNING");
        });
    });

    describe("System notifications", () => {
        it("should show system notification modal window", async () => {
            await app.client.click("button=Enable");
        });
    });

    describe("Profile page", () => {
        it("should open profile page", async () => {
            await app.client.click("a.profile");
            await app.client.waitUntil(
                async () => app.client.isExisting(".js-profileContent"),
                config.timeoutForElementChecks,
            );
            const exists = await app.client.isExisting(".js-profileContent");
            assert.equal(exists, true, "should have profile content");
        });

        it("should copy btc address", async () => {
            const btcAddr = await app.client.getText(".js-btcAddress .profile__value_value");
            await app.client.click(".js-btcAddress .profile__copy");
            assert.equal(await app.electron.clipboard.readText(), btcAddr, "btc address not in clipboard");
        });

        it("should generate new btc address", async () => {
            const oldAddr = await app.client.getText(".js-btcAddress .profile__value_value");
            await app.client.click(".js-btcAddress .profile__reload");
            const newAddr = await app.client.getText(".js-btcAddress .profile__value_value");
            assert.notEqual(newAddr, oldAddr, "new addr should be different from old one");
        });

        it("should copy lightningId", async () => {
            const lightningId = await app.client.getText(".js-lightningId .profile__value_value");
            await app.client.click(".js-lightningId .profile__copy");
            assert.equal(await app.electron.clipboard.readText(), lightningId, "lightningId not in clipboard");
        });

        it("should receive btc", async () => {
            const btcAddr = await app.client.getText(".js-btcAddress .profile__value_value");
            await utils.fundsLncli("sendcoins", ["--addr", btcAddr, "--amt", config.onchainAmount]);
            await utils.btcctlGenerate();
            const amount = await app.client.getText(".balance__value");
            const lightningBalance = amount[0].split("~")[0].trim();
            const onchainBalance = amount[1].split("~")[0].trim();
            assert.equal(lightningBalance, config.stringLightningBalance, "lightning balance should be empty");
            assert.equal(onchainBalance, config.stringOnchainBalance, "onchain balance should have 1btc");
        });
    });

    describe("Channels page", () => {
        it("should open channels page", async () => {
            await app.client.click("a.channels");
            await app.client.waitUntil(
                async () => app.client.isExisting(".channels-page"),
                config.timeoutForElementChecks,
            );
            const exists = await app.client.isExisting(".channels-page");
            assert.equal(exists, true);
        });

        it("should open new channel modal", async () => {
            await app.client.click("button=Create Channel");
            await app.client.waitUntil(
                async () => app.client.isExisting(".modal-wrapper"),
                config.timeoutForElementChecks,
            );
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "CREATE CHANNEL");
        });

        it("should add new channel", async () => {
            const fundsInfo = await utils.fundsLncli("getinfo");
            await app.client.click(".channels__custom");
            await app.client.setValue("#channel__name", config.channelName);
            await app.client.setValue("#channel__amount", config.channelAmount);
            await app.client.setValue(
                "#channel__lightningId",
                `${fundsInfo.identity_pubkey}@${config.channelHost}`,
            );
            await app.client.click("button=Create");
            await app.client.waitUntil(
                async () => app.client.isExisting(".channel__pending"),
                config.timeoutForElementChecks,
            );
            const chanExists = await app.client.isExisting(".channel__pending");
            assert.equal(chanExists, true, "should appear channel");
        });

        it("should open channel", async () => {
            await utils.btcctlGenerate(3);
            await app.client.waitUntil(
                async () => app.client.isExisting(".channel__active"),
                config.timeoutForElementChecks,
            );
            const chanBalance = (await app.client.getText(".channel__text--balance")).split(":")[1].trim();
            assert.equal(chanBalance, config.channelOpenedAmountString);
        });
    });

    describe("Send some money", () => {
        it("should open lightning page", async () => {
            await app.client.click("a.nav__lightning");
            await app.client.waitUntil(
                async () => app.client.isExisting(".lightning-page"),
                config.timeoutForElementChecks,
            );
            const exists = await app.client.isExisting(".lightning-page");
            assert.equal(exists, true);
        });

        it("should open details page", async () => {
            const payReq = (await utils.fundsLncli("addinvoice", ["--amt", 10000])).pay_req;
            await app.client.setValue("#regular__to", payReq);
            await app.client.setValue("#regular__name", config.regularTransactionName);
            await app.client.click("button=Pay");
            await app.client.waitUntil(
                async () => app.client.isExisting(".modal-wrapper"),
                config.timeoutForElementChecks,
            );
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "CHECK YOUR DATA");
        });

        it("should success payment", async () => {
            await app.client.click(".modal-footer .button__close");
            await app.client.waitUntil(
                async () => app.client.isExisting(".modal-payment_result__success"),
                config.timeoutForElementChecks,
            );
            const exists = await app.client.isExisting(".modal-payment_result__success");
            assert.equal(exists, true);
        });

        it("should close success payment modal", async () => {
            await app.client.click(".modal-wrapper .button__close");
            await utils.sleep(1000);
            const exists = await app.client.isExisting(".lightning-page");
            assert.equal(exists, true);
        });
    });

    describe("Close channel", () => {
        it("should show close channel modal", async () => {
            await app.client.click("a.channels");
            await app.client.waitUntil(
                async () => app.client.isExisting(".channels-page"),
                config.timeoutForElementChecks,
            );
            await app.client.moveToObject(".channels-page .channel");
            await app.client.waitUntil(
                async () => app.client.isVisible("#close-channel-button"),
                config.timeoutForElementChecks,
            );
            await app.client.click("#close-channel-button");
            await app.client.waitUntil(
                async () => app.client.isExisting(".modal-wrapper"),
                config.timeoutForElementChecks,
            );
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "CLOSE CHANNEL");
        });

        it("should close channel", async () => {
            await app.client.click("#close-channel-modal-button");
            await utils.btcctlGenerate(3);
            await app.client.waitUntil(
                async () => await app.client.isExisting(".channel__deleting") || await app.client.isExisting(".empty-placeholder"), // eslint-disable-line
                config.timeoutForElementChecks,
            );
            const notExists = await app.client.isExisting(".empty-placeholder");
            const deleting = await app.client.isExisting(".channel__deleting");
            assert.equal(notExists || deleting, true);
            await utils.sleep(3000);
        });
    });
    describe("Logout and login/signup checks for existing user", () => {
        it("TC:593: Cancel logout from account", async () => {
            await app.client.click("a.profile");
            await app.client.click("#logout-button");
            await app.client.waitUntil(
                async () => app.client.isExisting(".button__close"),
                config.timeoutForElementChecks,
            );
            await app.client.click("#cancel-logout-button");
            await utils.sleep(config.cmdUtilsTimeout);
        });
        it("TC:590: Logout from account", async () => {
            await app.client.click("a.channels");
            await app.client.click("a.profile");
            await app.client.click("#logout-button");
            await app.client.waitUntil(
                async () => app.client.isExisting(".button__close"),
                config.timeoutForElementChecks,
            );
            await app.client.click(".button__close");
            await app.client.waitUntil(
                async () => app.client.isExisting("#username"),
                config.timeoutForElementChecks,
            );
        });
        it("TC:577: Login with incorrect password", async () => {
            await app.client.setValue(loginScreen.loginUsername, config.username);
            await app.client.setValue(loginScreen.loginPassword, config.wrongPassword);
            await app.client.click(loginScreen.signin);
            await app.client.waitForVisible(".notification-message");
            const loginError = await app.client.getText(".notification-message");
            assert.equal(loginError, "Incorrect username or password.", "should incorrect password error");
            await app.client.click(".notification-message");
        });
        it("TC:563: The uniqueness of the username during sign up", async () => {
            await app.client.click(loginScreen.signup);
            await app.client.setValue(registrationScreen.registraionUsernameID, config.username);
            await app.client.setValue(registrationScreen.registrationPasswordId, config.wrongPassword);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.wrongPassword);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitForVisible(".notification-message");
            const loginError = await app.client.getText(".notification-message");
            assert.equal(loginError, "User already exist");
        });
    });
});
/* eslint-enable prefer-arrow-callback */
