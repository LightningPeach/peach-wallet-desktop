import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ErrorFieldTooltip from "components/ui/error_field_tooltip";
import { analytics, validators } from "additional";
import { authOperations as operations, authTypes as types } from "modules/auth";
import { push } from "react-router-redux";
import { error } from "modules/notifications";
import { WalletPath } from "routes";

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
        const { dispatch, password, username } = this.props;
        analytics.event({ action: "Restore Password", category: "Auth", label: "Submit seed" });
        const seed = this.seed.value.trim().split(" ");
        const seedError = validators.validateSeed(seed);
        if (seedError) {
            this.setState({ processing: false, seedError });
            return;
        }
        const init = await dispatch(operations.restore(username, password, seed));
        this.setState({ processing: false });
        if (!init.ok) {
            dispatch(error({
                message: init.error,
            }));
            return;
        }
        dispatch(push(WalletPath));
    };

    cancelRestore = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Restore Password", category: "Auth", label: "Cancel enter seed word" });
        dispatch(operations.setAuthStep(types.RESTORE_STEP_USER_PASS));
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
            <form onSubmit={this.confirm}>
                <div className="row form-row">
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
                        />
                        <ErrorFieldTooltip text={this.state.seedError} />
                    </div>
                </div>
                <div className="row form-row form-row__footer">
                    <div className="col-xs-12">
                        <button
                            className="button button__orange button__fullwide"
                            type="submit"
                            disabled={disabled}
                        >
                            Confirm
                        </button>
                        {disabled ? spinner : null}
                    </div>
                    <div className="col-xs-12 text-center">
                        <button
                            type="button"
                            className="button button__link button__under-button"
                            onClick={this.cancelRestore}
                            disabled={disabled}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
                {this.showStatus()}
            </form>
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
    username: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    initStatus: state.lnd.initStatus,
    lndBlocks: state.lnd.lndBlocks,
    lndSyncedToChain: state.lnd.lndSyncedToChain,
    networkBlocks: state.lnd.networkBlocks,
});

export default connect(mapStateToProps)(Seed);
