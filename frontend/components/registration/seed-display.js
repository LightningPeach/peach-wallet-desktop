import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import Tooltip from "rc-tooltip";

import { analytics, helpers, tooltips } from "additional";
import { error } from "modules/notifications";
import { authOperations as operations, authTypes as types } from "modules/auth";
import { lndOperations } from "modules/lnd";
import { accountActions } from "modules/account";

class SeedDisplay extends PureComponent {
    submitSeedView = (e) => {
        e.preventDefault();
        const { dispatch } = this.props;
        analytics.event({ action: "Registration", category: "Auth", label: "Submit Show Seed Words" });
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_SEED_VERIFY));
    };

    cancelSeedView = () => {
        analytics.event({ action: "Registration", category: "Auth", label: "Cancel Show Seed Words" });
        const { dispatch } = this.props;
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_WALLET_MODE));
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
            <Fragment>
                <div className="row row--no-col justify-center-xs">
                    <div className="block__title">
                        Create a new wallet
                    </div>
                </div>
                <form className="form form--home" onSubmit={this.submitSeedView}>
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <div className="form-label">
                                <label htmlFor="seed">
                                    Save your seed words to a file or write them down.
                                </label>
                                <Tooltip
                                    placement="bottom"
                                    overlay={tooltips.SEED_WORDS}
                                    trigger="hover"
                                    arrowContent={
                                        <div className="rc-tooltip-arrow-inner" />
                                    }
                                    prefixCls="rc-tooltip__small rc-tooltip"
                                    mouseLeaveDelay={0}
                                >
                                    <i className="tooltip tooltip--info" />
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
                                className="reload home__seed-reload"
                                onClick={this.reloadSeed}
                            />
                        </div>
                    </div>
                    <div className="block__row-lg">
                        <div className="col-xs-12">
                            <button
                                type="submit"
                                className="button button__solid button--fullwide"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                    <div className="block__row-xs">
                        <div className="col-xs-12">
                            <button
                                type="button"
                                className="button button__solid button__solid--transparent button--fullwide"
                                onClick={this.cancelSeedView}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                </form>
            </Fragment>
        );
    }
}

SeedDisplay.propTypes = {
    dispatch: PropTypes.func.isRequired,
    onReload: PropTypes.func.isRequired,
    seed: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default SeedDisplay;
