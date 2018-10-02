import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import bitcoin from "bitcoinjs-lib";
import { analytics, helpers, validators } from "additional";
import * as statusCodes from "config/status-codes";
import SubHeader from "components/subheader";
import {
    MODAL_ANIMATION_TIMEOUT,
    ELEMENT_NAME_MAX_LENGTH,
    LIGHTNING_ID_LENGTH,
    SIMNET_NETWORK,
} from "config/consts";
import { BITCOIN_SETTINGS } from "config/node-settings";
import ErrorFieldTooltip from "components/ui/error_field_tooltip";
import SuccessPayment from "components/common/success-payment";
import UnSuccessPayment from "components/common/unsuccess-payment";
import History from "components/history";
import BlocksLoader from "components/ui/blocks_loader";
import { onChainOperations as operations, onChainTypes as types } from "modules/onchain";
import BtcToUsd from "components/common/btc-to-usd";
import BalanceWithMeasure from "components/common/balance-with-measure";
import { appOperations, appTypes } from "modules/app";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { OnchainFullPath } from "routes";
import { accountOperations } from "modules/account";
import DigitsField from "components/ui/digitsField";
import Ellipsis from "components/common/ellipsis";
import OnChainDetails from "./modal/details";
import OnchainWarning from "./modal/warning";

class Onchain extends Component {
    constructor(props) {
        super(props);
        this.state = {
            amount: null,
            amountError: null,
            nameError: null,
            toError: null,
        };
        analytics.pageview(OnchainFullPath, "Onchain");
    }

    componentWillMount() {
        this.props.dispatch(operations.getOnchainHistory());
    }

    componentWillUpdate(nextProps) {
        if (this.props.modalState !== nextProps.modalState && nextProps.modalState === appTypes.CLOSE_MODAL_STATE) {
            analytics.pageview(OnchainFullPath, "Onchain");
        }
    }

    onChainPay = async (e) => {
        e.preventDefault();
        analytics.event({ action: "Payment", category: "Onchain", label: "Pay" });
        const { dispatch } = this.props;
        const name = this.name.value.trim();
        const to = this.to.value.trim();
        let amount = parseFloat(this.amount.value.trim());
        const nameError = validators.validateName(name, false, true, true, undefined, true);
        const toError = this.validateTo(to);
        const amountError = dispatch(accountOperations.checkAmount(amount, "bitcoin"));

        if (nameError || toError || amountError) {
            this.setState({ amountError, nameError, toError });
            return;
        }

        this.setState({ amountError, nameError, toError });
        amount = dispatch(appOperations.convertToSatoshi(amount));
        const response = await dispatch(operations.prepareSendCoins(to, amount, name));
        if (!response.ok) {
            this.setState({ amountError: response.error });
            return;
        }
        if (to.length === LIGHTNING_ID_LENGTH) {
            dispatch(operations.openWarningModal());
            return;
        }
        dispatch(operations.openSendCoinsModal());
    };

    getHistoryHeader = () => [
        {
            Header: <span className="sortable">Name of payment</span>,
            accessor: "name",
            className: "name",
            sortMethod: (a, b) => {
                const aa = a.props.children.toLowerCase();
                const bb = b.props.children.toLowerCase();
                return aa > bb ? 1 : (aa < bb ? -1 : 0); // eslint-disable-line
            },
            width: 164,
        },
        {
            Header: <span className="">Amount</span>,
            accessor: "amount",
            className: "amount",
            sortable: false,
            width: 145,
        },
        {
            Header: <span className="sortable">To</span>,
            accessor: "to",
            className: "to",
            sortable: false,
            width: 156,
        },
        {
            Header: <span className="sortable">Confirmations</span>,
            accessor: "time",
            className: "time",
            sortable: false,
            width: 157,
        },
        {
            Header: <span>Transaction ID</span>,
            accessor: "tid",
            className: "tid",
            sortable: false,
            width: 198,
        },
        {
            Header: <span className="sortable">Date</span>,
            accessor: "date",
            className: "date",
            width: 120,
            // eslint-disable-next-line
            sortMethod: (a, b) => a.props.dateTime > b.props.dateTime ?
                1 :
                (a.props.dateTime < b.props.dateTime ? -1 : 0),
        },
    ];

