import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import Tooltip from "rc-tooltip";
import { analytics, helpers } from "additional";
import { error } from "modules/notifications";
import { authOperations as operations, authTypes as types } from "modules/auth";
import { lndOperations } from "modules/lnd";
import { accountActions } from "modules/account";

class SeedDisplay extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            tooltips: {
                seedWords: [
                    "Seed words are random words that are used to regain access",
                    "to the wallet when computer breaks or hard drive is corrupted.",
                    "You should keep seed words safe and do not share with anyone.",
                    "When someone knows your seed words, they can have access to",
                    "your wallet and funds.",
                ],
            },
        };
    }
    submitSeedView = (e) => {
        e.preventDefault();
        const { dispatch } = this.props;
        analytics.event({ action: "Registration", category: "Auth", label: "Submit Show Seed Words" });
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_SEED_VERIFY));
    };

    cancelSeedView = () => {
        analytics.event({ action: "Registration", category: "Auth", label: "Cancel Show Seed Words" });
        const { dispatch } = this.props;
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_INIT));
        dispatch(lndOperations.clearLndData());
        dispatch(accountActions.finishInitAccount());
    };

    reloadSeed = async () => {
        const { dispatch, onReload } = this.props;
        const response = await dispatch(lndOperations.getSeed());
        if (!response.ok) {
            dispatch(error({ message: helpers.formatNotificationMessage(response.error) }));
            return;
        }
        onReload(response.response.seed);
    };

    render() {
        return (
            <form onSubmit={this.submitSeedView}>
                <div className="home__title">
                    Sign up and start working with Peach Wallet
                </div>
                <div className="row">
                    <div className="col-xs-12">
                        <div className="form-label">
                            <label htmlFor="seed">
                                Save your seed words to a file or write them down.
                            </label>
                            <Tooltip
                                placement="bottom"
                                overlay={helpers.formatMultilineText(this.state.tooltips.seedWords)}
                                trigger="hover"
                                arrowContent={
                                    <div className="rc-tooltip-arrow-inner" />
                                }
                                prefixCls="rc-tooltip__small rc-tooltip"
                                mouseLeaveDelay={0}
                            >
                                <i className="form-label__icon form-label__icon--info" />
                            </Tooltip>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        <textarea
                            className="form-textarea"
                            id="seed"
                            readOnly
                            value={this.props.seed.join(" ")}
                        />
                        <span
                            className="reload seed__reload"
                            onClick={this.reloadSeed}
                        />
                    </div>
                </div>
                <div className="row mt-30">
                    <div className="col-xs-12">
                        <button
                            type="submit"
                            className="button button__orange button__fullwide"
                        >
                            Next
                        </button>
                    </div>
                    <div className="col-xs-12 text-center">
                        <button
                            type="button"
                            className="button button__link button__under-button"
                            onClick={this.cancelSeedView}
                        >
                            Back
                        </button>
                    </div>
                </div>
            </form>
        );
    }
}

SeedDisplay.propTypes = {
    dispatch: PropTypes.func.isRequired,
    onReload: PropTypes.func.isRequired,
    seed: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default SeedDisplay;
