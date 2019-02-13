class Config {
    constructor(lightningId, createChannelViewed, activeMeasure, systemNotifications, analytics, terms, privacyMode) {
        this.lightningId = lightningId;
        this.createChannelViewed = createChannelViewed;
        this.activeMeasure = activeMeasure;
        this.systemNotifications = systemNotifications;
        this.analytics = analytics;
        this.terms = terms;
        this.privacyMode = privacyMode;
    }
}

module.exports = {
    Config,
};
