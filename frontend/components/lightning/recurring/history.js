import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Tooltip from "rc-tooltip";

import { analytics, helpers, tooltips } from "additional";
import { lightningOperations as operations } from "modules/lightning";
import { channelsOperations, channelsSelectors } from "modules/channels";
import {
    streamPaymentOperations,
    streamPaymentTypes,
    streamPaymentActions,
} from "modules/streamPayments";
import { filterTypes, filterOperations } from "modules/filter";
import { appOperations } from "modules/app";
import { accountTypes } from "modules/account";
import { consts } from "config";

import RecordsTable from "components/records/table";
import BalanceWithMeasure from "components/common/balance-with-measure";
import Ellipsis from "components/common/ellipsis";

const compare = (a, b, aPinned, bPinned, desc) => {
    if (aPinned && bPinned) {
        return !a ? -1 : !b ? 1 : a > b ? 1 : a < b ? -1 : 0;
    } else if (aPinned || bPinned) {
        if (desc) {
            return aPinned ? 1 : -1;
        }
        return aPinned ? -1 : 1;
    }
    return !a ? -1 : !b ? 1 : a > b ? 1 : a < b ? -1 : 0;
};

class RecurringHistory extends Component {
    getHistoryHeader = () => ([
        {
            Header: <span className="sortable">Description</span>,
            accessor: "name",
            sortMethod: (a, b, desc) => compare(
                a.props.children.toLowerCase(),
                b.props.children.toLowerCase(),
                a.props["data-pinned"],
                b.props["data-pinned"],
                desc,
            ),
            width: 165,
        },
        {
            Header: <span />,
            accessor: "status",
            sortable: false,
            width: 65,
        },
        {
            Header: (
                <span className="tooltip-wp">
                    Amount
                    <Tooltip
                        placement="right"
                        overlay={tooltips.RECURRING_AMOUNT}
                        trigger="hover"
                        arrowContent={
                            <div className="rc-tooltip-arrow-inner" />
                        }
                        prefixCls="rc-tooltip__small rc-tooltip"
                        mouseLeaveDelay={0}
                    >
                        <i className="tooltip tooltip--info" />
                    </Tooltip>
                </span>),
            accessor: "amount",
            sortable: false,
            width: 120,
        },
        {
            Header: <span className="sortable">Frequency</span>,
            accessor: "frequency",
            sortMethod: (a, b, desc) => compare(
                a.props.frequency,
                b.props.frequency,
                a.props["data-pinned"],
                b.props["data-pinned"],
                desc,
            ),
            width: 105,
        },
        {
            Header: (
                <span className="tooltip-wp">
                    Count
                    <Tooltip
                        placement="right"
                        overlay={tooltips.RECURRING_COUNT}
                        trigger="hover"
                        arrowContent={
                            <div className="rc-tooltip-arrow-inner" />
                        }
                        prefixCls="rc-tooltip__small rc-tooltip"
                        mouseLeaveDelay={0}
                    >
                        <i className="tooltip tooltip--info" />
                    </Tooltip>
                </span>),
            accessor: "count",
            sortable: false,
            width: 105,
        },
        {
            Header: <span className="sortable">To</span>,
            accessor: "to",
            sortMethod: (a, b, desc) => compare(
                a.props.children.props.children.toLowerCase(),
                b.props.children.props.children.toLowerCase(),
                a.props["data-pinned"],
                b.props["data-pinned"],
                desc,
            ),
            width: 245,
        },
        {
            Header: <span className="sortable">Date & Time</span>,
            accessor: "date",
            sortMethod: (a, b, desc) => compare(
                a.props.dateTime,
                b.props.dateTime,
                a.props["data-pinned"],
                b.props["data-pinned"],
                desc,
            ),
            width: 135,
        },
    ]);

