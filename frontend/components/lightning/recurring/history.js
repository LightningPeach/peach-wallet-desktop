import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, helpers } from "additional";
import { lightningOperations as operations } from "modules/lightning";
import { channelsOperations, channelsSelectors } from "modules/channels";
import History from "components/history";
import BalanceWithMeasure from "components/common/balance-with-measure";
import {
    streamPaymentOperations as streamOperations,
    streamPaymentTypes,
} from "modules/streamPayments";
import { appOperations } from "modules/app";
import { STREAM_INFINITE_TIME_VALUE } from "config/consts";
import Ellipsis from "components/common/ellipsis";

class RecurringHistory extends Component {
    getHistoryHeader = () => ([
        {
            Header: <span className="sortable">Name of payment</span>,
            accessor: "name",
            sortMethod: (a, b, desc) => {
                const aa = a.props.children.toLowerCase();
                const bb = b.props.children.toLowerCase();
                if (a.props["data-pinned"] && b.props["data-pinned"]) {
                    return aa > bb ? 1 : aa < bb ? -1 : 0;
                } else if (a.props["data-pinned"] || b.props["data-pinned"]) {
                    if (desc) {
                        return a.props["data-pinned"] ? 1 : -1;
                    }
                    return a.props["data-pinned"] ? -1 : 1;
                }
                return aa > bb ? 1 : aa < bb ? -1 : 0;
            },
            width: 186,
        },
        {
            Header: <span className="">Amount</span>,
            accessor: "amount",
            sortable: false,
            width: 210,
        },
        {
            Header: <span className="sortable">Type</span>,
            accessor: "type",
            sortMethod: (a, b, desc) => {
                if (a.props["data-pinned"] || b.props["data-pinned"]) {
                    if (desc) {
                        return a.props["data-pinned"] ? 1 : -1;
                    }
                    return a.props["data-pinned"] ? -1 : 1;
                }
                const aa = a.props.children.toLowerCase();
                const bb = b.props.children.toLowerCase();
                return aa > bb ? 1 : aa < bb ? -1 : 0;
            },
            width: 109,
        },
        {
            Header: <span className="">To</span>,
            accessor: "to",
            sortable: false,
            width: 305,
        },
        {
            Header: <span className="sortable">Date</span>,
            accessor: "date",
            sortMethod: (a, b, desc) => {
                if (a.props["data-pinned"] && b.props["data-pinned"]) {
                    return a.props.dateTime > b.props.dateTime ? 1 : a.props.dateTime < b.props.dateTime ? -1 : 0;
                } else if (a.props["data-pinned"] || b.props["data-pinned"]) {
                    if (desc) {
                        return a.props["data-pinned"] ? 1 : -1;
                    }
                    return a.props["data-pinned"] ? -1 : 1;
                }
                return a.props.dateTime > b.props.dateTime ? 1 : a.props.dateTime < b.props.dateTime ? -1 : 0;
            },
            width: 170,
        },
    ]);

