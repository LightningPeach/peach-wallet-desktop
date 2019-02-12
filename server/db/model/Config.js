class Config {
    constructor(lightningId, createChannelViewed, activeMeasure, systemNotifications, analytics, terms, userMode) {
        this.lightningId = lightningId;
        this.createChannelViewed = createChannelViewed;
        this.activeMeasure = activeMeasure;
        this.systemNotifications = systemNotifications;
        this.analytics = analytics;
        this.terms = terms;
        this.userMode = userMode;
    }
}

module.exports = {
    Config,
};
