let channels = {};

// Base implementation of electron ipc. For test some code like window.ipcRenderer.on("lnd-down")
const ipcRenderer = {
    send: sinon.spy((channel, ...arg) => {
        if (channel in channels) {
            channels[channel].callbacks.forEach((callback) => {
                if (arg.length) {
                    callback(null, ...Object.values(arg[0]));
                } else {
                    callback(null);
                }
            });
        }
    }),
    on: sinon.spy((channel, callback) => {
        if (channel in channels) {
            channels[channel].callbacks.push(callback);
        } else {
            channels[channel] = { callbacks: [callback] };
        }
    }),
    reset: () => {
        channels = {};
    },
};

window.ipcRenderer = ipcRenderer;
