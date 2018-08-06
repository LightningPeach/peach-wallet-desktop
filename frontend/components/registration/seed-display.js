import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { analytics } from "additional";
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
        dispatch(operations.setAuthStep(types.REGISTRATION_STEP_INIT));
        dispatch(lndOperations.clearLndData());
        dispatch(accountActions.finishInitAccount());
    };

    reloadSeed = async () => {
        const { dispatch, onReload } = this.props;
        const response = await dispatch(lndOperations.getSeed());
        if (!response.ok) {
            dispatch(error({ message: response.error }));
            return;
        }
        onReload(response.response.seed);
    };

    render() {
        return (
            <form onSubmit={this.submitSeedView}>
                <div className="home__title">
                    Sign up and start working with peach wallet
                </div>
                <div className="row form-row">
                    <div className="col-xs-12">
                        <div className="form-label form-label__wrapper">
                            <label htmlFor="seed" className="form-label__seed">
                                Save your seed words to a file or write them down.
                            </label>
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
                <div className="row form-row form-row__footer">
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
