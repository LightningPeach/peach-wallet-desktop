import React from "react";
import {
    USERNAME_MAX_LENGTH,
    MIN_PASS_LENGTH,
    DEFAULT_BITCOIN_MEASURE_TYPE,
    MIN_CHANNEL_SIZE,
    MAX_CHANNEL_SIZE,
} from "config/consts";

/**
 * GLOBAL
 * PD: prameter-dependent
 *
 * EXCEPTIONS
 */

// DATABASE
// DB need to be opened before forcing an action
export const EXCEPTION_DB_NOT_OPENED = "First need to open DB.";

// FIELD PATTERNS
// Field is required upon form filling
export const EXCEPTION_FIELD_IS_REQUIRED = "This field is required.";
// Field should contain only numbers
export const EXCEPTION_FIELD_DIGITS_ONLY = "Only digits are allowed.";

// PARAMETERS
// Passed parameter should be instance of required type
export const EXCEPTION_DATE_INSTANCE = "Date must be instance of Date.";

// USERNAME PATTERNS
// PD: Incorrect name length (more than max allowed)
export const EXCEPTION_USERNAME_WRONG_MAX_LENGTH = (maxChars = USERNAME_MAX_LENGTH) =>
    `Invalid length. Maximum allowed length is ${maxChars} characters.`;
// PD: Incorrect name format
export const EXCEPTION_USERNAME_WRONG_FORMAT = (withSpace = 1, withSeparators = 0) =>
    `Only letters${withSpace ? ", space" : ""}${withSeparators ? ", separators" : ""} and numbers are allowed.`;

// PASSWORD PATTERNS
// Incorrect password format
export const EXCEPTION_PASSWORD_WRONG_FORMAT = "Must contain digit, uppercase and lowercase letter.";
// Incorrent password length (less than min allowed)
export const EXCEPTION_PASSWORD_WRONG_MIN_LENGTH =
    `Invalid length. Minimum allowed length is ${MIN_PASS_LENGTH} characters.`;
// Confirm password mismatch
export const EXCEPTION_PASSWORD_MISMATCH = "Password mismatch.";
// Change password difference
// TODO: Remove case due to inactivity, check if it so
export const EXCEPTION_PASSWORD_DIFF = "New password must be different from the old one.";
// Seed words mismatch upon validation
export const EXCEPTION_PASSWORD_SEED_MISMATCH = "Seed mismatch.";
// Seed words counts mismatch
export const EXCEPTION_PASSWORD_SEED_COUNT_MISMATCH = "Wrong seed words count.";
// Seed words must have only lowercase chars
export const EXCEPTION_PASSWORD_SEED_WRONG_FORMAT = "Seed must contain only lowercase chars.";

//  LIGHTNING ID PATTERNS
// Incorrect lightning address
export const EXCEPTION_LIGHTNING_ID_WRONG = "Not valid Lightning ID."; // unexpected characters
// Incorrect lightningId - same with own one
export const EXCEPTION_LIGHTNING_ID_WRONG_SELF = "This is your personal Lightning ID.";
// Incorrect lightningId length
export const EXCEPTION_LIGHTNING_ID_WRONG_LENGTH = "Incorrect length of Lightning ID.";
// Incorrect LightnindId length or no such contact in address book
export const EXCEPTION_LIGHTNING_ID_WRONG_LENGTH_NO_CONTACT =
    "Incorrect Lightning ID length, or no contact with such name.";

// BITCOIN ADDRESS PATTERNS
// Incorrect bitcoin address upon validation
export const EXCEPTION_BITCOIN_ADDRESS_WRONG = "Incorrect bitcoin address.";

// CHANNEL HOST PATTERNS
// Incorrect lightningId + host format
export const EXCEPTION_LIGHTNING_HOST_WRONG_FORMAT = "Incorrect format. Correct is LightningID@host.";

// VALIDATION
// Incorrect username or password upon attempt
export const EXCEPTION_USERNAME_PASSWORD_WRONG = "Incorrect username or password.";

// Folder unavailable
export const EXCEPTION_FOLDER_UNAVAILABLE = "Folder unavailable.";

// User already exists
export const EXCEPTION_USERNAME_EXISTS = "User already exist.";

// username exists before restore through folder
export const EXCEPTION_FOLDER_USERNAME_EXISTS = "Username already exists. Please rename selected folder.";

// ACCOUNT
// Account not connected to kernel
export const EXCEPTION_ACCOUNT_NO_KERNEL = "Lost connection to LND.";

// REMOTE ACTIONS
// Invalid reponse upon remote invoice add
export const EXCEPTION_REMOTE_OFFLINE = "Probably client is offline.";

// CHANNELS
// No channel upon set channel event
export const EXCEPTION_CHANNEL_ABSENT = "There is no such channel.";
// Attempt to create channel - channel with such name already exists
export const EXCEPTION_CHANNEL_CREATE_CHANNEL_EXISTS = "Unable to create channel. This name already exists.";
// Attempt to edit channel - channel with such name already exists
export const EXCEPTION_CHANNEL_EDIT_CHANNEL_EXISTS = "Unable to edit channel. This name already exists.";

