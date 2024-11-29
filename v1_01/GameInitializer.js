let GameInitializer = ((function () {
    "use strict";
    let canvasContext = null;
    let clearCanvas = function (canvasNode) {
        if (canvasContext === null)
            canvasContext = canvasNode.getContext("2d", { alpha: false });
        canvasContext.clearRect(0, 0, canvasNode.width, canvasNode.height);
    };
    let addResizingCanvasLogic = function (canvasNode) {
        setInterval(function () {
            let innerWidth = window.innerWidth;
            let innerHeight = window.innerHeight;
            let canvasWidth = canvasNode.width;
            let canvasHeight = canvasNode.height;
            let canvasScalingX = innerWidth / canvasWidth;
            let canvasScalingY = innerHeight / canvasHeight;
            let canvasScaling = Math.min(canvasScalingX, canvasScalingY);
            let newCanvasCssWidth = Math.floor(canvasWidth * canvasScaling);
            let newCanvasCssHeight = Math.floor(canvasHeight * canvasScaling);
            canvasNode.style.width = newCanvasCssWidth + "px";
            canvasNode.style.height = newCanvasCssHeight + "px";
            let canvasMarginTop;
            if (innerHeight > newCanvasCssHeight) {
                canvasMarginTop = Math.floor((innerHeight - newCanvasCssHeight) / 2);
            }
            else {
                canvasMarginTop = 0;
            }
            canvasNode.style.marginTop = canvasMarginTop + "px";
        }, 250);
    };
    let removeMarginOnBody;
    removeMarginOnBody = function () {
        let bodyElement = document.body;
        if (!bodyElement) {
            setTimeout(removeMarginOnBody, 50);
            return;
        }
        bodyElement.style.margin = "0px";
    };
    let gameFrame;
    let gameKeyboard;
    let gameMouse;
    let display;
    let soundOutput;
    let musicOutput;
    let previousGameKeyboard;
    let previousGameMouse;
    let initializeGame = function (canvasNode, buildType, debugMode) {
        if (buildType === 1 /* BuildType.WebEmbedded */ || buildType === 2 /* BuildType.Electron */)
            removeMarginOnBody();
        if (buildType === 2 /* BuildType.Electron */)
            addResizingCanvasLogic(canvasNode);
        gameFrame = GameEntryFrame.getFirstFrame(buildType, debugMode);
        gameKeyboard = GameKeyboard.getKeyboard(buildType === 1 /* BuildType.WebEmbedded */ || buildType === 2 /* BuildType.Electron */);
        gameMouse = GameMouse.getMouse();
        display = CanvasDisplay.getDisplay(GlobalConstants.WINDOW_HEIGHT);
        soundOutput = GameSoundOutput.getSoundOutput();
        musicOutput = GameMusicOutput.getMusicOutput();
        previousGameKeyboard = EmptyKeyboard.getEmptyKeyboard();
        previousGameMouse = EmptyMouse.getEmptyMouse();
        clearCanvas(canvasNode);
        gameFrame.render(display);
    };
    let clickUrl = null;
    document.addEventListener("click", function (e) {
        if (clickUrl !== null && clickUrl !== "")
            window.open(clickUrl, "_blank");
    }, false);
    let windowAsAny = window;
    if (!windowAsAny.completedAchievements)
        windowAsAny.completedAchievements = [];
    let addAchievement = function (achievement) {
        let array = windowAsAny.completedAchievements;
        for (let i = 0; i < array.length; i++) {
            if (array[i] === achievement)
                return;
        }
        array.push(achievement);
    };
    let computeAndRenderNextFrame = function (canvasNode) {
        let currentKeyboard = CopiedKeyboard.getSnapshot(gameKeyboard);
        let currentMouse = CopiedMouse.getSnapshot(gameMouse);
        let getNextFrameFunc = gameFrame.getNextFrame;
        gameFrame = getNextFrameFunc({
            keyboardInput: currentKeyboard,
            mouseInput: currentMouse,
            previousKeyboardInput: previousGameKeyboard,
            previousMouseInput: previousGameMouse,
            displayProcessing: display,
            soundOutput: soundOutput,
            musicOutput: musicOutput,
            thisFrame: gameFrame
        });
        soundOutput.processFrame();
        musicOutput.processFrame();
        clearCanvas(canvasNode);
        gameFrame.render(display);
        let achievements = gameFrame.getCompletedAchievements();
        if (achievements !== null) {
            for (let i = 0; i < achievements.length; i++) {
                addAchievement(achievements[i]);
            }
        }
        clickUrl = gameFrame.getClickUrl();
        previousGameKeyboard = currentKeyboard;
        previousGameMouse = currentMouse;
    };
    return {
        initializeGame,
        computeAndRenderNextFrame
    };
})());
