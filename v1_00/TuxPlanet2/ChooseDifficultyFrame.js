let ChooseDifficultyFrame = {};
ChooseDifficultyFrame.getFrame = function (globalState, sessionState) {
    let volumePicker = null;
    let difficulty = 2;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume(), 0 /* VolumePickerColor.Black */);
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        globalState.saveAndLoadData.saveSoundAndMusicVolume(soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            return TitleScreenFrame.getFrame(globalState, sessionState);
        }
        if (keyboardInput.isPressed(36 /* Key.UpArrow */) && !previousKeyboardInput.isPressed(36 /* Key.UpArrow */)) {
            difficulty--;
            if (difficulty === 0)
                difficulty = 3;
        }
        if (keyboardInput.isPressed(37 /* Key.DownArrow */) && !previousKeyboardInput.isPressed(37 /* Key.DownArrow */)) {
            difficulty++;
            if (difficulty === 4)
                difficulty = 1;
        }
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            let gameDifficulty;
            switch (difficulty) {
                case 1:
                    gameDifficulty = 0 /* Difficulty.Easy */;
                    break;
                case 2:
                    gameDifficulty = 1 /* Difficulty.Normal */;
                    break;
                case 3:
                    gameDifficulty = 2 /* Difficulty.Hard */;
                    break;
                default: throw new Error("Unrecognized difficulty");
            }
            let gameState = GameStateUtil.getInitialGameState(1, gameDifficulty);
            return GameFrame.getFrame(globalState, sessionState, gameState);
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, GlobalConstants.STANDARD_BACKGROUND_COLOR, true);
        displayOutput.drawText(288, 650, "Choose Difficulty", 0 /* GameFont.SimpleFont */, 48, black);
        displayOutput.drawText(400, 500, "Easy", 0 /* GameFont.SimpleFont */, 24, black);
        displayOutput.drawText(400, 400, "Normal", 0 /* GameFont.SimpleFont */, 24, black);
        displayOutput.drawText(400, 300, "Hard", 0 /* GameFont.SimpleFont */, 24, black);
        let y;
        switch (difficulty) {
            case 1:
                y = 473;
                break;
            case 2:
                y = 373;
                break;
            case 3:
                y = 273;
                break;
            default:
                throw new Error("Unrecognized difficulty");
        }
        displayOutput.drawRectangle(397, y, 100, 30, black, false);
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
