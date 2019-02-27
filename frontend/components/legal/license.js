import React from "react";

const License = () => (
    <div className="license__container">
        {/* eslint-disable react/no-danger */}
        <div className="license__text" dangerouslySetInnerHTML={{ __html: window.LICENSE }} />
        {/* eslint-enable react/no-danger */}
    </div>
);

export default License;
