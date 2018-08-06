import React from "react";
import PropTypes from "prop-types";

const OverlayWithHole = (props) => {
    const title = props.title ? <div className="overlay__title">{props.title}</div> : null;
    return (
        <div className="overlay__wrapper" onClick={() => props.closeOnWrapper ? props.onClose() : null}>
            <div className={`overlay ${props.class || ""}`}>
                <div className="overlay__shadow" />
                <div className="overlay__hole" />
                <div className="overlay__tooltip">
                    {title}
                    <div className="overlay__content">
                        {props.content}
                    </div>
                    <div className="overlay__close" onClick={props.onClose} />
                </div>
            </div>
        </div>
    );
};

OverlayWithHole.propTypes = {
    class: PropTypes.string,
    closeOnWrapper: PropTypes.bool,
    content: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
};

export default OverlayWithHole;
