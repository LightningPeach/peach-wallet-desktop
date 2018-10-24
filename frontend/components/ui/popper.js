import React, { Component } from "react";
import PropTypes from "prop-types";

class Popper extends Component {
    componentDidMount() {
        document.addEventListener("keyup", this.handleKeyUp);
        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("touchend", this.handleTouchEnd);
    }

    componentWillUnmount() {
        document.removeEventListener("keyup", this.handleKeyUp);
        document.removeEventListener("mouseup", this.handleMouseUp);
        document.removeEventListener("touchend", this.handleTouchEnd);
    }

    handleKeyUp = (e) => {
        const { closeWithEsc, onClose } = this.props;
        if (closeWithEsc && e.keyCode === 27) {
            onClose();
        }
    };

    handleMouseUp = (e) => {
        const { onClose } = this.props;
        if (!this.popper.contains(e.target)) {
            onClose();
        }
    };

    handleTouchEnd = (e) => {
        const { onClose } = this.props;
        if (!this.popper.contains(e.target)) {
            onClose();
        }
    };

    render() {
        const { className, children } = this.props;
        return (
            <div
                className={className}
                ref={(ref) => { this.popper = ref }}
            >
                {children}
            </div>
        );
    }
}

Popper.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
    className: PropTypes.string,
    closeWithEsc: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
};

export default Popper;
