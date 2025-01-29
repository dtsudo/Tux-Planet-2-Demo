let CreditsFrame = {};
CreditsFrame.getFrame = function (globalState, sessionState) {
    "use strict";
    let tabButtons = [
        { x: 20, y: 569, width: 234, height: 40, tab: 0 /* Tab.DesignAndCoding */, tabName: "Design and coding" },
        { x: 254, y: 569, width: 103, height: 40, tab: 1 /* Tab.Images */, tabName: "Images" },
        { x: 357, y: 569, width: 82, height: 40, tab: 2 /* Tab.Font */, tabName: "Font" },
        { x: 439, y: 569, width: 96, height: 40, tab: 3 /* Tab.Sound */, tabName: "Sound" },
        { x: 535, y: 569, width: 90, height: 40, tab: 4 /* Tab.Music */, tabName: "Music" }
    ];
    let selectedTab = 0 /* Tab.DesignAndCoding */;
    let hoverTab = null;
    let clickTab = null;
    let backButton = ButtonUtil.getButton({
        x: 780,
        y: 20,
        width: 200,
        height: 80,
        backgroundColor: ButtonUtil.STANDARD_PRIMARY_BACKGROUND_COLOR,
        hoverColor: ButtonUtil.STANDARD_HOVER_COLOR,
        clickColor: ButtonUtil.STANDARD_CLICK_COLOR,
        text: "Back",
        textXOffset: 67,
        textYOffset: 28,
        font: 0 /* GameFont.SimpleFont */,
        fontSize: 27
    });
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        let mouseX = mouseInput.getX();
        let mouseY = mouseInput.getY();
        hoverTab = null;
        for (let tabButton of tabButtons) {
            if (tabButton.x <= mouseX && mouseX <= tabButton.x + tabButton.width && tabButton.y <= mouseY && mouseY <= tabButton.y + tabButton.height)
                hoverTab = tabButton.tab;
        }
        if (mouseInput.isLeftMouseButtonPressed() && !previousMouseInput.isLeftMouseButtonPressed()) {
            if (hoverTab !== null)
                clickTab = hoverTab;
        }
        if (clickTab !== null && !mouseInput.isLeftMouseButtonPressed() && previousMouseInput.isLeftMouseButtonPressed()) {
            if (hoverTab !== null && hoverTab === clickTab) {
                soundOutput.playSound(0 /* GameSound.Click */, 100);
                selectedTab = clickTab;
            }
            clickTab = null;
        }
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            return TitleScreenFrame.getFrame(globalState, sessionState);
        }
        let clickedBackButton = backButton.processFrame(mouseInput).wasClicked;
        if (clickedBackButton) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            return TitleScreenFrame.getFrame(globalState, sessionState);
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, GlobalConstants.STANDARD_BACKGROUND_COLOR, true);
        displayOutput.drawText(422, 675, "Credits", 0 /* GameFont.SimpleFont */, 43, black);
        displayOutput.drawRectangle(20, 120, 960, 450, white, true);
        displayOutput.drawRectangle(20, 120, 960, 450, black, false);
        for (let tabButton of tabButtons) {
            let backgroundColor;
            if (tabButton.tab === selectedTab)
                backgroundColor = white;
            else if (clickTab !== null && clickTab === tabButton.tab)
                backgroundColor = ButtonUtil.STANDARD_CLICK_COLOR;
            else if (hoverTab !== null && hoverTab === tabButton.tab)
                backgroundColor = ButtonUtil.STANDARD_HOVER_COLOR;
            else
                backgroundColor = ButtonUtil.STANDARD_SECONDARY_BACKGROUND_COLOR;
            displayOutput.drawRectangle(tabButton.x, tabButton.y, tabButton.width, tabButton.height, backgroundColor, true);
            displayOutput.drawRectangle(tabButton.x, tabButton.y, tabButton.width, tabButton.height, black, false);
            if (selectedTab === tabButton.tab)
                displayOutput.drawRectangle(tabButton.x + 1, tabButton.y - 1, tabButton.width - 2, 3, white, true);
            displayOutput.drawText(tabButton.x + 10, tabButton.y + tabButton.height - 10, tabButton.tabName, 0 /* GameFont.SimpleFont */, 24, black);
        }
        backButton.render(displayOutput);
        let translatedDisplayOutput = TranslatedDisplayOutput.getTranslatedDisplayOutput(displayOutput, 20, 120);
        if (selectedTab === 0 /* Tab.DesignAndCoding */)
            CreditsFrame_DesignAndCoding.render(translatedDisplayOutput, 960, 450, globalState.buildType);
        if (selectedTab === 1 /* Tab.Images */)
            CreditsFrame_Images.render(translatedDisplayOutput, 960, 450, globalState.buildType);
        if (selectedTab === 2 /* Tab.Font */)
            CreditsFrame_Font.render(translatedDisplayOutput, 960, 450, globalState.buildType);
        if (selectedTab === 3 /* Tab.Sound */)
            CreditsFrame_Sound.render(translatedDisplayOutput, 960, 450, globalState.buildType);
        if (selectedTab === 4 /* Tab.Music */)
            CreditsFrame_Music.render(translatedDisplayOutput, 960, 450, globalState.buildType);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
