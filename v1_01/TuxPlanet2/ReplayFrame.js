let ReplayFrame = {};
ReplayFrame.getFrame = function (globalState, sessionState, frameInputHistory, difficulty, displayProcessing) {
    let gameState = GameStateUtil.getInitialGameState(0 /* Level.Level1 */, difficulty, displayProcessing);
    let savedGameState = null;
    let skipFrameCount = 0;
    let frameInputs = {};
    let endLevelCounter = null;
    ((function () {
        let currentFrameInput = frameInputHistory;
        while (true) {
            frameInputs[currentFrameInput.index] = currentFrameInput.frameInput;
            if (currentFrameInput.previousFrameInputs === null)
                return;
            currentFrameInput = currentFrameInput.previousFrameInputs;
        }
    })());
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return ReplayPauseMenuFrame.getFrame(globalState, sessionState, thisFrame, gameState.difficulty, frameInputHistory);
        let frame = getNextFrameHelper({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame });
        if (!keyboardInput.isPressed(43 /* Key.Shift */))
            frame = getNextFrameHelper({ keyboardInput, mouseInput, previousKeyboardInput: keyboardInput, previousMouseInput: mouseInput, displayProcessing, soundOutput, musicOutput, thisFrame });
        if (keyboardInput.isPressed(25 /* Key.Z */) && !keyboardInput.isPressed(43 /* Key.Shift */)) {
            let emptyKeyboard = EmptyKeyboard.getEmptyKeyboard();
            let emptyMouse = EmptyMouse.getEmptyMouse();
            for (let i = 0; i < 8; i++) {
                frame = getNextFrameHelper({ keyboardInput: emptyKeyboard, mouseInput: emptyMouse, previousKeyboardInput: emptyKeyboard, previousMouseInput: emptyMouse, displayProcessing, soundOutput, musicOutput, thisFrame });
            }
        }
        if (endLevelCounter !== null)
            endLevelCounter++;
        if (endLevelCounter === GameFrame.END_LEVEL_NUM_FRAMES_TO_WAIT)
            return LevelCompleteFrame.getFrame(globalState, sessionState, thisFrame, gameState.difficulty, frameInputHistory);
        return frame;
    };
    let getNextFrameHelper = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        let shouldExecuteFrame = true;
        if (keyboardInput.isPressed(43 /* Key.Shift */)) {
            skipFrameCount++;
            if (skipFrameCount === 2) {
                skipFrameCount = 0;
                shouldExecuteFrame = true;
            }
            else {
                shouldExecuteFrame = false;
            }
        }
        if (shouldExecuteFrame) {
            let frameInput = frameInputs[gameState.frameCount];
            if (!frameInput)
                frameInput = {
                    up: false,
                    down: false,
                    left: false,
                    right: false,
                    shoot: false,
                    continueDialogue: false,
                    debug_toggleInvulnerability: false
                };
            let result = GameStateProcessing.processFrame(gameState, frameInput, soundOutput, musicOutput);
            if (result.shouldEndLevel && endLevelCounter === null)
                endLevelCounter = 0;
        }
        if (keyboardInput.isPressed(2 /* Key.C */) && !previousKeyboardInput.isPressed(2 /* Key.C */) && gameState.playerState.isDeadFrameCount === null)
            savedGameState = GameStateUtil.getSnapshot(gameState);
        if (keyboardInput.isPressed(23 /* Key.X */) && !previousKeyboardInput.isPressed(23 /* Key.X */) && endLevelCounter === null) {
            if (savedGameState !== null)
                gameState = GameStateUtil.getSnapshot(savedGameState);
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        GameStateRendering.render(gameState, displayOutput, false);
        if (endLevelCounter !== null) {
            let alpha = GameFrame.getAlphaForEndLevelFadeOut(endLevelCounter);
            displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: alpha }, true);
        }
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
