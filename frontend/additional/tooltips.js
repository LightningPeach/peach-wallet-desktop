import React, { Fragment } from "react";

import * as helpers from "./helpers";

/**
 * FLOATING TOOLTIPS
 */

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
    "You may use wallet recovery in 2 cases:",
    "1) If you want to use your existing Bitcoin wallet for Lightning payments",
    "then go through the wallet recovery procedure and specify the seed words",
    "from your Bitcoin wallet.",
    <Fragment>2) If you have forgotten your Peach Wallet password then enter a <b>new</b></Fragment>,
    <Fragment>wallet name, <b>new</b> password and use the seed words you have for this wallet.</Fragment>,
]);

export const WALLET_NAME = helpers.formatMultilineText([
    "Wallet name is used when creating a local folder",
    "where your wallet data will be stored",
]);

export const SEED_WORDS = helpers.formatMultilineText([
    "Seed words are random words that are used to regain access",
    "to the wallet when a computer breaks or a hard drive is corrupted.",
    "You should keep these seed words safe and never share them with anyone.",
    "When someone knows your seed words, they can have access to",
    "your wallet and funds.",
]);

export const SEED_VERIFY = helpers.formatMultilineText([
    "Seed words should be specified manually.",
    "You can't paste them from the clipboard.",
]);

export const DEFAULT_WALLET_PATH = helpers.formatMultilineText([
    "We recommend you to back up this folder periodically.",
    "Some people are comfortable with using Dropbox or",
    "Google Cloud for this purpose.",
]);

export const WALLET_PATH = helpers.formatMultilineText([
    "Full path (include wallet name) to wallet data",
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
    "Your on-chain balance which is not yet",
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
    "of it in the field below. Other users of the",
    "Lightning Network will be able to pay",
    "generated invoice (one payment for each request).",
]);

/**
 * INLINE TOOLTIPS
 */

/**
 * Settings
 */

export const MODE_STANDARD = (
    <Fragment>
        In this mode your wallet never connects to the Peach server for any reason. The Extended Mode features are
        disabled.
    </Fragment>
);

export const MODE_EXTENDED = (
    <Fragment>
        In this mode you have a few extra features not yet present in the standard Lightning Network. These features
        rely on the Peach server to route a transaction.
    </Fragment>
);

export const SYSTEM_NOTIFICATIONS = (
    <Fragment>
        Enable or disable system notifications. When enabled, they will be shown as push messages on your PC. System
        notifications will inform you about incoming payments, opening and closing channels and other types of the
        wallet activities.
    </Fragment>
);

export const SYSTEM_NOTIFICATIONS_SOUNDS = (
    <Fragment>
        Enable or disable sounds of system notifications.
    </Fragment>
);

export const APP_ANALYTICS = (
    <Fragment>
        We use Google Analytics to optionally collect anonymized data on how people use the wallet. This data helps us
        improve the user experience of the app. By default, this setting is disabled when a new wallet is being created.
    </Fragment>
);
