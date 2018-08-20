class Channels {
    constructor(fundingTxid, name, status, activeStatus) {
        this.fundingTxid = fundingTxid;
        this.name = name;
        this.status = status;
        this.activeStatus = activeStatus;
    }
}

module.exports = {
    Channels,
};
