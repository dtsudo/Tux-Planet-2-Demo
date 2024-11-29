let GameFrame = {};
GameFrame.END_LEVEL_NUM_FRAMES_TO_WAIT = 60;
GameFrame.getAlphaForEndLevelFadeOut = function (endLevelCounter) {
    let alpha = endLevelCounter * 3;
    if (alpha > 200)
        alpha = 200;
    return alpha;
};
GameFrame.getFrame = function (globalState, sessionState, gameState) {
    let savedGameState = null;
    let autoSavedGameState = { gameStateSnapshot: GameStateUtil.getSnapshot(gameState), frameInputHistory: null };
    let skipFrameCount = 0;
    let frameInputHistory = null;
    let renderKonqiHitbox = false;
    let previousFrameInput = FrameInputUtil.getEmptyFrameInput();
    let suggestedFrameInput = FrameInputUtil.getEmptyFrameInput();
    let endLevelCounter = null;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return PauseMenuFrame.getFrame(globalState, sessionState, thisFrame, gameState.difficulty);
        if (endLevelCounter !== null)
            endLevelCounter++;
        let frame = getNextFrameHelper({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame });
        if (!keyboardInput.isPressed(43 /* Key.Shift */))
            frame = getNextFrameHelper({ keyboardInput, mouseInput, previousKeyboardInput: keyboardInput, previousMouseInput: mouseInput, displayProcessing, soundOutput, musicOutput, thisFrame });
        if (globalState.debugMode) {
            if (keyboardInput.isPressed(26 /* Key.Zero */) && !previousKeyboardInput.isPressed(26 /* Key.Zero */) && endLevelCounter === null)
                endLevelCounter = 0;
        }
        if (endLevelCounter === GameFrame.END_LEVEL_NUM_FRAMES_TO_WAIT)
            return LevelCompleteFrame.getFrame(globalState, sessionState, thisFrame, gameState.difficulty, frameInputHistory);
        if (globalState.debugMode && keyboardInput.isPressed(27 /* Key.One */)) {
            let emptyKeyboard = EmptyKeyboard.getEmptyKeyboard();
            let emptyMouse = EmptyMouse.getEmptyMouse();
            for (let i = 0; i < 20; i++)
                frame = getNextFrameHelper({ keyboardInput: emptyKeyboard, mouseInput: emptyMouse, previousKeyboardInput: emptyKeyboard, previousMouseInput: emptyMouse, displayProcessing, soundOutput, musicOutput, thisFrame });
        }
        return frame;
    };
    let getNextFrameHelper = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        let shouldExecuteFrame = true;
        renderKonqiHitbox = keyboardInput.isPressed(43 /* Key.Shift */);
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
            let frameInput = FrameInputUtil.getFrameInput(keyboardInput, previousKeyboardInput, globalState.debugMode);
            if (suggestedFrameInput.up && !frameInput.down && !previousFrameInput.up)
                frameInput.up = true;
            if (suggestedFrameInput.down && !frameInput.up && !previousFrameInput.down)
                frameInput.down = true;
            if (suggestedFrameInput.left && !frameInput.right && !previousFrameInput.left)
                frameInput.left = true;
            if (suggestedFrameInput.right && !frameInput.left && !previousFrameInput.right)
                frameInput.right = true;
            if (suggestedFrameInput.shoot && !previousFrameInput.shoot)
                frameInput.shoot = true;
            if (suggestedFrameInput.continueDialogue)
                frameInput.continueDialogue = true;
            suggestedFrameInput = FrameInputUtil.getEmptyFrameInput();
            previousFrameInput = frameInput;
            frameInputHistory = { frameInput: frameInput, index: gameState.frameCount, previousFrameInputs: frameInputHistory };
            let result = GameStateProcessing.processFrame(gameState, frameInput, soundOutput, musicOutput);
            if (result.shouldCreateAutoSavestate && gameState.playerState.isDeadFrameCount === null) {
                autoSavedGameState = {
                    gameStateSnapshot: GameStateUtil.getSnapshot(gameState),
                    frameInputHistory: frameInputHistory
                };
            }
            if (result.shouldEndLevel && gameState.playerState.isDeadFrameCount === null && endLevelCounter === null)
                endLevelCounter = 0;
            if (gameState.playerState.isDeadFrameCount !== null && gameState.playerState.isDeadFrameCount >= 240) {
                gameState = GameStateUtil.getSnapshot(autoSavedGameState.gameStateSnapshot);
                frameInputHistory = autoSavedGameState.frameInputHistory;
            }
        }
        else {
            let currentFrameInput = FrameInputUtil.getFrameInput(keyboardInput, previousKeyboardInput, globalState.debugMode);
            suggestedFrameInput = {
                up: suggestedFrameInput.up || currentFrameInput.up,
                down: suggestedFrameInput.down || currentFrameInput.down,
                left: suggestedFrameInput.left || currentFrameInput.left,
                right: suggestedFrameInput.right || currentFrameInput.right,
                shoot: suggestedFrameInput.shoot || currentFrameInput.shoot,
                continueDialogue: suggestedFrameInput.continueDialogue || currentFrameInput.continueDialogue,
                debug_toggleInvulnerability: suggestedFrameInput.debug_toggleInvulnerability || currentFrameInput.debug_toggleInvulnerability
            };
        }
        if (keyboardInput.isPressed(2 /* Key.C */) && !previousKeyboardInput.isPressed(2 /* Key.C */) && gameState.playerState.isDeadFrameCount === null)
            savedGameState = { gameStateSnapshot: GameStateUtil.getSnapshot(gameState), frameInputHistory: frameInputHistory };
        if (keyboardInput.isPressed(23 /* Key.X */) && !previousKeyboardInput.isPressed(23 /* Key.X */) && endLevelCounter === null) {
            if (savedGameState !== null) {
                gameState = GameStateUtil.getSnapshot(savedGameState.gameStateSnapshot);
                frameInputHistory = savedGameState.frameInputHistory;
            }
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        GameStateRendering.render(gameState, displayOutput, renderKonqiHitbox);
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
