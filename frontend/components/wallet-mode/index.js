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
    let extendedButtonText;
    let standardButtonText;
    switch (walletMode) {
        case accountTypes.WALLET_MODE.EXTENDED:
            extendedButtonText = "Selected";
            standardButtonText = "Switch to Standard";
            break;
        case accountTypes.WALLET_MODE.STANDARD:
            extendedButtonText = "Switch to Extended";
            standardButtonText = "Selected";
            break;
        default:
            extendedButtonText = "Choose Extended";
            standardButtonText = "Choose Standard";
    }
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
                            In this mode you will have a few extra features not yet present in the standard Lightning
                            Network. These features rely on the Peach server to route a transaction.
                        </div>
                        <ul className="card__list">
                            <div className="card__list-title">
                                Added in the Extended Mode:
                            </div>
                            <li className="card__list-item">
                                <div className="label label--checkmark">
                                    Recurring payments
                                </div>
                            </li>
                            <li className="card__list-item">
                                <div className="label label--checkmark">
                                    Payments by Lightning ID
                                </div>
                            </li>
                            <li className="card__list-item">
                                <div className="label label--checkmark">
                                    Contacts
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
                            {extendedButtonText}
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
                            In this mode your wallet will never connect to the Peach server for any reason. The Extended
                            Mode features will be disabled.
                            <ul className="card__list">
                                <li className="card__list-item">
                                    <div className="label label--checkmark">
                                        No 3rd party servers
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <ul className="card__list">
                            <div className="card__list-title">
                                Disabled in the Standard Mode:
                            </div>
                            <li className="card__list-item">
                                <div className="label label--xmark">
                                    Recurring payments
                                </div>
                            </li>
                            <li className="card__list-item">
                                <div className="label label--xmark">
                                    Payments by Lightning ID
                                </div>
                            </li>
                            <li className="card__list-item">
                                <div className="label label--xmark">
                                    Contacts
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
                            {standardButtonText}
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
    walletMode: PropTypes.oneOf(accountTypes.WALLET_MODES_LIST),
};

const mapStateToProps = state => ({
    walletMode: state.account.walletMode,
});

export default connect(mapStateToProps)(WalletMode);
