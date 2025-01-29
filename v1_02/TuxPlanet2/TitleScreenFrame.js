let TitleScreenFrame = {};
TitleScreenFrame.getFrame = function (globalState, sessionState) {
    let volumePicker = null;
    let creditsButton = ButtonUtil.getButton({
        x: GlobalConstants.WINDOW_WIDTH - 105,
        y: 5,
        width: 100,
        height: 35,
        backgroundColor: ButtonUtil.STANDARD_SECONDARY_BACKGROUND_COLOR,
        hoverColor: ButtonUtil.STANDARD_HOVER_COLOR,
        clickColor: ButtonUtil.STANDARD_CLICK_COLOR,
        text: "Credits",
        textXOffset: 15,
        textYOffset: 8,
        font: 0 /* GameFont.SimpleFont */,
        fontSize: 20
    });
    let resetDataButton = ButtonUtil.getButton({
        x: 160,
        y: 10,
        width: 150,
        height: 31,
        backgroundColor: ButtonUtil.STANDARD_SECONDARY_BACKGROUND_COLOR,
        hoverColor: ButtonUtil.STANDARD_HOVER_COLOR,
        clickColor: ButtonUtil.STANDARD_CLICK_COLOR,
        text: "Reset data",
        textXOffset: 20,
        textYOffset: 7,
        font: 0 /* GameFont.SimpleFont */,
        fontSize: 20
    });
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (globalState.debugMode) {
            if (keyboardInput.isPressed(19 /* Key.T */) && !previousKeyboardInput.isPressed(19 /* Key.T */))
                return TestingFrame.getFrame(globalState, sessionState);
        }
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume(), 0 /* VolumePickerColor.Black */);
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        globalState.saveAndLoadData.saveSoundAndMusicVolume(soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        musicOutput.playMusic(3 /* GameMusic.MainTheme */, 100);
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            sessionState.hasStarted = true;
            globalState.saveAndLoadData.saveSessionState(sessionState);
            return OverworldFrame.getFrame(globalState, sessionState);
        }
        let clickedCreditsButton = creditsButton.processFrame(mouseInput).wasClicked;
        if (clickedCreditsButton) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            return CreditsFrame.getFrame(globalState, sessionState);
        }
        if (sessionState.hasStarted) {
            let clickedResetDataButton = resetDataButton.processFrame(mouseInput).wasClicked;
            if (clickedResetDataButton) {
                soundOutput.playSound(0 /* GameSound.Click */, 100);
                return ResetDataConfirmationFrame.getFrame(globalState, sessionState, thisFrame);
            }
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, GlobalConstants.STANDARD_BACKGROUND_COLOR, true);
        displayOutput.drawText(Math.floor(GlobalConstants.WINDOW_WIDTH / 2) - 440, 510, "Tux Planet 2: Konqi's Fiery Adventure", 0 /* GameFont.SimpleFont */, 48, black);
        if (sessionState.hasStarted) {
            displayOutput.drawText(Math.floor(GlobalConstants.WINDOW_WIDTH / 2) - 158, 350, "Continue (press enter)", 0 /* GameFont.SimpleFont */, 28, black);
        }
        else {
            displayOutput.drawText(Math.floor(GlobalConstants.WINDOW_WIDTH / 2) - 129, 350, "Start (press enter)", 0 /* GameFont.SimpleFont */, 28, black);
        }
        let versionInfo = VersionInfo.getCurrentVersion();
        let versionString = "v" + versionInfo.version;
        displayOutput.drawText(GlobalConstants.WINDOW_WIDTH - 42, 55, versionString, 0 /* GameFont.SimpleFont */, 16, black);
        creditsButton.render(displayOutput);
        if (volumePicker !== null)
            volumePicker.render(displayOutput);
        if (sessionState.hasStarted)
            resetDataButton.render(displayOutput);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
