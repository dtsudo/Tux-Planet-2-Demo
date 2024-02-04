let ChooseDifficultyFrame = {};
ChooseDifficultyFrame.getFrame = function (globalState, sessionState) {
    let volumePicker = null;
    let difficulty = 2;
    let getNextFrame = function (keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame) {
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        globalState.saveAndLoadData.saveSoundAndMusicVolume(soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */)) {
            return TitleScreenFrame.getFrame(globalState, sessionState);
        }
        if (keyboardInput.isPressed(36 /* Key.UpArrow */) && !previousKeyboardInput.isPressed(36 /* Key.UpArrow */)) {
            if (difficulty > 1)
                difficulty--;
        }
        if (keyboardInput.isPressed(37 /* Key.DownArrow */) && !previousKeyboardInput.isPressed(37 /* Key.DownArrow */)) {
            if (difficulty < 3)
                difficulty++;
        }
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            let gameDifficulty = difficulty === 1 ? 0 /* Difficulty.Easy */ : (difficulty === 2 ? 1 /* Difficulty.Normal */ : 2 /* Difficulty.Hard */);
            let gameState = GameStateUtil.getInitialGameState(1, gameDifficulty);
            return GameFrame.getFrame(globalState, sessionState, gameState);
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        displayOutput.drawText(300, 650, "Choose Difficulty", 0 /* GameFont.SimpleFont */, 48, black);
        displayOutput.drawText(350, 500, "Easy", 0 /* GameFont.SimpleFont */, 24, black);
        displayOutput.drawText(350, 400, "Normal", 0 /* GameFont.SimpleFont */, 24, black);
        displayOutput.drawText(350, 300, "Hard", 0 /* GameFont.SimpleFont */, 24, black);
        let y;
        switch (difficulty) {
            case 1:
                y = 470;
                break;
            case 2:
                y = 370;
                break;
            case 3:
                y = 270;
                break;
            default:
                throw new Error(" :( ");
        }
        displayOutput.drawRectangle(350, y, 200, 30, black, false);
        if (volumePicker !== null)
            volumePicker.render(displayOutput);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
