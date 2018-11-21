import moment from "moment/moment";
import { appOperations } from "modules/app";
import * as types from "./types";

export function filter(sourceFilter, itemFiltered) { // eslint-disable-line
    return (dispatch) => {
        const target = JSON.parse(JSON.stringify(itemFiltered));
        const {
            type, date, search, time, price,
        } = sourceFilter;
        let searchCheck = true;
        let typeCheck = true;
        let priceCheck = true;
        let dateCheck = true;
        let timeCheck = true;
        if (target.search) {
            if (!Array.isArray(target.search)) {
                target.search = [target.search];
            }
            searchCheck = target.search.filter(item =>
                item.toLowerCase().includes(search.toLowerCase())).length > 0;
        }

        if (target.type) {
            if (!Array.isArray(target.type)) {
                target.type = [target.type];
            }
            typeCheck = target.type.filter(item =>
                type === types.TYPE_PAYMENT_ALL
                || !(
                    (type === types.TYPE_PAYMENT_INCOMING && item < 0)
                    || (type === types.TYPE_PAYMENT_OUTCOMING && item > 0)))
                .length > 0;
        }

        if (target.price) {
            if (!Array.isArray(target.price)) {
                target.price = [target.price];
            }
            priceCheck = target.price.filter((item) => {
                if (!price.from && !price.to) {
                    return true;
                } else if (price.currency === "USD") {
                    return !(
                        (price.from && dispatch(appOperations.convertUsdToSatoshi(price.from)) > Math.abs(item))
                        || (price.to && dispatch(appOperations.convertUsdToSatoshi(price.to)) < Math.abs(item))
                    );
                }
                return !(
                    (price.from && dispatch(appOperations.convertToSatoshi(price.from)) > Math.abs(item))
                    || (price.to && dispatch(appOperations.convertToSatoshi(price.to)) < Math.abs(item))
                );
            }).length > 0;
        }

        if (target.date) {
            if (!Array.isArray(target.date)) {
                target.date = [target.date];
            }
            dateCheck = target.date.filter((item) => {
                const mDate = moment(item);
                return !(date.from || date.to)
                    || !((date.from && date.from.isAfter(mDate, "day"))
                        || (date.to && date.to.isBefore(mDate, "day")));
            }).length > 0;

            timeCheck = target.date.filter((item) => {
                const mDate = moment(item);
                const hms = (mDate.hours() * 60) + mDate.minutes();
                if (time.from) {
                    if ((time.from.hours() * 60) + time.from.minutes() > hms) {
                        return false;
                    }
                }
                if (time.to) {
                    if ((time.to.hours() * 60) + time.to.minutes() < hms) {
                        return false;
                    }
                }
                return true;
            }).length > 0;
        }

        return searchCheck && typeCheck && priceCheck && dateCheck && timeCheck;
    };
}
