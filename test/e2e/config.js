const walletName = "testWalletName";
const password = "testPass1234";
const randomSeed = "test test";
const onchainAmount = 100000000;
const stringOnchainBalance = "1000 mBTC";
const stringLightningBalance = "0 mBTC";
const channelName = "Test channel";
const channelAmount = 10;
const channelOpenedAmountString = "9.9095 mBTC";
const channelHost = "127.0.0.1:20202";
const timeoutForElementChecks = 40 * 1000;
const localSettings = "settings.local.ini";
const regularTransactionName = "Test regular transaction";
const filenamePostfix = ".testBackup";
const fundsLndHost = "127.0.0.1:20201";
const testTimeout = 60 * 1000;
const cmdUtilsTimeout = 1000;
const cmdUtilsCallDelay = 5 * 1000;

module.exports = {
    walletName,
    password,
    randomSeed,
    onchainAmount,
    stringOnchainBalance,
    stringLightningBalance,
    channelName,
    channelAmount,
    channelOpenedAmountString,
    channelHost,
    timeoutForElementChecks,
    localSettings,
    regularTransactionName,
    filenamePostfix,
    fundsLndHost,
    testTimeout,
    cmdUtilsTimeout,
    cmdUtilsCallDelay,
};
