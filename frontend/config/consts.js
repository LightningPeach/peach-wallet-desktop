import XRegExp from "xregexp";
import { NODE_ENV } from "./node-settings";

export const SUCCESS_RESPONSE = "SUCCESS";
export const UNSUCCESS_RESPONSE = "UNSUCCESS";
export const PENDING_RESPONSE = "PENDING";

export const TIME_RANGE_MEASURE = [
    { measure: "seconds", range: 1000 },
    { measure: "minutes", range: 1000 * 60 },
    { measure: "hours", range: 1000 * 60 * 60 },
    { measure: "days", range: 1000 * 60 * 60 * 24 },
    { measure: "weeks", range: 1000 * 60 * 60 * 24 * 7 },
    { measure: "months", range: 1000 * 60 * 60 * 24 * 30 },
    { measure: "years", range: 1000 * 60 * 60 * 24 * 365 },
];

export const SIMNET_NETWORK = {
    bech32: "sb",
    bip32: {
        private: 0x0420b900,
        public: 0x0420bd3a,
    },
    messagePrefix: "\x18Bitcoin Signed Message:\n",
    pubKeyHash: 0x3f,
    scriptHash: 0x7b,
    wif: 0x64,
};

export const BTC_MEASURE = {
    btc: "BTC",
    ln: "LN",
    multiplier: 1e-8,
    toFixed: 8,
    toFixedAll: 8,
};
export const MBTC_MEASURE = {
    btc: "mBTC",
    ln: "mLN",
    multiplier: 1e-5,
    toFixed: 5,
    toFixedAll: 5,
};
export const SATOSHI_MEASURE = {
    btc: "Satoshi",
    ln: "sLN",
    multiplier: 1,
    toFixed: 0,
    toFixedAll: 0,
};
export const MILISATOSHI_MEASURE = {
    btc: "MiliSatoshi",
    ln: "mSat",
    multiplier: 1e-3,
    toFixed: 3,
    toFixedAll: 3,
};
export const UBCBTC_MEASURE = {
    btc: "\u03BCBTC",
    ln: "\u03BCLN",
    multiplier: 1e-2,
    toFixed: 2,
    toFixedAll: 2,
};
export const ALL_MEASURES = [MBTC_MEASURE, BTC_MEASURE, SATOSHI_MEASURE];

export const SOCKET_RECONNECT_SETTINGS = { maxReconnectAttempts: null, reconnectInterval: 3000 };

// Value for proper handling of some native JS functions (setInterval and setTimeout)
// by separating them into smaller subtasks with TIMEOUT_PART delay value of execution
export const TIMEOUT_PART = 0x7FFFFFF;
export const SESSION_EXPIRE_TIMEOUT = 15 * 60 * 1000;
export const MAX_INTERVAL_FREUENCY = 100000000000;
export const STREAM_INFINITE_TIME_VALUE = "Infinite";
export const LOGOUT_ACCOUNT_TIMEOUT = NODE_ENV === "test" ? 1 : 5 * 1000;
export const LND_SYNC_TIMEOUT = NODE_ENV === "test" ? 1 : 15 * 1000;
export const STREAM_ERROR_TIMEOUT = 10 * 1000;
export const BALANCE_INTERVAL_TIMEOUT = 30 * 1000;
export const CHANNELS_INTERVAL_TIMEOUT = 30 * 1000;
export const LND_SYNC_STATUS_INTERVAL_TIMEOUT = 15 * 1000;
export const USD_PER_BTC_INTERVAL_TIMEOUT = 60 * 60 * 1000;
export const GET_MERCHANTS_INTERVAL_TIMEOUT = 60 * 60 * 1000;
export const CHANNEL_CLOSE_CONFIRMATION = 6;
export const MIN_CHANNEL_SIZE = 2e4;
export const WALLET_NAME_MAX_LENGTH = 100;
export const ELEMENT_NAME_MAX_LENGTH = 100;
export const LIGHTNING_ID_LENGTH = 66;
export const PAYMENT_REQUEST_LENGTH = 124;
export const MODAL_ANIMATION_TIMEOUT = 200;
export const DEFAULT_TABLE_RECORDS_PER_PAGE = 8;
export const DEFAULT_PAGINNATION_SPREAD_PAGES = 2;
export const MIN_PASS_LENGTH = 8;
export const SEED_COUNT = 24;
export const MAX_NOTIFICATIONS = 3;
export const MAX_DB_NUM_CONFIRMATIONS = 6;
export const CHANNEL_LEFT_AMOUNT_TO_NOTIFY = 0.1;
export const DEFAULT_NOTIFICATIONS_DISMISS = 5;
export const TX_NUM_CONFIRMATIONS_TO_SHOW_NOTIFY = 1;
export const MAX_INVOICES = 18446744073709551615; // Uint64 in GO
export const DEFAULT_MAX_INVOICES = 100;
export const LIGHTNING_NUM_ROUTES = 10;

export const DEFAULT_BITCOIN_MEASURE_TYPE = "mBTC";
export const DEFAULT_NOTIFICATIONS_POSITION = "bc";
export const RECURRING_MEMO_PREFIX = "recurring_payment_";
export const STREAM_MEMO_PREFIX = "stream_payment_";
export const INCOMING_RECURRING_NAME = "Incoming recurring payment";

export const BLOCKCHAIN_INFO_HOST = "https://blockchain.info";
export const ONEML_HOST = "https://1ml.com";
export const PEACH_NODE_QUERY = "/node/02a0bc43557fae6af7be8e3a29fdebda819e439bea9c0f8eb8ed6a0201f3471ca9";
export const PEACH_NODE_URL = `${ONEML_HOST}${PEACH_NODE_QUERY}`;
export const USD_PER_BTC_QUERY = "/ru/ticker";
export const USD_PER_BTC_URL = `${BLOCKCHAIN_INFO_HOST}${USD_PER_BTC_QUERY}`;

export const VALIDATE_PASS_REGEXP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[!-\/:-@[-`{-~a-zA-Z\d]{8,}$/; // eslint-disable-line
export const ONLY_LETTERS_AND_NUMBERS = /^[a-z0-9]+$/i;
export const ONLY_UNICODE_LETTERS_AND_NUMBERS = XRegExp("^[\\pL0-9]+$");

/**
 * See {@link https://github.com/lightningnetwork/lnd/blob/master/rpcserver.go#L1761|Github LND}
 */
export const MAX_PAYMENT_REQUEST = Math.round((2 ** 32) * MILISATOSHI_MEASURE.multiplier);

/* eslint-disable */
/**
 * See {@link https://github.com/lightningnetwork/lightning-rfc/blob/master/02-peer-protocol.md#requirements|Github LND BOLT-2}
 */
/* eslint-enable */
export const MAX_CHANNEL_SIZE = 2 ** 24;

export const LIGHTNING_INVOICE_STATE = {
    ACCEPTED: 3,
    CANCELED: 2,
    OPEN: 0,
    SETTLED: 1,
};
