const PEACH_API_PROTOCOL = `http${window.PEACH.replenishTLS ? "s" : ""}`;
export const PEACH_API_HOST = `${PEACH_API_PROTOCOL}://${window.PEACH.replenishUrl}`;
export const { NODE_ENV } = window.env;
export const {
    ANALYTICS,
    PEACH,
    BITCOIN_SETTINGS,
    DB,
    INIT_LISTEN_PORT,
    DEV_MODE,
} = window;
