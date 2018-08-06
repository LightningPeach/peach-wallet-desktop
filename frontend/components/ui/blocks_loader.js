import React from "react";
import PropTypes from "prop-types";

const blockCount = 6;

const BlocksLoader = (props) => {
    const { countBlocks } = props;
    const blocks = [];
    for (let i = 0; i < blockCount; i += 1) {
        const className = ["block__cell"];
        if (i < countBlocks) {
            className.push("block__cell--active");
        }
        if (i === countBlocks || (i === blockCount - 1 && countBlocks >= i)) {
            className.push("block__cell--last");
        }
        blocks.push(<div className={className.join(" ")} key={i} />);
    }
    return (
        <div className={`block__wrapper ${props.class || ""}`}>
            {blocks}
        </div>
    );
};

BlocksLoader.propTypes = {
    class: PropTypes.string,
    countBlocks: PropTypes.number,
};

export default BlocksLoader;
