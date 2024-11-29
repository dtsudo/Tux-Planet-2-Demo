let EmptyKeyboard = {
    getEmptyKeyboard: function () {
        "use strict";
        return {
            isPressed: function (key) { return false; }
        };
    }
};
