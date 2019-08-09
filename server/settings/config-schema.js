module.exports = {
    analytics: {
        trackingID: {
            format: String,
            default: null,
        },
        appUrl: {
            format: String,
            default: null,
        },
    },
    backend: {
        dbFile: {
            doc: "Name for database file",
            format: String,
            default: "db.db",
        },
        devMode: {
            doc: "Enable dev mode",
            format: Boolean,
            default: false,
        },
    },
    lnd: {
        init_listen: {
            doc: "Add an port to listen for peer connections",
            format: "nat",
            default: 9735,
        },
        rpclisten: {
            doc: "Add an port to listen for RPC connections",
            format: "nat",
            default: 10009,
        },
        restlisten: {
            doc: "Add an port to listen for REST connections",
            format: "nat",
            default: 10014,
        },
        no_macaroons: {
            doc: "Disable macaroon authentication",
            format: Boolean,
            default: true,
        },
        address_look_ahead: {
            doc: "Address lookahead when restoring a wallet seed",
            format: "nat",
            default: 250,
        },
        log_level: {
            doc: "",
            format: String,
            default: "info",
        },
    },
    bitcoin: {
        active: {
            doc: "If the chain should be active or not.",
            format: Boolean,
            default: true,
        },
        node: {
            doc: "[btcd|neutrino] The blockchain interface to use.",
            format: String,
            default: "neutrino",
        },
        network: {
            doc: "[testnet|simnet] The blockchain interface to use.",
            format: String,
            default: "testnet",
        },
    },
    neutrino: {
        connect: {
            doc: "Connect only to the specified peers at startup.",
            format: String,
        },
    },
    btcd: {
        rpcuser: {
            doc: "Wallet name for RPC connections",
            format: String,
        },
        rpcpass: {
            doc: "Password for RPC connections",
            format: String,
        },
        rpchost: {
            doc: "The daemon's rpc listening address. If a port is omitted, then the default port for the selected " +
            "chain parameters will be used.",
            format: "*",
        },
        rpccert: {
            doc: "File containing the daemon's certificate file.",
            format: String,
        },
    },
    bitcoind: {
        rpcuser: {
            doc: "Wallet name for RPC connections",
            format: String,
        },
        rpcpass: {
            doc: "Password for RPC connections",
            format: String,
        },
        rpchost: {
            doc: "The daemon's rpc listening address. If a port is omitted, then the default port for the selected " +
            "chain parameters will be used.",
            format: "*",
        },
        zmqpubrawblock: {
            doc: "The address listening for ZMQ connections to deliver raw block notifications.",
            format: "*",
        },
        zmqpubrawtx: {
            doc: "The address listening for ZMQ connections to deliver raw transaction notifications.",
            format: "*",
        },
    },
    autopilot: {
        active: {
            format: Boolean,
        },
    },
    version: {
        legal: {
            format: String,
        },
        syncedVersion: {
            format: Number,
        },
    },
    logger: {
        level: {
            format: String,
            default: "DEBUG",
        },
    },
    peach: {
        pubKey: {
            doc: "",
            format: String,
        },
        host: {
            doc: "",
            format: String,
        },
        peerPort: {
            doc: "",
            format: Number,
        },
        replenishUrl: {
            doc: "",
            format: String,
        },
        replenishTLS: {
            doc: "",
            format: Boolean,
        },
    },
};
