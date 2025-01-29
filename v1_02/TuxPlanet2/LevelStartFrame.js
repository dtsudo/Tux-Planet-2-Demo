let LevelStartFrame = ((function () {
    let getFrame = function (globalState, sessionState, level, overworldMapFrame) {
        let selectedDifficulty = sessionState.lastSelectedDifficulty;
        let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
            if (keyboardInput.isPressed(38 /* Key.LeftArrow */) && !previousKeyboardInput.isPressed(38 /* Key.LeftArrow */)) {
                switch (selectedDifficulty) {
                    case 0 /* Difficulty.Easy */: break;
                    case 1 /* Difficulty.Normal */:
                        selectedDifficulty = 0 /* Difficulty.Easy */;
                        break;
                    case 2 /* Difficulty.Hard */:
                        selectedDifficulty = 1 /* Difficulty.Normal */;
                        break;
                }
            }
            if (keyboardInput.isPressed(39 /* Key.RightArrow */) && !previousKeyboardInput.isPressed(39 /* Key.RightArrow */)) {
                switch (selectedDifficulty) {
                    case 0 /* Difficulty.Easy */:
                        selectedDifficulty = 1 /* Difficulty.Normal */;
                        break;
                    case 1 /* Difficulty.Normal */:
                        selectedDifficulty = 2 /* Difficulty.Hard */;
                        break;
                    case 2 /* Difficulty.Hard */: break;
                }
            }
            if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
                || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
                || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
                soundOutput.playSound(0 /* GameSound.Click */, 100);
                sessionState.lastSelectedDifficulty = selectedDifficulty;
                globalState.saveAndLoadData.saveSessionState(sessionState);
                let gameState = GameStateUtil.getInitialGameState(level, selectedDifficulty, displayProcessing);
                return GameFrame.getFrame(globalState, sessionState, gameState);
            }
            if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */)
                || keyboardInput.isPressed(23 /* Key.X */) && !previousKeyboardInput.isPressed(23 /* Key.X */)
                || keyboardInput.isPressed(2 /* Key.C */) && !previousKeyboardInput.isPressed(2 /* Key.C */)) {
                soundOutput.playSound(0 /* GameSound.Click */, 100);
                sessionState.lastSelectedDifficulty = selectedDifficulty;
                globalState.saveAndLoadData.saveSessionState(sessionState);
                return overworldMapFrame;
            }
            return thisFrame;
        };
        let render = function (displayOutput) {
            overworldMapFrame.render(displayOutput);
            let levelName;
            let levelNameX;
            let levelScreenshot;
            switch (level) {
                case 0 /* Level.Level1 */:
                    levelName = "Learning the Slopes";
                    levelNameX = 341;
                    levelScreenshot = 46 /* GameImage.Level1Screenshot */;
                    break;
                case 1 /* Level.Level2 */:
                    levelName = "Icyfall Forest";
                    levelNameX = 383;
                    levelScreenshot = 47 /* GameImage.Level2Screenshot */;
                    break;
            }
            displayOutput.drawRectangle(50, 50, 900, 600, GlobalConstants.STANDARD_BACKGROUND_COLOR, true);
            displayOutput.drawText(levelNameX, 640, levelName, 0 /* GameFont.SimpleFont */, 32, black);
            displayOutput.drawImage(levelScreenshot, 50, 175);
            displayOutput.drawRectangle(50, 50, 900, 600, black, false);
            displayOutput.drawText(100, 150, "Start level:", 0 /* GameFont.SimpleFont */, 28, black);
            displayOutput.drawText(325, 150, "Easy", 0 /* GameFont.SimpleFont */, 28, black);
            displayOutput.drawText(457, 150, "Normal", 0 /* GameFont.SimpleFont */, 28, black);
            displayOutput.drawText(625, 150, "Hard", 0 /* GameFont.SimpleFont */, 28, black);
            let startLevelX;
            switch (selectedDifficulty) {
                case 0 /* Difficulty.Easy */:
                    startLevelX = 300;
                    break;
                case 1 /* Difficulty.Normal */:
                    startLevelX = 450;
                    break;
                case 2 /* Difficulty.Hard */:
                    startLevelX = 600;
                    break;
            }
            displayOutput.drawRectangle(startLevelX, 122, 120, 30, black, false);
        };
        return {
            getNextFrame,
            render,
            getClickUrl: function () { return null; },
            getCompletedAchievements: function () { return null; }
        };
    };
    return {
        getFrame
    };
})());