    getHistoryData = () => {
        const {
            dispatch, contacts, history, lightningID, streams, isThereActiveChannel,
        } = this.props;
        let type;

        streams.sort((a, b) => a.date > b.date ? -1 : a.date < b.date ? 1 : 0);
        const activeStreamsData = streams.map((item, key) => {
            let className = "orange";
            let tempAddress = item.lightningID;
            const date = new Date(parseInt(item.date, 10));
            let isActive = false;
            contacts.forEach((contact) => {
                if (contact.lightningID === item.lightningID) {
                    tempAddress = contact.name;
                }
            });
            let price = item.totalParts === STREAM_INFINITE_TIME_VALUE
                ? item.price * (!item.partsPaid ? 1 : item.partsPaid)
                : item.price * (!item.partsPaid ? item.totalParts : item.partsPaid);
            let seconds = item.totalParts === STREAM_INFINITE_TIME_VALUE
                ? (!item.partsPaid ? "∞" : item.partsPaid)
                : (!item.partsPaid ? item.totalParts : item.partsPaid);
            const address = (
                <span
                    onClick={() => {
                        if (item.lightningID !== "-") {
                            if (helpers.hasSelection()) return;
                            analytics.event({
                                action: "History address",
                                category: "Lightning",
                                label: "Copy",
                            });
                            dispatch(appOperations.copyToClipboard(item.lightningID));
                        }
                    }}
                    title={tempAddress}
                >
                    {tempAddress}
                </span>
            );
            if (item.status === streamPaymentTypes.STREAM_PAYMENT_PAUSED) {
                type = (
                    <Fragment>
                        <span
                            className="start"
                            onClick={() => {
                                analytics.event({
                                    action: "Stream",
                                    category: "Lightning",
                                    label: "Play",
                                });
                                if (!isThereActiveChannel) {
                                    dispatch(operations.channelWarningModal());
                                    return;
                                }
                                dispatch(streamOperations.startStreamPayment(item.streamId));
                            }}
                        />
                        <span
                            className="stop"
                            onClick={() => {
                                analytics.event({
                                    action: "Stream",
                                    category: "Lightning",
                                    label: "Stop",
                                });
                                dispatch(streamOperations.finishStreamPayment(item.streamId));
                            }}
                        />
                    </Fragment>
                );
                className = key === 0 ? "green" : "orange";
                isActive = true;
            } else if (item.status === streamPaymentTypes.STREAM_PAYMENT_STREAMING) {
                type = (
                    <span
                        className="pause"
                        onClick={() => {
                            analytics.event({
                                action: "Stream",
                                category: "Lightning",
                                label: "Pause",
                            });
                            dispatch(streamOperations.pauseStreamPayment(item.streamId));
                        }}
                    />
                );
                className = "red";
                isActive = true;
            } else {
                type = "Stream";
                ({ price } = item);
                seconds = item.partsPaid;
                price *= seconds;
            }
            const [ymd, hms] = helpers.formatDate(date).split(" ");
            return {
                amount: (
                    <span>{item.currency === "USD"
                        ? `${price} USD`
                        : <BalanceWithMeasure satoshi={price} />} / {seconds} payments
                    </span>),
                date: (
                    <span dateTime={date} data-pinned={isActive}>
                        <span className="date__ymd">{ymd}</span>
                        <span className="date__hms">{hms}</span>
                    </span>
                ),
                name: <Ellipsis classList={className} data-pinned={isActive}>{item.name}</Ellipsis>,
                sortDate: date,
                to: <Ellipsis>{address}</Ellipsis>,
                type: <span data-pinned={isActive}>{type}</span>,
            };
        });

        let date;
        const finishedStreamsData = history
            .filter(item => item.type === "stream")
            .map((item, key) => {
                let tempAddress = null;
                date = new Date(parseInt(item.date, 10));
                contacts.forEach((contact) => {
                    if (contact.lightningID === item.lightningID) {
                        tempAddress = contact.name;
                    }
                });
                tempAddress = tempAddress || (item.lightningID !== lightningID ? item.lightningID : "me");
                const address = (
                    <span
                        onClick={() => {
                            if (item.lightningID !== "-") {
                                if (helpers.hasSelection()) return;
                                analytics.event({
                                    action: "History address",
                                    category: "Lightning",
                                    label: "Copy",
                                });
                                dispatch(appOperations.copyToClipboard(item.lightningID));
                            }
                        }}
                        title={tempAddress}
                    >
                        {tempAddress}
                    </span>
                );
                const [ymd, hms] = helpers.formatDate(date).split(" ");
                const amount = item.type !== "stream" ?
                    <BalanceWithMeasure satoshi={item.amount} /> :
                    <span><BalanceWithMeasure satoshi={item.amount} /> / {item.parts} sec</span>;
                return {
                    amount,
                    date: (
                        <div dateTime={date}>
                            <span className="date__ymd">{ymd}</span>
                            <span className="date__hms">{hms}</span>
                        </div>
                    ),
                    name: <Ellipsis classList="history">{item.name}</Ellipsis>,
                    to: <Ellipsis>{address}</Ellipsis>,
                    type: <span>{item.type === "stream" ? "Stream" : "Regular"}</span>,
                };
            });

        return [...activeStreamsData, ...finishedStreamsData];
    };

    render() {
        return (
            <History
                columns={this.getHistoryHeader()}
                data={this.getHistoryData()}
                defaultSorted={[
                    {
                        desc: true,
                        id: "date",
                    },
                ]}
            />
        );
    }
}

RecurringHistory.propTypes = {
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.arrayOf(PropTypes.shape).isRequired,
    isThereActiveChannel: PropTypes.bool,
    lightningID: PropTypes.string.isRequired,
    streams: PropTypes.arrayOf(PropTypes.shape({
        comment: PropTypes.string,
        date: PropTypes.number.isRequired,
        delay: PropTypes.number,
        description: PropTypes.string,
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        partsPaid: PropTypes.number.isRequired,
        price: PropTypes.number.isRequired,
        status: PropTypes.string.isRequired,
        totalParts: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })).isRequired,
};

const mapStateToProps = state => ({
    contacts: state.contacts.contacts,
    externalPaymentRequest: state.lightning.externalPaymentRequest,
    history: state.lightning.history,
    isThereActiveChannel: channelsSelectors.isThereActiveChannel(state),
    lightningID: state.account.lightningID,
    modalState: state.app.modalState,
    streams: state.streamPayment.streams,
});

export default connect(mapStateToProps)(RecurringHistory);
