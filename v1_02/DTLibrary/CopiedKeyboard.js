let CopiedKeyboard = {
    getSnapshot: function (keyboard) {
        "use strict";
        let keysPressed = {};
        let array = Object.keys(KeyMapping);
        for (let i = 0; i < array.length; i++) {
            let key = KeyMapping[array[i]];
            keysPressed[key] = keyboard.isPressed(key);
        }
        return {
            isPressed: function (key) {
                return keysPressed[key];
            }
        };
    }
};
