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
const statusCodes = require("../../frontend/config/status-codes");
const agreementScreen = require("./screens/agreementScreen");
const mainScreen = require("./screens/mainScreen");
const lightingScreen = require("./screens/lightingScreen");
const channelsScreen = require("./screens/channelsScreen");
const profileScreen = require("./screens/profileScreen");
const tourgideScreen = require("./screens/tourGuide");

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
            await app.client.click(agreementScreen.submitButton);
            const licenseExists = await app.client.isExisting(agreementScreen.licenseText);
            assert.equal(licenseExists, true, "license should exists");
        });

        it("should proceed with eula", async () => {
            await app.client.click(agreementScreen.acceptAgreementButton);
            await app.client.click(agreementScreen.submitButton);
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
            await app.client.waitForVisible(loginScreen.notificationMessage);
            const loginError = await app.client.getText(loginScreen.notificationMessage);
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
                async () => app.client.isExisting(registrationScreen.errorForm),
                config.timeoutForElementChecks,
            );
            const error = await app.client.getText(registrationScreen.errorForm);
            assert.equal(error, statusCodes.EXCEPTION_USERNAME_WRONG_FORMAT(0, 0));
            console.log("Checked username with space");
            await app.client.setValue(registrationScreen.registraionUsernameID, config.usernameWithSpecialChar);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(registrationScreen.errorForm),
                config.timeoutForElementChecks,
            );
            assert.equal(error, statusCodes.EXCEPTION_USERNAME_WRONG_FORMAT(0, 0));
            console.log("Checked username with special char");
        });

        it("TC:562: Password complexity verification", async () => {
            await app.client.setValue(registrationScreen.registraionUsernameID, config.username);
            await app.client.setValue(registrationScreen.registrationPasswordId, config.lowercasePassword);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.lowercasePassword);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(registrationScreen.errorForm),
                config.timeoutForElementChecks,
            );
            const error = await app.client.getText(registrationScreen.errorForm);
            assert.equal(error, statusCodes.EXCEPTION_PASSWORD_WRONG_FORMAT);
            await app.client.setValue(registrationScreen.registrationPasswordId, config.uppercasePasswordNoDigits);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.uppercasePasswordNoDigits);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(registrationScreen.errorForm),
                config.timeoutForElementChecks,
            );
            assert.equal(error, statusCodes.EXCEPTION_PASSWORD_WRONG_FORMAT);
            await app.client.setValue(registrationScreen.registrationPasswordId, config.onlyDigitsPassword);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.onlyDigitsPassword);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(registrationScreen.errorForm),
                config.timeoutForElementChecks,
            );
            assert.equal(error, statusCodes.EXCEPTION_PASSWORD_WRONG_FORMAT);
        });

        it("TC:560: Password length verification during signup", async () => {
            await app.client.setValue(registrationScreen.registrationPasswordId, config.shortPassword);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.shortPassword);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(registrationScreen.errorForm),
                config.timeoutForElementChecks,
            );
            const error = await app.client.getText(registrationScreen.errorForm);
            assert.equal(error, statusCodes.EXCEPTION_PASSWORD_WRONG_MIN_LENGTH);
        });

        it("TC:578: Password mismatch verification", async () => {
            await app.client.setValue(registrationScreen.registrationPasswordId, config.password);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.wrongPassword);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(registrationScreen.errorForm),
                config.timeoutForElementChecks,
            );
            const error = await app.client.getText(registrationScreen.errorForm);
            assert.equal(error, statusCodes.EXCEPTION_PASSWORD_MISMATCH);
        });

        it("TC:579: Unhide password possibility", async () => {
            await app.client.setValue(registrationScreen.registrationPasswordId, config.password);
            await app.client.click(registrationScreen.unhidePasswordButton);
            const password = await app.client.getValue(registrationScreen.registrationPasswordId);
            assert.equal(password, config.password);
        });

        it("Step 1: correct password and username", async () => {
            await app.client.setValue(registrationScreen.registraionUsernameID, config.username);
            await app.client.setValue(registrationScreen.registrationPasswordId, config.password);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.password);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(seedConfirmationScreen.seedField),
                config.timeoutForElementChecks,
            );
            const seedExists = await app.client.isExisting(seedConfirmationScreen.seedField);
            assert.equal(seedExists, true, "should show seed");
        });

        it("Step 2 should reload seed", async () => {
            const oldSeed = await app.client.getText(seedConfirmationScreen.seedField);
            await app.client.click(seedConfirmationScreen.seedReload);
            await utils.sleep(1000);
            seed = await app.client.getText(seedConfirmationScreen.seedField);
            assert.notEqual(seed, oldSeed);
        });

        it("Step 2 should proceed to confirmation seed", async () => {
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(seedConfirmationScreen.verifySeedField),
                config.timeoutForElementChecks,
            );
            const seedVerifyExists = await app.client.isExisting(seedConfirmationScreen.verifySeedField);
            assert.equal(seedVerifyExists, true, "should show seed verify form");
        });

        it("TC:567: Return possibility to seed words generation", async () => {
            await app.client.click(seedConfirmationScreen.backButtonId);
            await app.client.waitUntil(async () => app.client.isExisting("#seed"), config.timeoutForElementChecks);
            const seedExists = await app.client.isExisting("#seed");
            assert.equal(seedExists, true, "should show seed");
        });

        it("Step 3 should return error for wrong seed", async () => {
            await app.client.click(seedConfirmationScreen.seedConfirmationNextButton);
            console.log("Pressed Next");
            await app.client.waitUntil(
                async () => app.client.isExisting(seedConfirmationScreen.verifySeedField),
                config.timeoutForElementChecks,
            );
            const seedVerifyExists = await app.client.isExisting(seedConfirmationScreen.verifySeedField);
            assert.equal(seedVerifyExists, true, "should show seed verify form");
            await app.client.setValue(seedConfirmationScreen.verifySeedField, config.randomSeed);
            await app.client.click(seedConfirmationScreen.signupButton);
            console.log("Pressed signup");
            await app.client.waitUntil(
                async () => app.client.isExisting(seedConfirmationScreen.errorForm),
                config.timeoutForElementChecks,
            );
            const error = await app.client.getText(seedConfirmationScreen.errorForm);
            assert.equal(error, statusCodes.EXCEPTION_PASSWORD_SEED_MISMATCH);
        });

        it("Step 3 should proceed to tourgide", async () => {
            await app.client.setValue(seedConfirmationScreen.verifySeedField, seed);
            await app.client.click(seedConfirmationScreen.signupButton);
            const disabled = await app.client.getAttribute(".button__orange", "disabled") === "true";
            assert.equal(disabled, true, "should have disabled button");
        });
    });

    describe("Tourgide", () => {
        it("should show tourgide", async () => {
            await utils.sleep(3000);
            await app.client.waitUntil(
                async () => app.client.isExisting(tourgideScreen.guideScreen),
                config.timeoutForElementChecks,
            );
            const title = await app.client.getText(tourgideScreen.guideTitle);
            assert.equal(title[0], "CHANNEL CREATION");
        });

        it("should show 4 slides", async () => {
            const dots = await app.client.elements(".tourgide__dots > li");
            assert.equal(dots.value.length, 4);
        });

        it("should open wallet", async () => {
            await app.client.click(tourgideScreen.guideNextButton);
            await utils.sleep(1000);
            await app.client.click(tourgideScreen.guideNextButton);
            await utils.sleep(1000);
            await app.client.click(tourgideScreen.guideNextButton);
            await utils.sleep(1000);
            await app.client.waitUntil(
                async () => !(await app.client.getAttribute(tourgideScreen.guideNextButton, "disabled")),
                config.timeoutForElementChecks,
            );
            await app.client.click(tourgideScreen.guideNextButton);
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
            await app.client.click(mainScreen.profileScreen);
            await app.client.waitUntil(
                async () => app.client.isExisting(profileScreen.profileContent),
                config.timeoutForElementChecks,
            );
            const exists = await app.client.isExisting(profileScreen.profileContent);
            assert.equal(exists, true, "should have profile content");
        });

        it("should copy btc address", async () => {
            const btcAddr = await app.client.getText(profileScreen.btcAddr);
            await app.client.click(profileScreen.btcAddrCopyButton);
            assert.equal(await app.electron.clipboard.readText(), btcAddr, "btc address not in clipboard");
        });

        it("should generate new btc address", async () => {
            const oldAddr = await app.client.getText(profileScreen.btcAddr);
            await app.client.click(profileScreen.btcAddrReload);
            const newAddr = await app.client.getText(profileScreen.btcAddr);
            assert.notEqual(newAddr, oldAddr, "new addr should be different from old one");
        });

        it("should copy lightningId", async () => {
            const lightningId = await app.client.getText(profileScreen.lightingId);
            await app.client.click(profileScreen.lightingIdCopy);
            assert.equal(await app.electron.clipboard.readText(), lightningId, "lightningId not in clipboard");
        });

        it("TC:615: Default denomination of wallet", async () => {
            const amount = await app.client.getText(".balance__value");
            const lightningBalance = amount[0].split("~")[0].trim();
            const onchainBalance = amount[1].split("~")[0].trim();
            assert.equal(lightningBalance, config.defaultLightningBalance, "Default lighting balance = 0 mBTC");
            assert.equal(onchainBalance, config.defualtOnchainBalance, "Default onchain balance = 0 mBTC");
        });

        it("TC:597: Payment request field validation", async () => {
            await app.client.click(profileScreen.generateRequestButton);
            const copyRequestExists = await app.client.isExisting(".pay_req__button .profile__copy");
            assert.equal(copyRequestExists, false);
            await app.client.setValue(profileScreen.paymentAmount, 100);
            assert.equal(copyRequestExists, false);
            await app.client.setValue(profileScreen.paymentAmount, "2.2.2.2");
            const amount = await app.client.getValue(profileScreen.paymentAmount);
            assert.equal(amount, "2.222");
        });

        it("TC:596: Update payment request", async () => {
            await app.client.setValue(profileScreen.paymentAmount, "2");
            await app.client.click(profileScreen.generateRequestButton);
            const paymentRequestFirst = await app.client.getText(profileScreen.paymentRequestId);
            await app.client.setValue(profileScreen.paymentAmount, "3");
            await app.client.click(profileScreen.generateRequestButton);
            const paymentRequestSecond = await app.client.getText(profileScreen.paymentRequestId);
            assert.notEqual(paymentRequestFirst, paymentRequestSecond, "Request are different");
        });

        it("TC:594: Generate payment request", async () => {
            await app.client.setValue(profileScreen.paymentAmount, 1);
            await app.client.click(profileScreen.generateRequestButton);
            const paymentRequest = await app.client.getText(profileScreen.paymentRequestId);
            await app.client.click(".pay_req__button .profile__copy");
            assert.equal(await app.electron.clipboard.readText(), paymentRequest, "Payment request is in clipboard");

            await app.client.click(mainScreen.lightingScreen);
            await app.client.waitUntil(
                async () => app.client.isExisting(lightingScreen.lightingPage),
                config.timeoutForElementChecks,
            );
            const exists = await app.client.isExisting(lightingScreen.lightingPage);
            assert.equal(exists, true);

            await app.client.setValue(lightingScreen.regularPaymentTo, paymentRequest);
            await app.client.setValue(lightingScreen.regularPaymentName, config.regularTransactionName);
        });
    });

    describe("Channels page", () => {
        it("TC:652: should open channels page, channel open hint", async () => {
            await app.client.click(mainScreen.channelsScreen);
            await app.client.waitUntil(
                async () => app.client.isExisting(".overlay__content"),
                config.timeoutForElementChecks,
            );
            const hint = await app.client.getText(".overlay__content");
            assert.equal(hint, "Create channel for making payments with BTC");
            await app.client.waitUntil(
                async () => app.client.isExisting(channelsScreen.channelsPage),
                config.timeoutForElementChecks,
            );
            const exists = await app.client.isExisting(channelsScreen.channelsPage);
            assert.equal(exists, true);
        });

        it("TC:682: Opening channel errors. Not enough money to open the channel with specified size", async () => {
            await app.client.click(channelsScreen.createChannelButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(".modal-wrapper"),
                config.timeoutForElementChecks,
            );
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "CREATE CHANNEL");
            await app.client.setValue(channelsScreen.channelName, config.channelName);
            await app.client.setValue(channelsScreen.channelAmount, config.channelBigAmout);
            await app.client.click(channelsScreen.createChannelModal);
            const error = await app.client.getText(".form-error");
            assert.equal(error, statusCodes.EXCEPTION_AMOUNT_ONCHAIN_NOT_ENOUGH_FUNDS);
            await app.client.click(channelsScreen.cancelCreateChannel);
            await utils.sleep(config.cmdUtilsTimeout);
        });

        it("should receive btc", async () => {
            await app.client.click(mainScreen.profileScreen);
            await app.client.waitUntil(
                async () => app.client.isExisting(profileScreen.profileContent),
                config.timeoutForElementChecks,
            );
            const exists = await app.client.isExisting(profileScreen.profileContent);
            assert.equal(exists, true, "should have profile content");
            const btcAddr = await app.client.getText(profileScreen.btcAddr);
            await utils.fundsLncli("sendcoins", ["--addr", btcAddr, "--amt", config.onchainAmount]);
            await utils.btcctlGenerate();
            const amount = await app.client.getText(".balance__value");
            const lightningBalance = amount[0].split("~")[0].trim();
            const onchainBalance = amount[1].split("~")[0].trim();
            assert.equal(lightningBalance, config.stringLightningBalance, "lightning balance should be empty");
            assert.equal(onchainBalance, config.stringOnchainBalance, "onchain balance should have 1btc");
        });

        it("TC:686: Channel cannot be more then 16777216 satoshies", async () => {
            await app.client.click(mainScreen.channelsScreen);
            await app.client.click(channelsScreen.createChannelButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(".modal-wrapper"),
                config.timeoutForElementChecks,
            );
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "CREATE CHANNEL");
            await app.client.setValue(channelsScreen.channelName, config.channelName);
            await app.client.setValue(channelsScreen.channelAmount, config.channelBigAmout);
            await app.client.click(channelsScreen.createChannelModal);
            const error = await app.client.getText(".form-error");
            assert.equal(error, statusCodes.EXCEPTION_AMOUNT_MORE_MAX_CHANNEL("167.77216 mBTC"));
            await app.client.click(channelsScreen.cancelCreateChannel);
            await utils.sleep(config.cmdUtilsTimeout);
        });

        it("should open new channel modal", async () => {
            await app.client.click(channelsScreen.createChannelButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(".modal-wrapper"),
                config.timeoutForElementChecks,
            );
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "CREATE CHANNEL");
        });

        it("should add new channel", async () => {
            const fundsInfo = await utils.fundsLncli("getinfo");
            await app.client.click(channelsScreen.customChannel);
            await app.client.setValue(channelsScreen.channelName, config.channelName);
            await app.client.setValue(channelsScreen.channelAmount, config.channelAmount);
            await app.client.setValue(
                channelsScreen.newChannelLightingId,
                `${fundsInfo.identity_pubkey}@${config.channelHost}`,
            );
            await app.client.click(channelsScreen.createChannelModal);
            await app.client.waitUntil(
                async () => app.client.isExisting(channelsScreen.channelPending),
                config.timeoutForElementChecks,
            );
            const chanExists = await app.client.isExisting(channelsScreen.channelPending);
            assert.equal(chanExists, true, "should appear channel");
        });

        it("should open channel", async () => {
            await utils.btcctlGenerate(3);
            await app.client.waitUntil(
                async () => app.client.isExisting(channelsScreen.channelActive),
                config.timeoutForElementChecks,
            );
            const chanBalance = (await app.client.getText(".channel__text--balance")).split(":")[1].trim();
            assert.equal(chanBalance, config.channelOpenedAmountString);
        });
    });

    describe("TC: 614: regular payment by lighting ID", () => {
        it("should open lightning page", async () => {
            await app.client.click(mainScreen.lightingScreen);
            await app.client.waitUntil(
                async () => app.client.isExisting(lightingScreen.lightingPage),
                config.timeoutForElementChecks,
            );
            const exists = await app.client.isExisting(lightingScreen.lightingPage);
            assert.equal(exists, true);
        });

        it("should open details page", async () => {
            const payReq = (await utils.fundsLncli("addinvoice", ["--amt", 10000])).pay_req;
            await app.client.setValue(lightingScreen.regularPaymentTo, payReq);
            await app.client.setValue(lightingScreen.regularPaymentName, config.regularTransactionName);
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
            const exists = await app.client.isExisting(lightingScreen.lightingPage);
            assert.equal(exists, true);
        });
    });

    describe("TC: 620: regular payment without name", () => {
        it("enter details without name", async () => {
            const payReq = (await utils.fundsLncli("addinvoice", ["--amt", 10000])).pay_req;
            await app.client.setValue(lightingScreen.regularPaymentTo, payReq);
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
            const exists = await app.client.isExisting(lightingScreen.lightingPage);
            assert.equal(exists, true);
        });
    });

    describe("Close channel", () => {
        it("should show close channel modal", async () => {
            await app.client.click(mainScreen.channelsScreen);
            await app.client.waitUntil(
                async () => app.client.isExisting(channelsScreen.channelsPage),
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

    describe("TC:610: Add new contact name with special characters", () => {
        it("open address book", async () => {
            await app.client.click(mainScreen.contactsScreen);
            await app.client.waitUntil(
                async () => app.client.isExisting(".contacts-page"),
                config.timeoutForElementChecks,
            );
        });
        it("open add contact modal", async () => {
            await app.client.click("button=ADD CONTACT");
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "ADD NEW CONTACT");
        });
        it("set contact name and address", async () => {
            const fundsInfo = await utils.fundsLncli("getinfo");
            await app.client.setValue("#contact__name", config.usernameWithSpecialChar);
            await app.client.setValue("#contact__lightning", `${fundsInfo.identity_pubkey}@${config.channelHost}`);
            await app.client.click("#create-contact");
            const error = await app.client.getText(".form-error");
            assert.equal(
                error,
                "Only letters, space and numbers are allowed.",
            );
            await app.client.click("#cancel-create-contract");
            await utils.sleep(config.cmdUtilsTimeout);
        });
    });

    describe("TC:613: add contact to address book", () => {
        it("open address book", async () => {
            await app.client.click(mainScreen.contactsScreen);
            await app.client.waitUntil(
                async () => app.client.isExisting(".contacts-page"),
                config.timeoutForElementChecks,
            );
        });
        it("open add contact modal", async () => {
            await app.client.click("button=ADD CONTACT");
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "ADD NEW CONTACT");
        });
        it("set contact name and address", async () => {
            const fundsInfo = await utils.fundsLncli("getinfo");
            await app.client.setValue("#contact__name", config.testAddressContact);
            console.log("Set name");
            await app.client.setValue("#contact__lightning", `${fundsInfo.identity_pubkey}@${config.channelHost}`);
            console.log("Set lighting");
            await app.client.click("#create-contact");
            const contactName = await app.client.getText(".text-ellipsis__text");
            assert.equal(contactName, config.testAddressContact, "contact name should be present");
            const contactLightingID = await app.client.getText(".contacts__lightningId");
            assert.equal(
                contactLightingID,
                `${fundsInfo.identity_pubkey}`, "lighting id should be present",
            );
            await utils.sleep(config.cmdUtilsTimeout);
        });
    });

    describe("TC:604: Add existing contact to address book", () => {
        it("open address book", async () => {
            await app.client.click(mainScreen.contactsScreen);
            await app.client.waitUntil(
                async () => app.client.isExisting(".contacts-page"),
                config.timeoutForElementChecks,
            );
        });
        it("open add contact modal", async () => {
            await app.client.click("button=ADD CONTACT");
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "ADD NEW CONTACT");
        });
        it("set contact name and address", async () => {
            const fundsInfo = await utils.fundsLncli("getinfo");
            await app.client.setValue("#contact__name", config.testAddressContact);
            console.log("Set name");
            await app.client.setValue("#contact__lightning", `${fundsInfo.identity_pubkey}@${config.channelHost}`);
            console.log("Set lighting");
            await app.client.click("#create-contact");
            const error = await app.client.getText(".form-error");
            assert.equal(
                error,
                "Unable to create contact. This name and Lightning ID already exists.",
            );
            await app.client.click("#cancel-create-contract");
            await utils.sleep(config.cmdUtilsTimeout);
        });
    });

    describe("TC:606: Edit contact in address book", () => {
        it("open edit contact modal", async () => {
            await app.client.moveToObject(".contacts__lightningId");
            await app.client.waitUntil(
                async () => app.client.isVisible("#edit-contract"),
                config.timeoutForElementChecks,
            );
            await app.client.click("#edit-contract");
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "EDIT CONTACT");
        });
        it("change name of contract", async () => {
            await app.client.setValue("#contact__name", config.testAddressContactNew);
            await app.client.click("#edit-contract-modal");
            const contactName = await app.client.getText(".text-ellipsis__text");
            assert.equal(contactName, config.testAddressContactNew, "contact name should be changed");
            await utils.sleep(config.cmdUtilsTimeout);
        });
    });

    describe("TC:608: Cancel deletion contact from address book", () => {
        it("open edit contact modal", async () => {
            await app.client.moveToObject(".contacts__lightningId");
            await app.client.waitUntil(
                async () => app.client.isVisible("#edit-contract"),
                config.timeoutForElementChecks,
            );
            await app.client.click("#edit-contract");
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "EDIT CONTACT");
            utils.sleep(config.cmdUtilsTimeout);
            await app.client.click("#delete-contract-modal");
            await app.client.click("#back-button-modal");
            await app.client.click(".close-modal");
            const contactName = await app.client.getText(".text-ellipsis__text");
            assert.equal(contactName, config.testAddressContactNew, "contact name should be present");
            await utils.sleep(config.cmdUtilsTimeout);
        });
    });

    describe("TC:605: Copy contact from address book", () => {
        it("open edit contact modal and copy", async () => {
            await app.client.moveToObject(".contacts__lightningId");
            await app.client.waitUntil(
                async () => app.client.isVisible("#edit-contract"),
                config.timeoutForElementChecks,
            );
            await app.client.click("#copy-contract");
            const contactAddr = await app.client.getText(".contacts__lightningId");
            assert.equal(await app.electron.clipboard.readText(), contactAddr, "Contact address is in clipboard");
            await utils.sleep(config.cmdUtilsTimeout);
        });
    });

    describe("TC:607: Delete contact from address book", () => {
        it("open edit contact modal", async () => {
            await app.client.moveToObject(".contacts__lightningId");
            await app.client.waitUntil(
                async () => app.client.isVisible("#edit-contract"),
                config.timeoutForElementChecks,
            );
            await app.client.click("#edit-contract");
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "EDIT CONTACT");
            await app.client.waitUntil(
                async () => app.client.isExisting("#delete-contract-modal"),
                config.timeoutForElementChecks,
            );
            await app.client.click("#delete-contract-modal");
            await app.client.waitUntil(
                async () => app.client.isExisting("#delete-button-modal"),
                config.timeoutForElementChecks,
            );
            await app.client.click("#delete-button-modal");
            await utils.sleep(config.cmdUtilsTimeout);
        });
    });

    describe("TC:609: Add contact with incorrect lightning id", () => {
        it("open add contact modal", async () => {
            await app.client.click("button=ADD CONTACT");
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "ADD NEW CONTACT");
        });
        it("set contact name and address", async () => {
            await app.client.setValue("#contact__name", config.testAddressContact);
            await app.client.setValue("#contact__lightning", "12345");
            await app.client.click("#create-contact");
            const error = await app.client.getText(".form-error");
            assert.equal(
                error,
                "Incorrect length of Lightning ID.",
            );
            await app.client.click("#cancel-create-contract");
            await utils.sleep(config.cmdUtilsTimeout);
        });
    });

    describe("TC:673: ONCHAIN transaction errors. Not enough money to make a payment", () => {
        it("open onchain page and make a big payment", async () => {
            await app.client.click("a.onchain");
            await app.client.waitUntil(
                async () => app.client.isExisting("#send-coins__name"),
                config.timeoutForElementChecks,
            );
            await app.client.setValue("#send-coins__to", config.testBtcAddr);
            await app.client.setValue("#send-coins__name", config.username);
            await app.client.setValue("#send-coins__amount", config.bigOnchainAmount);
            await app.client.click("button=Pay");
            const error = await app.client.getText(".form-error");
            assert.equal(error, statusCodes.EXCEPTION_AMOUNT_ONCHAIN_NOT_ENOUGH_FUNDS);
            await utils.sleep(config.cmdUtilsTimeout);
        });
    });

    describe("TC:674: ONCHAIN transaction errors. Amount is less than minimum allowed transaction", () => {
        it("open onchain page and make a small payment", async () => {
            await app.client.click("a.onchain");
            await app.client.waitUntil(
                async () => app.client.isExisting("#send-coins__name"),
                config.timeoutForElementChecks,
            );
            await app.client.setValue("#send-coins__to", config.testBtcAddr);
            await app.client.setValue("#send-coins__name", config.username);
            await app.client.setValue("#send-coins__amount", config.smallOnchainAmout);
            await app.client.click("button=Pay");
            const error = await app.client.getText(".form-error");
            assert.equal(error, statusCodes.EXCEPTION_AMOUNT_LESS_THAN_FEE(0.11468));
            await utils.sleep(config.cmdUtilsTimeout);
        });
    });

    describe("TC:647: Payment creation. Without payment name", () => {
        it("open onchain page and make a payment with name", async () => {
            await app.client.click("a.onchain");
            await app.client.waitUntil(
                async () => app.client.isExisting("#send-coins__name"),
                config.timeoutForElementChecks,
            );
            await app.client.setValue("#send-coins__to", config.testBtcAddr);
            await app.client.setValue("#send-coins__amount", config.normalOnchainAmount);
            await app.client.click("button=Pay");
            console.log("Clicked first pay");
            // await app.client.waitUntil(
            //     async () => app.client.isExisting(".modal-wrapper"),
            //     config.timeoutForElementChecks,
            // );
            // const title = await app.client.getText(".modal-header");
            // assert.equal(title, "CHECK YOUR DATA");
            // await app.client.waitUntil(
            //     async () => app.client.isExisting("#pay-button-modal"),
            //     config.timeoutForElementChecks,
            // );
            await app.client.click("#pay-button-modal");
            console.log("Clicked second pay");
            await app.client.waitUntil(
                async () => app.client.isExisting(".modal-payment_result__success"),
                config.timeoutForElementChecks,
            );
            const exists = await app.client.isExisting(".modal-payment_result__success");
            assert.equal(exists, true);
            await app.client.click(".modal-wrapper .button__close");
            await utils.sleep(config.cmdUtilsTimeout);
            const existsCoinsName = await app.client.isExisting("#send-coins__name");
            assert.equal(existsCoinsName, true);
            await utils.sleep(config.cmdUtilsTimeout);
        });
    });

    describe("Logout and login/signup checks for existing user", () => {
        it("TC:593: Cancel logout from account", async () => {
            await app.client.click(mainScreen.profileScreen);
            await app.client.click(profileScreen.logoutButton);
            await app.client.waitUntil(
                async () => app.client.isExisting(".button__close"),
                config.timeoutForElementChecks,
            );
            await app.client.click("#cancel-logout-button");
            await utils.sleep(config.cmdUtilsTimeout);
        });
        it("TC:590: Logout from account", async () => {
            await app.client.click(mainScreen.profileScreen);
            await app.client.click(profileScreen.logoutButton);
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
            await app.client.waitForVisible(loginScreen.notificationMessage);
            const loginError = await app.client.getText(loginScreen.notificationMessage);
            assert.equal(loginError, statusCodes.EXCEPTION_USERNAME_PASSWORD_WRONG, "should incorrect password error");
            await app.client.click(loginScreen.notificationMessage);
        });
        it("TC:563: The uniqueness of the username during sign up", async () => {
            await app.client.click(loginScreen.signup);
            await app.client.setValue(registrationScreen.registraionUsernameID, config.username);
            await app.client.setValue(registrationScreen.registrationPasswordId, config.wrongPassword);
            await app.client.setValue(registrationScreen.registrationConfirmPassword, config.wrongPassword);
            await app.client.click(registrationScreen.registrationNextButton);
            await app.client.waitForVisible(loginScreen.notificationMessage);
            const loginError = await app.client.getText(loginScreen.notificationMessage);
            assert.equal(loginError, "User already exist");
        });
    });
});

/* eslint-enable prefer-arrow-callback */
