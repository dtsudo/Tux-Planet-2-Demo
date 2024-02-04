// REVIEW ME
let GameFrame = {};
GameFrame.getFrame = function (globalState, sessionState, gameState) {
    let savedGameState = null;
    let autoSavedGameState = null;
    let skipFrameCount = 0;
    let frameInputHistory = null;
    let renderKonqiHitbox = false;
    let previousFrameInput = FrameInputUtil.getEmptyFrameInput();
    let suggestedFrameInput = FrameInputUtil.getEmptyFrameInput();
    let endLevelCounter = null;
    let getNextFrameWrapped = function (keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */)) {
            return PauseMenuFrame.getFrame(globalState, sessionState, thisFrame, gameState.difficulty);
        }
        if (globalState.debugMode && keyboardInput.isPressed(17 /* Key.R */) && !previousKeyboardInput.isPressed(17 /* Key.R */) && frameInputHistory !== null) {
            return ReplayFrame.getFrame(globalState, sessionState, frameInputHistory, gameState.difficulty);
        }
        if (endLevelCounter !== null)
            endLevelCounter++;
        let frame = getNextFrame(keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame);
        if (endLevelCounter === 60)
            return LevelCompleteFrame.getFrame(globalState, sessionState, thisFrame, gameState.difficulty, frameInputHistory);
        if (globalState.debugMode && keyboardInput.isPressed(27 /* Key.One */)) {
            let emptyKeyboard = EmptyKeyboard.getEmptyKeyboard();
            let emptyMouse = EmptyMouse.getEmptyMouse();
            for (let i = 0; i < 4; i++) {
                frame = getNextFrame(emptyKeyboard, emptyMouse, emptyKeyboard, emptyMouse, displayProcessing, soundOutput, musicOutput, thisFrame);
            }
        }
        return frame;
    };
    let getNextFrame = function (keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame) {
        let shouldExecuteFrame = true;
        renderKonqiHitbox = keyboardInput.isPressed(43 /* Key.Shift */);
        if (keyboardInput.isPressed(43 /* Key.Shift */)) {
            skipFrameCount++;
            if (skipFrameCount === 5) {
                skipFrameCount = 0;
                shouldExecuteFrame = true;
            }
            else {
                shouldExecuteFrame = false;
            }
        }
        if (shouldExecuteFrame) {
            let frameInput = FrameInputUtil.getFrameInput(keyboardInput, previousKeyboardInput);
            if (suggestedFrameInput.up && !frameInput.down && !previousFrameInput.up)
                frameInput.up = true;
            if (suggestedFrameInput.down && !frameInput.up && !previousFrameInput.down)
                frameInput.down = true;
            if (suggestedFrameInput.left && !frameInput.right && !previousFrameInput.left)
                frameInput.left = true;
            if (suggestedFrameInput.right && !frameInput.left && !previousFrameInput.right)
                frameInput.right = true;
            if (suggestedFrameInput.shoot)
                frameInput.shoot = true;
            if (suggestedFrameInput.continueDialogue)
                frameInput.continueDialogue = true;
            suggestedFrameInput = FrameInputUtil.getEmptyFrameInput();
            previousFrameInput = frameInput;
            frameInputHistory = { frameInput: frameInput, index: gameState.frameCount, previousFrameInputs: frameInputHistory };
            let result = GameStateProcessing.processFrame(gameState, frameInput, soundOutput, musicOutput);
            let shouldCreateAutoSavestate = result.shouldCreateAutoSavestate;
            if (shouldCreateAutoSavestate && gameState.playerState.isDeadFrameCount === null) {
                autoSavedGameState = {
                    gameState: GameStateUtil.getSnapshot(gameState),
                    frameInputHistory: frameInputHistory
                };
            }
            let shouldEndLevel = result.shouldEndLevel;
            if (shouldEndLevel && endLevelCounter === null) {
                endLevelCounter = 0;
            }
            if (gameState.playerState.isDeadFrameCount !== null && gameState.playerState.isDeadFrameCount >= 120) {
                gameState = GameStateUtil.getSnapshot(autoSavedGameState.gameState);
                frameInputHistory = autoSavedGameState.frameInputHistory;
            }
        }
        else {
            let frameInput = FrameInputUtil.getFrameInput(keyboardInput, previousKeyboardInput);
            if (frameInput.up && !frameInput.down) {
                suggestedFrameInput.up = true;
                suggestedFrameInput.down = false;
            }
            if (!frameInput.up && frameInput.down) {
                suggestedFrameInput.up = false;
                suggestedFrameInput.down = true;
            }
            if (frameInput.left && !frameInput.right) {
                suggestedFrameInput.left = true;
                suggestedFrameInput.right = false;
            }
            if (!frameInput.left && frameInput.right) {
                suggestedFrameInput.left = false;
                suggestedFrameInput.right = true;
            }
            if (frameInput.shoot)
                suggestedFrameInput.shoot = true;
            if (frameInput.continueDialogue)
                suggestedFrameInput.continueDialogue = true;
        }
        if (autoSavedGameState === null && frameInputHistory !== null) {
            autoSavedGameState = { gameState: GameStateUtil.getSnapshot(gameState), frameInputHistory: frameInputHistory };
        }
        if (keyboardInput.isPressed(2 /* Key.C */) && !previousKeyboardInput.isPressed(2 /* Key.C */) && gameState.playerState.isDeadFrameCount === null && frameInputHistory !== null) {
            savedGameState = { gameState: GameStateUtil.getSnapshot(gameState), frameInputHistory: frameInputHistory };
        }
        if (keyboardInput.isPressed(23 /* Key.X */) && !previousKeyboardInput.isPressed(23 /* Key.X */)) {
            if (savedGameState !== null) {
                gameState = GameStateUtil.getSnapshot(savedGameState.gameState);
                frameInputHistory = savedGameState.frameInputHistory;
            }
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        GameStateRendering.render(gameState, displayOutput, renderKonqiHitbox);
        if (endLevelCounter !== null) {
            let alpha = endLevelCounter * 3;
            if (alpha > 200)
                alpha = 200;
            displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: alpha }, true);
        }
    };
    return {
        getNextFrame: getNextFrameWrapped,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
