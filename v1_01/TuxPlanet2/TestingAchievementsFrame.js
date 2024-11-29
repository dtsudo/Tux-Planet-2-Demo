let TestingAchievementsFrame = {};
TestingAchievementsFrame.getFrame = function (globalState, sessionState) {
    let completedAchievements = [];
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        completedAchievements = [];
        if (keyboardInput.isPressed(27 /* Key.One */))
            completedAchievements.push("test_achievement_1");
        if (keyboardInput.isPressed(28 /* Key.Two */))
            completedAchievements.push("test_achievement_2");
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        displayOutput.drawText(50, GlobalConstants.WINDOW_HEIGHT - 50, "Press 1/2 to earn an achievement!", 0 /* GameFont.SimpleFont */, 24, black);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return completedAchievements; }
    };
};
