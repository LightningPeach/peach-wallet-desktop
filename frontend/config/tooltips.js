import React, { Fragment } from "react";

import { helpers } from "additional";

/**
 * Common
 */

export const COPY_TO_CLIPBOARD = helpers.formatMultilineText([
    "Copy to clipboard",
]);

/**
 * Login/registration flow
 */

export const RECOVER_WALLET = helpers.formatMultilineText([
    "You can use wallet recovery procedure in 2 situations:",
    "1) If you want to use your existing Bitcoin wallet for Lightning payments,",
    "go through the wallet recovery procedure, during which specify seed words",
    "from your Bitcoin wallet.",
    <Fragment>2) If you have forgotten your Peach Wallet password. Enter <b>new</b></Fragment>,
    <Fragment>username, <b>new</b> password and use seed words associated with it.</Fragment>,
]);

export const WALLET_NAME = helpers.formatMultilineText([
    "Username is a name of wallet (folder),",
    "it is stored locally on your PC.",
]);

export const SEED_WORDS = helpers.formatMultilineText([
    "Seed words are random words that are used to regain access",
    "to the wallet when computer breaks or hard drive is corrupted.",
    "You should keep seed words safe and do not share with anyone.",
    "When someone knows your seed words, they can have access to",
    "your wallet and funds.",
]);

export const SEED_VERIFY = helpers.formatMultilineText([
    "Seed words should be specified manually.",
    "You can't paste them from the clipboard.",
]);

export const DEFAULT_WALLET_PATH = helpers.formatMultilineText([
    "Better to set wallet data path in dropbox",
    "or google drive folder.",
]);

export const WALLET_PATH = helpers.formatMultilineText([
    "Full path (include username) to wallet data",
]);

export const PASSWORD = helpers.formatMultilineText([
    "The password must be at least 8 characters and contain",
    "minimum 1 uppercase letter [A-Z], 1 lower case letter [a-z]",
    "and 1 digit [0-9]. Also, you can use special characters",
    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
]);

/**
 * Lightning
 */

export const RECURRING_FEE = helpers.formatMultilineText([
    "Fee is relevant only as of today.",
    "In future it may change.",
]);

export const RECURRING_AMOUNT = helpers.formatMultilineText([
    "Total amount for the whole recurring payment",
    "and price per singe time unit within the payment.",
]);

export const RECURRING_COUNT = helpers.formatMultilineText([
    "Current count of paid (confirmed) plus pending",
    "(finished but not confirmed) payments relative",
    "to total amount of payments.",
]);

/**
 * Channels
 */

export const CREATE_CHANNEL = helpers.formatMultilineText([
    "The payment channel allows users to make payments between",
    "each other without broadcasting such transactions to the",
    "Bitcoin blockchain. Creating a channel can take some time",
    "as opening transaction should be confirmed on the Bitcoin",
    "blockchain.",
]);

/**
 * Onchain
 */

export const LOCKED_BALANCE = helpers.formatMultilineText([
    "Your onchain balance which is not yet",
    "confirmed on the Bitcoin blockchain.",
]);

export const TRANSACTION_PROCESSING = helpers.formatMultilineText([
    "You need to wait for transaction processing.",
    "Your payment will be processed when it is",
    "confirmed on the Bitcoin blockchain",
]);

/**
 * Settings
 */

export const GENERATE_BTC_ADDRESS = helpers.formatMultilineText([
    "Generate new BTC address",
]);

export const GENERATE_PAYMENT_REQUEST = helpers.formatMultilineText([
    "Create new payment request by specifying amount",
    "of it in the filed below. Other users of the",
    "Lightning Network will have possibility to pay",
    "generated invoice (one payment for each request).",
]);
