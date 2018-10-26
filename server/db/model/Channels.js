class Channels {
    constructor(fundingTxid, name, status, activeStatus, localBalance, remoteBalance) {
        this.fundingTxid = fundingTxid;
        this.name = name;
        this.status = status;
        this.activeStatus = activeStatus;
        this.localBalance = localBalance;
        this.remoteBalance = remoteBalance;
    }
}

module.exports = {
    Channels,
};
