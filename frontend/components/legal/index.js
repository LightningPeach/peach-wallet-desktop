import React, { Component } from "react";
import PropTypes from "prop-types";
import { TabContent, TabLink, Tabs } from "react-tabs-redux";

import { analytics, subscribeOpenLinkExternal } from "additional";
import { routes } from "config";

import License from "./license";
import Terms from "./terms";

class Legal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: "license",
        };
        this.openLinks = subscribeOpenLinkExternal(".license");

        if (props.fromProfile) {
            analytics.pageview(`${routes.ProfileFullPath}/license`, "License agreement");
        }
    }

    componentDidMount() {
        this.openLinks.subscribe();
    }

    componentWillUnmount() {
        this.openLinks.unSubscribe();
    }

    handleTabClick = (tab) => {
        this.setState({ activeTab: tab });
        if (!this.props.fromProfile) {
            return;
        }
        if (this.state.activeTab !== tab) {
            let path;
            let title;
            if (tab === "license") {
                path = `${routes.ProfileFullPath}/license`;
                title = "License agreement";
            } else if (tab === "terms") {
                path = `${routes.ProfileFullPath}/terms`;
                title = "Terms and conditions";
            }
            analytics.pageview(path, title);
        }
    };

    render() {
        return (
            <div className="license">
                <Tabs name="legal">
                    <div className="row">
                        <div className="col-xs-12">
                            <div className="tabs">
                                <div className="tabs__row">
                                    <TabLink to="terms-tab-container" onClick={() => this.handleTabClick("terms")}>
                                        Terms and conditions
                                    </TabLink>
                                    <TabLink to="license-tab-container" onClick={() => this.handleTabClick("license")}>
                                        Privacy policy
                                    </TabLink>
                                </div>
                            </div>
                        </div>
                    </div>
                    <TabContent for="terms-tab-container">
                        <Terms />
                    </TabContent>
                    <TabContent for="license-tab-container">
                        <License />
                    </TabContent>
                </Tabs>
            </div>
        );
    }
}

Legal.defaultProps = {
    fromProfile: false,
};

Legal.propTypes = {
    fromProfile: PropTypes.bool,
};

export default Legal;
