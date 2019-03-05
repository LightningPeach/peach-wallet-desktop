import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { accountTypes, accountOperations, accountActions } from "modules/account";

const WalletMode = ({
    dispatch,
    callback,
    walletMode,
    onlyToStore,
}) => {
    const confirmType = (type) => {
        dispatch(onlyToStore ? accountActions.setWalletMode(type) : accountOperations.setWalletMode(type));
        callback(type);
    };
    return (
        <div className="row card__row align-stretch-xs">
            <div className="col-xs-12 col-md-6 card__col">
                <div className="card card--wallet-mode">
                    <div className="card__body">
                        <div className="card__icon card__icon--extended" />
                        <div className="card__title">
                            Extended Mode
                        </div>
                        <div className="card__description">
                            Wallet connects with our server  and collects your IP address, your Lightning ID
                            and Contact list.
                        </div>
                        <ul className="card__list">
                            <div className="card__list-title">
                                Extended Mode includes:
                            </div>
                            <li className="card__list-item">
                                <div className="label label--checkmark">
                                    Contacts
                                </div>
                            </li>
                            <li className="card__list-item">
                                <div className="label label--checkmark">
                                    Streaming payments
                                </div>
                            </li>
                            <li className="card__list-item">
                                <div className="label label--checkmark">
                                    Payments by Lightning ID
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div className="card__footer">
                        <button
                            className="button button__solid button--fullwide"
                            onClick={() => confirmType(accountTypes.WALLET_MODE.EXTENDED)}
                            disabled={walletMode === accountTypes.WALLET_MODE.EXTENDED}
                        >
                            Choose extended
                        </button>
                    </div>
                </div>
            </div>
            <div className="card__col col-xs-12 col-md-6">
                <div className="card card--wallet-mode">
                    <div className="card__body">
                        <div className="card__icon card__icon--standard" />
                        <div className="card__title">
                            Standard Mode
                        </div>
                        <div className="card__description">
                            Wallet doesn&apos;t connect with our server and doesn&apos;t collect any data.
                            <ul className="card__list">
                                <li className="card__list-item">
                                    <div className="label label--checkmark">
                                        Anonymous use
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <ul className="card__list">
                            <div className="card__list-title">
                                Standard mode disable:
                            </div>
                            <li className="card__list-item">
                                <div className="label label--xmark">
                                    Contacts
                                </div>
                            </li>
                            <li className="card__list-item">
                                <div className="label label--xmark">
                                    Streaming payments
                                </div>
                            </li>
                            <li className="card__list-item">
                                <div className="label label--xmark">
                                    Payments by Lightning ID
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div className="card__footer">
                        <button
                            className="button button__solid button--fullwide"
                            onClick={() => confirmType(accountTypes.WALLET_MODE.STANDARD)}
                            disabled={walletMode === accountTypes.WALLET_MODE.STANDARD}
                        >
                            Choose standard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

WalletMode.propTypes = {
    callback: PropTypes.func,
    dispatch: PropTypes.func.isRequired,
    onlyToStore: PropTypes.bool,
    walletMode: PropTypes.oneOf([
        accountTypes.WALLET_MODE.EXTENDED,
        accountTypes.WALLET_MODE.STANDARD,
        accountTypes.WALLET_MODE.PENDING,
    ]),
};

const mapStateToProps = state => ({
    walletMode: state.account.walletMode,
});

export default connect(mapStateToProps)(WalletMode);
