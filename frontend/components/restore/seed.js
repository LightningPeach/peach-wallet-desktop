import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { push } from "react-router-redux";

import { analytics, validators, helpers } from "additional";
import { authOperations as operations, authTypes as types } from "modules/auth";
import { error } from "modules/notifications";
import { routes } from "config";

import ErrorFieldTooltip from "components/ui/error-field-tooltip";

const spinner = <div className="spinner" />;

class Seed extends Component {
    constructor(props) {
        super(props);

        this.state = {
            processing: false,
            seedError: null,
        };
    }

    confirm = async (e) => {
        e.preventDefault();
        this.setState({ processing: true });
        const { dispatch, password, walletName } = this.props;
        analytics.event({ action: "Restore Password", category: "Auth", label: "Submit seed" });
        const seed = this.seed.value.trim().split(" ");
        const seedError = validators.validateSeed(seed);
        if (seedError) {
            this.setState({ processing: false, seedError });
            return;
        }
        const init = await dispatch(operations.restore(walletName, password, seed));
        this.setState({ processing: false });
        if (!init.ok) {
            dispatch(error({
                message: helpers.formatNotificationMessage(init.error),
            }));
            return;
        }
        dispatch(push(routes.WalletPath));
    };

    cancelRestore = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Restore Password", category: "Auth", label: "Cancel enter seed word" });
        dispatch(operations.setAuthStep(types.RESTORE_STEP_WALLET_MODE));
    };

    showStatus = () => {
        const {
            networkBlocks,
            initStatus,
            lndBlocks,
            lndSyncedToChain,
        } = this.props;
        if (!this.state.processing) {
            return null;
        }
        let percent = networkBlocks < 1 ? "" : Math.min(Math.round((lndBlocks * 100) / networkBlocks), 99);
        if (lndSyncedToChain) {
            percent = 100;
        }
        return (
            <div className="row h-sync">
                <div className="col-xs-12">
                    <div className="h-sync__percent text-center">{percent ? `${percent}%` : ""}</div>
                    <progress max={100} value={percent} className="h-sync__progress" />
                    <div className="h-sync__text text-center">
                        {initStatus}
                    </div>
                </div>
            </div>
        );
    };

    render() {
        const disabled = this.state.processing;
        return (
            <Fragment>
                <div className="row row--no-col justify-center-xs">
                    <div className="block__title">
                        Wallet recovery
                    </div>
                </div>
                <form className="form form--home" onSubmit={this.confirm}>
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <div className="form-label">
                                <label htmlFor="seed">Enter your seed words</label>
                            </div>
                        </div>
                        <div className="col-xs-12">
                            <textarea
                                className={`form-textarea ${this.state.seedError ? "form-textarea__error" : ""}`}
                                id="seed"
                                placeholder="Write here"
                                ref={(ref) => {
                                    this.seed = ref;
                                }}
                                disabled={disabled}
                                onChange={() => { this.setState({ seedError: null }) }}
                            />
                            <ErrorFieldTooltip text={this.state.seedError} />
                        </div>
                    </div>
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <button
                                className="button button__solid button--fullwide"
                                type="submit"
                                disabled={disabled}
                            >
                                Confirm
                            </button>
                            {disabled ? spinner : null}
                        </div>
                    </div>
                    <div className="block__row-xs">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__solid button__solid--transparent button--fullwide"
                                onClick={this.cancelRestore}
                                disabled={disabled}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                    {this.showStatus()}
                </form>
            </Fragment>
        );
    }
}

Seed.propTypes = {
    dispatch: PropTypes.func.isRequired,
    initStatus: PropTypes.string,
    lndBlocks: PropTypes.number.isRequired,
    lndSyncedToChain: PropTypes.bool,
    networkBlocks: PropTypes.number.isRequired,
    password: PropTypes.string.isRequired,
    walletName: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    initStatus: state.lnd.initStatus,
    lndBlocks: state.lnd.lndBlocks,
    lndSyncedToChain: state.lnd.lndSyncedToChain,
    networkBlocks: state.server.networkBlocks,
});

export default connect(mapStateToProps)(Seed);
