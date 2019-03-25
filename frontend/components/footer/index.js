import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import { connect } from "react-redux";

import { appOperations } from "modules/app";

class Footer extends PureComponent {
    openLegal = () => {
        this.props.dispatch(appOperations.openLegalModal());
    };

    render() {
        const { peerPort } = this.props;

        return (
            <footer className="footer">
                <div className="container">
                    <div className="column align-center-xs">
                        <div className="footer__title block__title-sm">
                            Contact Us
                        </div>
                        <a className="footer__email main_text_14pt" href="mailto:hello@lightningpeach.com">
                            hello@lightningpeach.com
                        </a>
                    </div>
                    <div className="footer__extra">
                        <div className="row">
                            <div className="col-xs-12 col-md-6">
                                <button className="link" onClick={this.openLegal}>
                                    License agreement & Terms and conditions
                                </button>
                            </div>
                            <div className="col-xs-12 col-md-6 text-right">
                                    LND port: {peerPort}<br />
                                    v {window.VERSION.Wallet}
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
