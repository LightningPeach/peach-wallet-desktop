import React from "react";

const Terms = () => (
    <div className="license__container">
        {/* eslint-disable react/no-danger */}
        <div className="license__text" dangerouslySetInnerHTML={{ __html: window.TERMS }} />
        {/* eslint-enable react/no-danger */}
    </div>
);

export default Terms;
