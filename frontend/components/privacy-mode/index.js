import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { accountTypes, accountOperations } from "modules/account";

const PrivacyMode = ({ dispatch, callback, privacyMode }) => {
    const confirmType = (type) => {
        dispatch(accountOperations.setPrivacyMode(type));
        callback(type);
    };
    return (
        <div className="row align-stretch-xs">
            <div className="col-xs-12 col-md-6">
                <div className="card card--privacy-mode">
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
                            className="button button__orange"
                            onClick={() => confirmType(accountTypes.PRIVACY_MODE.EXTENDED)}
                            disabled={privacyMode === accountTypes.PRIVACY_MODE.EXTENDED}
                        >
                            Choose extended
                        </button>
                    </div>
                </div>
            </div>
            <div className="col-xs-12 col-md-6">
                <div className="card card--privacy-mode">
                    <div className="card__body">
                        <div className="card__icon card__icon--incognito" />
                        <div className="card__title">
                            Incognito Mode
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
                                Incognito mode disable:
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
                            className="button button__orange"
                            onClick={() => confirmType(accountTypes.PRIVACY_MODE.INCOGNITO)}
                            disabled={privacyMode === accountTypes.PRIVACY_MODE.INCOGNITO}
                        >
                            Choose incognito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

PrivacyMode.propTypes = {
    callback: PropTypes.func,
    dispatch: PropTypes.func.isRequired,
    privacyMode: PropTypes.oneOf([
        accountTypes.PRIVACY_MODE.EXTENDED,
        accountTypes.PRIVACY_MODE.INCOGNITO,
        accountTypes.PRIVACY_MODE.PENDING,
    ]),
};

const mapStateToProps = state => ({
    privacyMode: state.account.privacyMode,
});

export default connect(mapStateToProps)(PrivacyMode);