    getHistoryData = () => {
        const {
            dispatch, contacts, history, lightningID, streams, isThereActiveChannel, filter, walletMode,
        } = this.props;
        return [
            ...streams.sort((a, b) => a.date > b.date ? -1 : a.date < b.date ? 1 : 0),
            ...history.filter(item => item.type === "stream" && !streams.some(i => i.id === item.id)),
        ]
            .map((item) => {
                let tempAddress = null;
                const isActive = item.status !== streamPaymentTypes.STREAM_PAYMENT_FINISHED;
                contacts.forEach((contact) => {
                    if (contact.lightningID === item.lightningID) {
                        tempAddress = contact.name;
                    }
                });
                tempAddress = tempAddress || (item.lightningID !== lightningID ? item.lightningID : "me");
                const date = new Date(parseInt(item.date, 10));
                return {
                    ...item,
                    date,
                    isActive,
                    tempAddress,
                };
            })
            .filter(item => dispatch(filterOperations.filter(
                filter,
                {
                    search: [
                        item.name,
                        item.tempAddress,
                        item.lightningID,
                    ],
                },
            )))
            .map((item, key) => {
                const address = (
                    <span
                        onClick={() => {
                            if (item.lightningID !== "-") {
                                if (helpers.hasSelection()) return;
                                analytics.event({
                                    action: "History address / Recurring payment",
                                    category: "Lightning",
                                    label: "Copy",
                                });
                                dispatch(appOperations.copyToClipboard(item.lightningID));
                            }
                        }}
                        title={item.tempAddress}
                    >
                        {item.tempAddress}
                    </span>
                );
                let status = "";
                if (item.status === streamPaymentTypes.STREAM_PAYMENT_PAUSED) {
                    status = (
                        <Fragment>
                            <button
                                className="start"
                                onClick={() => {
                                    analytics.event({
                                        action: "Recurring",
                                        category: "Lightning",
                                        label: "Start",
                                    });
                                    if (!isThereActiveChannel) {
                                        dispatch(operations.channelWarningModal());
                                        return;
                                    }
                                    dispatch(streamPaymentOperations.startStreamPayment(item.id));
                                }}
                                disabled={walletMode !== accountTypes.WALLET_MODE.EXTENDED}
                            />
                            <button
                                className="stop"
                                onClick={() => {
                                    analytics.event({
                                        action: "Recurring",
                                        category: "Lightning",
                                        label: "Stop",
                                    });
                                    dispatch(streamPaymentOperations.finishStreamPayment(item.id));
                                }}
                                disabled={walletMode !== accountTypes.WALLET_MODE.EXTENDED}
                            />
                        </Fragment>
                    );
                } else if (item.status === streamPaymentTypes.STREAM_PAYMENT_STREAMING) {
                    status = (
                        <button
                            className="pause"
                            onClick={() => {
                                analytics.event({
                                    action: "Recurring",
                                    category: "Lightning",
                                    label: "Pause",
                                });
                                dispatch(streamPaymentOperations.pauseStreamPayment(item.id));
                            }}
                            disabled={walletMode !== accountTypes.WALLET_MODE.EXTENDED}
                        />
                    );
                }
                const amount = item.currency === "BTC"
                    ? (
                        <span>
                            <BalanceWithMeasure satoshi={item.totalAmount} />
                            <br />
                            (<BalanceWithMeasure satoshi={item.price} />)
                        </span>)
                    : (
                        <span>
                            {item.totalAmount} USD
                            <br />
                            ({item.price} USD)
                        </span>);
                const count = item.status !== streamPaymentTypes.STREAM_PAYMENT_FINISHED
                    ? (
                        <span>
                            <span
                                className={item.status === streamPaymentTypes.STREAM_PAYMENT_STREAMING ? "green" : ""}
                            >
                                {item.partsPaid}
                                {item.partsPending > 0 && `+${item.partsPending}`}
                            </span> / {item.totalParts === consts.STREAM_INFINITE_TIME_VALUE ? "∞" : item.totalParts}
                        </span>)
                    : (
                        <span>
                            {item.partsPaid} / {
                                item.totalParts === consts.STREAM_INFINITE_TIME_VALUE ? "∞" : item.totalParts
                            }
                        </span>);
                return {
                    amount,
                    count,
                    date: (
                        <span dateTime={item.date} data-pinned={item.isActive}>
                            {helpers.formatDate(item.date)}
                        </span>
                    ),
                    frequency: (
                        <Ellipsis
                            frequency={item.delay}
                            data-pinned={item.isActive}
                        >
                            {helpers.formatTimeRange(item.delay) || "-"}
                        </Ellipsis>
                    ),
                    name: (
                        <div data-pinned={item.isActive}>
                            <Ellipsis>{item.name}</Ellipsis>
                            <div className="stream__actions">
                                {walletMode === accountTypes.WALLET_MODE.EXTENDED &&
                                    item.name !== consts.INCOMING_RECURRING_NAME &&
                                    <button
                                        className="table__button"
                                        type="button"
                                        onClick={() => { this.handleEdit(item) }}
                                    >
                                        Edit
                                    </button>
                                }
                                <button
                                    className="table__button"
                                    type="button"
                                    onClick={() => { this.handleCopy(item.lightningID) }}
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    ),
                    status: <span data-pinned={item.isActive}>{status}</span>,
                    to: <Ellipsis data-pinned={item.isActive}>{address}</Ellipsis>,
                };
            });
    };

    handleCopy = (address) => {
        analytics.event({ action: "Recurring", category: "Lightning", label: "Copy lightning ID" });
        const { dispatch } = this.props;
        dispatch(appOperations.copyToClipboard(address, "Lightning ID copied"));
    };

    handleEdit = (payment) => {
        analytics.event({ action: "Recurring", category: "Lightning", label: "Edit payment" });
        const { dispatch } = this.props;
        dispatch(streamPaymentActions.setCurrentStream(payment));
        if (payment.status === streamPaymentTypes.STREAM_PAYMENT_STREAMING) {
            dispatch(streamPaymentOperations.openActiveRecurringWarningModal());
        } else {
            dispatch(streamPaymentOperations.openEditStreamModal());
        }
    };

    render() {
        return (
            <RecordsTable
                columns={this.getHistoryHeader()}
                data={this.getHistoryData()}
                defaultSorted={[
                    {
                        desc: true,
                        id: "date",
                    },
                ]}
                source={filterTypes.FILTER_RECURRING}
                title="Recurring payments history"
                filters={[
                    filterTypes.FILTER_KIND_SEARCH,
                ]}
                emptyPlaceholder="No payments found"
                searchPlaceholder="Name, To, Lightning ID"
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
    filter: PropTypes.shape().isRequired,
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
    walletMode: PropTypes.oneOf(accountTypes.WALLET_MODES_LIST),
};

const mapStateToProps = state => ({
    contacts: state.contacts.contacts,
    externalPaymentRequest: state.lightning.externalPaymentRequest,
    filter: state.filter.recurring,
    history: state.lightning.history,
    isThereActiveChannel: channelsSelectors.isThereActiveChannel(state),
    lightningID: state.account.lightningID,
    modalState: state.app.modalState,
    streams: state.streamPayment.streams,
    walletMode: state.account.walletMode,
});

export default connect(mapStateToProps)(RecurringHistory);
