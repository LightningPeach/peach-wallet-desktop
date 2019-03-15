import {
    WALLET_NAME_MAX_LENGTH,
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
export const DB_NOT_OPENED = "First need to open DB.";

// FIELD PATTERNS
// Field is required upon form filling
export const FIELD_IS_REQUIRED = "This field is required.";
// Field should contain only numbers
export const FIELD_DIGITS_ONLY = "Only digits are allowed.";

// PARAMETERS
// Passed parameter should be instance of required type
export const DATE_INSTANCE = "Date must be instance of Date.";

// WALLET NAME PATTERNS
// PD: Incorrect name length (more than max allowed)
export const WALLET_NAME_WRONG_MAX_LENGTH = (maxChars = WALLET_NAME_MAX_LENGTH) =>
    `Invalid length. Maximum allowed length is ${maxChars} characters.`;
// PD: Incorrect name format
export const WALLET_NAME_WRONG_FORMAT = (withSpace = 1, withSeparators = 0) =>
    `Only letters${withSpace ? ", space" : ""}${withSeparators ? ", separators" : ""} and numbers are allowed.`;

// PASSWORD PATTERNS
// Incorrect password format
export const PASSWORD_WRONG_FORMAT = "Must contain digit, uppercase and lowercase letter.";
// Incorrent password length (less than min allowed)
export const PASSWORD_WRONG_MIN_LENGTH =
    `Invalid length. Minimum allowed length is ${MIN_PASS_LENGTH} characters.`;
// Confirm password mismatch
export const PASSWORD_MISMATCH = "Password mismatch.";
// Change password difference
export const PASSWORD_DIFF = "New password must be different from the old one.";
// Seed words mismatch upon validation
export const PASSWORD_SEED_MISMATCH = "Seed mismatch.";
// Seed words counts mismatch
export const PASSWORD_SEED_COUNT_MISMATCH = "Wrong seed words count.";
// Seed words must have only lowercase chars
export const PASSWORD_SEED_WRONG_FORMAT = "Seed must contain only lowercase chars.";

//  LIGHTNING ID PATTERNS
// Incorrect lightning address
export const LIGHTNING_ID_WRONG = "Not valid Lightning ID."; // unexpected characters
// Incorrect lightningId - same with own one
export const LIGHTNING_ID_WRONG_SELF = "This is your personal Lightning ID.";
// Incorrect lightningId length
export const LIGHTNING_ID_WRONG_LENGTH = "Incorrect length of Lightning ID.";
// Incorrect LightnindId length or no such contact in address book
export const LIGHTNING_ID_WRONG_LENGTH_NO_CONTACT =
    "Incorrect Lightning ID length, or no contact with such name.";

// BITCOIN ADDRESS PATTERNS
// Incorrect bitcoin address upon validation
export const BITCOIN_ADDRESS_WRONG = "Incorrect bitcoin address.";

// CHANNEL HOST PATTERNS
// Incorrect lightningId + host format
export const LIGHTNING_HOST_WRONG_FORMAT = "Incorrect format. Correct is LightningID@host.";

// VALIDATION
// Incorrect wallet name or password upon attempt
export const WALLET_NAME_PASSWORD_WRONG = "Incorrect wallet name or password.";

// Folder unavailable
export const FOLDER_UNAVAILABLE = "Folder unavailable.";

// User already exists
export const WALLET_NAME_EXISTS = "User already exist.";

// Wallet name exists before restore through folder
export const FOLDER_WALLET_NAME_EXISTS = "Wallet name already exists. Please rename selected folder.";

// ACCOUNT
// Account not connected to kernel
export const ACCOUNT_NO_KERNEL = "Lost connection to LND.";

// REMOTE ACTIONS
// Invalid reponse upon remote invoice add
export const REMOTE_OFFLINE = "Probably client is offline.";

// CHANNELS
// No channel upon set channel event
export const CHANNEL_ABSENT = "There is no such channel.";
// Attempt to create channel - channel with such name already exists
export const CHANNEL_CREATE_CHANNEL_EXISTS = "Unable to create channel. This name already exists.";
// Attempt to edit channel - channel with such name already exists
export const CHANNEL_EDIT_CHANNEL_EXISTS = "Unable to edit channel. This name already exists.";

// RECURRING PAYMENTS
// Stream not found in store
export const RECURRING_NOT_IN_STORE = "Recurring Payment not found in store.";
// Frequency is 0
export const RECURRING_FEQUENCY_IS_ZERO = "Frequency must be greater than 0.";
// Recurring payment error deadline exceeded;
export const RECURRING_TIMEOUT = "Recurring payment: deadline exceeded.";
// Recurring payment no funds for next payment;
export const RECURRING_NO_FUNDS = [
    "Insufficient funds on Lightning balance.",
    "Please, open new channel to process payment.",
];
export const RECURRING_MORE_MAX_FREQUENCY = (frequency, measure) =>
    `Maximum allowed frequency is ${frequency} ${measure}.`;
export const RECURRING_LESS_PAID_PARTS = number =>
    `Must be greater than number of paid ones(${number})`;

// TRANSACITONS
// Empty recurring payment details
export const RECURRING_DETAILS_REQUIRED = "There are no recurring payment details.";
// Empty send coin details
export const SEND_COINS_DETAILS_REQUIRED = "Send coins details are empty";
// PD: Amount is less than fee for operation
export const AMOUNT_LESS_THAN_FEE = (currentFee = 0, bitcoinMeasureType = DEFAULT_BITCOIN_MEASURE_TYPE) =>
    `Your payment must be greater than ${currentFee} ${bitcoinMeasureType} fee.`;
// No funds on on-chain balance for this operation
export const AMOUNT_ONCHAIN_NOT_ENOUGH_FUNDS = "Insufficient funds on On-chain balance.";
// PD: Field exists but amount is 0 Satoshi
export const AMOUNT_EQUAL_ZERO = (bitcoinMeasureType = DEFAULT_BITCOIN_MEASURE_TYPE) =>
    `0 ${bitcoinMeasureType} payment is not allowed.`;
// Field exists but amount is negative
export const AMOUNT_NEGATIVE = "The value must contain positive number.";
// No funds on lightning balance for this operation
export const AMOUNT_LIGHTNING_NOT_ENOUGH_FUNDS = "Insufficient funds on Lightning balance.";
// PD: More than max allowed payment
export const AMOUNT_MORE_MAX = (capacity, bitcoinMeasureType = DEFAULT_BITCOIN_MEASURE_TYPE) =>
    `Maximum allowed payment is ${capacity} ${bitcoinMeasureType}.`;
// PD: More than max allowed channel size
export const AMOUNT_LESS_MIN_CHANNEL =
    (channelSize = MIN_CHANNEL_SIZE, bitcoinMeasureType = DEFAULT_BITCOIN_MEASURE_TYPE) =>
        `Minimum allowed channel size is ${channelSize} ${bitcoinMeasureType}`;
// PD: Less than min allowed channel size
export const AMOUNT_MORE_MAX_CHANNEL = (channelSize = MIN_CHANNEL_SIZE) =>
    `Maximum allowed channel size is ${channelSize}`;
// Time value is lower than zero
export const TIME_NEGATIVE = "Time value should be positive.";
// Edited amount is lower than in payment request
export const EXEPTION_REDUCE_PAY_REQ_AMOUNT = "Payment request amount can not be reduced.";

// EXTRAORDINARY ERROR
export const EXTRA = "This error must not happen.";

// CONTACTS LIST
// Attempt to edit name - user already exists
export const CONTACT_EDIT_USER_EXISTS = "Unable to edit contact. This name already exists.";
// Attempt to edit name - user already exists
export const CONTACT_CREATE_USER_ID_EXISTS =
    "Unable to create contact. This name and Lightning ID already exists.";
// Attempt to edit name - user already exists
export const CONTACT_CREATE_USER_EXISTS = "Unable to create contact. This name already exists.";
// Attempt to edit name - user already exists
export const CONTACT_CREATE_ID_EXISTS = "Unable to create contact. This Lightning ID already exists.";

// LIS STATUSES
// LIS is down upon transaction attempt
export const LIS_DOWN_DURING_TX =
    "Local Invoice Server is not running, please use payment request instead of Lightning ID.";

// MERCHANTS
// Merchants api unavailable, exception or 404
export const SERVER_UNAVAILABLE = "Server api unavailable.";

// PRIVACY MODE
// Attempt to pay via Lightning Id not in extended mode
export const PAY_LIGHTNING_ID_IN_STANDARD
    = "Lightning ID payments are not supported in standard mode. You can change Wallet privacy mode in Profile";
// Incorrect payment request
export const INCORRECT_PAYMENT_REQUEST = "Incorrect payment request.";
