/* eslint-env node, mocha */
/* eslint-disable prefer-arrow-callback */
require("@babel/polyfill");
const { Application } = require("spectron");
const path = require("path");
const assert = require("assert");
const config = require("./config");
const utils = require("./utilities");
const rimraf = require("rimraf");
const electronPath = require("electron");

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
        await utils.beforeTestPrepare(testParams);
        await app.start();
        const userDataPath = await app.electron.remote.app.getPath("userData");
        testParams.userPath = path.join(userDataPath, ".lnd", config.walletName);
        rimraf.sync(testParams.userPath);
    });

    after(async () => {
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
            await app.client.click("#agreement-submit");
            const licenseExists = await app.client.isExisting(".license__text");
            assert.equal(licenseExists, true, "license should exists");
        });

        it("should proceed with eula", async () => {
            await app.client.click(".js-agreement");
            await app.client.click("#agreement-submit");
            await utils.sleep(3000);
            await app.client.windowByIndex(0);
            await app.client.waitUntilWindowLoaded();
            const count = await app.client.getWindowCount();
            assert.equal(count, 1, "should open second window");
        });
    });

    describe("Login form", () => {
        it("Change to registration window", async () => {
            await app.client.setValue("#wallet-name", config.walletName);
            await app.client.setValue("#password", config.password);
            await app.client.click("button=Sign in");
            await app.client.waitForVisible(".notification-message");
            const loginError = await app.client.getText(".notification-message");
            assert.equal(loginError, "Incorrect wallet name or password", "should show error for not exists user");
        });
    });

    describe("Registration", () => {
        let seed;

        it("Step 1", async () => {
            await app.client.click("button=Sign up");
            await app.client.setValue("#wallet-name", config.walletName);
            await app.client.setValue("#password", config.password);
            await app.client.setValue("#conf_password", config.password);
            await app.client.click("button=Next");
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

        it("Step 3 should return error for wrong seed", async () => {
            await app.client.setValue("#verify-seed", config.randomSeed);
            await app.client.click("button=Sign up");
            await app.client.waitUntil(
                async () => app.client.isExisting(".form-error"),
                config.timeoutForElementChecks,
            );
            const error = await app.client.getText(".form-error");
            assert.equal(error, "Seed mismatch");
        });

        it("Step 3 should proceed to tourgide", async () => {
            await app.client.setValue("#verify-seed", seed);
            await app.client.click("button=Sign up");
            const disabled = await app.client.getAttribute(".button__solid", "disabled") === "true";
            assert.equal(disabled, true, "should have disabled button");
        });
    });

    describe("Tourgide", () => {
        it("should show tourgide", async () => {
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
            await app.client.waitUntil(async () => app.client.isExisting("a.nav__lightning"), 10000);
            const activeMenu = await app.client.getText(".nav__lightning.active");
            assert.equal(activeMenu, "LIGHTNING");
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
            await app.client.click(".modal__footer .button__close");
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
                async () => app.client.isVisible(".channel__close"),
                config.timeoutForElementChecks,
            );
            await app.client.click(".channel__close");
            await app.client.waitUntil(
                async () => app.client.isExisting(".modal-wrapper"),
                config.timeoutForElementChecks,
            );
            const title = await app.client.getText(".modal-header");
            assert.equal(title, "CLOSE CHANNEL");
        });

        it("should close channel", async () => {
            await app.client.click(".modal__footer .button__close");
            await utils.btcctlGenerate(3);
            await app.client.waitUntil(
                async () => await app.client.isExisting(".channel__deleting") || await app.client.isExisting(".empty-placeholder"), // eslint-disable-line
                config.timeoutForElementChecks,
            );
            const notExists = await app.client.isExisting(".empty-placeholder");
            const deleting = await app.client.isExisting(".channel__deleting");
            assert.equal(notExists || deleting, true);
        });
    });
});
/* eslint-enable prefer-arrow-callback */
