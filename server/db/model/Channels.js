class Channels {
    constructor(fundingTxid, name, status, blockHeight, activeStatus) {
        this.fundingTxid = fundingTxid;
        this.name = name;
        this.status = status;
        this.blockHeight = blockHeight;
        this.activeStatus = activeStatus;
    }
}

module.exports = {
    Channels,
};
