const username = "testUsername";
const veryLongUsernameOne = "AVerylongusernameconsistingofmorethan100characters";
const veryLongUsernameTwo = "AVerylongusernameconsistingofmorethan100charactersandseveralmore";
const usernameWithSpace = "Alex QA";
const usernameWithSpecialChar = "#@Alex";
const password = "testPass1234";
const wrongPassword = "wrongPass123";
const lowercasePassword = "lowercas";
const uppercasePasswordNoDigits = "UPPERCSAS";
const onlyDigitsPassword = "12345678";
const shortPassword = "1";
const randomSeed = "test test";
const onchainAmount = 100000000;
const stringOnchainBalance = "1000 mBTC";
const stringLightningBalance = "0 mBTC";
const channelName = "Test channel";
const channelAmount = 10;
const channelOpenedAmountString = "9.9095 mBTC";
const channelHost = "127.0.0.1:20202";
const timeoutForElementChecks = 6 * 1000;
const agreementFile = "agreement.ini";
const locatAgreement = "agreement.local.ini";
const localSettings = "settings.local.ini";
const regularTransactionName = "Test regular transaction";
const filenamePostfix = ".testBackup";
const fundsLndHost = "127.0.0.1:20201";
const testTimeout = 60 * 1000;
const cmdUtilsTimeout = 1000;
const timeoutForAgreement = 3 * 1000;
const cmdUtilsCallDelay = 5 * 1000;

module.exports = {
    username,
    veryLongUsernameOne,
    veryLongUsernameTwo,
    usernameWithSpace,
    usernameWithSpecialChar,
    password,
    wrongPassword,
    lowercasePassword,
    uppercasePasswordNoDigits,
    onlyDigitsPassword,
    shortPassword,
    randomSeed,
    onchainAmount,
    stringOnchainBalance,
    stringLightningBalance,
    channelName,
    channelAmount,
    channelOpenedAmountString,
    channelHost,
    timeoutForElementChecks,
    agreementFile,
    locatAgreement,
    localSettings,
    regularTransactionName,
    filenamePostfix,
    fundsLndHost,
    testTimeout,
    cmdUtilsTimeout,
    timeoutForAgreement,
    cmdUtilsCallDelay,
};
