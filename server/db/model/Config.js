class Config {
    constructor(
        lightningId,
        createChannelViewed,
        activeMeasure,
        systemNotifications,
        analytics,
        terms,
        walletMode,
        legalVersion,
    ) {
        this.lightningId = lightningId;
        this.createChannelViewed = createChannelViewed;
        this.activeMeasure = activeMeasure;
        this.systemNotifications = systemNotifications;
        this.analytics = analytics;
        this.terms = terms;
        this.walletMode = walletMode;
        this.legalVersion = legalVersion;
    }
}

module.exports = {
    Config,
};
