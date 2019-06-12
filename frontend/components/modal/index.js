import React, { Component } from "react";
import PropTypes from "prop-types";
import Tooltip from "rc-tooltip";
import { connect } from "react-redux";
import { analytics, helpers } from "additional";
import { appOperations } from "modules/app";

class Modal extends Component {
    componentDidMount() {
        document.addEventListener("keydown", this.onKeyClick, false);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.onKeyClick, false);
    }

    onKeyClick = (e) => {
        const { disabled, onClose } = this.props;
        if (onClose && !disabled && e.keyCode === 27) {
            analytics.event({ action: "Modal", category: "Modal windows", label: "Close with ESC" });
            this.props.dispatch(appOperations.closeModal());
        }
    };

    renderHeader = () => {
        const { title, titleTooltip } = this.props;
        if (!title) {
            return null;
        }

        return (
            <div className="modal__header">
                <div className="row justify-center-xs">
                    <div className="block__title position-relative">
                        {title}
                        {titleTooltip &&
                        <Tooltip
                            placement="right"
                            overlay={titleTooltip}
                            trigger="hover"
                            arrowContent={
                                <div className="rc-tooltip-arrow-inner" />
                            }
                            prefixCls="rc-tooltip__small rc-tooltip"
                            mouseLeaveDelay={0}
                        >
                            <i className="tooltip tooltip--info tooltip--large" />
                        </Tooltip>
                        }
                    </div>
                </div>
            </div>
        );
    };

    render() {
        const {
            disabled, onClose, theme, children, showCloseButton,
        } = this.props;
        const spinner = <div className="spinner modal__spinner" />;
        const themeFull = theme
            ? theme.split(" ").map(style => `modal--${style}`).join(" ")
            : "";

        return (
            <div className="modal__wrapper">
                <div
                    className="modal__layout"
                    onClick={onClose}
                />
                <div
                    className={`modal ${theme ? themeFull : ""}`}
                    tabIndex="-1"
                    role="dialog"
                >
                    {this.renderHeader()}
                    {children}
                    {showCloseButton && !disabled &&
                        <button
                            className="modal__close"
                            onClick={onClose}
                            disabled={disabled}
                        />
                    }
                </div>
            </div>
        );
    }
}

Modal.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
    disabled: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
    onClose: PropTypes.func,
    showCloseButton: PropTypes.bool,
    theme: PropTypes.string,
    title: PropTypes.string,
    titleTooltip: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]),
};

export default connect(null)(Modal);