// RECURRING PAYMENTS
// Stream not found in store
export const EXCEPTION_RECURRING_NOT_IN_STORE = "Recurring Payment not found in store.";
// Frequency is 0
export const EXCEPTION_RECURRING_FEQUENCY_IS_ZERO = "Frequency must be greater than 0.";
// Recurring payment error deadline exceeded;
export const EXCEPTION_RECURRING_TIMEOUT = "Recurring payment: deadline exceeded.";
// Recurring payment no funds for next payment;
export const EXCEPTION_RECURRING_NO_FUNDS = [
    "Insufficient funds on Lightning balance.",
    "Please, open new channel to process payment.",
];
export const EXCEPTION_RECURRING_MORE_MAX_FREQUENCY = (frequency, measure) =>
    `Maximum allowed frequency is ${frequency} ${measure}.`;
export const EXCEPTION_RECURRING_LESS_PAID_PARTS = number =>
    `Must be greater than number of paid ones(${number})`;

// TRANSACITONS
// Empty recurring payment details
export const EXCEPTION_RECURRING_DETAILS_REQUIRED = "There are no recurring payment details.";
// Empty send coin details
export const EXCEPTION_SEND_COINS_DETAILS_REQUIRED = "Send coins details are empty";
// PD: Amount is less than fee for operation
export const EXCEPTION_AMOUNT_LESS_THAN_FEE = (currentFee = 0, bitcoinMeasureType = DEFAULT_BITCOIN_MEASURE_TYPE) =>
    `Your payment must be greater than ${currentFee} ${bitcoinMeasureType} fee.`;
// No funds on onchain balance for this operation
export const EXCEPTION_AMOUNT_ONCHAIN_NOT_ENOUGH_FUNDS = "Insufficient funds on Onchain balance.";
// PD: Field exists but amount is 0 Satoshi
export const EXCEPTION_AMOUNT_EQUAL_ZERO = (bitcoinMeasureType = DEFAULT_BITCOIN_MEASURE_TYPE) =>
    `0 ${bitcoinMeasureType} payment is not allowed.`;
// Field exists but amount is negative
export const EXCEPTION_AMOUNT_NEGATIVE = "The value must contain positive number.";
// No funds on lightning balance for this operation
export const EXCEPTION_AMOUNT_LIGHTNING_NOT_ENOUGH_FUNDS = "Insufficient funds on Lightning balance.";
// PD: More than max allowed payment
export const EXCEPTION_AMOUNT_MORE_MAX = (capacity, bitcoinMeasureType = DEFAULT_BITCOIN_MEASURE_TYPE) =>
    `Maximum allowed payment is ${capacity} ${bitcoinMeasureType}.`;
// PD: More than max allowed channel size
export const EXCEPTION_AMOUNT_LESS_MIN_CHANNEL =
    (channelSize = MIN_CHANNEL_SIZE, bitcoinMeasureType = DEFAULT_BITCOIN_MEASURE_TYPE) =>
        `Minimum allowed channel size is ${channelSize} ${bitcoinMeasureType}`;
// PD: Less than min allowed channel size
export const EXCEPTION_AMOUNT_MORE_MAX_CHANNEL = (channelSize = MIN_CHANNEL_SIZE) =>
    `Maximum allowed channel size is ${channelSize}`;
// Time value is lower than zero
export const EXCEPTION_TIME_NEGATIVE = "Time value should be positive.";
// Edited amount is lower than in payment request
export const EXEPTION_REDUCE_PAY_REQ_AMOUNT = "Payment request amount can not be reduced.";

// EXTRAORDINARY ERROR
export const EXCEPTION_EXTRA = "This error must not happen.";

// CONTACTS LIST
// Attempt to edit name - user already exists
export const EXCEPTION_CONTACT_EDIT_USER_EXISTS = "Unable to edit contact. This name already exists.";
// Attempt to edit name - user already exists
export const EXCEPTION_CONTACT_CREATE_USER_ID_EXISTS =
    "Unable to create contact. This name and Lightning ID already exists.";
// Attempt to edit name - user already exists
export const EXCEPTION_CONTACT_CREATE_USER_EXISTS = "Unable to create contact. This name already exists.";
// Attempt to edit name - user already exists
export const EXCEPTION_CONTACT_CREATE_ID_EXISTS = "Unable to create contact. This Lightning ID already exists.";

// LIS STATUSES
// LIS is down upon transaction attempt
export const EXCEPTION_LIS_DOWN_DURING_TX =
    "Local Invoice Server is not running, please use payment request instead of Lightning ID.";

// MERCHANTS
// Merchants api unavailable, exception or 404
export const EXCEPTION_SERVER_UNAVAILABLE = "Server api unavailable.";

//PRIVACY MODE
// Attempt to pay via Lightning Id not in extended mode
export const EXCEPTION_PAY_LIGHTNING_ID_IN_INCOGNITO = "You can not pay via Lightning Id while not in extended mode";

/**
 * STATUS NOTIFICATIONS
 */

// LND SYNCHRONIZATION
// Status while LND syncing blocks with blockchain
export const STATUS_LND_SYNCING = "Syncing blocks";
// Success status after finishing synchronization
export const STATUS_LND_FULLY_SYNCED = "Wallet fully synced to blockchain";
