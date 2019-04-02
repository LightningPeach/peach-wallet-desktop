### Configuration file

The configuration file is called "settings.ini". It contains parameters required for the wallet configuration and is used for mainnet. For testnet please use the configuration file which is called "settings.testnet.ini".

**Default config is shown below:**

```javascript
[backend]
dbFile = db.db
devMode = false

[lnd] 
init_listen = 9735
address_look_ahead = 250
rpclisten = 10009
restlisten = 10014 
no_macaroons = false 
log_level = info
maxpendingchannels = 5

[bitcoin] 
active = true
node = neutrino 
network = mainnet

[neutrino]
connect = proxy.lightningpeach.com:8333

[btcd]
rpcuser = rpcuser
rpcpass = rpcpass
rpchost = your.host.com:18334
rpccert = some_path_to_cert/rpc.cert

[autopilot]
active = false

[logger]
level = INFO
```

**Description of config parameters**

Parameters are described in the following format: 
`name of parameter` – description. Names for a group of parameters are <u>underlined</u>. 

* <u>backend</u> – Parameters for database.
  * `dbFile` – Name of a wallet db file.
  * `devMode` – Specifies whether devMode is active. If the value is 'true' – then the mode is active and user can develop application easier.
* <u>lnd</u> – Ports that are sent when launching lnd.
  * `init_listen` – The initial port number for p2p connections.
  * `address_look_ahead` – How many ports try to alocate starting from the port specified in the *init_listen* parameter. 
  * `rpclisten` – The port for the rpc server.
  * `restlisten` – The port for the REST server.
  * `no_macaroons` – Specifies whether to use macaroons. If the parameter has 'true' value, then 'macaroons' won't be used.
  * `log_level` – The level of logging the LND. Possible values: "trace", "debug", "info", "warn", "error", "critical". The default value is "info".
  * `maxpendingchannels` - The maximum number of incoming pending channels permitted per peer.
* <u>bitcoin</u> – Options for launching lnd: Bitcoin.
  * `active` – Specifies whether the chain is active.
  * `node` – Type of blockchain interface to use. Possible values: "neutrino", "btcd".
  * `network` – The network type. Possible values: "simnet", "regtest", "testnet".
* <u>neutrino</u> – Options for neutrino node (parameter is used only if value of the `bitcoin.node` parameter is set to "neutrino").
  * `connect` – Url, which is used by neutrino for connection to bitcoin network. Format: "ip:port".
* <u>btcd</u> – Options for btcd node (parameter is used only if value of the `bitcoin.node` parameter is set to "btcd").
  * `rpcuser` – Username for RPC connections.
  * `rpcpass` – Password for RPC connections.
  * `rpchost` – The daemon's rpc listening host. Format: "ip:port".
  * `rpccert` – Path to btcd cert file.
* <u>autopilot</u> – Options for autopilot:
  * `active` – Specifies whether the autopilot function is active.
* <u>logger</u> – Options for wallet logger:
  * `level` – The level of logging the wallet. Possible values: TRACE, DEBUG, INFO, WARN, ERROR, FATAL. The default value is "INFO". 
