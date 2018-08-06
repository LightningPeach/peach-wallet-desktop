import notificationsReducer from "./reducers";

import * as notificationsActions from "./actions";
import * as notificationsTypes from "./types";

export {
    error,
    info,
    success,
    warning,
} from "./actions";

export {
    notificationsActions,
    notificationsTypes,
};

export default notificationsReducer;
