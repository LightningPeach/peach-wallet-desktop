/* eslint-disable */
class Stream {
    constructor(id, name, totalParts, partsPaid, price, memo, lightningID, date, status, delay) {
        this.id = id;
        this.name = name;
        this.totalParts = totalParts;
        this.partsPaid = partsPaid;
        this.price = price;
        this.memo = memo;
        this.lightningID = lightningID;
        this.date = date;
        this.status = status;
        this.delay = delay;
    }
}

module.exports = {
    Stream,
};
