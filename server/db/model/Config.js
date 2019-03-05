class Config {
    constructor(lightningId, createChannelViewed, activeMeasure, systemNotifications, analytics, terms, walletMode) {
        this.lightningId = lightningId;
        this.createChannelViewed = createChannelViewed;
        this.activeMeasure = activeMeasure;
        this.systemNotifications = systemNotifications;
        this.analytics = analytics;
        this.terms = terms;
        this.walletMode = walletMode;
    }
}

module.exports = {
    Config,
};
