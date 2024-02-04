// REVIEW ME
let FrameInputUtil = {
    getFrameInput: function (keyboardInput, previousKeyboardInput) {
        return {
            up: keyboardInput.isPressed(36 /* Key.UpArrow */),
            down: keyboardInput.isPressed(37 /* Key.DownArrow */),
            left: keyboardInput.isPressed(38 /* Key.LeftArrow */),
            right: keyboardInput.isPressed(39 /* Key.RightArrow */),
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
