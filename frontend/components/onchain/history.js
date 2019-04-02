import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, helpers } from "additional";
import RecordsTable from "components/records/table";
import BalanceWithMeasure from "components/common/balance-with-measure";
import { filterTypes, filterOperations } from "modules/filter";
import { appOperations } from "modules/app";
import Ellipsis from "components/common/ellipsis";
import BlocksLoader from "components/ui/blocks-loader";

const compare = (a, b) => !a ? -1 : !b ? 1 : a > b ? 1 : a < b ? -1 : 0;

class OnchainHistory extends Component {
    getHistoryHeader = () => [
        {
            Header: <span className="sortable">Description</span>,
            accessor: "name",
            className: "name",
            sortMethod: (a, b) => compare(
                a.props.children.toLowerCase(),
                b.props.children.toLowerCase(),
            ),
            width: 164,
        },
        {
            Header: <span className="sortable">Amount</span>,
            accessor: "amount",
            className: "amount",
            sortMethod: (a, b) => compare(
                a.props.satoshi,
                b.props.satoshi,
            ),
            width: 145,
        },
        {
            Header: <span className="sortable">To</span>,
            accessor: "to",
            className: "to",
            sortMethod: (a, b) => compare(
                a.props.children.props.children.toLowerCase(),
                b.props.children.props.children.toLowerCase(),
            ),
            width: 156,
        },
        {
            Header: <span>Confirmations</span>,
            accessor: "time",
            className: "time",
            sortable: false,
            width: 150,
        },
        {
            Header: <span>Transaction ID</span>,
            accessor: "tid",
            className: "tid",
            sortable: false,
            width: 190,
        },
        {
            Header: <span className="sortable">Date</span>,
            accessor: "date",
            className: "date",
            sortMethod: (a, b) => compare(
                a.props.dateTime,
                b.props.dateTime,
            ),
            width: 135,
        },
    ];

    getHistoryData = () => {
        const { dispatch, lightningID, filter } = this.props;
        return this.props.history
            .map((item) => {
                const tempAddress = item.to !== lightningID ? item.to : "me";
                return {
                    ...item,
                    tempAddress,
                };
            })
            .filter(item => dispatch(filterOperations.filter(
                filter,
                {
                    date: item.date,
                    price: item.amount,
                    search: [
                        item.name,
                        item.tempAddress,
                        item.tx_hash,
                    ],
                    type: item.amount,
                },
            )))
            .map((item, key) => {
                const address = (
                    <span
                        onClick={() => {
                            if (helpers.hasSelection()) return;
                            if (item.tempAddress !== "-") {
                                analytics.event({ action: "History address", category: "On-chain", label: "Copy" });
                                dispatch(appOperations.copyToClipboard(item.to));
                            }
                        }}
                        title={item.tempAddress}
                    >
                        {item.tempAddress}
                    </span>
                );
                const tid = (
                    <span
                        onClick={() => {
                            if (helpers.hasSelection()) return;
                            analytics.event({
                                action: "History transaction hash",
                                category: "On-chain",
                                label: "Copy",
                            });
                            dispatch(appOperations.copyToClipboard(item.tx_hash));
                        }}
                        title={item.tx_hash}
                    >
                        {item.tx_hash}
                    </span>
                );
                return {
                    amount: <BalanceWithMeasure satoshi={item.amount} />,
                    date: (
                        <span dateTime={item.date}>
                            {helpers.formatDate(item.date)}
                        </span>
                    ),
                    name: <Ellipsis>{item.name}</Ellipsis>,
                    tid: <Ellipsis>{tid}</Ellipsis>,
                    time: <BlocksLoader
                        class={item.status === "pending" ? "pending" : "sended"}
                        countBlocks={item.num_confirmations}
                    />,
                    to: <Ellipsis>{address}</Ellipsis>,
                };
            });
    };

    render() {
        return (
            <RecordsTable
                key={3}
                columns={this.getHistoryHeader()}
                data={this.getHistoryData()}
                defaultSorted={[
                    {
                        desc: true,
                        id: "date",
                    },
                ]}
                source={filterTypes.FILTER_ONCHAIN}
                title="On-chain payments history"
                filters={filterTypes.FILTER_KIND_LIST}
                emptyPlaceholder="No payments found"
                searchPlaceholder="Name, To, Transaction ID"
            />
        );
    }
}

OnchainHistory.propTypes = {
    dispatch: PropTypes.func.isRequired,
    filter: PropTypes.shape().isRequired,
    history: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number,
        block_hash: PropTypes.string,
        block_height: PropTypes.number,
        date: PropTypes.instanceOf(Date).isRequired,
        name: PropTypes.string.isRequired,
        num_confirmations: PropTypes.number,
        status: PropTypes.string.isRequired,
        to: PropTypes.string.isRequired,
        total_fees: PropTypes.number,
        tx_hash: PropTypes.string,
    })).isRequired,
    lightningID: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    filter: state.filter.onchain,
    history: state.onchain.history,
    lightningID: state.account.lightningID,
});

export default connect(mapStateToProps)(OnchainHistory);