    getHistoryData = () => {
        const { dispatch, lightningID } = this.props;
        return this.props.history.map((item, key) => {
            const className = key === 0 ? "green" : "orange";
            const tempAddress = item.to !== lightningID ? item.to : "me";
            const address = (
                <span
                    onClick={() => {
                        if (helpers.hasSelection()) return;
                        if (tempAddress !== "-") {
                            analytics.event({ action: "History address", category: "Onchain", label: "Copy" });
                            dispatch(appOperations.copyToClipboard(item.to));
                        }
                    }}
                    title={tempAddress}
                >
                    {tempAddress}
                </span>
            );
            const tid = (
                <span
                    onClick={() => {
                        if (helpers.hasSelection()) return;
                        analytics.event({ action: "History transaction hash", category: "Onchain", label: "Copy" });
                        dispatch(appOperations.copyToClipboard(item.tx_hash));
                    }}
                    title={item.tx_hash}
                >
                    {item.tx_hash}
                </span>
            );
            const [ymd, hms] = helpers.formatDate(item.date).split(" ");
            return {
                amount: <BalanceWithMeasure satoshi={item.amount} />,
                date: (
                    <span dateTime={item.date}>
                        <span className="date__ymd">{ymd}</span>
                        <span className="date__hms">{hms}</span>
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

    getNetwork = () => {
        if (BITCOIN_SETTINGS.network === "testnet") {
            return bitcoin.networks.testnet;
        } else if (BITCOIN_SETTINGS.network === "simnet") {
            return SIMNET_NETWORK;
        }
        return bitcoin.networks.bitcoin;
    };

    validateTo = (to) => {
        if (!to) {
            return statusCodes.EXCEPTION_FIELD_IS_REQUIRED;
        }
        const network = this.getNetwork();
        return validators.validateBitcoinAddr(to, network);
    };

    successPaymentCallback = () => {
        const { dispatch } = this.props;
        dispatch(operations.clearSendCoinsDetails());
        this.setState({ amount: null });
        this.form.reset();
        this.amountComponent.reset();
    };

    renderOnchain = () => {
        const { dispatch, bitcoinMeasureType } = this.props;
        let usd = null;
        if (this.state.amount) {
            usd = (
                <span className="form-usd">
                    <BtcToUsd amount={dispatch(appOperations.convertToSatoshi(this.state.amount))} hideBase />
                </span>
            );
        }
        return [
            <div className="tab-link tab-link__no-hover" key={-1}>
                Onchain payment
            </div>,
            <form
                className="send"
                onSubmit={this.onChainPay}
                key={0}
                ref={(ref) => {
                    this.form = ref;
                }}
            >
                <div className="row">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="send-coins__name">Name of payment</label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <input
                            id="send-coins__name"
                            className={`form-text ${this.state.nameError ? "form-text__error" : ""}`}
                            name="send-coins__name"
                            placeholder="Enter name"
                            ref={(ref) => {
                                this.name = ref;
                            }}
                            onChange={() => this.setState({ nameError: null })}
                            max={ELEMENT_NAME_MAX_LENGTH}
                            maxLength={ELEMENT_NAME_MAX_LENGTH}
                        />
                        <ErrorFieldTooltip text={this.state.nameError} />
                    </div>
                </div>
                <div className="row mt-14">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="send-coins__to">To</label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <input
                            id="send-coins__to"
                            className={`form-text ${this.state.toError ? "form-text__error" : ""}`}
                            name="send-coins__to"
                            placeholder="Bitcoin Address"
                            ref={(ref) => {
                                this.to = ref;
                            }}
                            onChange={() => this.setState({ toError: null })}
                        />
                        <ErrorFieldTooltip text={this.state.toError} />
                    </div>
                </div>
                <div className="row mt-14">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="send-coins__amount">Amount in {bitcoinMeasureType}</label>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <DigitsField
                            id="send-coins__amount"
                            className={`form-text ${this.state.amountError ? "form-text__error" : ""}`}
                            name="send-coins__amount"
                            placeholder={`${bitcoinMeasureType === "Satoshi" ? "0" : "0.0"} ${bitcoinMeasureType}`}
                            ref={(ref) => {
                                this.amountComponent = ref;
                            }}
                            setRef={(ref) => {
                                this.amount = ref;
                            }}
                            setOnChange={e => this.setState({
                                amount: e.target.value,
                                amountError: null,
                            })}
                        />
                        <ErrorFieldTooltip text={this.state.amountError} />
                    </div>
                    <div className="col-xs-12" />
                </div>
                <div className="row mt-30">
                    <div className="col-xs-12 text-right">
                        {usd}
                        <button type="submit" className="button button__orange button__side-padding45">
                            Pay
                        </button>
                    </div>
                </div>
            </form>,
        ];
    };

    render() {
        const { dispatch, modalState, sendCoinsDetails } = this.props;
        let modal;
        switch (modalState) {
            case types.MODAL_STATE_SEND_COINS:
                modal = <OnChainDetails />;
                break;
            case appTypes.FAIL_SEND_PAYMENT:
                modal = (
                    <UnSuccessPayment
                        error={this.props.sendCoinsPaymentDetails}
                        category="Onchain"
                        onClose={() => dispatch(operations.clearSendCoinsError())}
                    />
                );
                break;
            case appTypes.SUCCESS_SEND_PAYMENT:
                modal = (
                    <SuccessPayment
                        name={sendCoinsDetails.name}
                        amount={sendCoinsDetails.amount}
                        category="Onchain"
                        onClose={this.successPaymentCallback}
                    />
                );
                break;
            case types.MODAL_STATE_WARNING:
                modal = <OnchainWarning />;
                break;
            default:
                modal = null;
                break;
        }
        return [
            <SubHeader key={1} />,
            <div key={2} className="onchain">
                <div className="container">
                    {this.renderOnchain()}
                    <History
                        key={3}
                        columns={this.getHistoryHeader()}
                        data={this.getHistoryData()}
                        defaultSorted={[
                            {
                                desc: true,
                                id: "date",
                            },
                        ]}
                    />
                </div>
            </div>,
            <ReactCSSTransitionGroup
                transitionName="modal-transition"
                transitionEnterTimeout={MODAL_ANIMATION_TIMEOUT}
                transitionLeaveTimeout={MODAL_ANIMATION_TIMEOUT}
                key={3}
            >
                {modal}
            </ReactCSSTransitionGroup>,
        ];
    }
}

Onchain.propTypes = {
    bitcoinMeasureType: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
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
    modalState: PropTypes.string.isRequired,
    sendCoinsDetails: PropTypes.shape({
        amount: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        recepient: PropTypes.string.isRequired,
    }),
    sendCoinsPaymentDetails: PropTypes.string,
};

const mapStateToProps = state => ({
    bitcoinMeasureType: state.account.bitcoinMeasureType,
    history: state.onchain.history,
    lightningID: state.account.lightningID,
    modalState: state.app.modalState,
    sendCoinsDetails: state.onchain.sendCoinsDetails,
    sendCoinsPaymentDetails: state.onchain.sendCoinsPaymentDetails,
});

export default connect(mapStateToProps)(Onchain);
