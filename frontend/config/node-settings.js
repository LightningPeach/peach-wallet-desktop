const BLOCK_HEIGHT_PROTOCOL = `http${window.PEACH.replenishTLS ? "s" : ""}`;
export const BLOCK_HEIGHT_HOST = `${BLOCK_HEIGHT_PROTOCOL}://${window.PEACH.replenishUrl}`;
export const BLOCK_HEIGHT_QUERY = "/height";
export const BLOCK_HEIGHT_URL = `${BLOCK_HEIGHT_HOST}${BLOCK_HEIGHT_QUERY}`;
export const {
    ANALYTICS,
    AGREEMENT,
    PEACH,
    BITCOIN_SETTINGS,
    DB,
    INIT_LISTEN_PORT,
    DEV_MODE,
} = window;
