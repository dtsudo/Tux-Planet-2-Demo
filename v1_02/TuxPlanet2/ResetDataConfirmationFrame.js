let ResetDataConfirmationFrame = ((function () {
    let getFrame = function (globalState, sessionState, underlyingFrame) {
        let yesButton = ButtonUtil.getButton({
            x: 300,
            y: 270,
            width: 150,
            height: 40,
            backgroundColor: ButtonUtil.STANDARD_SECONDARY_BACKGROUND_COLOR,
            hoverColor: ButtonUtil.STANDARD_HOVER_COLOR,
            clickColor: ButtonUtil.STANDARD_CLICK_COLOR,
            text: "Yes",
            textXOffset: 55,
            textYOffset: 11,
            font: 0 /* GameFont.SimpleFont */,
            fontSize: 20
        });
        let noButton = ButtonUtil.getButton({
            x: 550,
            y: 270,
            width: 150,
            height: 40,
            backgroundColor: ButtonUtil.STANDARD_SECONDARY_BACKGROUND_COLOR,
            hoverColor: ButtonUtil.STANDARD_HOVER_COLOR,
            clickColor: ButtonUtil.STANDARD_CLICK_COLOR,
            text: "No",
            textXOffset: 61,
            textYOffset: 11,
            font: 0 /* GameFont.SimpleFont */,
            fontSize: 20
        });
        let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
            let clickedYesButton = yesButton.processFrame(mouseInput).wasClicked;
            let clickedNoButton = noButton.processFrame(mouseInput).wasClicked;
            if (clickedYesButton) {
                soundOutput.playSound(0 /* GameSound.Click */, 100);
                SessionStateUtil.clearSessionState(sessionState);
                globalState.saveAndLoadData.saveSessionState(sessionState);
                return TitleScreenFrame.getFrame(globalState, sessionState);
            }
            if (clickedNoButton || keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */)) {
                soundOutput.playSound(0 /* GameSound.Click */, 100);
                return TitleScreenFrame.getFrame(globalState, sessionState);
            }
            return thisFrame;
        };
        let render = function (displayOutput) {
            underlyingFrame.render(displayOutput);
            displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: 175 }, true);
            displayOutput.drawRectangle(200, 250, 600, 200, white, true);
            displayOutput.drawRectangle(200, 250, 600, 200, black, false);
            displayOutput.drawText(210, 440, "Are you sure you want to reset your \n" + "progress?", 0 /* GameFont.SimpleFont */, 28, black);
            yesButton.render(displayOutput);
            noButton.render(displayOutput);
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
