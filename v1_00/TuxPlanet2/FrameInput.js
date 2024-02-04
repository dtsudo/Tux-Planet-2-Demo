let FrameInputUtil = {
    getFrameInput: function (keyboardInput, previousKeyboardInput) {
        return {
            up: keyboardInput.isPressed(36 /* Key.UpArrow */) && !keyboardInput.isPressed(37 /* Key.DownArrow */),
            down: keyboardInput.isPressed(37 /* Key.DownArrow */) && !keyboardInput.isPressed(36 /* Key.UpArrow */),
            left: keyboardInput.isPressed(38 /* Key.LeftArrow */) && !keyboardInput.isPressed(39 /* Key.RightArrow */),
            right: keyboardInput.isPressed(39 /* Key.RightArrow */) && !keyboardInput.isPressed(38 /* Key.LeftArrow */),
            shoot: keyboardInput.isPressed(25 /* Key.Z */),
            continueDialogue: keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)
        };
    },
    getEmptyFrameInput: function () {
        return {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,
            continueDialogue: false
        };
    }
};
