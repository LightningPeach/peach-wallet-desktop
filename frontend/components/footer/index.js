import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { appOperations } from "modules/app";
import { GITHUB_USERGUIDE_LINK } from "config/consts";

class Footer extends PureComponent {
    openLegal = () => {
        this.props.dispatch(appOperations.openLegalModal());
    };
    openUserGuide = () => {
        window.ELECTRON_SHELL.openExternal(GITHUB_USERGUIDE_LINK);
    };

    render() {
        const { peerPort } = this.props;

        return (
            <footer>
                <div className="container">
                    <div className="row">
                        <div className="col-xs-12 title main_text_16pt">
                            Contact Us
                        </div>
                        <div className="col-xs-12 text-center">
                            <a className="mailto main_text_14pt" href="mailto:contact@lightningpeach.com">
                                contact@lightningpeach.com
                            </a>
                        </div>
                    </div>
                    <div className="footer__extra">
                        <div className="row footer__extra-row">
                            <div className="col-xs-6">
                                <a
                                    className="button button__link footer__legal"
                                    onClick={this.openUserGuide}
                                >
                                    User Guide
                                </a>
                            </div>
                            <div className="col-xs-6 text-right">
                                LND port: {peerPort}
                            </div>
                        </div>
                        <div className="row footer__extra-row">
                            <div className="col-xs-6">
                                <button className="button button__link footer__legal" onClick={this.openLegal}>
                                    License agreement & Terms and conditions
                                </button>
                            </div>
                            <div className="col-xs-6 text-right">
                                v {window.VERSION}
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }
}

Footer.propTypes = {
    dispatch: PropTypes.func.isRequired,
    peerPort: PropTypes.number.isRequired,
};

const mapStateToProps = state => ({
    peerPort: state.app.peerPort,
});

export default connect(mapStateToProps)(Footer);
