let FrameInputUtil = {
    getFrameInput: function (keyboardInput, previousKeyboardInput, debugMode) {
        let debug_toggleInvulnerability = false;
        if (debugMode) {
            if (keyboardInput.isPressed(8 /* Key.I */) && !previousKeyboardInput.isPressed(8 /* Key.I */))
                debug_toggleInvulnerability = true;
        }
        return {
            up: keyboardInput.isPressed(36 /* Key.UpArrow */) && !keyboardInput.isPressed(37 /* Key.DownArrow */),
            down: keyboardInput.isPressed(37 /* Key.DownArrow */) && !keyboardInput.isPressed(36 /* Key.UpArrow */),
            left: keyboardInput.isPressed(38 /* Key.LeftArrow */) && !keyboardInput.isPressed(39 /* Key.RightArrow */),
            right: keyboardInput.isPressed(39 /* Key.RightArrow */) && !keyboardInput.isPressed(38 /* Key.LeftArrow */),
            shoot: keyboardInput.isPressed(25 /* Key.Z */),
            continueDialogue: keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */),
            debug_toggleInvulnerability: debug_toggleInvulnerability
        };
    },
    getEmptyFrameInput: function () {
        return {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,
            continueDialogue: false,
            debug_toggleInvulnerability: false
        };
    }
};
