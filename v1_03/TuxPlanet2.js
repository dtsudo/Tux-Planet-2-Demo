let Game = ((function () {
    "use strict";
    let fpsNode = null;
    let canvasNode = null;
    let createHtmlElements = function (showFps) {
        document.body.style.overflow = "hidden";
        let fpsWrapperDiv = document.createElement("div");
        let fpsLabel = document.createElement("span");
        if (showFps) {
            let textNode = document.createTextNode("FPS: ");
            fpsLabel.appendChild(textNode);
        }
        fpsWrapperDiv.appendChild(fpsLabel);
        fpsNode = document.createElement("span");
        fpsWrapperDiv.appendChild(fpsNode);
        document.body.appendChild(fpsWrapperDiv);
        let canvasWrapperDiv = document.createElement("div");
        canvasWrapperDiv.style.textAlign = "center";
        canvasNode = document.createElement("canvas");
        canvasNode.id = "gameCanvas";
        canvasNode.width = GlobalConstants.WINDOW_WIDTH;
        canvasNode.height = GlobalConstants.WINDOW_HEIGHT;
        canvasWrapperDiv.appendChild(canvasNode);
        document.body.appendChild(canvasWrapperDiv);
    };
    let fpsFrameCounter = 0;
    let startTimeMillis = Date.now();
    let fpsPerformanceTracking = [];
    let displayFps = function () {
        let currentTimeMillis = Date.now();
        if (currentTimeMillis - startTimeMillis > 2000) {
            let actualFps = fpsFrameCounter / 2;
            if (fpsPerformanceTracking.length > 0) {
                let maxTimeToRenderFrame = fpsPerformanceTracking[0];
                for (let timeElapsed of fpsPerformanceTracking) {
                    if (timeElapsed > maxTimeToRenderFrame)
                        maxTimeToRenderFrame = timeElapsed;
                }
                fpsNode.textContent = actualFps.toString() + " (time to process/render slowest frame: " + maxTimeToRenderFrame.toString() + " ms)";
            }
            else {
                fpsNode.textContent = actualFps.toString();
            }
            fpsFrameCounter = 0;
            startTimeMillis = currentTimeMillis;
        }
    };
    let beginGame = function () {
        let isEmbeddedVersion = false;
        let isElectronVersion = !isEmbeddedVersion
            && (window.navigator.userAgent.indexOf("Electron") >= 0 || window.navigator.userAgent.indexOf("electron") >= 0);
        let documentAsAny = document;
        let urlParams = (new URL(documentAsAny.location)).searchParams;
        let showFps = urlParams.get("showfps") !== null
            ? (urlParams.get("showfps") === "true")
            : false;
        let debugMode = urlParams.get("debugmode") !== null
            ? (urlParams.get("debugmode") === "true")
            : false;
        let buildType;
        if (isEmbeddedVersion)
            buildType = 1 /* BuildType.WebEmbedded */;
        else if (isElectronVersion)
            buildType = 2 /* BuildType.Electron */;
        else
            buildType = 0 /* BuildType.WebStandalone */;
        createHtmlElements(showFps);
        GameInitializer.initializeGame(canvasNode, buildType, debugMode);
        let computeAndRenderNextFrame;
        let fps = 60;
        let nextTimeToAct = Date.now() + (1000.0 / fps);
        computeAndRenderNextFrame = function () {
            let now = Date.now();
            if (nextTimeToAct > now) {
                requestAnimationFrame(computeAndRenderNextFrame);
                return;
            }
            if (nextTimeToAct < now - 5.0 * (1000.0 / fps))
                nextTimeToAct = now - 5.0 * (1000.0 / fps);
            nextTimeToAct = nextTimeToAct + (1000.0 / fps);
            let startTimer = Date.now();
            GameInitializer.computeAndRenderNextFrame(canvasNode);
            let endTimer = Date.now();
            let timeElapsedThisFrame = endTimer - startTimer;
            fpsPerformanceTracking.push(timeElapsedThisFrame);
            if (fpsPerformanceTracking.length > 300)
                fpsPerformanceTracking.shift();
            fpsFrameCounter++;
            if (showFps)
                displayFps();
            requestAnimationFrame(computeAndRenderNextFrame);
        };
        requestAnimationFrame(computeAndRenderNextFrame);
    };
    return {
        beginGame
    };
})());
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
let ByteListUtil = ((function () {
    let getByteListBuilder = function () {
        let byteList = [];
        let toByteList = function () {
            return [...byteList];
        };
        let addBool = function (b) {
            byteList.push(b ? 1 : 0);
        };
        let addNullableBool = function (b) {
            if (b === null)
                byteList.push(2);
            else
                byteList.push(b ? 1 : 0);
        };
        let addByte = function (b) {
            byteList.push(b);
        };
        let addInt = function (i) {
            byteList.push(i & 0xff);
            byteList.push((i >> 8) & 0xff);
            byteList.push((i >> 16) & 0xff);
            byteList.push((i >> 24) & 0xff);
        };
        let addNullableInt = function (i) {
            if (i === null) {
                byteList.push(0);
            }
            else {
                byteList.push(1);
                addInt(i);
            }
        };
        let addBoolList = function (list) {
            addInt(list.length);
            for (let b of list) {
                addBool(b);
            }
        };
        let addNullableBoolList = function (list) {
            addInt(list.length);
            for (let b of list) {
                addNullableBool(b);
            }
        };
        let addByteList = function (list) {
            addInt(list.length);
            for (let b of list) {
                addByte(b);
            }
        };
        let addIntList = function (list) {
            addInt(list.length);
            for (let i of list) {
                addInt(i);
            }
        };
        let addNullableIntList = function (list) {
            addInt(list.length);
            for (let i of list) {
                addNullableInt(i);
            }
        };
        return {
            toByteList,
            addBool,
            addNullableBool,
            addByte,
            addInt,
            addNullableInt,
            addBoolList,
            addNullableBoolList,
            addByteList,
            addIntList,
            addNullableIntList
        };
    };
    let getByteListIterator = function (bytes) {
        let byteList = [...bytes];
        let index = 0;
        let hasNextByte = function () {
            return index < byteList.length;
        };
        let popBool = function () {
            let value = byteList[index++];
            if (value === 0)
                return false;
            if (value === 1)
                return true;
            throw new Error("Unrecognized value");
        };
        let popNullableBool = function () {
            let value = byteList[index++];
            if (value === 0)
                return false;
            if (value === 1)
                return true;
            if (value === 2)
                return null;
            throw new Error("Unrecognized value");
        };
        let popByte = function () {
            let b = byteList[index++];
            return b;
        };
        let popInt = function () {
            let x1 = byteList[index++];
            let x2 = byteList[index++];
            let x3 = byteList[index++];
            let x4 = byteList[index++];
            return x1 | (x2 << 8) | (x3 << 16) | (x4 << 24);
        };
        let popNullableInt = function () {
            let value = byteList[index++];
            if (value === 0)
                return null;
            if (value !== 1)
                throw new Error("Unrecognized value");
            return popInt();
        };
        let popBoolList = function () {
            let length = popInt();
            let array = [];
            for (let i = 0; i < length; i++) {
                array.push(popBool());
            }
            return array;
        };
        let popNullableBoolList = function () {
            let length = popInt();
            let array = [];
            for (let i = 0; i < length; i++) {
                array.push(popNullableBool());
            }
            return array;
        };
        let popByteList = function () {
            let length = popInt();
            let array = [];
            for (let i = 0; i < length; i++) {
                array.push(popByte());
            }
            return array;
        };
        let popIntList = function () {
            let length = popInt();
            let array = [];
            for (let i = 0; i < length; i++) {
                array.push(popInt());
            }
            return array;
        };
        let popNullableIntList = function () {
            let length = popInt();
            let array = [];
            for (let i = 0; i < length; i++) {
                array.push(popNullableInt());
            }
            return array;
        };
        return {
            hasNextByte,
            popBool,
            popNullableBool,
            popByte,
            popInt,
            popNullableInt,
            popBoolList,
            popNullableBoolList,
            popByteList,
            popIntList,
            popNullableIntList
        };
    };
    return {
        getByteListBuilder,
        getByteListIterator
    };
})());
let CanvasDisplay = {
    getDisplay: function (windowHeight) {
        "use strict";
        let canvasDisplayRectangle = CanvasDisplay_Rectangle.getCanvasDisplayRectangle(windowHeight);
        let canvasDisplayImages = CanvasDisplay_Images.getCanvasDisplayImages(windowHeight);
        let canvasDisplayFont = CanvasDisplay_Font.getCanvasDisplayFont(windowHeight);
        let load = function () {
            let hasFinishedLoadingImages = canvasDisplayImages.loadImages();
            let hasFinishedLoadingFonts = canvasDisplayFont.loadFonts();
            return hasFinishedLoadingImages && hasFinishedLoadingFonts;
        };
        return {
            load,
            drawRectangle: canvasDisplayRectangle.drawRectangle,
            getWidth: canvasDisplayImages.getWidth,
            getHeight: canvasDisplayImages.getHeight,
            drawImage: canvasDisplayImages.drawImage,
            drawImageRotatedClockwise: canvasDisplayImages.drawImageRotatedClockwise,
            drawText: canvasDisplayFont.drawText,
            tryDrawText: canvasDisplayFont.tryDrawText
        };
    }
};
let CanvasDisplay_Font = {
    getCanvasDisplayFont: function (windowHeight) {
        let fontDictionary = {};
        let context = null;
        let fontFamilyCount = 0;
        let numberOfFontObjectsLoaded = 0;
        let finishedLoading = false;
        let loadFonts = function () {
            let fontNamesArray = GameFontUtil.getFontNames();
            let numberOfFontObjects = fontNamesArray.length;
            for (let fontName of fontNamesArray) {
                if (fontDictionary[fontName])
                    continue;
                let fileName = GameFontUtil.getFontFilename(fontName);
                let fontFamilyName = "DTFontFamily" + fontFamilyCount;
                fontFamilyCount++;
                let font = new FontFace(fontFamilyName, "url(Data/Font/" + fileName + ")");
                fontDictionary[fontName] = fontFamilyName;
                font.load().then(function () {
                    document.fonts.add(font);
                    numberOfFontObjectsLoaded++;
                });
            }
            finishedLoading = numberOfFontObjects === numberOfFontObjectsLoaded;
            return finishedLoading;
        };
        let drawText = function (x, y, str, fontName, fontSize, color) {
            if (context === null) {
                let canvas = document.getElementById("gameCanvas");
                if (canvas === null)
                    return;
                context = canvas.getContext("2d", { alpha: false });
            }
            x = Math.floor(x);
            y = Math.floor(windowHeight - y - 1);
            let lineHeight = fontSize;
            let red = color.r;
            let green = color.g;
            let blue = color.b;
            let alpha = color.alpha;
            context.textBaseline = "top";
            context.fillStyle = "rgba(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ", " + (alpha / 255).toString() + ")";
            context.strokeStyle = "rgba(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ", " + (alpha / 255).toString() + ")";
            context.font = fontSize + 'px "' + fontDictionary[fontName] + '"';
            let strArray = str.split("\n");
            let lineY = y;
            for (let i = 0; i < strArray.length; i++) {
                context.fillText(strArray[i], x, Math.round(lineY));
                lineY += lineHeight;
            }
        };
        let tryDrawText = function (x, y, str, fontName, fontSize, color) {
            if (!finishedLoading)
                return;
            drawText(x, y, str, fontName, fontSize, color);
        };
        return {
            loadFonts,
            drawText,
            tryDrawText
        };
    }
};
let CanvasDisplay_Images = {
    getCanvasDisplayImages: function (windowHeight) {
        "use strict";
        let imgDict = {};
        let widthDict = {};
        let heightDict = {};
        let context = null;
        let radianConversion = 1.0 / 128.0 * (2.0 * Math.PI / 360.0);
        let numberOfImagesLoaded = 0;
        let loadImages = function () {
            let imageNamesArray = GameImageUtil.getImageNames();
            let count = 0;
            for (let imageName of imageNamesArray) {
                if (imgDict[imageName])
                    continue;
                let fileName = GameImageUtil.getFilename(imageName);
                let imgPath = "Data/Images/" + fileName;
                let img = new Image();
                img.addEventListener("load", function () {
                    numberOfImagesLoaded++;
                    widthDict[imageName] = img.naturalWidth;
                    heightDict[imageName] = img.naturalHeight;
                });
                img.src = imgPath;
                imgDict[imageName] = img;
                count++;
                if (count === 15) // arbitrary
                    return false;
            }
            return numberOfImagesLoaded === imageNamesArray.length;
        };
        let drawImageRotatedClockwise = function (image, imageX, imageY, imageWidth, imageHeight, x, y, degreesScaled, scalingFactorScaled) {
            if (context === null) {
                let canvas = document.getElementById("gameCanvas");
                if (canvas !== null) {
                    context = canvas.getContext("2d", { alpha: false });
                    context.imageSmoothingEnabled = false;
                }
                else
                    return;
            }
            let scaledHeight = imageHeight * scalingFactorScaled / 128;
            y = Math.floor(windowHeight - y - scaledHeight);
            let img = imgDict[image];
            let scalingFactor = scalingFactorScaled / 128.0;
            context.translate(x, y);
            context.scale(scalingFactor, scalingFactor);
            if (degreesScaled !== 0) {
                context.translate(imageWidth / 2, imageHeight / 2);
                context.rotate(degreesScaled * radianConversion);
                context.translate(-imageWidth / 2, -imageHeight / 2);
            }
            context.drawImage(img, imageX, imageY, imageWidth, imageHeight, 0, 0, imageWidth, imageHeight);
            context.setTransform(1, 0, 0, 1, 0, 0);
        };
        let getWidth = function (image) {
            return widthDict[image];
        };
        let getHeight = function (image) {
            return heightDict[image];
        };
        let drawImage = function (image, x, y) {
            drawImageRotatedClockwise(image, 0, 0, widthDict[image], heightDict[image], x, y, 0, 128);
        };
        return {
            loadImages,
            drawImage,
            drawImageRotatedClockwise,
            getWidth,
            getHeight
        };
    }
};
let CanvasDisplay_Rectangle = {
    getCanvasDisplayRectangle: function (windowHeight) {
        "use strict";
        let context = null;
        let drawRectangle = function (x, y, width, height, color, fill) {
            y = windowHeight - y - height;
            let red = color.r;
            let green = color.g;
            let blue = color.b;
            let alpha = color.alpha;
            if (context === null) {
                let canvas = document.getElementById("gameCanvas");
                if (canvas !== null)
                    context = canvas.getContext("2d", { alpha: false });
                else
                    return;
            }
            context.fillStyle = "rgba(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ", " + (alpha / 255).toString() + ")";
            context.strokeStyle = "rgba(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ", " + (alpha / 255).toString() + ")";
            if (fill)
                context.fillRect(x, y, width, height);
            else
                context.strokeRect(x, y, width, height);
        };
        return {
            drawRectangle
        };
    }
};
let CopiedKeyboard = {
    getSnapshot: function (keyboard) {
        "use strict";
        let keysPressed = {};
        let array = Object.keys(KeyMapping);
        for (let i = 0; i < array.length; i++) {
            let key = KeyMapping[array[i]];
            keysPressed[key] = keyboard.isPressed(key);
        }
        return {
            isPressed: function (key) {
                return keysPressed[key];
            }
        };
    }
};
let CopiedMouse = {
    getSnapshot: function (mouse) {
        "use strict";
        let isLeftMouseButtonPressed = mouse.isLeftMouseButtonPressed();
        let isRightMouseButtonPressed = mouse.isRightMouseButtonPressed();
        let x = mouse.getX();
        let y = mouse.getY();
        return {
            isLeftMouseButtonPressed: function () { return isLeftMouseButtonPressed; },
            isRightMouseButtonPressed: function () { return isRightMouseButtonPressed; },
            getX: function () { return x; },
            getY: function () { return y; }
        };
    }
};
let white = { r: 255, g: 255, b: 255, alpha: 255 };
let black = { r: 0, g: 0, b: 0, alpha: 255 };
let DTDeterministicRandomUtil = {
    getRandom: function (seed) {
        seed = (seed !== null) ? seed : 0;
        let normalizeSeed = function () {
            if (seed < 0)
                seed = -seed;
            if (seed < 0)
                seed = 0;
            if (seed >= 2 * 1000 * 1000 * 1000)
                seed = seed % (2 * 1000 * 1000 * 1000);
        };
        normalizeSeed();
        let getSeed = function () {
            return seed;
        };
        let addSeed = function (i) {
            seed = seed + i;
            normalizeSeed();
        };
        let nextInt = function (i) {
            if (i === 1)
                return 0;
            let a = (((48271 * seed) | 0) + 11) | 0;
            let b = (((48271 * a) | 0) + 11) | 0;
            seed = b;
            let c = ((a >> 16) << 16) | ((b >> 16) & 0xffff);
            if (c < 0)
                c = -c;
            if (c < 0)
                c = 0;
            return c % i;
        };
        let nextBool = function () {
            return nextInt(2) === 1;
        };
        return {
            getSeed,
            addSeed,
            nextInt,
            nextBool
        };
    }
};
let DTMath = ((function () {
    "use strict";
    let normalizeDegreesScaled = function (degreesScaled) {
        if (degreesScaled >= 0 && degreesScaled < 360 * 128)
            return degreesScaled;
        if (degreesScaled < 0)
            degreesScaled = degreesScaled + 360 * 128 * 2;
        let multiple = Math.floor(degreesScaled / (360 * 128));
        degreesScaled = degreesScaled - multiple * (360 * 128);
        while (degreesScaled < 0)
            degreesScaled = degreesScaled + 360 * 128;
        while (degreesScaled >= 360 * 128)
            degreesScaled = degreesScaled - 360 * 128;
        return degreesScaled;
    };
    // Given X as input, returns 1024 * sin(X / 128 degrees)
    let sineScaled = function (degreesScaled) {
        if (degreesScaled < 0)
            degreesScaled = degreesScaled + 360 * 128 * 2;
        if (degreesScaled < 0)
            return -sineScaled(-degreesScaled);
        let degreesTimes32 = degreesScaled >> 2;
        let newDegreesTimes32;
        if (degreesTimes32 < 360 * 32)
            newDegreesTimes32 = degreesTimes32;
        else {
            let division = Math.floor(degreesTimes32 / (360 * 32));
            newDegreesTimes32 = degreesTimes32 - 360 * 32 * division;
        }
        if (newDegreesTimes32 < 180 * 32)
            return DTMathHelper.sineArray[newDegreesTimes32];
        else {
            let translatedDegrees = newDegreesTimes32 - 180 * 32;
            return -DTMathHelper.sineArray[translatedDegrees];
        }
    };
    // Given X as input, returns 1024 * cos(X / 128 degrees)
    let cosineScaled = function (degreesScaled) {
        if (degreesScaled < 0)
            degreesScaled = degreesScaled + 360 * 128 * 2;
        if (degreesScaled < 0)
            degreesScaled = -degreesScaled;
        if (degreesScaled >= 360 * 128) {
            let division = Math.floor(degreesScaled / (360 * 128));
            degreesScaled = degreesScaled - 360 * 128 * division;
        }
        let newDegrees = degreesScaled + 90 * 128;
        if (newDegrees >= 360 * 128)
            newDegrees -= 360 * 128;
        return sineScaled(newDegrees);
    };
    // Returns arctan(x, y) * 128, using degrees (not radians)
    let arcTangentScaled = function (x, y) {
        if (x === 0) {
            if (y > 0)
                return 90 * 128;
            else
                return -90 * 128;
        }
        if (y === 0) {
            if (x > 0)
                return 0;
            else
                return 180 * 128;
        }
        if (x > 0 && y > 0) {
            let result;
            if (x >= 15 * 1000 * 1000 || y >= 15 * 1000 * 1000) {
                result = Math.floor((y * 128) / x);
                if (result >= 1000 * 1000 * 1000)
                    result = 1000 * 1000 * 1000;
            }
            else
                result = Math.floor((y << 7) / x);
            if (result >= DTMathHelper.arctanArray.length)
                result = DTMathHelper.arctanArray.length - 1;
            let angle = DTMathHelper.arctanArray[result];
            return angle;
        }
        if (x < 0 && y > 0) {
            let negativeX;
            if (x <= -2147483648)
                negativeX = 2147483647;
            else
                negativeX = -x;
            return 90 * 128 + arcTangentScaled(y, negativeX);
        }
        if (y < 0) {
            let negativeY;
            if (y <= -2147483648)
                negativeY = 2147483647;
            else
                negativeY = -y;
            return -arcTangentScaled(x, negativeY);
        }
        throw new Error("Unreachable");
    };
    let arcTangentScaledSafe = function (x, y) {
        if (x === 0 && y === 0)
            return 0;
        return arcTangentScaled(x, y);
    };
    return {
        normalizeDegreesScaled,
        sineScaled,
        cosineScaled,
        arcTangentScaled,
        arcTangentScaledSafe
    };
})());
let DTMathHelper = {};
DTMathHelper.sineArray = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5,
    6, 6, 7, 7, 8, 8, 9, 9, 10, 11,
    11, 12, 12, 13, 13, 14, 15, 15, 16, 16,
    17, 17, 18, 18, 19, 20, 20, 21, 21, 22,
    22, 23, 23, 24, 25, 25, 26, 26, 27, 27,
    28, 28, 29, 30, 30, 31, 31, 32, 32, 33,
    34, 34, 35, 35, 36, 36, 37, 37, 38, 39,
    39, 40, 40, 41, 41, 42, 42, 43, 44, 44,
    45, 45, 46, 46, 47, 47, 48, 49, 49, 50,
    50, 51, 51, 52, 52, 53, 54, 54, 55, 55,
    56, 56, 57, 57, 58, 59, 59, 60, 60, 61,
    61, 62, 63, 63, 64, 64, 65, 65, 66, 66,
    67, 68, 68, 69, 69, 70, 70, 71, 71, 72,
    73, 73, 74, 74, 75, 75, 76, 76, 77, 78,
    78, 79, 79, 80, 80, 81, 81, 82, 83, 83,
    84, 84, 85, 85, 86, 86, 87, 88, 88, 89,
    89, 90, 90, 91, 91, 92, 93, 93, 94, 94,
    95, 95, 96, 96, 97, 98, 98, 99, 99, 100,
    100, 101, 101, 102, 103, 103, 104, 104, 105, 105,
    106, 106, 107, 108, 108, 109, 109, 110, 110, 111,
    111, 112, 113, 113, 114, 114, 115, 115, 116, 116,
    117, 118, 118, 119, 119, 120, 120, 121, 121, 122,
    123, 123, 124, 124, 125, 125, 126, 126, 127, 128,
    128, 129, 129, 130, 130, 131, 131, 132, 133, 133,
    134, 134, 135, 135, 136, 136, 137, 138, 138, 139,
    139, 140, 140, 141, 141, 142, 143, 143, 144, 144,
    145, 145, 146, 146, 147, 147, 148, 149, 149, 150,
    150, 151, 151, 152, 152, 153, 154, 154, 155, 155,
    156, 156, 157, 157, 158, 159, 159, 160, 160, 161,
    161, 162, 162, 163, 163, 164, 165, 165, 166, 166,
    167, 167, 168, 168, 169, 170, 170, 171, 171, 172,
    172, 173, 173, 174, 175, 175, 176, 176, 177, 177,
    178, 178, 179, 179, 180, 181, 181, 182, 182, 183,
    183, 184, 184, 185, 186, 186, 187, 187, 188, 188,
    189, 189, 190, 190, 191, 192, 192, 193, 193, 194,
    194, 195, 195, 196, 196, 197, 198, 198, 199, 199,
    200, 200, 201, 201, 202, 203, 203, 204, 204, 205,
    205, 206, 206, 207, 207, 208, 209, 209, 210, 210,
    211, 211, 212, 212, 213, 213, 214, 215, 215, 216,
    216, 217, 217, 218, 218, 219, 219, 220, 221, 221,
    222, 222, 223, 223, 224, 224, 225, 225, 226, 227,
    227, 228, 228, 229, 229, 230, 230, 231, 231, 232,
    233, 233, 234, 234, 235, 235, 236, 236, 237, 237,
    238, 239, 239, 240, 240, 241, 241, 242, 242, 243,
    243, 244, 244, 245, 246, 246, 247, 247, 248, 248,
    249, 249, 250, 250, 251, 252, 252, 253, 253, 254,
    254, 255, 255, 256, 256, 257, 257, 258, 259, 259,
    260, 260, 261, 261, 262, 262, 263, 263, 264, 264,
    265, 266, 266, 267, 267, 268, 268, 269, 269, 270,
    270, 271, 271, 272, 273, 273, 274, 274, 275, 275,
    276, 276, 277, 277, 278, 278, 279, 280, 280, 281,
    281, 282, 282, 283, 283, 284, 284, 285, 285, 286,
    287, 287, 288, 288, 289, 289, 290, 290, 291, 291,
    292, 292, 293, 294, 294, 295, 295, 296, 296, 297,
    297, 298, 298, 299, 299, 300, 300, 301, 302, 302,
    303, 303, 304, 304, 305, 305, 306, 306, 307, 307,
    308, 308, 309, 310, 310, 311, 311, 312, 312, 313,
    313, 314, 314, 315, 315, 316, 316, 317, 317, 318,
    319, 319, 320, 320, 321, 321, 322, 322, 323, 323,
    324, 324, 325, 325, 326, 327, 327, 328, 328, 329,
    329, 330, 330, 331, 331, 332, 332, 333, 333, 334,
    334, 335, 335, 336, 337, 337, 338, 338, 339, 339,
    340, 340, 341, 341, 342, 342, 343, 343, 344, 344,
    345, 346, 346, 347, 347, 348, 348, 349, 349, 350,
    350, 351, 351, 352, 352, 353, 353, 354, 354, 355,
    355, 356, 357, 357, 358, 358, 359, 359, 360, 360,
    361, 361, 362, 362, 363, 363, 364, 364, 365, 365,
    366, 366, 367, 367, 368, 369, 369, 370, 370, 371,
    371, 372, 372, 373, 373, 374, 374, 375, 375, 376,
    376, 377, 377, 378, 378, 379, 379, 380, 380, 381,
    382, 382, 383, 383, 384, 384, 385, 385, 386, 386,
    387, 387, 388, 388, 389, 389, 390, 390, 391, 391,
    392, 392, 393, 393, 394, 394, 395, 395, 396, 397,
    397, 398, 398, 399, 399, 400, 400, 401, 401, 402,
    402, 403, 403, 404, 404, 405, 405, 406, 406, 407,
    407, 408, 408, 409, 409, 410, 410, 411, 411, 412,
    412, 413, 413, 414, 414, 415, 415, 416, 416, 417,
    418, 418, 419, 419, 420, 420, 421, 421, 422, 422,
    423, 423, 424, 424, 425, 425, 426, 426, 427, 427,
    428, 428, 429, 429, 430, 430, 431, 431, 432, 432,
    433, 433, 434, 434, 435, 435, 436, 436, 437, 437,
    438, 438, 439, 439, 440, 440, 441, 441, 442, 442,
    443, 443, 444, 444, 445, 445, 446, 446, 447, 447,
    448, 448, 449, 449, 450, 450, 451, 451, 452, 452,
    453, 453, 454, 454, 455, 455, 456, 456, 457, 457,
    458, 458, 459, 459, 460, 460, 461, 461, 462, 462,
    463, 463, 464, 464, 465, 465, 466, 466, 467, 467,
    468, 468, 469, 469, 470, 470, 471, 471, 472, 472,
    473, 473, 474, 474, 475, 475, 476, 476, 477, 477,
    478, 478, 479, 479, 480, 480, 481, 481, 482, 482,
    483, 483, 484, 484, 485, 485, 486, 486, 487, 487,
    488, 488, 489, 489, 490, 490, 491, 491, 492, 492,
    493, 493, 494, 494, 494, 495, 495, 496, 496, 497,
    497, 498, 498, 499, 499, 500, 500, 501, 501, 502,
    502, 503, 503, 504, 504, 505, 505, 506, 506, 507,
    507, 508, 508, 509, 509, 510, 510, 511, 511, 512,
    512, 512, 513, 513, 514, 514, 515, 515, 516, 516,
    517, 517, 518, 518, 519, 519, 520, 520, 521, 521,
    522, 522, 523, 523, 524, 524, 525, 525, 525, 526,
    526, 527, 527, 528, 528, 529, 529, 530, 530, 531,
    531, 532, 532, 533, 533, 534, 534, 535, 535, 536,
    536, 536, 537, 537, 538, 538, 539, 539, 540, 540,
    541, 541, 542, 542, 543, 543, 544, 544, 545, 545,
    545, 546, 546, 547, 547, 548, 548, 549, 549, 550,
    550, 551, 551, 552, 552, 553, 553, 553, 554, 554,
    555, 555, 556, 556, 557, 557, 558, 558, 559, 559,
    560, 560, 561, 561, 561, 562, 562, 563, 563, 564,
    564, 565, 565, 566, 566, 567, 567, 568, 568, 568,
    569, 569, 570, 570, 571, 571, 572, 572, 573, 573,
    574, 574, 574, 575, 575, 576, 576, 577, 577, 578,
    578, 579, 579, 580, 580, 580, 581, 581, 582, 582,
    583, 583, 584, 584, 585, 585, 586, 586, 586, 587,
    587, 588, 588, 589, 589, 590, 590, 591, 591, 591,
    592, 592, 593, 593, 594, 594, 595, 595, 596, 596,
    596, 597, 597, 598, 598, 599, 599, 600, 600, 601,
    601, 601, 602, 602, 603, 603, 604, 604, 605, 605,
    606, 606, 606, 607, 607, 608, 608, 609, 609, 610,
    610, 610, 611, 611, 612, 612, 613, 613, 614, 614,
    614, 615, 615, 616, 616, 617, 617, 618, 618, 618,
    619, 619, 620, 620, 621, 621, 622, 622, 622, 623,
    623, 624, 624, 625, 625, 626, 626, 626, 627, 627,
    628, 628, 629, 629, 630, 630, 630, 631, 631, 632,
    632, 633, 633, 634, 634, 634, 635, 635, 636, 636,
    637, 637, 637, 638, 638, 639, 639, 640, 640, 641,
    641, 641, 642, 642, 643, 643, 644, 644, 644, 645,
    645, 646, 646, 647, 647, 647, 648, 648, 649, 649,
    650, 650, 650, 651, 651, 652, 652, 653, 653, 653,
    654, 654, 655, 655, 656, 656, 657, 657, 657, 658,
    658, 659, 659, 659, 660, 660, 661, 661, 662, 662,
    662, 663, 663, 664, 664, 665, 665, 665, 666, 666,
    667, 667, 668, 668, 668, 669, 669, 670, 670, 671,
    671, 671, 672, 672, 673, 673, 673, 674, 674, 675,
    675, 676, 676, 676, 677, 677, 678, 678, 679, 679,
    679, 680, 680, 681, 681, 681, 682, 682, 683, 683,
    684, 684, 684, 685, 685, 686, 686, 686, 687, 687,
    688, 688, 689, 689, 689, 690, 690, 691, 691, 691,
    692, 692, 693, 693, 693, 694, 694, 695, 695, 696,
    696, 696, 697, 697, 698, 698, 698, 699, 699, 700,
    700, 700, 701, 701, 702, 702, 702, 703, 703, 704,
    704, 704, 705, 705, 706, 706, 706, 707, 707, 708,
    708, 709, 709, 709, 710, 710, 711, 711, 711, 712,
    712, 713, 713, 713, 714, 714, 715, 715, 715, 716,
    716, 717, 717, 717, 718, 718, 719, 719, 719, 720,
    720, 721, 721, 721, 722, 722, 722, 723, 723, 724,
    724, 724, 725, 725, 726, 726, 726, 727, 727, 728,
    728, 728, 729, 729, 730, 730, 730, 731, 731, 732,
    732, 732, 733, 733, 733, 734, 734, 735, 735, 735,
    736, 736, 737, 737, 737, 738, 738, 739, 739, 739,
    740, 740, 740, 741, 741, 742, 742, 742, 743, 743,
    744, 744, 744, 745, 745, 745, 746, 746, 747, 747,
    747, 748, 748, 749, 749, 749, 750, 750, 750, 751,
    751, 752, 752, 752, 753, 753, 753, 754, 754, 755,
    755, 755, 756, 756, 756, 757, 757, 758, 758, 758,
    759, 759, 759, 760, 760, 761, 761, 761, 762, 762,
    762, 763, 763, 764, 764, 764, 765, 765, 765, 766,
    766, 767, 767, 767, 768, 768, 768, 769, 769, 770,
    770, 770, 771, 771, 771, 772, 772, 772, 773, 773,
    774, 774, 774, 775, 775, 775, 776, 776, 776, 777,
    777, 778, 778, 778, 779, 779, 779, 780, 780, 780,
    781, 781, 782, 782, 782, 783, 783, 783, 784, 784,
    784, 785, 785, 786, 786, 786, 787, 787, 787, 788,
    788, 788, 789, 789, 789, 790, 790, 790, 791, 791,
    792, 792, 792, 793, 793, 793, 794, 794, 794, 795,
    795, 795, 796, 796, 796, 797, 797, 798, 798, 798,
    799, 799, 799, 800, 800, 800, 801, 801, 801, 802,
    802, 802, 803, 803, 803, 804, 804, 805, 805, 805,
    806, 806, 806, 807, 807, 807, 808, 808, 808, 809,
    809, 809, 810, 810, 810, 811, 811, 811, 812, 812,
    812, 813, 813, 813, 814, 814, 814, 815, 815, 815,
    816, 816, 816, 817, 817, 817, 818, 818, 818, 819,
    819, 819, 820, 820, 820, 821, 821, 821, 822, 822,
    822, 823, 823, 823, 824, 824, 824, 825, 825, 825,
    826, 826, 826, 827, 827, 827, 828, 828, 828, 829,
    829, 829, 830, 830, 830, 831, 831, 831, 832, 832,
    832, 833, 833, 833, 834, 834, 834, 835, 835, 835,
    836, 836, 836, 837, 837, 837, 838, 838, 838, 838,
    839, 839, 839, 840, 840, 840, 841, 841, 841, 842,
    842, 842, 843, 843, 843, 844, 844, 844, 845, 845,
    845, 845, 846, 846, 846, 847, 847, 847, 848, 848,
    848, 849, 849, 849, 850, 850, 850, 850, 851, 851,
    851, 852, 852, 852, 853, 853, 853, 854, 854, 854,
    855, 855, 855, 855, 856, 856, 856, 857, 857, 857,
    858, 858, 858, 858, 859, 859, 859, 860, 860, 860,
    861, 861, 861, 862, 862, 862, 862, 863, 863, 863,
    864, 864, 864, 865, 865, 865, 865, 866, 866, 866,
    867, 867, 867, 868, 868, 868, 868, 869, 869, 869,
    870, 870, 870, 870, 871, 871, 871, 872, 872, 872,
    873, 873, 873, 873, 874, 874, 874, 875, 875, 875,
    875, 876, 876, 876, 877, 877, 877, 877, 878, 878,
    878, 879, 879, 879, 879, 880, 880, 880, 881, 881,
    881, 881, 882, 882, 882, 883, 883, 883, 883, 884,
    884, 884, 885, 885, 885, 885, 886, 886, 886, 887,
    887, 887, 887, 888, 888, 888, 888, 889, 889, 889,
    890, 890, 890, 890, 891, 891, 891, 892, 892, 892,
    892, 893, 893, 893, 893, 894, 894, 894, 895, 895,
    895, 895, 896, 896, 896, 896, 897, 897, 897, 897,
    898, 898, 898, 899, 899, 899, 899, 900, 900, 900,
    900, 901, 901, 901, 902, 902, 902, 902, 903, 903,
    903, 903, 904, 904, 904, 904, 905, 905, 905, 905,
    906, 906, 906, 906, 907, 907, 907, 908, 908, 908,
    908, 909, 909, 909, 909, 910, 910, 910, 910, 911,
    911, 911, 911, 912, 912, 912, 912, 913, 913, 913,
    913, 914, 914, 914, 914, 915, 915, 915, 915, 916,
    916, 916, 916, 917, 917, 917, 917, 918, 918, 918,
    918, 919, 919, 919, 919, 920, 920, 920, 920, 921,
    921, 921, 921, 922, 922, 922, 922, 923, 923, 923,
    923, 924, 924, 924, 924, 924, 925, 925, 925, 925,
    926, 926, 926, 926, 927, 927, 927, 927, 928, 928,
    928, 928, 929, 929, 929, 929, 929, 930, 930, 930,
    930, 931, 931, 931, 931, 932, 932, 932, 932, 932,
    933, 933, 933, 933, 934, 934, 934, 934, 935, 935,
    935, 935, 935, 936, 936, 936, 936, 937, 937, 937,
    937, 938, 938, 938, 938, 938, 939, 939, 939, 939,
    940, 940, 940, 940, 940, 941, 941, 941, 941, 942,
    942, 942, 942, 942, 943, 943, 943, 943, 943, 944,
    944, 944, 944, 945, 945, 945, 945, 945, 946, 946,
    946, 946, 946, 947, 947, 947, 947, 948, 948, 948,
    948, 948, 949, 949, 949, 949, 949, 950, 950, 950,
    950, 950, 951, 951, 951, 951, 952, 952, 952, 952,
    952, 953, 953, 953, 953, 953, 954, 954, 954, 954,
    954, 955, 955, 955, 955, 955, 956, 956, 956, 956,
    956, 957, 957, 957, 957, 957, 958, 958, 958, 958,
    958, 959, 959, 959, 959, 959, 960, 960, 960, 960,
    960, 961, 961, 961, 961, 961, 961, 962, 962, 962,
    962, 962, 963, 963, 963, 963, 963, 964, 964, 964,
    964, 964, 965, 965, 965, 965, 965, 965, 966, 966,
    966, 966, 966, 967, 967, 967, 967, 967, 967, 968,
    968, 968, 968, 968, 969, 969, 969, 969, 969, 969,
    970, 970, 970, 970, 970, 971, 971, 971, 971, 971,
    971, 972, 972, 972, 972, 972, 972, 973, 973, 973,
    973, 973, 974, 974, 974, 974, 974, 974, 975, 975,
    975, 975, 975, 975, 976, 976, 976, 976, 976, 976,
    977, 977, 977, 977, 977, 977, 978, 978, 978, 978,
    978, 978, 979, 979, 979, 979, 979, 979, 980, 980,
    980, 980, 980, 980, 981, 981, 981, 981, 981, 981,
    982, 982, 982, 982, 982, 982, 982, 983, 983, 983,
    983, 983, 983, 984, 984, 984, 984, 984, 984, 984,
    985, 985, 985, 985, 985, 985, 986, 986, 986, 986,
    986, 986, 986, 987, 987, 987, 987, 987, 987, 988,
    988, 988, 988, 988, 988, 988, 989, 989, 989, 989,
    989, 989, 989, 990, 990, 990, 990, 990, 990, 990,
    991, 991, 991, 991, 991, 991, 991, 992, 992, 992,
    992, 992, 992, 992, 992, 993, 993, 993, 993, 993,
    993, 993, 994, 994, 994, 994, 994, 994, 994, 995,
    995, 995, 995, 995, 995, 995, 995, 996, 996, 996,
    996, 996, 996, 996, 996, 997, 997, 997, 997, 997,
    997, 997, 998, 998, 998, 998, 998, 998, 998, 998,
    999, 999, 999, 999, 999, 999, 999, 999, 999, 1000,
    1000, 1000, 1000, 1000, 1000, 1000, 1000, 1001, 1001, 1001,
    1001, 1001, 1001, 1001, 1001, 1002, 1002, 1002, 1002, 1002,
    1002, 1002, 1002, 1002, 1003, 1003, 1003, 1003, 1003, 1003,
    1003, 1003, 1003, 1004, 1004, 1004, 1004, 1004, 1004, 1004,
    1004, 1004, 1005, 1005, 1005, 1005, 1005, 1005, 1005, 1005,
    1005, 1006, 1006, 1006, 1006, 1006, 1006, 1006, 1006, 1006,
    1006, 1007, 1007, 1007, 1007, 1007, 1007, 1007, 1007, 1007,
    1007, 1008, 1008, 1008, 1008, 1008, 1008, 1008, 1008, 1008,
    1008, 1009, 1009, 1009, 1009, 1009, 1009, 1009, 1009, 1009,
    1009, 1009, 1010, 1010, 1010, 1010, 1010, 1010, 1010, 1010,
    1010, 1010, 1011, 1011, 1011, 1011, 1011, 1011, 1011, 1011,
    1011, 1011, 1011, 1011, 1012, 1012, 1012, 1012, 1012, 1012,
    1012, 1012, 1012, 1012, 1012, 1013, 1013, 1013, 1013, 1013,
    1013, 1013, 1013, 1013, 1013, 1013, 1013, 1013, 1014, 1014,
    1014, 1014, 1014, 1014, 1014, 1014, 1014, 1014, 1014, 1014,
    1014, 1015, 1015, 1015, 1015, 1015, 1015, 1015, 1015, 1015,
    1015, 1015, 1015, 1015, 1016, 1016, 1016, 1016, 1016, 1016,
    1016, 1016, 1016, 1016, 1016, 1016, 1016, 1016, 1017, 1017,
    1017, 1017, 1017, 1017, 1017, 1017, 1017, 1017, 1017, 1017,
    1017, 1017, 1017, 1017, 1018, 1018, 1018, 1018, 1018, 1018,
    1018, 1018, 1018, 1018, 1018, 1018, 1018, 1018, 1018, 1018,
    1019, 1019, 1019, 1019, 1019, 1019, 1019, 1019, 1019, 1019,
    1019, 1019, 1019, 1019, 1019, 1019, 1019, 1019, 1019, 1020,
    1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020,
    1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020, 1021,
    1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021,
    1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021,
    1021, 1021, 1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022,
    1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022,
    1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022,
    1022, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023,
    1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023,
    1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023,
    1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023,
    1023, 1023, 1023, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024,
    1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1023, 1023,
    1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023,
    1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023,
    1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023,
    1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023, 1023,
    1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022,
    1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022,
    1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022, 1022, 1021,
    1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021,
    1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021, 1021,
    1021, 1021, 1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020,
    1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020,
    1020, 1020, 1019, 1019, 1019, 1019, 1019, 1019, 1019, 1019,
    1019, 1019, 1019, 1019, 1019, 1019, 1019, 1019, 1019, 1019,
    1019, 1018, 1018, 1018, 1018, 1018, 1018, 1018, 1018, 1018,
    1018, 1018, 1018, 1018, 1018, 1018, 1018, 1017, 1017, 1017,
    1017, 1017, 1017, 1017, 1017, 1017, 1017, 1017, 1017, 1017,
    1017, 1017, 1017, 1016, 1016, 1016, 1016, 1016, 1016, 1016,
    1016, 1016, 1016, 1016, 1016, 1016, 1016, 1015, 1015, 1015,
    1015, 1015, 1015, 1015, 1015, 1015, 1015, 1015, 1015, 1015,
    1014, 1014, 1014, 1014, 1014, 1014, 1014, 1014, 1014, 1014,
    1014, 1014, 1014, 1013, 1013, 1013, 1013, 1013, 1013, 1013,
    1013, 1013, 1013, 1013, 1013, 1013, 1012, 1012, 1012, 1012,
    1012, 1012, 1012, 1012, 1012, 1012, 1012, 1011, 1011, 1011,
    1011, 1011, 1011, 1011, 1011, 1011, 1011, 1011, 1011, 1010,
    1010, 1010, 1010, 1010, 1010, 1010, 1010, 1010, 1010, 1009,
    1009, 1009, 1009, 1009, 1009, 1009, 1009, 1009, 1009, 1009,
    1008, 1008, 1008, 1008, 1008, 1008, 1008, 1008, 1008, 1008,
    1007, 1007, 1007, 1007, 1007, 1007, 1007, 1007, 1007, 1007,
    1006, 1006, 1006, 1006, 1006, 1006, 1006, 1006, 1006, 1006,
    1005, 1005, 1005, 1005, 1005, 1005, 1005, 1005, 1005, 1004,
    1004, 1004, 1004, 1004, 1004, 1004, 1004, 1004, 1003, 1003,
    1003, 1003, 1003, 1003, 1003, 1003, 1003, 1002, 1002, 1002,
    1002, 1002, 1002, 1002, 1002, 1002, 1001, 1001, 1001, 1001,
    1001, 1001, 1001, 1001, 1000, 1000, 1000, 1000, 1000, 1000,
    1000, 1000, 999, 999, 999, 999, 999, 999, 999, 999,
    999, 998, 998, 998, 998, 998, 998, 998, 998, 997,
    997, 997, 997, 997, 997, 997, 996, 996, 996, 996,
    996, 996, 996, 996, 995, 995, 995, 995, 995, 995,
    995, 995, 994, 994, 994, 994, 994, 994, 994, 993,
    993, 993, 993, 993, 993, 993, 992, 992, 992, 992,
    992, 992, 992, 992, 991, 991, 991, 991, 991, 991,
    991, 990, 990, 990, 990, 990, 990, 990, 989, 989,
    989, 989, 989, 989, 989, 988, 988, 988, 988, 988,
    988, 988, 987, 987, 987, 987, 987, 987, 986, 986,
    986, 986, 986, 986, 986, 985, 985, 985, 985, 985,
    985, 984, 984, 984, 984, 984, 984, 984, 983, 983,
    983, 983, 983, 983, 982, 982, 982, 982, 982, 982,
    982, 981, 981, 981, 981, 981, 981, 980, 980, 980,
    980, 980, 980, 979, 979, 979, 979, 979, 979, 978,
    978, 978, 978, 978, 978, 977, 977, 977, 977, 977,
    977, 976, 976, 976, 976, 976, 976, 975, 975, 975,
    975, 975, 975, 974, 974, 974, 974, 974, 974, 973,
    973, 973, 973, 973, 972, 972, 972, 972, 972, 972,
    971, 971, 971, 971, 971, 971, 970, 970, 970, 970,
    970, 969, 969, 969, 969, 969, 969, 968, 968, 968,
    968, 968, 967, 967, 967, 967, 967, 967, 966, 966,
    966, 966, 966, 965, 965, 965, 965, 965, 965, 964,
    964, 964, 964, 964, 963, 963, 963, 963, 963, 962,
    962, 962, 962, 962, 961, 961, 961, 961, 961, 961,
    960, 960, 960, 960, 960, 959, 959, 959, 959, 959,
    958, 958, 958, 958, 958, 957, 957, 957, 957, 957,
    956, 956, 956, 956, 956, 955, 955, 955, 955, 955,
    954, 954, 954, 954, 954, 953, 953, 953, 953, 953,
    952, 952, 952, 952, 952, 951, 951, 951, 951, 950,
    950, 950, 950, 950, 949, 949, 949, 949, 949, 948,
    948, 948, 948, 948, 947, 947, 947, 947, 946, 946,
    946, 946, 946, 945, 945, 945, 945, 945, 944, 944,
    944, 944, 943, 943, 943, 943, 943, 942, 942, 942,
    942, 942, 941, 941, 941, 941, 940, 940, 940, 940,
    940, 939, 939, 939, 939, 938, 938, 938, 938, 938,
    937, 937, 937, 937, 936, 936, 936, 936, 935, 935,
    935, 935, 935, 934, 934, 934, 934, 933, 933, 933,
    933, 932, 932, 932, 932, 932, 931, 931, 931, 931,
    930, 930, 930, 930, 929, 929, 929, 929, 929, 928,
    928, 928, 928, 927, 927, 927, 927, 926, 926, 926,
    926, 925, 925, 925, 925, 924, 924, 924, 924, 924,
    923, 923, 923, 923, 922, 922, 922, 922, 921, 921,
    921, 921, 920, 920, 920, 920, 919, 919, 919, 919,
    918, 918, 918, 918, 917, 917, 917, 917, 916, 916,
    916, 916, 915, 915, 915, 915, 914, 914, 914, 914,
    913, 913, 913, 913, 912, 912, 912, 912, 911, 911,
    911, 911, 910, 910, 910, 910, 909, 909, 909, 909,
    908, 908, 908, 908, 907, 907, 907, 906, 906, 906,
    906, 905, 905, 905, 905, 904, 904, 904, 904, 903,
    903, 903, 903, 902, 902, 902, 902, 901, 901, 901,
    900, 900, 900, 900, 899, 899, 899, 899, 898, 898,
    898, 897, 897, 897, 897, 896, 896, 896, 896, 895,
    895, 895, 895, 894, 894, 894, 893, 893, 893, 893,
    892, 892, 892, 892, 891, 891, 891, 890, 890, 890,
    890, 889, 889, 889, 888, 888, 888, 888, 887, 887,
    887, 887, 886, 886, 886, 885, 885, 885, 885, 884,
    884, 884, 883, 883, 883, 883, 882, 882, 882, 881,
    881, 881, 881, 880, 880, 880, 879, 879, 879, 879,
    878, 878, 878, 877, 877, 877, 877, 876, 876, 876,
    875, 875, 875, 875, 874, 874, 874, 873, 873, 873,
    873, 872, 872, 872, 871, 871, 871, 870, 870, 870,
    870, 869, 869, 869, 868, 868, 868, 868, 867, 867,
    867, 866, 866, 866, 865, 865, 865, 865, 864, 864,
    864, 863, 863, 863, 862, 862, 862, 862, 861, 861,
    861, 860, 860, 860, 859, 859, 859, 858, 858, 858,
    858, 857, 857, 857, 856, 856, 856, 855, 855, 855,
    855, 854, 854, 854, 853, 853, 853, 852, 852, 852,
    851, 851, 851, 850, 850, 850, 850, 849, 849, 849,
    848, 848, 848, 847, 847, 847, 846, 846, 846, 845,
    845, 845, 845, 844, 844, 844, 843, 843, 843, 842,
    842, 842, 841, 841, 841, 840, 840, 840, 839, 839,
    839, 838, 838, 838, 838, 837, 837, 837, 836, 836,
    836, 835, 835, 835, 834, 834, 834, 833, 833, 833,
    832, 832, 832, 831, 831, 831, 830, 830, 830, 829,
    829, 829, 828, 828, 828, 827, 827, 827, 826, 826,
    826, 825, 825, 825, 824, 824, 824, 823, 823, 823,
    822, 822, 822, 821, 821, 821, 820, 820, 820, 819,
    819, 819, 818, 818, 818, 817, 817, 817, 816, 816,
    816, 815, 815, 815, 814, 814, 814, 813, 813, 813,
    812, 812, 812, 811, 811, 811, 810, 810, 810, 809,
    809, 809, 808, 808, 808, 807, 807, 807, 806, 806,
    806, 805, 805, 805, 804, 804, 803, 803, 803, 802,
    802, 802, 801, 801, 801, 800, 800, 800, 799, 799,
    799, 798, 798, 798, 797, 797, 796, 796, 796, 795,
    795, 795, 794, 794, 794, 793, 793, 793, 792, 792,
    792, 791, 791, 790, 790, 790, 789, 789, 789, 788,
    788, 788, 787, 787, 787, 786, 786, 786, 785, 785,
    784, 784, 784, 783, 783, 783, 782, 782, 782, 781,
    781, 780, 780, 780, 779, 779, 779, 778, 778, 778,
    777, 777, 776, 776, 776, 775, 775, 775, 774, 774,
    774, 773, 773, 772, 772, 772, 771, 771, 771, 770,
    770, 770, 769, 769, 768, 768, 768, 767, 767, 767,
    766, 766, 765, 765, 765, 764, 764, 764, 763, 763,
    762, 762, 762, 761, 761, 761, 760, 760, 759, 759,
    759, 758, 758, 758, 757, 757, 756, 756, 756, 755,
    755, 755, 754, 754, 753, 753, 753, 752, 752, 752,
    751, 751, 750, 750, 750, 749, 749, 749, 748, 748,
    747, 747, 747, 746, 746, 745, 745, 745, 744, 744,
    744, 743, 743, 742, 742, 742, 741, 741, 740, 740,
    740, 739, 739, 739, 738, 738, 737, 737, 737, 736,
    736, 735, 735, 735, 734, 734, 733, 733, 733, 732,
    732, 732, 731, 731, 730, 730, 730, 729, 729, 728,
    728, 728, 727, 727, 726, 726, 726, 725, 725, 724,
    724, 724, 723, 723, 722, 722, 722, 721, 721, 721,
    720, 720, 719, 719, 719, 718, 718, 717, 717, 717,
    716, 716, 715, 715, 715, 714, 714, 713, 713, 713,
    712, 712, 711, 711, 711, 710, 710, 709, 709, 709,
    708, 708, 707, 707, 706, 706, 706, 705, 705, 704,
    704, 704, 703, 703, 702, 702, 702, 701, 701, 700,
    700, 700, 699, 699, 698, 698, 698, 697, 697, 696,
    696, 696, 695, 695, 694, 694, 693, 693, 693, 692,
    692, 691, 691, 691, 690, 690, 689, 689, 689, 688,
    688, 687, 687, 686, 686, 686, 685, 685, 684, 684,
    684, 683, 683, 682, 682, 681, 681, 681, 680, 680,
    679, 679, 679, 678, 678, 677, 677, 676, 676, 676,
    675, 675, 674, 674, 673, 673, 673, 672, 672, 671,
    671, 671, 670, 670, 669, 669, 668, 668, 668, 667,
    667, 666, 666, 665, 665, 665, 664, 664, 663, 663,
    662, 662, 662, 661, 661, 660, 660, 659, 659, 659,
    658, 658, 657, 657, 657, 656, 656, 655, 655, 654,
    654, 653, 653, 653, 652, 652, 651, 651, 650, 650,
    650, 649, 649, 648, 648, 647, 647, 647, 646, 646,
    645, 645, 644, 644, 644, 643, 643, 642, 642, 641,
    641, 641, 640, 640, 639, 639, 638, 638, 637, 637,
    637, 636, 636, 635, 635, 634, 634, 634, 633, 633,
    632, 632, 631, 631, 630, 630, 630, 629, 629, 628,
    628, 627, 627, 626, 626, 626, 625, 625, 624, 624,
    623, 623, 622, 622, 622, 621, 621, 620, 620, 619,
    619, 618, 618, 618, 617, 617, 616, 616, 615, 615,
    614, 614, 614, 613, 613, 612, 612, 611, 611, 610,
    610, 610, 609, 609, 608, 608, 607, 607, 606, 606,
    606, 605, 605, 604, 604, 603, 603, 602, 602, 601,
    601, 601, 600, 600, 599, 599, 598, 598, 597, 597,
    596, 596, 596, 595, 595, 594, 594, 593, 593, 592,
    592, 591, 591, 591, 590, 590, 589, 589, 588, 588,
    587, 587, 586, 586, 586, 585, 585, 584, 584, 583,
    583, 582, 582, 581, 581, 580, 580, 580, 579, 579,
    578, 578, 577, 577, 576, 576, 575, 575, 574, 574,
    574, 573, 573, 572, 572, 571, 571, 570, 570, 569,
    569, 568, 568, 568, 567, 567, 566, 566, 565, 565,
    564, 564, 563, 563, 562, 562, 561, 561, 561, 560,
    560, 559, 559, 558, 558, 557, 557, 556, 556, 555,
    555, 554, 554, 553, 553, 553, 552, 552, 551, 551,
    550, 550, 549, 549, 548, 548, 547, 547, 546, 546,
    545, 545, 545, 544, 544, 543, 543, 542, 542, 541,
    541, 540, 540, 539, 539, 538, 538, 537, 537, 536,
    536, 536, 535, 535, 534, 534, 533, 533, 532, 532,
    531, 531, 530, 530, 529, 529, 528, 528, 527, 527,
    526, 526, 525, 525, 525, 524, 524, 523, 523, 522,
    522, 521, 521, 520, 520, 519, 519, 518, 518, 517,
    517, 516, 516, 515, 515, 514, 514, 513, 513, 512,
    512, 512, 511, 511, 510, 510, 509, 509, 508, 508,
    507, 507, 506, 506, 505, 505, 504, 504, 503, 503,
    502, 502, 501, 501, 500, 500, 499, 499, 498, 498,
    497, 497, 496, 496, 495, 495, 494, 494, 494, 493,
    493, 492, 492, 491, 491, 490, 490, 489, 489, 488,
    488, 487, 487, 486, 486, 485, 485, 484, 484, 483,
    483, 482, 482, 481, 481, 480, 480, 479, 479, 478,
    478, 477, 477, 476, 476, 475, 475, 474, 474, 473,
    473, 472, 472, 471, 471, 470, 470, 469, 469, 468,
    468, 467, 467, 466, 466, 465, 465, 464, 464, 463,
    463, 462, 462, 461, 461, 460, 460, 459, 459, 458,
    458, 457, 457, 456, 456, 455, 455, 454, 454, 453,
    453, 452, 452, 451, 451, 450, 450, 449, 449, 448,
    448, 447, 447, 446, 446, 445, 445, 444, 444, 443,
    443, 442, 442, 441, 441, 440, 440, 439, 439, 438,
    438, 437, 437, 436, 436, 435, 435, 434, 434, 433,
    433, 432, 432, 431, 431, 430, 430, 429, 429, 428,
    428, 427, 427, 426, 426, 425, 425, 424, 424, 423,
    423, 422, 422, 421, 421, 420, 420, 419, 419, 418,
    418, 417, 416, 416, 415, 415, 414, 414, 413, 413,
    412, 412, 411, 411, 410, 410, 409, 409, 408, 408,
    407, 407, 406, 406, 405, 405, 404, 404, 403, 403,
    402, 402, 401, 401, 400, 400, 399, 399, 398, 398,
    397, 397, 396, 395, 395, 394, 394, 393, 393, 392,
    392, 391, 391, 390, 390, 389, 389, 388, 388, 387,
    387, 386, 386, 385, 385, 384, 384, 383, 383, 382,
    382, 381, 380, 380, 379, 379, 378, 378, 377, 377,
    376, 376, 375, 375, 374, 374, 373, 373, 372, 372,
    371, 371, 370, 370, 369, 369, 368, 367, 367, 366,
    366, 365, 365, 364, 364, 363, 363, 362, 362, 361,
    361, 360, 360, 359, 359, 358, 358, 357, 357, 356,
    355, 355, 354, 354, 353, 353, 352, 352, 351, 351,
    350, 350, 349, 349, 348, 348, 347, 347, 346, 346,
    345, 344, 344, 343, 343, 342, 342, 341, 341, 340,
    340, 339, 339, 338, 338, 337, 337, 336, 335, 335,
    334, 334, 333, 333, 332, 332, 331, 331, 330, 330,
    329, 329, 328, 328, 327, 327, 326, 325, 325, 324,
    324, 323, 323, 322, 322, 321, 321, 320, 320, 319,
    319, 318, 317, 317, 316, 316, 315, 315, 314, 314,
    313, 313, 312, 312, 311, 311, 310, 310, 309, 308,
    308, 307, 307, 306, 306, 305, 305, 304, 304, 303,
    303, 302, 302, 301, 300, 300, 299, 299, 298, 298,
    297, 297, 296, 296, 295, 295, 294, 294, 293, 292,
    292, 291, 291, 290, 290, 289, 289, 288, 288, 287,
    287, 286, 285, 285, 284, 284, 283, 283, 282, 282,
    281, 281, 280, 280, 279, 278, 278, 277, 277, 276,
    276, 275, 275, 274, 274, 273, 273, 272, 271, 271,
    270, 270, 269, 269, 268, 268, 267, 267, 266, 266,
    265, 264, 264, 263, 263, 262, 262, 261, 261, 260,
    260, 259, 259, 258, 257, 257, 256, 256, 255, 255,
    254, 254, 253, 253, 252, 252, 251, 250, 250, 249,
    249, 248, 248, 247, 247, 246, 246, 245, 244, 244,
    243, 243, 242, 242, 241, 241, 240, 240, 239, 239,
    238, 237, 237, 236, 236, 235, 235, 234, 234, 233,
    233, 232, 231, 231, 230, 230, 229, 229, 228, 228,
    227, 227, 226, 225, 225, 224, 224, 223, 223, 222,
    222, 221, 221, 220, 219, 219, 218, 218, 217, 217,
    216, 216, 215, 215, 214, 213, 213, 212, 212, 211,
    211, 210, 210, 209, 209, 208, 207, 207, 206, 206,
    205, 205, 204, 204, 203, 203, 202, 201, 201, 200,
    200, 199, 199, 198, 198, 197, 196, 196, 195, 195,
    194, 194, 193, 193, 192, 192, 191, 190, 190, 189,
    189, 188, 188, 187, 187, 186, 186, 185, 184, 184,
    183, 183, 182, 182, 181, 181, 180, 179, 179, 178,
    178, 177, 177, 176, 176, 175, 175, 174, 173, 173,
    172, 172, 171, 171, 170, 170, 169, 168, 168, 167,
    167, 166, 166, 165, 165, 164, 163, 163, 162, 162,
    161, 161, 160, 160, 159, 159, 158, 157, 157, 156,
    156, 155, 155, 154, 154, 153, 152, 152, 151, 151,
    150, 150, 149, 149, 148, 147, 147, 146, 146, 145,
    145, 144, 144, 143, 143, 142, 141, 141, 140, 140,
    139, 139, 138, 138, 137, 136, 136, 135, 135, 134,
    134, 133, 133, 132, 131, 131, 130, 130, 129, 129,
    128, 128, 127, 126, 126, 125, 125, 124, 124, 123,
    123, 122, 121, 121, 120, 120, 119, 119, 118, 118,
    117, 116, 116, 115, 115, 114, 114, 113, 113, 112,
    111, 111, 110, 110, 109, 109, 108, 108, 107, 106,
    106, 105, 105, 104, 104, 103, 103, 102, 101, 101,
    100, 100, 99, 99, 98, 98, 97, 96, 96, 95,
    95, 94, 94, 93, 93, 92, 91, 91, 90, 90,
    89, 89, 88, 88, 87, 86, 86, 85, 85, 84,
    84, 83, 83, 82, 81, 81, 80, 80, 79, 79,
    78, 78, 77, 76, 76, 75, 75, 74, 74, 73,
    73, 72, 71, 71, 70, 70, 69, 69, 68, 68,
    67, 66, 66, 65, 65, 64, 64, 63, 63, 62,
    61, 61, 60, 60, 59, 59, 58, 57, 57, 56,
    56, 55, 55, 54, 54, 53, 52, 52, 51, 51,
    50, 50, 49, 49, 48, 47, 47, 46, 46, 45,
    45, 44, 44, 43, 42, 42, 41, 41, 40, 40,
    39, 39, 38, 37, 37, 36, 36, 35, 35, 34,
    34, 33, 32, 32, 31, 31, 30, 30, 29, 28,
    28, 27, 27, 26, 26, 25, 25, 24, 23, 23,
    22, 22, 21, 21, 20, 20, 19, 18, 18, 17,
    17, 16, 16, 15, 15, 14, 13, 13, 12, 12,
    11, 11, 10, 9, 9, 8, 8, 7, 7, 6,
    6, 5, 4, 4, 3, 3, 2, 2, 1, 1];
DTMathHelper.arctanArray = [0, 57, 115, 172, 229, 286, 344, 401, 458, 515,
    572, 629, 686, 742, 799, 856, 912, 968, 1025, 1081,
    1137, 1193, 1248, 1304, 1359, 1415, 1470, 1525, 1579, 1634,
    1688, 1743, 1797, 1850, 1904, 1958, 2011, 2064, 2116, 2169,
    2221, 2273, 2325, 2377, 2428, 2479, 2530, 2581, 2631, 2681,
    2731, 2781, 2830, 2879, 2928, 2976, 3025, 3073, 3120, 3168,
    3215, 3262, 3308, 3354, 3400, 3446, 3491, 3537, 3581, 3626,
    3670, 3714, 3758, 3801, 3844, 3887, 3930, 3972, 4014, 4055,
    4097, 4138, 4179, 4219, 4259, 4299, 4339, 4378, 4417, 4456,
    4494, 4533, 4570, 4608, 4645, 4683, 4719, 4756, 4792, 4828,
    4864, 4899, 4934, 4969, 5004, 5038, 5073, 5106, 5140, 5173,
    5206, 5239, 5272, 5304, 5336, 5368, 5400, 5431, 5462, 5493,
    5524, 5554, 5584, 5614, 5644, 5673, 5702, 5731, 5760, 5789,
    5817, 5845, 5873, 5900, 5928, 5955, 5982, 6009, 6036, 6062,
    6088, 6114, 6140, 6166, 6191, 6216, 6241, 6266, 6291, 6315,
    6339, 6363, 6387, 6411, 6434, 6458, 6481, 6504, 6526, 6549,
    6572, 6594, 6616, 6638, 6660, 6681, 6703, 6724, 6745, 6766,
    6787, 6808, 6828, 6848, 6869, 6889, 6908, 6928, 6948, 6967,
    6987, 7006, 7025, 7044, 7062, 7081, 7100, 7118, 7136, 7154,
    7172, 7190, 7208, 7225, 7243, 7260, 7277, 7294, 7311, 7328,
    7345, 7361, 7378, 7394, 7410, 7427, 7443, 7458, 7474, 7490,
    7505, 7521, 7536, 7552, 7567, 7582, 7597, 7612, 7626, 7641,
    7655, 7670, 7684, 7699, 7713, 7727, 7741, 7755, 7768, 7782,
    7796, 7809, 7823, 7836, 7849, 7862, 7875, 7888, 7901, 7914,
    7927, 7939, 7952, 7964, 7977, 7989, 8001, 8014, 8026, 8038,
    8050, 8061, 8073, 8085, 8097, 8108, 8120, 8131, 8142, 8154,
    8165, 8176, 8187, 8198, 8209, 8220, 8231, 8242, 8252, 8263,
    8273, 8284, 8294, 8305, 8315, 8325, 8335, 8345, 8355, 8365,
    8375, 8385, 8395, 8405, 8415, 8424, 8434, 8443, 8453, 8462,
    8472, 8481, 8490, 8499, 8509, 8518, 8527, 8536, 8545, 8554,
    8562, 8571, 8580, 8589, 8597, 8606, 8614, 8623, 8631, 8640,
    8648, 8657, 8665, 8673, 8681, 8689, 8697, 8706, 8714, 8721,
    8729, 8737, 8745, 8753, 8761, 8768, 8776, 8784, 8791, 8799,
    8806, 8814, 8821, 8829, 8836, 8843, 8851, 8858, 8865, 8872,
    8879, 8886, 8894, 8901, 8908, 8914, 8921, 8928, 8935, 8942,
    8949, 8955, 8962, 8969, 8975, 8982, 8989, 8995, 9002, 9008,
    9015, 9021, 9027, 9034, 9040, 9046, 9053, 9059, 9065, 9071,
    9077, 9084, 9090, 9096, 9102, 9108, 9114, 9120, 9125, 9131,
    9137, 9143, 9149, 9155, 9160, 9166, 9172, 9177, 9183, 9189,
    9194, 9200, 9205, 9211, 9216, 9222, 9227, 9233, 9238, 9243,
    9249, 9254, 9259, 9265, 9270, 9275, 9280, 9285, 9290, 9296,
    9301, 9306, 9311, 9316, 9321, 9326, 9331, 9336, 9341, 9346,
    9350, 9355, 9360, 9365, 9370, 9375, 9379, 9384, 9389, 9393,
    9398, 9403, 9407, 9412, 9417, 9421, 9426, 9430, 9435, 9439,
    9444, 9448, 9453, 9457, 9462, 9466, 9470, 9475, 9479, 9483,
    9488, 9492, 9496, 9500, 9505, 9509, 9513, 9517, 9521, 9525,
    9530, 9534, 9538, 9542, 9546, 9550, 9554, 9558, 9562, 9566,
    9570, 9574, 9578, 9582, 9586, 9590, 9593, 9597, 9601, 9605,
    9609, 9613, 9616, 9620, 9624, 9628, 9631, 9635, 9639, 9642,
    9646, 9650, 9653, 9657, 9661, 9664, 9668, 9671, 9675, 9678,
    9682, 9686, 9689, 9693, 9696, 9699, 9703, 9706, 9710, 9713,
    9717, 9720, 9723, 9727, 9730, 9733, 9737, 9740, 9743, 9747,
    9750, 9753, 9756, 9760, 9763, 9766, 9769, 9773, 9776, 9779,
    9782, 9785, 9788, 9792, 9795, 9798, 9801, 9804, 9807, 9810,
    9813, 9816, 9819, 9822, 9825, 9828, 9831, 9834, 9837, 9840,
    9843, 9846, 9849, 9852, 9855, 9858, 9861, 9863, 9866, 9869,
    9872, 9875, 9878, 9880, 9883, 9886, 9889, 9892, 9894, 9897,
    9900, 9903, 9905, 9908, 9911, 9914, 9916, 9919, 9922, 9924,
    9927, 9930, 9932, 9935, 9938, 9940, 9943, 9945, 9948, 9951,
    9953, 9956, 9958, 9961, 9963, 9966, 9969, 9971, 9974, 9976,
    9979, 9981, 9984, 9986, 9988, 9991, 9993, 9996, 9998, 10001,
    10003, 10006, 10008, 10010, 10013, 10015, 10017, 10020, 10022, 10025,
    10027, 10029, 10032, 10034, 10036, 10039, 10041, 10043, 10045, 10048,
    10050, 10052, 10054, 10057, 10059, 10061, 10063, 10066, 10068, 10070,
    10072, 10075, 10077, 10079, 10081, 10083, 10085, 10088, 10090, 10092,
    10094, 10096, 10098, 10100, 10103, 10105, 10107, 10109, 10111, 10113,
    10115, 10117, 10119, 10121, 10123, 10125, 10127, 10130, 10132, 10134,
    10136, 10138, 10140, 10142, 10144, 10146, 10148, 10150, 10152, 10154,
    10155, 10157, 10159, 10161, 10163, 10165, 10167, 10169, 10171, 10173,
    10175, 10177, 10179, 10181, 10182, 10184, 10186, 10188, 10190, 10192,
    10194, 10195, 10197, 10199, 10201, 10203, 10205, 10206, 10208, 10210,
    10212, 10214, 10215, 10217, 10219, 10221, 10223, 10224, 10226, 10228,
    10230, 10231, 10233, 10235, 10237, 10238, 10240, 10242, 10244, 10245,
    10247, 10249, 10250, 10252, 10254, 10255, 10257, 10259, 10261, 10262,
    10264, 10266, 10267, 10269, 10270, 10272, 10274, 10275, 10277, 10279,
    10280, 10282, 10284, 10285, 10287, 10288, 10290, 10292, 10293, 10295,
    10296, 10298, 10299, 10301, 10303, 10304, 10306, 10307, 10309, 10310,
    10312, 10313, 10315, 10317, 10318, 10320, 10321, 10323, 10324, 10326,
    10327, 10329, 10330, 10332, 10333, 10335, 10336, 10338, 10339, 10340,
    10342, 10343, 10345, 10346, 10348, 10349, 10351, 10352, 10354, 10355,
    10356, 10358, 10359, 10361, 10362, 10364, 10365, 10366, 10368, 10369,
    10371, 10372, 10373, 10375, 10376, 10378, 10379, 10380, 10382, 10383,
    10384, 10386, 10387, 10388, 10390, 10391, 10392, 10394, 10395, 10397,
    10398, 10399, 10400, 10402, 10403, 10404, 10406, 10407, 10408, 10410,
    10411, 10412, 10414, 10415, 10416, 10417, 10419, 10420, 10421, 10423,
    10424, 10425, 10426, 10428, 10429, 10430, 10431, 10433, 10434, 10435,
    10436, 10438, 10439, 10440, 10441, 10443, 10444, 10445, 10446, 10447,
    10449, 10450, 10451, 10452, 10454, 10455, 10456, 10457, 10458, 10459,
    10461, 10462, 10463, 10464, 10465, 10467, 10468, 10469, 10470, 10471,
    10472, 10474, 10475, 10476, 10477, 10478, 10479, 10480, 10482, 10483,
    10484, 10485, 10486, 10487, 10488, 10490, 10491, 10492, 10493, 10494,
    10495, 10496, 10497, 10498, 10500, 10501, 10502, 10503, 10504, 10505,
    10506, 10507, 10508, 10509, 10510, 10512, 10513, 10514, 10515, 10516,
    10517, 10518, 10519, 10520, 10521, 10522, 10523, 10524, 10525, 10526,
    10527, 10528, 10530, 10531, 10532, 10533, 10534, 10535, 10536, 10537,
    10538, 10539, 10540, 10541, 10542, 10543, 10544, 10545, 10546, 10547,
    10548, 10549, 10550, 10551, 10552, 10553, 10554, 10555, 10556, 10557,
    10558, 10559, 10560, 10561, 10562, 10563, 10564, 10565, 10566, 10567,
    10568, 10568, 10569, 10570, 10571, 10572, 10573, 10574, 10575, 10576,
    10577, 10578, 10579, 10580, 10581, 10582, 10583, 10584, 10584, 10585,
    10586, 10587, 10588, 10589, 10590, 10591, 10592, 10593, 10594, 10595,
    10595, 10596, 10597, 10598, 10599, 10600, 10601, 10602, 10603, 10604,
    10604, 10605, 10606, 10607, 10608, 10609, 10610, 10611, 10612, 10612,
    10613, 10614, 10615, 10616, 10617, 10618, 10618, 10619, 10620, 10621,
    10622, 10623, 10624, 10624, 10625, 10626, 10627, 10628, 10629, 10630,
    10630, 10631, 10632, 10633, 10634, 10635, 10635, 10636, 10637, 10638,
    10639, 10639, 10640, 10641, 10642, 10643, 10644, 10644, 10645, 10646,
    10647, 10648, 10648, 10649, 10650, 10651, 10652, 10652, 10653, 10654,
    10655, 10656, 10656, 10657, 10658, 10659, 10660, 10660, 10661, 10662,
    10663, 10663, 10664, 10665, 10666, 10667, 10667, 10668, 10669, 10670,
    10670, 10671, 10672, 10673, 10673, 10674, 10675, 10676, 10677, 10677,
    10678, 10679, 10680, 10680, 10681, 10682, 10683, 10683, 10684, 10685,
    10685, 10686, 10687, 10688, 10688, 10689, 10690, 10691, 10691, 10692,
    10693, 10694, 10694, 10695, 10696, 10696, 10697, 10698, 10699, 10699,
    10700, 10701, 10701, 10702, 10703, 10704, 10704, 10705, 10706, 10706,
    10707, 10708, 10708, 10709, 10710, 10711, 10711, 10712, 10713, 10713,
    10714, 10715, 10715, 10716, 10717, 10717, 10718, 10719, 10719, 10720,
    10721, 10722, 10722, 10723, 10724, 10724, 10725, 10726, 10726, 10727,
    10728, 10728, 10729, 10730, 10730, 10731, 10732, 10732, 10733, 10734,
    10734, 10735, 10735, 10736, 10737, 10737, 10738, 10739, 10739, 10740,
    10741, 10741, 10742, 10743, 10743, 10744, 10745, 10745, 10746, 10746,
    10747, 10748, 10748, 10749, 10750, 10750, 10751, 10751, 10752, 10753,
    10753, 10754, 10755, 10755, 10756, 10756, 10757, 10758, 10758, 10759,
    10760, 10760, 10761, 10761, 10762, 10763, 10763, 10764, 10764, 10765,
    10766, 10766, 10767, 10767, 10768, 10769, 10769, 10770, 10770, 10771,
    10772, 10772, 10773, 10773, 10774, 10775, 10775, 10776, 10776, 10777,
    10778, 10778, 10779, 10779, 10780, 10780, 10781, 10782, 10782, 10783,
    10783, 10784, 10784, 10785, 10786, 10786, 10787, 10787, 10788, 10788,
    10789, 10790, 10790, 10791, 10791, 10792, 10792, 10793, 10794, 10794,
    10795, 10795, 10796, 10796, 10797, 10797, 10798, 10799, 10799, 10800,
    10800, 10801, 10801, 10802, 10802, 10803, 10804, 10804, 10805, 10805,
    10806, 10806, 10807, 10807, 10808, 10808, 10809, 10809, 10810, 10811,
    10811, 10812, 10812, 10813, 10813, 10814, 10814, 10815, 10815, 10816,
    10816, 10817, 10817, 10818, 10818, 10819, 10819, 10820, 10821, 10821,
    10822, 10822, 10823, 10823, 10824, 10824, 10825, 10825, 10826, 10826,
    10827, 10827, 10828, 10828, 10829, 10829, 10830, 10830, 10831, 10831,
    10832, 10832, 10833, 10833, 10834, 10834, 10835, 10835, 10836, 10836,
    10837, 10837, 10838, 10838, 10839, 10839, 10840, 10840, 10841, 10841,
    10842, 10842, 10843, 10843, 10844, 10844, 10845, 10845, 10846, 10846,
    10847, 10847, 10848, 10848, 10848, 10849, 10849, 10850, 10850, 10851,
    10851, 10852, 10852, 10853, 10853, 10854, 10854, 10855, 10855, 10856,
    10856, 10857, 10857, 10857, 10858, 10858, 10859, 10859, 10860, 10860,
    10861, 10861, 10862, 10862, 10863, 10863, 10863, 10864, 10864, 10865,
    10865, 10866, 10866, 10867, 10867, 10868, 10868, 10868, 10869, 10869,
    10870, 10870, 10871, 10871, 10872, 10872, 10872, 10873, 10873, 10874,
    10874, 10875, 10875, 10876, 10876, 10876, 10877, 10877, 10878, 10878,
    10879, 10879, 10880, 10880, 10880, 10881, 10881, 10882, 10882, 10883,
    10883, 10883, 10884, 10884, 10885, 10885, 10886, 10886, 10886, 10887,
    10887, 10888, 10888, 10889, 10889, 10889, 10890, 10890, 10891, 10891,
    10892, 10892, 10892, 10893, 10893, 10894, 10894, 10894, 10895, 10895,
    10896, 10896, 10897, 10897, 10897, 10898, 10898, 10899, 10899, 10899,
    10900, 10900, 10901, 10901, 10901, 10902, 10902, 10903, 10903, 10903,
    10904, 10904, 10905, 10905, 10905, 10906, 10906, 10907, 10907, 10907,
    10908, 10908, 10909, 10909, 10909, 10910, 10910, 10911, 10911, 10911,
    10912, 10912, 10913, 10913, 10913, 10914, 10914, 10915, 10915, 10915,
    10916, 10916, 10917, 10917, 10917, 10918, 10918, 10918, 10919, 10919,
    10920, 10920, 10920, 10921, 10921, 10922, 10922, 10922, 10923, 10923,
    10923, 10924, 10924, 10925, 10925, 10925, 10926, 10926, 10926, 10927,
    10927, 10928, 10928, 10928, 10929, 10929, 10929, 10930, 10930, 10931,
    10931, 10931, 10932, 10932, 10932, 10933, 10933, 10933, 10934, 10934,
    10935, 10935, 10935, 10936, 10936, 10936, 10937, 10937, 10937, 10938,
    10938, 10939, 10939, 10939, 10940, 10940, 10940, 10941, 10941, 10941,
    10942, 10942, 10942, 10943, 10943, 10944, 10944, 10944, 10945, 10945,
    10945, 10946, 10946, 10946, 10947, 10947, 10947, 10948, 10948, 10948,
    10949, 10949, 10949, 10950, 10950, 10950, 10951, 10951, 10952, 10952,
    10952, 10953, 10953, 10953, 10954, 10954, 10954, 10955, 10955, 10955,
    10956, 10956, 10956, 10957, 10957, 10957, 10958, 10958, 10958, 10959,
    10959, 10959, 10960, 10960, 10960, 10961, 10961, 10961, 10962, 10962,
    10962, 10963, 10963, 10963, 10964, 10964, 10964, 10965, 10965, 10965,
    10966, 10966, 10966, 10967, 10967, 10967, 10968, 10968, 10968, 10969,
    10969, 10969, 10969, 10970, 10970, 10970, 10971, 10971, 10971, 10972,
    10972, 10972, 10973, 10973, 10973, 10974, 10974, 10974, 10975, 10975,
    10975, 10976, 10976, 10976, 10976, 10977, 10977, 10977, 10978, 10978,
    10978, 10979, 10979, 10979, 10980, 10980, 10980, 10981, 10981, 10981,
    10981, 10982, 10982, 10982, 10983, 10983, 10983, 10984, 10984, 10984,
    10985, 10985, 10985, 10985, 10986, 10986, 10986, 10987, 10987, 10987,
    10988, 10988, 10988, 10988, 10989, 10989, 10989, 10990, 10990, 10990,
    10991, 10991, 10991, 10991, 10992, 10992, 10992, 10993, 10993, 10993,
    10994, 10994, 10994, 10994, 10995, 10995, 10995, 10996, 10996, 10996,
    10996, 10997, 10997, 10997, 10998, 10998, 10998, 10998, 10999, 10999,
    10999, 11000, 11000, 11000, 11001, 11001, 11001, 11001, 11002, 11002,
    11002, 11003, 11003, 11003, 11003, 11004, 11004, 11004, 11004, 11005,
    11005, 11005, 11006, 11006, 11006, 11006, 11007, 11007, 11007, 11008,
    11008, 11008, 11008, 11009, 11009, 11009, 11010, 11010, 11010, 11010,
    11011, 11011, 11011, 11011, 11012, 11012, 11012, 11013, 11013, 11013,
    11013, 11014, 11014, 11014, 11014, 11015, 11015, 11015, 11016, 11016,
    11016, 11016, 11017, 11017, 11017, 11017, 11018, 11018, 11018, 11019,
    11019, 11019, 11019, 11020, 11020, 11020, 11020, 11021, 11021, 11021,
    11021, 11022, 11022, 11022, 11022, 11023, 11023, 11023, 11024, 11024,
    11024, 11024, 11025, 11025, 11025, 11025, 11026, 11026, 11026, 11026,
    11027, 11027, 11027, 11027, 11028, 11028, 11028, 11028, 11029, 11029,
    11029, 11030, 11030, 11030, 11030, 11031, 11031, 11031, 11031, 11032,
    11032, 11032, 11032, 11033, 11033, 11033, 11033, 11034, 11034, 11034,
    11034, 11035, 11035, 11035, 11035, 11036, 11036, 11036, 11036, 11037,
    11037, 11037, 11037, 11038, 11038, 11038, 11038, 11039, 11039, 11039,
    11039, 11040, 11040, 11040, 11040, 11041, 11041, 11041, 11041, 11041,
    11042, 11042, 11042, 11042, 11043, 11043, 11043, 11043, 11044, 11044,
    11044, 11044, 11045, 11045, 11045, 11045, 11046, 11046, 11046, 11046,
    11047, 11047, 11047, 11047, 11048, 11048, 11048, 11048, 11048, 11049,
    11049, 11049, 11049, 11050, 11050, 11050, 11050, 11051, 11051, 11051,
    11051, 11052, 11052, 11052, 11052, 11052, 11053, 11053, 11053, 11053,
    11054, 11054, 11054, 11054, 11055, 11055, 11055, 11055, 11055, 11056,
    11056, 11056, 11056, 11057, 11057, 11057, 11057, 11057, 11058, 11058,
    11058, 11058, 11059, 11059, 11059, 11059, 11060, 11060, 11060, 11060,
    11060, 11061, 11061, 11061, 11061, 11062, 11062, 11062, 11062, 11062,
    11063, 11063, 11063, 11063, 11064, 11064, 11064, 11064, 11064, 11065,
    11065, 11065, 11065, 11066, 11066, 11066, 11066, 11066, 11067, 11067,
    11067, 11067, 11068, 11068, 11068, 11068, 11068, 11069, 11069, 11069,
    11069, 11069, 11070, 11070, 11070, 11070, 11071, 11071, 11071, 11071,
    11071, 11072, 11072, 11072, 11072, 11072, 11073, 11073, 11073, 11073,
    11074, 11074, 11074, 11074, 11074, 11075, 11075, 11075, 11075, 11075,
    11076, 11076, 11076, 11076, 11076, 11077, 11077, 11077, 11077, 11078,
    11078, 11078, 11078, 11078, 11079, 11079, 11079, 11079, 11079, 11080,
    11080, 11080, 11080, 11080, 11081, 11081, 11081, 11081, 11081, 11082,
    11082, 11082, 11082, 11082, 11083, 11083, 11083, 11083, 11083, 11084,
    11084, 11084, 11084, 11085, 11085, 11085, 11085, 11085, 11086, 11086,
    11086, 11086, 11086, 11087, 11087, 11087, 11087, 11087, 11088, 11088,
    11088, 11088, 11088, 11088, 11089, 11089, 11089, 11089, 11089, 11090,
    11090, 11090, 11090, 11090, 11091, 11091, 11091, 11091, 11091, 11092,
    11092, 11092, 11092, 11092, 11093, 11093, 11093, 11093, 11093, 11094,
    11094, 11094, 11094, 11094, 11095, 11095, 11095, 11095, 11095, 11096,
    11096, 11096, 11096, 11096, 11096, 11097, 11097, 11097, 11097, 11097,
    11098, 11098, 11098, 11098, 11098, 11099, 11099, 11099, 11099, 11099,
    11100, 11100, 11100, 11100, 11100, 11100, 11101, 11101, 11101, 11101,
    11101, 11102, 11102, 11102, 11102, 11102, 11102, 11103, 11103, 11103,
    11103, 11103, 11104, 11104, 11104, 11104, 11104, 11105, 11105, 11105,
    11105, 11105, 11105, 11106, 11106, 11106, 11106, 11106, 11107, 11107,
    11107, 11107, 11107, 11107, 11108, 11108, 11108, 11108, 11108, 11109,
    11109, 11109, 11109, 11109, 11109, 11110, 11110, 11110, 11110, 11110,
    11110, 11111, 11111, 11111, 11111, 11111, 11112, 11112, 11112, 11112,
    11112, 11112, 11113, 11113, 11113, 11113, 11113, 11114, 11114, 11114,
    11114, 11114, 11114, 11115, 11115, 11115, 11115, 11115, 11115, 11116,
    11116, 11116, 11116, 11116, 11116, 11117, 11117, 11117, 11117, 11117,
    11118, 11118, 11118, 11118, 11118, 11118, 11119, 11119, 11119, 11119,
    11119, 11119, 11120, 11120, 11120, 11120, 11120, 11120, 11121, 11121,
    11121, 11121, 11121, 11121, 11122, 11122, 11122, 11122, 11122, 11122,
    11123, 11123, 11123, 11123, 11123, 11123, 11124, 11124, 11124, 11124,
    11124, 11124, 11125, 11125, 11125, 11125, 11125, 11125, 11126, 11126,
    11126, 11126, 11126, 11126, 11127, 11127, 11127, 11127, 11127, 11127,
    11128, 11128, 11128, 11128, 11128, 11128, 11129, 11129, 11129, 11129,
    11129, 11129, 11130, 11130, 11130, 11130, 11130, 11130, 11131, 11131,
    11131, 11131, 11131, 11131, 11131, 11132, 11132, 11132, 11132, 11132,
    11132, 11133, 11133, 11133, 11133, 11133, 11133, 11134, 11134, 11134,
    11134, 11134, 11134, 11135, 11135, 11135, 11135, 11135, 11135, 11135,
    11136, 11136, 11136, 11136, 11136, 11136, 11137, 11137, 11137, 11137,
    11137, 11137, 11138, 11138, 11138, 11138, 11138, 11138, 11138, 11139,
    11139, 11139, 11139, 11139, 11139, 11140, 11140, 11140, 11140, 11140,
    11140, 11140, 11141, 11141, 11141, 11141, 11141, 11141, 11142, 11142,
    11142, 11142, 11142, 11142, 11142, 11143, 11143, 11143, 11143, 11143,
    11143, 11143, 11144, 11144, 11144, 11144, 11144, 11144, 11145, 11145,
    11145, 11145, 11145, 11145, 11145, 11146, 11146, 11146, 11146, 11146,
    11146, 11146, 11147, 11147, 11147, 11147, 11147, 11147, 11148, 11148,
    11148, 11148, 11148, 11148, 11148, 11149, 11149, 11149, 11149, 11149,
    11149, 11149, 11150, 11150, 11150, 11150, 11150, 11150, 11150, 11151,
    11151, 11151, 11151, 11151, 11151, 11151, 11152, 11152, 11152, 11152,
    11152, 11152, 11152, 11153, 11153, 11153, 11153, 11153, 11153, 11153,
    11154, 11154, 11154, 11154, 11154, 11154, 11154, 11155, 11155, 11155,
    11155, 11155, 11155, 11155, 11156, 11156, 11156, 11156, 11156, 11156,
    11156, 11157, 11157, 11157, 11157, 11157, 11157, 11157, 11158, 11158,
    11158, 11158, 11158, 11158, 11158, 11159, 11159, 11159, 11159, 11159,
    11159, 11159, 11160, 11160, 11160, 11160, 11160, 11160, 11160, 11160,
    11161, 11161, 11161, 11161, 11161, 11161, 11161, 11162, 11162, 11162,
    11162, 11162, 11162, 11162, 11163, 11163, 11163, 11163, 11163, 11163,
    11163, 11163, 11164, 11164, 11164, 11164, 11164, 11164, 11164, 11165,
    11165, 11165, 11165, 11165, 11165, 11165, 11166, 11166, 11166, 11166,
    11166, 11166, 11166, 11166, 11167, 11167, 11167, 11167, 11167, 11167,
    11167, 11167, 11168, 11168, 11168, 11168, 11168, 11168, 11168, 11169,
    11169, 11169, 11169, 11169, 11169, 11169, 11169, 11170, 11170, 11170,
    11170, 11170, 11170, 11170, 11171, 11171, 11171, 11171, 11171, 11171,
    11171, 11171, 11172, 11172, 11172, 11172, 11172, 11172, 11172, 11172,
    11173, 11173, 11173, 11173, 11173, 11173, 11173, 11173, 11174, 11174,
    11174, 11174, 11174, 11174, 11174, 11174, 11175, 11175, 11175, 11175,
    11175, 11175, 11175, 11176, 11176, 11176, 11176, 11176, 11176, 11176,
    11176, 11177, 11177, 11177, 11177, 11177, 11177, 11177, 11177, 11178,
    11178, 11178, 11178, 11178, 11178, 11178, 11178, 11179, 11179, 11179,
    11179, 11179, 11179, 11179, 11179, 11180, 11180, 11180, 11180, 11180,
    11180, 11180, 11180, 11180, 11181, 11181, 11181, 11181, 11181, 11181,
    11181, 11181, 11182, 11182, 11182, 11182, 11182, 11182, 11182, 11182,
    11183, 11183, 11183, 11183, 11183, 11183, 11183, 11183, 11184, 11184,
    11184, 11184, 11184, 11184, 11184, 11184, 11184, 11185, 11185, 11185,
    11185, 11185, 11185, 11185, 11185, 11186, 11186, 11186, 11186, 11186,
    11186, 11186, 11186, 11187, 11187, 11187, 11187, 11187, 11187, 11187,
    11187, 11187, 11188, 11188, 11188, 11188, 11188, 11188, 11188, 11188,
    11189, 11189, 11189, 11189, 11189, 11189, 11189, 11189, 11189, 11190,
    11190, 11190, 11190, 11190, 11190, 11190, 11190, 11190, 11191, 11191,
    11191, 11191, 11191, 11191, 11191, 11191, 11192, 11192, 11192, 11192,
    11192, 11192, 11192, 11192, 11192, 11193, 11193, 11193, 11193, 11193,
    11193, 11193, 11193, 11193, 11194, 11194, 11194, 11194, 11194, 11194,
    11194, 11194, 11194, 11195, 11195, 11195, 11195, 11195, 11195, 11195,
    11195, 11196, 11196, 11196, 11196, 11196, 11196, 11196, 11196, 11196,
    11197, 11197, 11197, 11197, 11197, 11197, 11197, 11197, 11197, 11198,
    11198, 11198, 11198, 11198, 11198, 11198, 11198, 11198, 11199, 11199,
    11199, 11199, 11199, 11199, 11199, 11199, 11199, 11199, 11200, 11200,
    11200, 11200, 11200, 11200, 11200, 11200, 11200, 11201, 11201, 11201,
    11201, 11201, 11201, 11201, 11201, 11201, 11202, 11202, 11202, 11202,
    11202, 11202, 11202, 11202, 11202, 11203, 11203, 11203, 11203, 11203,
    11203, 11203, 11203, 11203, 11203, 11204, 11204, 11204, 11204, 11204,
    11204, 11204, 11204, 11204, 11205, 11205, 11205, 11205, 11205, 11205,
    11205, 11205, 11205, 11205, 11206, 11206, 11206, 11206, 11206, 11206,
    11206, 11206, 11206, 11207, 11207, 11207, 11207, 11207, 11207, 11207,
    11207, 11207, 11207, 11208, 11208, 11208, 11208, 11208, 11208, 11208,
    11208, 11208, 11209, 11209, 11209, 11209, 11209, 11209, 11209, 11209,
    11209, 11209, 11210, 11210, 11210, 11210, 11210, 11210, 11210, 11210,
    11210, 11210, 11211, 11211, 11211, 11211, 11211, 11211, 11211, 11211,
    11211, 11211, 11212, 11212, 11212, 11212, 11212, 11212, 11212, 11212,
    11212, 11212, 11213, 11213, 11213, 11213, 11213, 11213, 11213, 11213,
    11213, 11214, 11214, 11214, 11214, 11214, 11214, 11214, 11214, 11214,
    11214, 11214, 11215, 11215, 11215, 11215, 11215, 11215, 11215, 11215,
    11215, 11215, 11216, 11216, 11216, 11216, 11216, 11216, 11216, 11216,
    11216, 11216, 11217, 11217, 11217, 11217, 11217, 11217, 11217, 11217,
    11217, 11217, 11218, 11218, 11218, 11218, 11218, 11218, 11218, 11218,
    11218, 11218, 11219, 11219, 11219, 11219, 11219, 11219, 11219, 11219,
    11219, 11219, 11219, 11220, 11220, 11220, 11220, 11220, 11220, 11220,
    11220, 11220, 11220, 11221, 11221, 11221, 11221, 11221, 11221, 11221,
    11221, 11221, 11221, 11221, 11222, 11222, 11222, 11222, 11222, 11222,
    11222, 11222, 11222, 11222, 11223, 11223, 11223, 11223, 11223, 11223,
    11223, 11223, 11223, 11223, 11223, 11224, 11224, 11224, 11224, 11224,
    11224, 11224, 11224, 11224, 11224, 11224, 11225, 11225, 11225, 11225,
    11225, 11225, 11225, 11225, 11225, 11225, 11226, 11226, 11226, 11226,
    11226, 11226, 11226, 11226, 11226, 11226, 11226, 11227, 11227, 11227,
    11227, 11227, 11227, 11227, 11227, 11227, 11227, 11227, 11228, 11228,
    11228, 11228, 11228, 11228, 11228, 11228, 11228, 11228, 11228, 11229,
    11229, 11229, 11229, 11229, 11229, 11229, 11229, 11229, 11229, 11229,
    11230, 11230, 11230, 11230, 11230, 11230, 11230, 11230, 11230, 11230,
    11230, 11231, 11231, 11231, 11231, 11231, 11231, 11231, 11231, 11231,
    11231, 11231, 11231, 11232, 11232, 11232, 11232, 11232, 11232, 11232,
    11232, 11232, 11232, 11232, 11233, 11233, 11233, 11233, 11233, 11233,
    11233, 11233, 11233, 11233, 11233, 11234, 11234, 11234, 11234, 11234,
    11234, 11234, 11234, 11234, 11234, 11234, 11234, 11235, 11235, 11235,
    11235, 11235, 11235, 11235, 11235, 11235, 11235, 11235, 11236, 11236,
    11236, 11236, 11236, 11236, 11236, 11236, 11236, 11236, 11236, 11236,
    11237, 11237, 11237, 11237, 11237, 11237, 11237, 11237, 11237, 11237,
    11237, 11237, 11238, 11238, 11238, 11238, 11238, 11238, 11238, 11238,
    11238, 11238, 11238, 11238, 11239, 11239, 11239, 11239, 11239, 11239,
    11239, 11239, 11239, 11239, 11239, 11239, 11240, 11240, 11240, 11240,
    11240, 11240, 11240, 11240, 11240, 11240, 11240, 11241, 11241, 11241,
    11241, 11241, 11241, 11241, 11241, 11241, 11241, 11241, 11241, 11241,
    11242, 11242, 11242, 11242, 11242, 11242, 11242, 11242, 11242, 11242,
    11242, 11242, 11243, 11243, 11243, 11243, 11243, 11243, 11243, 11243,
    11243, 11243, 11243, 11243, 11244, 11244, 11244, 11244, 11244, 11244,
    11244, 11244, 11244, 11244, 11244, 11244, 11245, 11245, 11245, 11245,
    11245, 11245, 11245, 11245, 11245, 11245, 11245, 11245, 11245, 11246,
    11246, 11246, 11246, 11246, 11246, 11246, 11246, 11246, 11246, 11246,
    11246, 11247, 11247, 11247, 11247, 11247, 11247, 11247, 11247, 11247,
    11247, 11247, 11247, 11247, 11248, 11248, 11248, 11248, 11248, 11248,
    11248, 11248, 11248, 11248, 11248, 11248, 11248, 11249, 11249, 11249,
    11249, 11249, 11249, 11249, 11249, 11249, 11249, 11249, 11249, 11250,
    11250, 11250, 11250, 11250, 11250, 11250, 11250, 11250, 11250, 11250,
    11250, 11250, 11251, 11251, 11251, 11251, 11251, 11251, 11251, 11251,
    11251, 11251, 11251, 11251, 11251, 11252, 11252, 11252, 11252, 11252,
    11252, 11252, 11252, 11252, 11252, 11252, 11252, 11252, 11253, 11253,
    11253, 11253, 11253, 11253, 11253, 11253, 11253, 11253, 11253, 11253,
    11253, 11254, 11254, 11254, 11254, 11254, 11254, 11254, 11254, 11254,
    11254, 11254, 11254, 11254, 11254, 11255, 11255, 11255, 11255, 11255,
    11255, 11255, 11255, 11255, 11255, 11255, 11255, 11255, 11256, 11256,
    11256, 11256, 11256, 11256, 11256, 11256, 11256, 11256, 11256, 11256,
    11256, 11256, 11257, 11257, 11257, 11257, 11257, 11257, 11257, 11257,
    11257, 11257, 11257, 11257, 11257, 11258, 11258, 11258, 11258, 11258,
    11258, 11258, 11258, 11258, 11258, 11258, 11258, 11258, 11258, 11259,
    11259, 11259, 11259, 11259, 11259, 11259, 11259, 11259, 11259, 11259,
    11259, 11259, 11259, 11260, 11260, 11260, 11260, 11260, 11260, 11260,
    11260, 11260, 11260, 11260, 11260, 11260, 11261, 11261, 11261, 11261,
    11261, 11261, 11261, 11261, 11261, 11261, 11261, 11261, 11261, 11261,
    11262, 11262, 11262, 11262, 11262, 11262, 11262, 11262, 11262, 11262,
    11262, 11262, 11262, 11262, 11262, 11263, 11263, 11263, 11263, 11263,
    11263, 11263, 11263, 11263, 11263, 11263, 11263, 11263, 11263, 11264,
    11264, 11264, 11264, 11264, 11264, 11264, 11264, 11264, 11264, 11264,
    11264, 11264, 11264, 11265, 11265, 11265, 11265, 11265, 11265, 11265,
    11265, 11265, 11265, 11265, 11265, 11265, 11265, 11265, 11266, 11266,
    11266, 11266, 11266, 11266, 11266, 11266, 11266, 11266, 11266, 11266,
    11266, 11266, 11267, 11267, 11267, 11267, 11267, 11267, 11267, 11267,
    11267, 11267, 11267, 11267, 11267, 11267, 11267, 11268, 11268, 11268,
    11268, 11268, 11268, 11268, 11268, 11268, 11268, 11268, 11268, 11268,
    11268, 11268, 11269, 11269, 11269, 11269, 11269, 11269, 11269, 11269,
    11269, 11269, 11269, 11269, 11269, 11269, 11270, 11270, 11270, 11270,
    11270, 11270, 11270, 11270, 11270, 11270, 11270, 11270, 11270, 11270,
    11270, 11270, 11271, 11271, 11271, 11271, 11271, 11271, 11271, 11271,
    11271, 11271, 11271, 11271, 11271, 11271, 11271, 11272, 11272, 11272,
    11272, 11272, 11272, 11272, 11272, 11272, 11272, 11272, 11272, 11272,
    11272, 11272, 11273, 11273, 11273, 11273, 11273, 11273, 11273, 11273,
    11273, 11273, 11273, 11273, 11273, 11273, 11273, 11274, 11274, 11274,
    11274, 11274, 11274, 11274, 11274, 11274, 11274, 11274, 11274, 11274,
    11274, 11274, 11274, 11275, 11275, 11275, 11275, 11275, 11275, 11275,
    11275, 11275, 11275, 11275, 11275, 11275, 11275, 11275, 11276, 11276,
    11276, 11276, 11276, 11276, 11276, 11276, 11276, 11276, 11276, 11276,
    11276, 11276, 11276, 11276, 11277, 11277, 11277, 11277, 11277, 11277,
    11277, 11277, 11277, 11277, 11277, 11277, 11277, 11277, 11277, 11277,
    11278, 11278, 11278, 11278, 11278, 11278, 11278, 11278, 11278, 11278,
    11278, 11278, 11278, 11278, 11278, 11278, 11279, 11279, 11279, 11279,
    11279, 11279, 11279, 11279, 11279, 11279, 11279, 11279, 11279, 11279,
    11279, 11279, 11280, 11280, 11280, 11280, 11280, 11280, 11280, 11280,
    11280, 11280, 11280, 11280, 11280, 11280, 11280, 11280, 11280, 11281,
    11281, 11281, 11281, 11281, 11281, 11281, 11281, 11281, 11281, 11281,
    11281, 11281, 11281, 11281, 11281, 11282, 11282, 11282, 11282, 11282,
    11282, 11282, 11282, 11282, 11282, 11282, 11282, 11282, 11282, 11282,
    11282, 11282, 11283, 11283, 11283, 11283, 11283, 11283, 11283, 11283,
    11283, 11283, 11283, 11283, 11283, 11283, 11283, 11283, 11284, 11284,
    11284, 11284, 11284, 11284, 11284, 11284, 11284, 11284, 11284, 11284,
    11284, 11284, 11284, 11284, 11284, 11285, 11285, 11285, 11285, 11285,
    11285, 11285, 11285, 11285, 11285, 11285, 11285, 11285, 11285, 11285,
    11285, 11285, 11286, 11286, 11286, 11286, 11286, 11286, 11286, 11286,
    11286, 11286, 11286, 11286, 11286, 11286, 11286, 11286, 11286, 11287,
    11287, 11287, 11287, 11287, 11287, 11287, 11287, 11287, 11287, 11287,
    11287, 11287, 11287, 11287, 11287, 11287, 11287, 11288, 11288, 11288,
    11288, 11288, 11288, 11288, 11288, 11288, 11288, 11288, 11288, 11288,
    11288, 11288, 11288, 11288, 11289, 11289, 11289, 11289, 11289, 11289,
    11289, 11289, 11289, 11289, 11289, 11289, 11289, 11289, 11289, 11289,
    11289, 11289, 11290, 11290, 11290, 11290, 11290, 11290, 11290, 11290,
    11290, 11290, 11290, 11290, 11290, 11290, 11290, 11290, 11290, 11290,
    11291, 11291, 11291, 11291, 11291, 11291, 11291, 11291, 11291, 11291,
    11291, 11291, 11291, 11291, 11291, 11291, 11291, 11292, 11292, 11292,
    11292, 11292, 11292, 11292, 11292, 11292, 11292, 11292, 11292, 11292,
    11292, 11292, 11292, 11292, 11292, 11293, 11293, 11293, 11293, 11293,
    11293, 11293, 11293, 11293, 11293, 11293, 11293, 11293, 11293, 11293,
    11293, 11293, 11293, 11293, 11294, 11294, 11294, 11294, 11294, 11294,
    11294, 11294, 11294, 11294, 11294, 11294, 11294, 11294, 11294, 11294,
    11294, 11294, 11295, 11295, 11295, 11295, 11295, 11295, 11295, 11295,
    11295, 11295, 11295, 11295, 11295, 11295, 11295, 11295, 11295, 11295,
    11295, 11296, 11296, 11296, 11296, 11296, 11296, 11296, 11296, 11296,
    11296, 11296, 11296, 11296, 11296, 11296, 11296, 11296, 11296, 11297,
    11297, 11297, 11297, 11297, 11297, 11297, 11297, 11297, 11297, 11297,
    11297, 11297, 11297, 11297, 11297, 11297, 11297, 11297, 11298, 11298,
    11298, 11298, 11298, 11298, 11298, 11298, 11298, 11298, 11298, 11298,
    11298, 11298, 11298, 11298, 11298, 11298, 11298, 11299, 11299, 11299,
    11299, 11299, 11299, 11299, 11299, 11299, 11299, 11299, 11299, 11299,
    11299, 11299, 11299, 11299, 11299, 11299, 11299, 11300, 11300, 11300,
    11300, 11300, 11300, 11300, 11300, 11300, 11300, 11300, 11300, 11300,
    11300, 11300, 11300, 11300, 11300, 11300, 11301, 11301, 11301, 11301,
    11301, 11301, 11301, 11301, 11301, 11301, 11301, 11301, 11301, 11301,
    11301, 11301, 11301, 11301, 11301, 11302, 11302, 11302, 11302, 11302,
    11302, 11302, 11302, 11302, 11302, 11302, 11302, 11302, 11302, 11302,
    11302, 11302, 11302, 11302, 11302, 11303, 11303, 11303, 11303, 11303,
    11303, 11303, 11303, 11303, 11303, 11303, 11303, 11303, 11303, 11303,
    11303, 11303, 11303, 11303, 11303, 11304, 11304, 11304, 11304, 11304,
    11304, 11304, 11304, 11304, 11304, 11304, 11304, 11304, 11304, 11304,
    11304, 11304, 11304, 11304, 11304, 11305, 11305, 11305, 11305, 11305,
    11305, 11305, 11305, 11305, 11305, 11305, 11305, 11305, 11305, 11305,
    11305, 11305, 11305, 11305, 11305, 11305, 11306, 11306, 11306, 11306,
    11306, 11306, 11306, 11306, 11306, 11306, 11306, 11306, 11306, 11306,
    11306, 11306, 11306, 11306, 11306, 11306, 11307, 11307, 11307, 11307,
    11307, 11307, 11307, 11307, 11307, 11307, 11307, 11307, 11307, 11307,
    11307, 11307, 11307, 11307, 11307, 11307, 11307, 11308, 11308, 11308,
    11308, 11308, 11308, 11308, 11308, 11308, 11308, 11308, 11308, 11308,
    11308, 11308, 11308, 11308, 11308, 11308, 11308, 11308, 11309, 11309,
    11309, 11309, 11309, 11309, 11309, 11309, 11309, 11309, 11309, 11309,
    11309, 11309, 11309, 11309, 11309, 11309, 11309, 11309, 11309, 11310,
    11310, 11310, 11310, 11310, 11310, 11310, 11310, 11310, 11310, 11310,
    11310, 11310, 11310, 11310, 11310, 11310, 11310, 11310, 11310, 11310,
    11311, 11311, 11311, 11311, 11311, 11311, 11311, 11311, 11311, 11311,
    11311, 11311, 11311, 11311, 11311, 11311, 11311, 11311, 11311, 11311,
    11311, 11311, 11312, 11312, 11312, 11312, 11312, 11312, 11312, 11312,
    11312, 11312, 11312, 11312, 11312, 11312, 11312, 11312, 11312, 11312,
    11312, 11312, 11312, 11313, 11313, 11313, 11313, 11313, 11313, 11313,
    11313, 11313, 11313, 11313, 11313, 11313, 11313, 11313, 11313, 11313,
    11313, 11313, 11313, 11313, 11313, 11314, 11314, 11314, 11314, 11314,
    11314, 11314, 11314, 11314, 11314, 11314, 11314, 11314, 11314, 11314,
    11314, 11314, 11314, 11314, 11314, 11314, 11314, 11315, 11315, 11315,
    11315, 11315, 11315, 11315, 11315, 11315, 11315, 11315, 11315, 11315,
    11315, 11315, 11315, 11315, 11315, 11315, 11315, 11315, 11315, 11315,
    11316, 11316, 11316, 11316, 11316, 11316, 11316, 11316, 11316, 11316,
    11316, 11316, 11316, 11316, 11316, 11316, 11316, 11316, 11316, 11316,
    11316, 11316, 11317, 11317, 11317, 11317, 11317, 11317, 11317, 11317,
    11317, 11317, 11317, 11317, 11317, 11317, 11317, 11317, 11317, 11317,
    11317, 11317, 11317, 11317, 11317, 11318, 11318, 11318, 11318, 11318,
    11318, 11318, 11318, 11318, 11318, 11318, 11318, 11318, 11318, 11318,
    11318, 11318, 11318, 11318, 11318, 11318, 11318, 11318, 11319, 11319,
    11319, 11319, 11319, 11319, 11319, 11319, 11319, 11319, 11319, 11319,
    11319, 11319, 11319, 11319, 11319, 11319, 11319, 11319, 11319, 11319,
    11319, 11320, 11320, 11320, 11320, 11320, 11320, 11320, 11320, 11320,
    11320, 11320, 11320, 11320, 11320, 11320, 11320, 11320, 11320, 11320,
    11320, 11320, 11320, 11320, 11320, 11321, 11321, 11321, 11321, 11321,
    11321, 11321, 11321, 11321, 11321, 11321, 11321, 11321, 11321, 11321,
    11321, 11321, 11321, 11321, 11321, 11321, 11321, 11321, 11322, 11322,
    11322, 11322, 11322, 11322, 11322, 11322, 11322, 11322, 11322, 11322,
    11322, 11322, 11322, 11322, 11322, 11322, 11322, 11322, 11322, 11322,
    11322, 11322, 11323, 11323, 11323, 11323, 11323, 11323, 11323, 11323,
    11323, 11323, 11323, 11323, 11323, 11323, 11323, 11323, 11323, 11323,
    11323, 11323, 11323, 11323, 11323, 11323, 11323, 11324, 11324, 11324,
    11324, 11324, 11324, 11324, 11324, 11324, 11324, 11324, 11324, 11324,
    11324, 11324, 11324, 11324, 11324, 11324, 11324, 11324, 11324, 11324,
    11324, 11325, 11325, 11325, 11325, 11325, 11325, 11325, 11325, 11325,
    11325, 11325, 11325, 11325, 11325, 11325, 11325, 11325, 11325, 11325,
    11325, 11325, 11325, 11325, 11325, 11325, 11326, 11326, 11326, 11326,
    11326, 11326, 11326, 11326, 11326, 11326, 11326, 11326, 11326, 11326,
    11326, 11326, 11326, 11326, 11326, 11326, 11326, 11326, 11326, 11326,
    11326, 11327, 11327, 11327, 11327, 11327, 11327, 11327, 11327, 11327,
    11327, 11327, 11327, 11327, 11327, 11327, 11327, 11327, 11327, 11327,
    11327, 11327, 11327, 11327, 11327, 11327, 11328, 11328, 11328, 11328,
    11328, 11328, 11328, 11328, 11328, 11328, 11328, 11328, 11328, 11328,
    11328, 11328, 11328, 11328, 11328, 11328, 11328, 11328, 11328, 11328,
    11328, 11329, 11329, 11329, 11329, 11329, 11329, 11329, 11329, 11329,
    11329, 11329, 11329, 11329, 11329, 11329, 11329, 11329, 11329, 11329,
    11329, 11329, 11329, 11329, 11329, 11329, 11329, 11330, 11330, 11330,
    11330, 11330, 11330, 11330, 11330, 11330, 11330, 11330, 11330, 11330,
    11330, 11330, 11330, 11330, 11330, 11330, 11330, 11330, 11330, 11330,
    11330, 11330, 11330, 11331, 11331, 11331, 11331, 11331, 11331, 11331,
    11331, 11331, 11331, 11331, 11331, 11331, 11331, 11331, 11331, 11331,
    11331, 11331, 11331, 11331, 11331, 11331, 11331, 11331, 11331, 11332,
    11332, 11332, 11332, 11332, 11332, 11332, 11332, 11332, 11332, 11332,
    11332, 11332, 11332, 11332, 11332, 11332, 11332, 11332, 11332, 11332,
    11332, 11332, 11332, 11332, 11332, 11332, 11333, 11333, 11333, 11333,
    11333, 11333, 11333, 11333, 11333, 11333, 11333, 11333, 11333, 11333,
    11333, 11333, 11333, 11333, 11333, 11333, 11333, 11333, 11333, 11333,
    11333, 11333, 11333, 11334, 11334, 11334, 11334, 11334, 11334, 11334,
    11334, 11334, 11334, 11334, 11334, 11334, 11334, 11334, 11334, 11334,
    11334, 11334, 11334, 11334, 11334, 11334, 11334, 11334, 11334, 11334,
    11335, 11335, 11335, 11335, 11335, 11335, 11335, 11335, 11335, 11335,
    11335, 11335, 11335, 11335, 11335, 11335, 11335, 11335, 11335, 11335,
    11335, 11335, 11335, 11335, 11335, 11335, 11335, 11336, 11336, 11336,
    11336, 11336, 11336, 11336, 11336, 11336, 11336, 11336, 11336, 11336,
    11336, 11336, 11336, 11336, 11336, 11336, 11336, 11336, 11336, 11336,
    11336, 11336, 11336, 11336, 11336, 11337, 11337, 11337, 11337, 11337,
    11337, 11337, 11337, 11337, 11337, 11337, 11337, 11337, 11337, 11337,
    11337, 11337, 11337, 11337, 11337, 11337, 11337, 11337, 11337, 11337,
    11337, 11337, 11337, 11338, 11338, 11338, 11338, 11338, 11338, 11338,
    11338, 11338, 11338, 11338, 11338, 11338, 11338, 11338, 11338, 11338,
    11338, 11338, 11338, 11338, 11338, 11338, 11338, 11338, 11338, 11338,
    11338, 11338, 11339, 11339, 11339, 11339, 11339, 11339, 11339, 11339,
    11339, 11339, 11339, 11339, 11339, 11339, 11339, 11339, 11339, 11339,
    11339, 11339, 11339, 11339, 11339, 11339, 11339, 11339, 11339, 11339,
    11340, 11340, 11340, 11340, 11340, 11340, 11340, 11340, 11340, 11340,
    11340, 11340, 11340, 11340, 11340, 11340, 11340, 11340, 11340, 11340,
    11340, 11340, 11340, 11340, 11340, 11340, 11340, 11340, 11340, 11341,
    11341, 11341, 11341, 11341, 11341, 11341, 11341, 11341, 11341, 11341,
    11341, 11341, 11341, 11341, 11341, 11341, 11341, 11341, 11341, 11341,
    11341, 11341, 11341, 11341, 11341, 11341, 11341, 11341, 11342, 11342,
    11342, 11342, 11342, 11342, 11342, 11342, 11342, 11342, 11342, 11342,
    11342, 11342, 11342, 11342, 11342, 11342, 11342, 11342, 11342, 11342,
    11342, 11342, 11342, 11342, 11342, 11342, 11342, 11342, 11343, 11343,
    11343, 11343, 11343, 11343, 11343, 11343, 11343, 11343, 11343, 11343,
    11343, 11343, 11343, 11343, 11343, 11343, 11343, 11343, 11343, 11343,
    11343, 11343, 11343, 11343, 11343, 11343, 11343, 11343, 11344, 11344,
    11344, 11344, 11344, 11344, 11344, 11344, 11344, 11344, 11344, 11344,
    11344, 11344, 11344, 11344, 11344, 11344, 11344, 11344, 11344, 11344,
    11344, 11344, 11344, 11344, 11344, 11344, 11344, 11344, 11345, 11345,
    11345, 11345, 11345, 11345, 11345, 11345, 11345, 11345, 11345, 11345,
    11345, 11345, 11345, 11345, 11345, 11345, 11345, 11345, 11345, 11345,
    11345, 11345, 11345, 11345, 11345, 11345, 11345, 11345, 11345, 11346,
    11346, 11346, 11346, 11346, 11346, 11346, 11346, 11346, 11346, 11346,
    11346, 11346, 11346, 11346, 11346, 11346, 11346, 11346, 11346, 11346,
    11346, 11346, 11346, 11346, 11346, 11346, 11346, 11346, 11346, 11346,
    11347, 11347, 11347, 11347, 11347, 11347, 11347, 11347, 11347, 11347,
    11347, 11347, 11347, 11347, 11347, 11347, 11347, 11347, 11347, 11347,
    11347, 11347, 11347, 11347, 11347, 11347, 11347, 11347, 11347, 11347,
    11347, 11348, 11348, 11348, 11348, 11348, 11348, 11348, 11348, 11348,
    11348, 11348, 11348, 11348, 11348, 11348, 11348, 11348, 11348, 11348,
    11348, 11348, 11348, 11348, 11348, 11348, 11348, 11348, 11348, 11348,
    11348, 11348, 11348, 11349, 11349, 11349, 11349, 11349, 11349, 11349,
    11349, 11349, 11349, 11349, 11349, 11349, 11349, 11349, 11349, 11349,
    11349, 11349, 11349, 11349, 11349, 11349, 11349, 11349, 11349, 11349,
    11349, 11349, 11349, 11349, 11349, 11350, 11350, 11350, 11350, 11350,
    11350, 11350, 11350, 11350, 11350, 11350, 11350, 11350, 11350, 11350,
    11350, 11350, 11350, 11350, 11350, 11350, 11350, 11350, 11350, 11350,
    11350, 11350, 11350, 11350, 11350, 11350, 11350, 11350, 11351, 11351,
    11351, 11351, 11351, 11351, 11351, 11351, 11351, 11351, 11351, 11351,
    11351, 11351, 11351, 11351, 11351, 11351, 11351, 11351, 11351, 11351,
    11351, 11351, 11351, 11351, 11351, 11351, 11351, 11351, 11351, 11351,
    11351, 11352, 11352, 11352, 11352, 11352, 11352, 11352, 11352, 11352,
    11352, 11352, 11352, 11352, 11352, 11352, 11352, 11352, 11352, 11352,
    11352, 11352, 11352, 11352, 11352, 11352, 11352, 11352, 11352, 11352,
    11352, 11352, 11352, 11352, 11353, 11353, 11353, 11353, 11353, 11353,
    11353, 11353, 11353, 11353, 11353, 11353, 11353, 11353, 11353, 11353,
    11353, 11353, 11353, 11353, 11353, 11353, 11353, 11353, 11353, 11353,
    11353, 11353, 11353, 11353, 11353, 11353, 11353, 11353, 11354, 11354,
    11354, 11354, 11354, 11354, 11354, 11354, 11354, 11354, 11354, 11354,
    11354, 11354, 11354, 11354, 11354, 11354, 11354, 11354, 11354, 11354,
    11354, 11354, 11354, 11354, 11354, 11354, 11354, 11354, 11354, 11354,
    11354, 11354, 11355, 11355, 11355, 11355, 11355, 11355, 11355, 11355,
    11355, 11355, 11355, 11355, 11355, 11355, 11355, 11355, 11355, 11355,
    11355, 11355, 11355, 11355, 11355, 11355, 11355, 11355, 11355, 11355,
    11355, 11355, 11355, 11355, 11355, 11355, 11356, 11356, 11356, 11356,
    11356, 11356, 11356, 11356, 11356, 11356, 11356, 11356, 11356, 11356,
    11356, 11356, 11356, 11356, 11356, 11356, 11356, 11356, 11356, 11356,
    11356, 11356, 11356, 11356, 11356, 11356, 11356, 11356, 11356, 11356,
    11356, 11357, 11357, 11357, 11357, 11357, 11357, 11357, 11357, 11357,
    11357, 11357, 11357, 11357, 11357, 11357, 11357, 11357, 11357, 11357,
    11357, 11357, 11357, 11357, 11357, 11357, 11357, 11357, 11357, 11357,
    11357, 11357, 11357, 11357, 11357, 11357, 11358, 11358, 11358, 11358,
    11358, 11358, 11358, 11358, 11358, 11358, 11358, 11358, 11358, 11358,
    11358, 11358, 11358, 11358, 11358, 11358, 11358, 11358, 11358, 11358,
    11358, 11358, 11358, 11358, 11358, 11358, 11358, 11358, 11358, 11358,
    11358, 11358, 11359, 11359, 11359, 11359, 11359, 11359, 11359, 11359,
    11359, 11359, 11359, 11359, 11359, 11359, 11359, 11359, 11359, 11359,
    11359, 11359, 11359, 11359, 11359, 11359, 11359, 11359, 11359, 11359,
    11359, 11359, 11359, 11359, 11359, 11359, 11359, 11359, 11360, 11360,
    11360, 11360, 11360, 11360, 11360, 11360, 11360, 11360, 11360, 11360,
    11360, 11360, 11360, 11360, 11360, 11360, 11360, 11360, 11360, 11360,
    11360, 11360, 11360, 11360, 11360, 11360, 11360, 11360, 11360, 11360,
    11360, 11360, 11360, 11360, 11360, 11361, 11361, 11361, 11361, 11361,
    11361, 11361, 11361, 11361, 11361, 11361, 11361, 11361, 11361, 11361,
    11361, 11361, 11361, 11361, 11361, 11361, 11361, 11361, 11361, 11361,
    11361, 11361, 11361, 11361, 11361, 11361, 11361, 11361, 11361, 11361,
    11361, 11361, 11362, 11362, 11362, 11362, 11362, 11362, 11362, 11362,
    11362, 11362, 11362, 11362, 11362, 11362, 11362, 11362, 11362, 11362,
    11362, 11362, 11362, 11362, 11362, 11362, 11362, 11362, 11362, 11362,
    11362, 11362, 11362, 11362, 11362, 11362, 11362, 11362, 11362, 11362,
    11363, 11363, 11363, 11363, 11363, 11363, 11363, 11363, 11363, 11363,
    11363, 11363, 11363, 11363, 11363, 11363, 11363, 11363, 11363, 11363,
    11363, 11363, 11363, 11363, 11363, 11363, 11363, 11363, 11363, 11363,
    11363, 11363, 11363, 11363, 11363, 11363, 11363, 11363, 11364, 11364,
    11364, 11364, 11364, 11364, 11364, 11364, 11364, 11364, 11364, 11364,
    11364, 11364, 11364, 11364, 11364, 11364, 11364, 11364, 11364, 11364,
    11364, 11364, 11364, 11364, 11364, 11364, 11364, 11364, 11364, 11364,
    11364, 11364, 11364, 11364, 11364, 11364, 11365, 11365, 11365, 11365,
    11365, 11365, 11365, 11365, 11365, 11365, 11365, 11365, 11365, 11365,
    11365, 11365, 11365, 11365, 11365, 11365, 11365, 11365, 11365, 11365,
    11365, 11365, 11365, 11365, 11365, 11365, 11365, 11365, 11365, 11365,
    11365, 11365, 11365, 11365, 11365, 11365, 11366, 11366, 11366, 11366,
    11366, 11366, 11366, 11366, 11366, 11366, 11366, 11366, 11366, 11366,
    11366, 11366, 11366, 11366, 11366, 11366, 11366, 11366, 11366, 11366,
    11366, 11366, 11366, 11366, 11366, 11366, 11366, 11366, 11366, 11366,
    11366, 11366, 11366, 11366, 11366, 11367, 11367, 11367, 11367, 11367,
    11367, 11367, 11367, 11367, 11367, 11367, 11367, 11367, 11367, 11367,
    11367, 11367, 11367, 11367, 11367, 11367, 11367, 11367, 11367, 11367,
    11367, 11367, 11367, 11367, 11367, 11367, 11367, 11367, 11367, 11367,
    11367, 11367, 11367, 11367, 11367, 11368, 11368, 11368, 11368, 11368,
    11368, 11368, 11368, 11368, 11368, 11368, 11368, 11368, 11368, 11368,
    11368, 11368, 11368, 11368, 11368, 11368, 11368, 11368, 11368, 11368,
    11368, 11368, 11368, 11368, 11368, 11368, 11368, 11368, 11368, 11368,
    11368, 11368, 11368, 11368, 11368, 11368, 11369, 11369, 11369, 11369,
    11369, 11369, 11369, 11369, 11369, 11369, 11369, 11369, 11369, 11369,
    11369, 11369, 11369, 11369, 11369, 11369, 11369, 11369, 11369, 11369,
    11369, 11369, 11369, 11369, 11369, 11369, 11369, 11369, 11369, 11369,
    11369, 11369, 11369, 11369, 11369, 11369, 11369, 11370, 11370, 11370,
    11370, 11370, 11370, 11370, 11370, 11370, 11370, 11370, 11370, 11370,
    11370, 11370, 11370, 11370, 11370, 11370, 11370, 11370, 11370, 11370,
    11370, 11370, 11370, 11370, 11370, 11370, 11370, 11370, 11370, 11370,
    11370, 11370, 11370, 11370, 11370, 11370, 11370, 11370, 11370, 11371,
    11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371,
    11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371,
    11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371,
    11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371, 11371,
    11371, 11372, 11372, 11372, 11372, 11372, 11372, 11372, 11372, 11372,
    11372, 11372, 11372, 11372, 11372, 11372, 11372, 11372, 11372, 11372,
    11372, 11372, 11372, 11372, 11372, 11372, 11372, 11372, 11372, 11372,
    11372, 11372, 11372, 11372, 11372, 11372, 11372, 11372, 11372, 11372,
    11372, 11372, 11372, 11372, 11373, 11373, 11373, 11373, 11373, 11373,
    11373, 11373, 11373, 11373, 11373, 11373, 11373, 11373, 11373, 11373,
    11373, 11373, 11373, 11373, 11373, 11373, 11373, 11373, 11373, 11373,
    11373, 11373, 11373, 11373, 11373, 11373, 11373, 11373, 11373, 11373,
    11373, 11373, 11373, 11373, 11373, 11373, 11373, 11374, 11374, 11374,
    11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374,
    11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374,
    11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374,
    11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374, 11374,
    11374, 11375, 11375, 11375, 11375, 11375, 11375, 11375, 11375, 11375,
    11375, 11375, 11375, 11375, 11375, 11375, 11375, 11375, 11375, 11375,
    11375, 11375, 11375, 11375, 11375, 11375, 11375, 11375, 11375, 11375,
    11375, 11375, 11375, 11375, 11375, 11375, 11375, 11375, 11375, 11375,
    11375, 11375, 11375, 11375, 11375, 11375, 11376, 11376, 11376, 11376,
    11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376,
    11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376,
    11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376,
    11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376, 11376,
    11376, 11377, 11377, 11377, 11377, 11377, 11377, 11377, 11377, 11377,
    11377, 11377, 11377, 11377, 11377, 11377, 11377, 11377, 11377, 11377,
    11377, 11377, 11377, 11377, 11377, 11377, 11377, 11377, 11377, 11377,
    11377, 11377, 11377, 11377, 11377, 11377, 11377, 11377, 11377, 11377,
    11377, 11377, 11377, 11377, 11377, 11377, 11377, 11378, 11378, 11378,
    11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378,
    11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378,
    11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378,
    11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378, 11378,
    11378, 11378, 11378, 11378, 11379, 11379, 11379, 11379, 11379, 11379,
    11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379,
    11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379,
    11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379,
    11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379, 11379,
    11379, 11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380,
    11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380,
    11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380,
    11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380,
    11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380, 11380, 11381,
    11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381,
    11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381,
    11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381,
    11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381,
    11381, 11381, 11381, 11381, 11381, 11381, 11381, 11381, 11382, 11382,
    11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382,
    11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382,
    11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382,
    11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382, 11382,
    11382, 11382, 11382, 11382, 11382, 11382, 11382, 11383, 11383, 11383,
    11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383,
    11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383,
    11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383,
    11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383, 11383,
    11383, 11383, 11383, 11383, 11383, 11383, 11383, 11384, 11384, 11384,
    11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384,
    11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384,
    11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384,
    11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384,
    11384, 11384, 11384, 11384, 11384, 11384, 11384, 11384, 11385, 11385,
    11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385,
    11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385,
    11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385,
    11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385,
    11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385, 11385, 11386,
    11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386,
    11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386,
    11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386,
    11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386,
    11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386, 11386,
    11386, 11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387,
    11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387,
    11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387,
    11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387,
    11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387, 11387,
    11387, 11387, 11387, 11387, 11387, 11388, 11388, 11388, 11388, 11388,
    11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388,
    11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388,
    11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388,
    11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388,
    11388, 11388, 11388, 11388, 11388, 11388, 11388, 11388, 11389, 11389,
    11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389,
    11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389,
    11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389,
    11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389,
    11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389, 11389,
    11389, 11389, 11389, 11390, 11390, 11390, 11390, 11390, 11390, 11390,
    11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390,
    11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390,
    11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390,
    11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390,
    11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390, 11390, 11391,
    11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391,
    11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391,
    11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391,
    11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391,
    11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391, 11391,
    11391, 11391, 11391, 11391, 11391, 11392, 11392, 11392, 11392, 11392,
    11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392,
    11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392,
    11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392,
    11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392,
    11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392, 11392,
    11392, 11392, 11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393,
    11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393,
    11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393,
    11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393,
    11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393,
    11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393, 11393,
    11393, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394,
    11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394,
    11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394,
    11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394,
    11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394,
    11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394, 11394,
    11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395,
    11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395,
    11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395,
    11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395,
    11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395,
    11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395, 11395,
    11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396,
    11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396,
    11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396,
    11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396,
    11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396,
    11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396, 11396,
    11396, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397,
    11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397,
    11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397,
    11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397,
    11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397,
    11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397, 11397,
    11397, 11397, 11397, 11398, 11398, 11398, 11398, 11398, 11398, 11398,
    11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398,
    11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398,
    11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398,
    11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398,
    11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398, 11398,
    11398, 11398, 11398, 11398, 11398, 11398, 11399, 11399, 11399, 11399,
    11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399,
    11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399,
    11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399,
    11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399,
    11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399,
    11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399, 11399,
    11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400,
    11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400,
    11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400,
    11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400,
    11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400,
    11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400, 11400,
    11400, 11400, 11400, 11400, 11400, 11401, 11401, 11401, 11401, 11401,
    11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401,
    11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401,
    11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401,
    11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401,
    11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401,
    11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401, 11401,
    11401, 11401, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402,
    11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402,
    11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402,
    11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402,
    11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402,
    11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402,
    11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11402, 11403,
    11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403,
    11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403,
    11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403,
    11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403,
    11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403,
    11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403,
    11403, 11403, 11403, 11403, 11403, 11403, 11403, 11403, 11404, 11404,
    11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404,
    11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404,
    11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404,
    11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404,
    11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404,
    11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404, 11404,
    11404, 11404, 11404, 11404, 11404, 11404, 11404, 11405, 11405, 11405,
    11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405,
    11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405,
    11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405,
    11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405,
    11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405,
    11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405,
    11405, 11405, 11405, 11405, 11405, 11405, 11405, 11405, 11406, 11406,
    11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406,
    11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406,
    11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406,
    11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406,
    11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406,
    11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406,
    11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406, 11406,
    11406, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407,
    11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407,
    11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407,
    11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407,
    11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407,
    11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407,
    11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407, 11407,
    11407, 11407, 11407, 11407, 11408, 11408, 11408, 11408, 11408, 11408,
    11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408,
    11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408,
    11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408,
    11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408,
    11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408,
    11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408,
    11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11408, 11409,
    11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409,
    11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409,
    11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409,
    11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409,
    11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409,
    11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409,
    11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409, 11409,
    11409, 11409, 11409, 11409, 11409, 11410, 11410, 11410, 11410, 11410,
    11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410,
    11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410,
    11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410,
    11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410,
    11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410,
    11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410,
    11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410, 11410,
    11410, 11410, 11410, 11411, 11411, 11411, 11411, 11411, 11411, 11411,
    11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411,
    11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411,
    11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411,
    11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411,
    11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411,
    11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411,
    11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411, 11411,
    11411, 11411, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412,
    11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412,
    11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412,
    11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412,
    11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412,
    11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412,
    11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412,
    11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412, 11412,
    11412, 11412, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413,
    11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413,
    11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413,
    11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413,
    11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413,
    11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413,
    11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413,
    11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413, 11413,
    11413, 11413, 11413, 11413, 11414, 11414, 11414, 11414, 11414, 11414,
    11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414,
    11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414,
    11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414,
    11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414,
    11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414,
    11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414,
    11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414,
    11414, 11414, 11414, 11414, 11414, 11414, 11414, 11414, 11415, 11415,
    11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415,
    11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415,
    11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415,
    11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415,
    11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415,
    11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415,
    11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415,
    11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415, 11415,
    11415, 11415, 11415, 11416, 11416, 11416, 11416, 11416, 11416, 11416,
    11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416,
    11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416,
    11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416,
    11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416,
    11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416,
    11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416,
    11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416,
    11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416, 11416,
    11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417,
    11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417,
    11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417,
    11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417,
    11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417,
    11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417,
    11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417,
    11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417,
    11417, 11417, 11417, 11417, 11417, 11417, 11417, 11417, 11418, 11418,
    11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418,
    11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418,
    11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418,
    11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418,
    11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418,
    11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418,
    11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418,
    11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418,
    11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11418, 11419,
    11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419,
    11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419,
    11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419,
    11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419,
    11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419,
    11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419,
    11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419,
    11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419,
    11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419, 11419,
    11419, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420,
    11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420,
    11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420,
    11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420,
    11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420,
    11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420,
    11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420,
    11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420,
    11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420, 11420,
    11420, 11420, 11420, 11420, 11421, 11421, 11421, 11421, 11421, 11421,
    11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421,
    11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421,
    11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421,
    11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421,
    11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421,
    11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421,
    11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421,
    11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421,
    11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421, 11421,
    11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422,
    11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422,
    11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422,
    11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422,
    11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422,
    11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422,
    11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422,
    11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422,
    11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422,
    11422, 11422, 11422, 11422, 11422, 11422, 11422, 11422, 11423, 11423,
    11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423,
    11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423,
    11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423,
    11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423,
    11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423,
    11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423,
    11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423,
    11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423,
    11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423,
    11423, 11423, 11423, 11423, 11423, 11423, 11423, 11423, 11424, 11424,
    11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424,
    11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424,
    11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424,
    11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424,
    11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424,
    11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424,
    11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424,
    11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424,
    11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424,
    11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424, 11424,
    11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425,
    11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425,
    11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425,
    11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425,
    11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425,
    11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425,
    11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425,
    11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425,
    11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425,
    11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425, 11425,
    11425, 11425, 11425, 11425, 11426, 11426, 11426, 11426, 11426, 11426,
    11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426,
    11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426,
    11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426,
    11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426,
    11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426,
    11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426,
    11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426,
    11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426,
    11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426,
    11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426, 11426,
    11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427,
    11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427,
    11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427,
    11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427,
    11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427,
    11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427,
    11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427,
    11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427,
    11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427,
    11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427,
    11427, 11427, 11427, 11427, 11427, 11427, 11427, 11427, 11428, 11428,
    11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428,
    11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428,
    11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428,
    11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428,
    11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428,
    11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428,
    11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428,
    11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428,
    11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428,
    11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428,
    11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11428, 11429,
    11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429,
    11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429,
    11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429,
    11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429,
    11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429,
    11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429,
    11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429,
    11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429,
    11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429,
    11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429,
    11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429, 11429,
    11429, 11429, 11429, 11430, 11430, 11430, 11430, 11430, 11430, 11430,
    11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430,
    11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430,
    11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430,
    11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430,
    11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430,
    11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430,
    11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430,
    11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430,
    11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430,
    11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430,
    11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11430, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431, 11431,
    11431, 11431, 11431, 11431, 11431, 11431, 11431, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432,
    11432, 11432, 11432, 11432, 11432, 11432, 11432, 11432, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433, 11433,
    11433, 11433, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434,
    11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11434, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435,
    11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11435, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436, 11436,
    11436, 11436, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437,
    11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11437, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438,
    11438, 11438, 11438, 11438, 11438, 11438, 11438, 11438, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439, 11439,
    11439, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440,
    11440, 11440, 11440, 11440, 11440, 11440, 11440, 11440, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441,
    11441, 11441, 11441, 11441, 11441, 11441, 11441, 11441, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442, 11442,
    11442, 11442, 11442, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443, 11443,
    11443, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444, 11444,
    11444, 11444, 11444, 11444, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445, 11445,
    11445, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446, 11446,
    11446, 11446, 11447, 11447, 11447, 11447, 11447, 11447, 11447, 11447,
    11447, 11447, 11447, 11447, 11447, 11447, 11447, 11447, 11447, 11447,
    11447, 11447, 11447, 11447, 11447, 11447, 11447, 11447, 11447, 11447];
let EmptyKeyboard = {
    getEmptyKeyboard: function () {
        "use strict";
        return {
            isPressed: function (key) { return false; }
        };
    }
};
let EmptyMouse = {
    getEmptyMouse: function () {
        "use strict";
        return {
            isLeftMouseButtonPressed: function () { return false; },
            isRightMouseButtonPressed: function () { return false; },
            getX: function () { return 0; },
            getY: function () { return 0; }
        };
    }
};
let FileIO = {};
((function () {
    "use strict";
    let getNamespace = function (fileId, version) {
        return "guid" + version.alphanumericVersionGuid + "_file" + fileId;
    };
    let convertToBase64 = function (byteList) {
        let stringArray = [];
        for (let i = 0; i < byteList.length; i++)
            stringArray.push(String.fromCharCode(byteList[i]));
        let str = stringArray.join("");
        return btoa(str);
    };
    let convertFromBase64 = function (str) {
        let result = atob(str);
        let returnValue = [];
        for (let i = 0; i < result.length; i++) {
            returnValue.push(result.charCodeAt(i));
        }
        return returnValue;
    };
    FileIO.persistData = function (fileId, version, byteList) {
        let namespace = getNamespace(fileId, version);
        let base64Data = convertToBase64(byteList);
        try {
            localStorage.setItem(namespace, base64Data);
        }
        catch (error) {
            // do nothing
        }
    };
    FileIO.fetchData = function (fileId, version) {
        let namespace = getNamespace(fileId, version);
        try {
            let value = localStorage.getItem(namespace);
            if (value === null)
                return null;
            return convertFromBase64(value);
        }
        catch (error) {
            return null;
        }
    };
})());
let GameFontUtil = {
    getFontNames: function () {
        return [
            0 /* GameFont.SimpleFont */
        ];
    },
    getFontFilename: function (font) {
        switch (font) {
            case 0 /* GameFont.SimpleFont */: return "Metaflop/dtsimplefont.woff";
        }
    }
};
let GameImageUtil = {
    getImageNames: function () {
        return [
            0 /* GameImage.SoundOn_Black */,
            1 /* GameImage.SoundOff_Black */,
            2 /* GameImage.MusicOn_Black */,
            3 /* GameImage.MusicOff_Black */,
            4 /* GameImage.SoundOn_White */,
            5 /* GameImage.SoundOff_White */,
            6 /* GameImage.MusicOn_White */,
            7 /* GameImage.MusicOff_White */,
            8 /* GameImage.KonqiAir */,
            9 /* GameImage.TinyFlame */,
            10 /* GameImage.TinyFlameBlue */,
            11 /* GameImage.FlyAmanita */,
            12 /* GameImage.Smartcap */,
            13 /* GameImage.Smartcap_Mirrored */,
            14 /* GameImage.Snowfly */,
            15 /* GameImage.Snowfly_Mirrored */,
            16 /* GameImage.OgJumpy */,
            17 /* GameImage.OgJumpy_Mirrored */,
            18 /* GameImage.Ocean */,
            19 /* GameImage.Noone */,
            20 /* GameImage.NooneIce */,
            21 /* GameImage.ExplodeF */,
            22 /* GameImage.Strawberry */,
            23 /* GameImage.Freezewave */,
            24 /* GameImage.Poof */,
            25 /* GameImage.OverworldTileset_Snow */,
            26 /* GameImage.OverworldTileset_PathDirt */,
            27 /* GameImage.OverworldTileset_TownsSnow */,
            28 /* GameImage.LevelIcons */,
            29 /* GameImage.KonqiO */,
            30 /* GameImage.OwlBrown */,
            31 /* GameImage.DarkKonqi */,
            32 /* GameImage.DarkKonqi_Mirrored */,
            33 /* GameImage.Spikes */,
            34 /* GameImage.Icicle */,
            35 /* GameImage.IcicleGreen */,
            36 /* GameImage.Flame */,
            37 /* GameImage.FlameBlue */,
            38 /* GameImage.FlameGreen */,
            39 /* GameImage.Fireball */,
            40 /* GameImage.CyraDoll */,
            41 /* GameImage.DashieDoll */,
            42 /* GameImage.Iceball */,
            43 /* GameImage.IceballBlue */,
            44 /* GameImage.IceballGreen */,
            45 /* GameImage.Coin */,
            46 /* GameImage.Skull */,
            47 /* GameImage.BossHealth */,
            48 /* GameImage.BossDoor */,
            49 /* GameImage.ExplodeI */,
            50 /* GameImage.ExplodeIGreen */,
            51 /* GameImage.BouncySnow */,
            52 /* GameImage.BouncySnow_Mirrored */,
            53 /* GameImage.TsSnow */,
            54 /* GameImage.TsCastle */,
            55 /* GameImage.Rail */,
            56 /* GameImage.Sawblade */,
            57 /* GameImage.SignPost */,
            58 /* GameImage.Igloo */,
            59 /* GameImage.IceCaveTiles */,
            60 /* GameImage.Treetops */,
            61 /* GameImage.Level1Screenshot */,
            62 /* GameImage.Level2Screenshot */,
            63 /* GameImage.Level3Screenshot */,
            64 /* GameImage.Yeti */,
            65 /* GameImage.Yeti_Mirrored */,
            66 /* GameImage.HitYellow */,
            67 /* GameImage.HitYellow_Mirrored */
        ];
    },
    getFilename: function (image) {
        switch (image) {
            case 0 /* GameImage.SoundOn_Black */: return "Kenney/SoundOn_Black.png";
            case 1 /* GameImage.SoundOff_Black */: return "Kenney/SoundOff_Black.png";
            case 2 /* GameImage.MusicOn_Black */: return "Kenney/MusicOn_Black.png";
            case 3 /* GameImage.MusicOff_Black */: return "Kenney/MusicOff_Black.png";
            case 4 /* GameImage.SoundOn_White */: return "Kenney/SoundOn_White.png";
            case 5 /* GameImage.SoundOff_White */: return "Kenney/SoundOff_White.png";
            case 6 /* GameImage.MusicOn_White */: return "Kenney/MusicOn_White.png";
            case 7 /* GameImage.MusicOff_White */: return "Kenney/MusicOff_White.png";
            case 8 /* GameImage.KonqiAir */: return "KelvinShadewing/konqiair.png";
            case 9 /* GameImage.TinyFlame */: return "KelvinShadewing/tinyflame.png";
            case 10 /* GameImage.TinyFlameBlue */: return "KelvinShadewing/tinyflameBlue.png";
            case 11 /* GameImage.FlyAmanita */: return "KelvinShadewing/flyamanita.png";
            case 12 /* GameImage.Smartcap */: return "KelvinShadewing/smartcap.png";
            case 13 /* GameImage.Smartcap_Mirrored */: return "KelvinShadewing/smartcap_mirrored.png";
            case 14 /* GameImage.Snowfly */: return "KelvinShadewing/snowfly.png";
            case 15 /* GameImage.Snowfly_Mirrored */: return "KelvinShadewing/snowfly_mirrored.png";
            case 16 /* GameImage.OgJumpy */: return "CrystalizedSun/og-jumpy.png";
            case 17 /* GameImage.OgJumpy_Mirrored */: return "CrystalizedSun/og-jumpy_mirrored.png";
            case 18 /* GameImage.Ocean */: return "KnoblePersona/ocean.png";
            case 19 /* GameImage.Noone */: return "KelvinShadewing/noone.png";
            case 20 /* GameImage.NooneIce */: return "KelvinShadewing/noone_ice.png";
            case 21 /* GameImage.ExplodeF */: return "KelvinShadewing/explodeF.png";
            case 22 /* GameImage.Strawberry */: return "KelvinShadewing/strawberry.png";
            case 23 /* GameImage.Freezewave */: return "KelvinShadewing/freezewave.png";
            case 24 /* GameImage.Poof */: return "KelvinShadewing/poof.png";
            case 25 /* GameImage.OverworldTileset_Snow */: return "BenCreating/Snow/Snow.png";
            case 26 /* GameImage.OverworldTileset_PathDirt */: return "BenCreating/PathDirt.png";
            case 27 /* GameImage.OverworldTileset_TownsSnow */: return "BenCreating/Snow/TownsSnow.png";
            case 28 /* GameImage.LevelIcons */: return "KelvinShadewing/level-icons.png";
            case 29 /* GameImage.KonqiO */: return "KelvinShadewing/konqiO.png";
            case 30 /* GameImage.OwlBrown */: return "KelvinShadewing/owl-brown.png";
            case 31 /* GameImage.DarkKonqi */: return "KelvinShadewing/konqi_dark.png";
            case 32 /* GameImage.DarkKonqi_Mirrored */: return "KelvinShadewing/konqi_dark_mirrored.png";
            case 33 /* GameImage.Spikes */: return "FrostC/spikes.png";
            case 34 /* GameImage.Icicle */: return "KelvinShadewing/icicle.png";
            case 35 /* GameImage.IcicleGreen */: return "KelvinShadewing/icicle_green.png";
            case 36 /* GameImage.Flame */: return "KelvinShadewing/flame.png";
            case 37 /* GameImage.FlameBlue */: return "KelvinShadewing/flameBlue.png";
            case 38 /* GameImage.FlameGreen */: return "KelvinShadewing/flameGreen.png";
            case 39 /* GameImage.Fireball */: return "KelvinShadewing/fireball.png";
            case 40 /* GameImage.CyraDoll */: return "KelvinShadewing/cyradoll.png";
            case 41 /* GameImage.DashieDoll */: return "KelvinShadewing/dashie-doll.png";
            case 42 /* GameImage.Iceball */: return "KelvinShadewing/iceball.png";
            case 43 /* GameImage.IceballBlue */: return "KelvinShadewing/iceball_blue.png";
            case 44 /* GameImage.IceballGreen */: return "KelvinShadewing/iceball_green.png";
            case 45 /* GameImage.Coin */: return "KelvinShadewing/coin.png";
            case 46 /* GameImage.Skull */: return "KelvinShadewing/skull.png";
            case 47 /* GameImage.BossHealth */: return "KelvinShadewing/boss-health.png";
            case 48 /* GameImage.BossDoor */: return "KelvinShadewing/boss-door.png";
            case 49 /* GameImage.ExplodeI */: return "KelvinShadewing/explodeI.png";
            case 50 /* GameImage.ExplodeIGreen */: return "KelvinShadewing/explodeI_green.png";
            case 51 /* GameImage.BouncySnow */: return "KelvinShadewing/bouncysnow.png";
            case 52 /* GameImage.BouncySnow_Mirrored */: return "KelvinShadewing/bouncysnow_mirrored.png";
            case 53 /* GameImage.TsSnow */: return "KelvinShadewing/tssnow.png";
            case 54 /* GameImage.TsCastle */: return "Jetrel/tsCastle.png";
            case 55 /* GameImage.Rail */: return "KelvinShadewing/rail.png";
            case 56 /* GameImage.Sawblade */: return "KelvinShadewing/sawblade.png";
            case 57 /* GameImage.SignPost */: return "Nemisys/signpost.png";
            case 58 /* GameImage.Igloo */: return "KelvinShadewing/igloo.png";
            case 59 /* GameImage.IceCaveTiles */: return "KelvinShadewing/icecavetiles.png";
            case 60 /* GameImage.Treetops */: return "Treetops/treetops.png";
            case 61 /* GameImage.Level1Screenshot */: return "Screenshots/Level1Screenshot.png";
            case 62 /* GameImage.Level2Screenshot */: return "Screenshots/Level2Screenshot.png";
            case 63 /* GameImage.Level3Screenshot */: return "Screenshots/Level3Screenshot.png";
            case 64 /* GameImage.Yeti */: return "KelvinShadewing/yeti.png";
            case 65 /* GameImage.Yeti_Mirrored */: return "KelvinShadewing/yeti_mirrored.png";
            case 66 /* GameImage.HitYellow */: return "KelvinShadewing/hit-yellow.png";
            case 67 /* GameImage.HitYellow_Mirrored */: return "KelvinShadewing/hit-yellow_mirrored.png";
        }
    }
};
let GameKeyboard = {
    getKeyboard: function (disableArrowKeyScrolling) {
        "use strict";
        let keysBeingPressed = [];
        let mapKeyToCanonicalKey = function (key) {
            if (key === "A")
                return "a";
            if (key === "B")
                return "b";
            if (key === "C")
                return "c";
            if (key === "D")
                return "d";
            if (key === "E")
                return "e";
            if (key === "F")
                return "f";
            if (key === "G")
                return "g";
            if (key === "H")
                return "h";
            if (key === "I")
                return "i";
            if (key === "J")
                return "j";
            if (key === "K")
                return "k";
            if (key === "L")
                return "l";
            if (key === "M")
                return "m";
            if (key === "N")
                return "n";
            if (key === "O")
                return "o";
            if (key === "P")
                return "p";
            if (key === "Q")
                return "q";
            if (key === "R")
                return "r";
            if (key === "S")
                return "s";
            if (key === "T")
                return "t";
            if (key === "U")
                return "u";
            if (key === "V")
                return "v";
            if (key === "W")
                return "w";
            if (key === "X")
                return "x";
            if (key === "Y")
                return "y";
            if (key === "Z")
                return "z";
            if (key === "!")
                return "1";
            if (key === "@")
                return "2";
            if (key === "#")
                return "3";
            if (key === "$")
                return "4";
            if (key === "%")
                return "5";
            if (key === "^")
                return "6";
            if (key === "&")
                return "7";
            if (key === "*")
                return "8";
            if (key === "(")
                return "9";
            if (key === ")")
                return "0";
            return key;
        };
        let keyDownHandler = function (e) {
            if (disableArrowKeyScrolling) {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === " ")
                    e.preventDefault();
            }
            let key = KeyMapping[mapKeyToCanonicalKey(e.key)];
            if (key === null || key === undefined)
                return;
            for (let i = 0; i < keysBeingPressed.length; i++) {
                if (keysBeingPressed[i] === key)
                    return;
            }
            keysBeingPressed.push(key);
        };
        let keyUpHandler = function (e) {
            let key = KeyMapping[mapKeyToCanonicalKey(e.key)];
            let newArray = [];
            for (let i = 0; i < keysBeingPressed.length; i++) {
                if (keysBeingPressed[i] !== key)
                    newArray.push(keysBeingPressed[i]);
            }
            keysBeingPressed = newArray;
        };
        let onBlur = function () {
            keysBeingPressed = [];
        };
        document.addEventListener("keydown", function (e) { keyDownHandler(e); }, false);
        document.addEventListener("keyup", function (e) { keyUpHandler(e); }, false);
        window.addEventListener("blur", function () { onBlur(); });
        let isPressed = function (key) {
            for (let i = 0; i < keysBeingPressed.length; i++) {
                if (keysBeingPressed[i] === key)
                    return true;
            }
            return false;
        };
        return {
            isPressed
        };
    }
};
let GameMouse = {
    getMouse: function () {
        "use strict";
        let mouseXPosition = -50;
        let mouseYPosition = -50;
        let canvas = null;
        let mouseMoveHandler = function (e) {
            if (canvas === null) {
                canvas = document.getElementById("gameCanvas");
                if (canvas === null)
                    return;
            }
            let canvasCssWidth = canvas.offsetWidth;
            let canvasCssHeight = canvas.offsetHeight;
            let xPosition = (e.pageX !== null && e.pageX !== undefined ? e.pageX : e.clientX) - canvas.offsetLeft;
            let canvasXScaling = canvasCssWidth / canvas.width;
            if (canvasXScaling < 0.001)
                canvasXScaling = 0.001;
            xPosition = Math.round(xPosition / canvasXScaling);
            if (xPosition < -5)
                xPosition = -5;
            if (xPosition > canvas.width + 5)
                xPosition = canvas.width + 5;
            let yPosition = (e.pageY !== null && e.pageY !== undefined ? e.pageY : e.clientY) - canvas.offsetTop;
            let canvasYScaling = canvasCssHeight / canvas.height;
            if (canvasYScaling < 0.001)
                canvasYScaling = 0.001;
            yPosition = Math.round(yPosition / canvasYScaling);
            if (yPosition < -5)
                yPosition = -5;
            if (yPosition > canvas.height + 5)
                yPosition = canvas.height + 5;
            mouseXPosition = xPosition;
            mouseYPosition = canvas.height - yPosition - 1;
        };
        let isLeftMouseButtonPressed = false;
        let isRightMouseButtonPressed = false;
        let checkMouseButtonHandler = function (e) {
            if ((e.buttons & 1) === 1)
                isLeftMouseButtonPressed = true;
            else
                isLeftMouseButtonPressed = false;
            if ((e.buttons & 2) === 2)
                isRightMouseButtonPressed = true;
            else
                isRightMouseButtonPressed = false;
        };
        let disableContextMenu;
        disableContextMenu = function () {
            if (canvas === null) {
                canvas = document.getElementById("gameCanvas");
                if (canvas === null) {
                    setTimeout(disableContextMenu, 50);
                    return;
                }
            }
            canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
        };
        disableContextMenu();
        document.addEventListener("mousemove", function (e) { mouseMoveHandler(e); checkMouseButtonHandler(e); }, false);
        document.addEventListener("mousedown", function (e) { checkMouseButtonHandler(e); }, false);
        document.addEventListener("mouseup", function (e) { checkMouseButtonHandler(e); }, false);
        return {
            isLeftMouseButtonPressed: function () { return isLeftMouseButtonPressed; },
            isRightMouseButtonPressed: function () { return isRightMouseButtonPressed; },
            getX: function () { return Math.round(mouseXPosition); },
            getY: function () { return Math.round(mouseYPosition); }
        };
    }
};
let GameMusicUtil = {
    getMusic: function () {
        return [
            0 /* GameMusic.ChiptuneLevel1 */,
            1 /* GameMusic.ChiptuneLevel3 */,
            2 /* GameMusic.ForestTop */,
            3 /* GameMusic.Level3Theme */,
            4 /* GameMusic.MainTheme */,
            5 /* GameMusic.OverworldTheme */,
            6 /* GameMusic.FortressLoop */,
            7 /* GameMusic.NolokTalk */
        ];
    },
    getMusicInfo: function (music) {
        switch (music) {
            case 0 /* GameMusic.ChiptuneLevel1 */:
                return {
                    filename: "JuhaniJunkala/Level1.ogg",
                    volume: 0.07
                };
            case 1 /* GameMusic.ChiptuneLevel3 */:
                return {
                    filename: "JuhaniJunkala/Level3.ogg",
                    volume: 0.07
                };
            case 2 /* GameMusic.ForestTop */:
                return {
                    filename: "SpringSpring/ForestTop.ogg",
                    volume: 0.60
                };
            case 3 /* GameMusic.Level3Theme */:
                return {
                    filename: "ProSensory/BossSpaceBattle.ogg",
                    volume: 0.17
                };
            case 4 /* GameMusic.MainTheme */:
                return {
                    filename: "wansti/theme.ogg",
                    volume: 0.10
                };
            case 5 /* GameMusic.OverworldTheme */:
                return {
                    filename: "Trex0n/peace_at_last.ogg",
                    volume: 0.16
                };
            case 6 /* GameMusic.FortressLoop */:
                return {
                    filename: "migfus20/fortress_loop.ogg",
                    volume: 0.12
                };
            case 7 /* GameMusic.NolokTalk */:
                return {
                    filename: "migfus20/nolok_talk.ogg",
                    volume: 0.15
                };
        }
    }
};
let GameMusicOutput = {
    getMusicOutput: function () {
        "use strict";
        let musicDictionary = {};
        let numberOfAudioObjectsLoaded = 0;
        let loadMusic = function () {
            let musicNamesArray = GameMusicUtil.getMusic();
            let numberOfAudioObjects = musicNamesArray.length;
            for (let musicName of musicNamesArray) {
                if (musicDictionary[musicName])
                    continue;
                let musicPath = "Data/Music/" + GameMusicUtil.getMusicInfo(musicName).filename + "?doNotCache=" + Date.now().toString();
                let hasAudioLoaded = false;
                let audio = new Audio(musicPath);
                audio.addEventListener("canplaythrough", function () {
                    if (!hasAudioLoaded) {
                        hasAudioLoaded = true;
                        numberOfAudioObjectsLoaded++;
                    }
                });
                audio.loop = true;
                musicDictionary[musicName] = audio;
            }
            return numberOfAudioObjects === numberOfAudioObjectsLoaded;
        };
        /*
            The current music being played, or null if no music is playing.
            
            This may not be the same as intendedMusic since it takes a while
            to fade out an existing music and fade in a new one
        */
        let currentMusic = null;
        // The intended music that should eventually play, or null if we should fade out all music
        let intendedMusic = null;
        /*
            From 0.0 to 1.0
            
            Normally, this value is 1.0
            However, when fading in/out, this value will decrease to represent the drop in music volume.
        */
        let currentFadeInAndOutVolume = 0.0;
        /*
            From 0 to 100.
            
            For currentMusic, the intended volume at which the music should be played.
            We allow this to be set since we might want to play a particular music at a different
            volume depending on circumstances (e.g. maybe the music should be played softer when
            the game is paused)
        */
        let currentMusicVolume = 0;
        /*
            From 0 to 100.
            
            For intendedMusic, the intended volume at which the music should be played.
        */
        let intendedMusicVolume = 0;
        // From 0 to 100
        let globalMusicVolume = 0;
        let playMusic = function (music, volume) {
            intendedMusic = music;
            intendedMusicVolume = volume;
        };
        let stopMusic = function () {
            intendedMusic = null;
        };
        let decreaseCurrentFadeInAndOutVolume = function () {
            currentFadeInAndOutVolume = currentFadeInAndOutVolume - 0.08;
            if (currentFadeInAndOutVolume < 0.0)
                currentFadeInAndOutVolume = 0.0;
        };
        let increaseCurrentFadeInAndOutVolume = function () {
            currentFadeInAndOutVolume = currentFadeInAndOutVolume + 0.08;
            if (currentFadeInAndOutVolume > 1.0)
                currentFadeInAndOutVolume = 1.0;
        };
        let playCurrentMusic = function () {
            let music = musicDictionary[currentMusic];
            let finalVolume = currentFadeInAndOutVolume * (currentMusicVolume / 100.0) * (globalMusicVolume / 100.0) * GameMusicUtil.getMusicInfo(currentMusic).volume;
            if (finalVolume > 1.0)
                finalVolume = 1.0;
            if (finalVolume < 0.0)
                finalVolume = 0.0;
            for (let m in musicDictionary) {
                let audio = musicDictionary[m];
                if (audio === music) {
                    audio.volume = finalVolume;
                    let audioPromise = audio.play();
                    if (audioPromise) {
                        audioPromise.then(function () { }, function () { });
                    }
                }
                else {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        };
        let stopCurrentMusic = function () {
            for (let musicName in musicDictionary) {
                let audio = musicDictionary[musicName];
                audio.pause();
                audio.currentTime = 0;
            }
        };
        let updateCurrentMusic = function () {
            if (intendedMusic === null) {
                if (currentMusic !== null) {
                    decreaseCurrentFadeInAndOutVolume();
                    if (currentFadeInAndOutVolume === 0.0)
                        currentMusic = null;
                }
                return;
            }
            if (currentMusic === null) {
                currentMusic = intendedMusic;
                currentFadeInAndOutVolume = 0.0;
                currentMusicVolume = intendedMusicVolume;
                return;
            }
            if (currentMusic !== intendedMusic) {
                decreaseCurrentFadeInAndOutVolume();
                if (currentFadeInAndOutVolume === 0.0)
                    currentMusic = null;
                return;
            }
            if (currentMusicVolume < intendedMusicVolume) {
                let delta = 3;
                currentMusicVolume = currentMusicVolume + delta;
                if (currentMusicVolume > intendedMusicVolume)
                    currentMusicVolume = intendedMusicVolume;
            }
            if (currentMusicVolume > intendedMusicVolume) {
                let delta = 3;
                currentMusicVolume = currentMusicVolume - delta;
                if (currentMusicVolume < intendedMusicVolume)
                    currentMusicVolume = intendedMusicVolume;
            }
            increaseCurrentFadeInAndOutVolume();
        };
        let processFrame = function () {
            updateCurrentMusic();
            if (currentMusic !== null)
                playCurrentMusic();
            else
                stopCurrentMusic();
        };
        let setMusicVolume = function (volume) {
            globalMusicVolume = volume;
        };
        let getMusicVolume = function () {
            return globalMusicVolume;
        };
        return {
            loadMusic,
            playMusic,
            stopMusic,
            setMusicVolume,
            getMusicVolume,
            processFrame
        };
    }
};
let GameSoundUtil = {
    getSounds: function () {
        return [
            0 /* GameSound.Click */,
            1 /* GameSound.Cut */,
            2 /* GameSound.PlayerShoot */,
            3 /* GameSound.StandardDeath */,
            4 /* GameSound.EnemyShoot */,
            5 /* GameSound.Explosion00 */
        ];
    },
    getSoundInfo: function (sound) {
        switch (sound) {
            case 0 /* GameSound.Click */:
                return {
                    filename: "Kenney/click3_Modified.wav",
                    volume: 0.3
                };
            case 1 /* GameSound.Cut */:
                return {
                    filename: "Basto/cut.ogg",
                    volume: 0.5
                };
            case 2 /* GameSound.PlayerShoot */:
                return {
                    filename: "Kenney/PlayerShoot_Modified.ogg",
                    volume: 0.2
                };
            case 3 /* GameSound.StandardDeath */:
                return {
                    filename: "Kenney/StandardDeath.ogg",
                    volume: 0.3
                };
            case 4 /* GameSound.EnemyShoot */:
                return {
                    filename: "Kenney/EnemyShoot_Modified.ogg",
                    volume: 1.0
                };
            case 5 /* GameSound.Explosion00 */:
                return {
                    filename: "LittleRobotSoundFactory/Explosion_00_modified.wav",
                    volume: 0.25
                };
        }
    }
};
let GameSoundOutput = {
    getSoundOutput: function () {
        "use strict";
        let soundDictionary = {};
        let numberOfAudioObjectsLoaded = 0;
        let hasFinishedLoading = false;
        let loadSounds = function () {
            let soundNamesArray = GameSoundUtil.getSounds();
            let numberOfAudioObjects = soundNamesArray.length * 4;
            for (let soundName of soundNamesArray) {
                if (soundDictionary[soundName])
                    continue;
                soundDictionary[soundName] = [];
                let soundPath = "Data/Sound/" + GameSoundUtil.getSoundInfo(soundName).filename + "?doNotCache=" + Date.now().toString();
                for (let i = 0; i < 4; i++) {
                    let audio = new Audio(soundPath);
                    let hasAudioLoaded = false;
                    audio.addEventListener("canplaythrough", function () {
                        if (!hasAudioLoaded) {
                            hasAudioLoaded = true;
                            numberOfAudioObjectsLoaded++;
                        }
                    });
                    soundDictionary[soundName].push(audio);
                }
            }
            hasFinishedLoading = numberOfAudioObjects === numberOfAudioObjectsLoaded;
            return hasFinishedLoading;
        };
        let desiredSoundVolume = 0;
        let currentSoundVolume = 0;
        let playSound = function (sound, volume) {
            if (!hasFinishedLoading)
                return;
            let finalVolume = GameSoundUtil.getSoundInfo(sound).volume * (currentSoundVolume / 100.0) * (volume / 100.0);
            if (finalVolume > 1.0)
                finalVolume = 1.0;
            if (finalVolume <= 0.0)
                return;
            let soundArray = soundDictionary[sound];
            let audio = soundArray[0];
            for (let i = 0; i < soundArray.length; i++) {
                if (i === soundArray.length - 1)
                    soundArray[i] = audio;
                else
                    soundArray[i] = soundArray[i + 1];
            }
            audio.volume = finalVolume;
            audio.play();
        };
        let setSoundVolume = function (volume) {
            if (volume < 0)
                throw new Error("volume < 0");
            if (volume > 100)
                throw new Error("volume > 100");
            desiredSoundVolume = volume;
        };
        let getSoundVolume = function () {
            return desiredSoundVolume;
        };
        let processFrame = function () {
            currentSoundVolume = VolumeUtil.getVolumeSmoothed(currentSoundVolume, desiredSoundVolume);
        };
        return {
            loadSounds,
            setSoundVolume,
            getSoundVolume,
            playSound,
            processFrame
        };
    }
};
const KeyMapping = {};
KeyMapping["a"] = 0 /* Key.A */;
KeyMapping["b"] = 1 /* Key.B */;
KeyMapping["c"] = 2 /* Key.C */;
KeyMapping["d"] = 3 /* Key.D */;
KeyMapping["e"] = 4 /* Key.E */;
KeyMapping["f"] = 5 /* Key.F */;
KeyMapping["g"] = 6 /* Key.G */;
KeyMapping["h"] = 7 /* Key.H */;
KeyMapping["i"] = 8 /* Key.I */;
KeyMapping["j"] = 9 /* Key.J */;
KeyMapping["k"] = 10 /* Key.K */;
KeyMapping["l"] = 11 /* Key.L */;
KeyMapping["m"] = 12 /* Key.M */;
KeyMapping["n"] = 13 /* Key.N */;
KeyMapping["o"] = 14 /* Key.O */;
KeyMapping["p"] = 15 /* Key.P */;
KeyMapping["q"] = 16 /* Key.Q */;
KeyMapping["r"] = 17 /* Key.R */;
KeyMapping["s"] = 18 /* Key.S */;
KeyMapping["t"] = 19 /* Key.T */;
KeyMapping["u"] = 20 /* Key.U */;
KeyMapping["v"] = 21 /* Key.V */;
KeyMapping["w"] = 22 /* Key.W */;
KeyMapping["x"] = 23 /* Key.X */;
KeyMapping["y"] = 24 /* Key.Y */;
KeyMapping["z"] = 25 /* Key.Z */;
KeyMapping["0"] = 26 /* Key.Zero */;
KeyMapping["1"] = 27 /* Key.One */;
KeyMapping["2"] = 28 /* Key.Two */;
KeyMapping["3"] = 29 /* Key.Three */;
KeyMapping["4"] = 30 /* Key.Four */;
KeyMapping["5"] = 31 /* Key.Five */;
KeyMapping["6"] = 32 /* Key.Six */;
KeyMapping["7"] = 33 /* Key.Seven */;
KeyMapping["8"] = 34 /* Key.Eight */;
KeyMapping["9"] = 35 /* Key.Nine */;
KeyMapping["ArrowUp"] = 36 /* Key.UpArrow */;
KeyMapping["ArrowDown"] = 37 /* Key.DownArrow */;
KeyMapping["ArrowLeft"] = 38 /* Key.LeftArrow */;
KeyMapping["ArrowRight"] = 39 /* Key.RightArrow */;
KeyMapping["Delete"] = 40 /* Key.Delete */;
KeyMapping["Backspace"] = 41 /* Key.Backspace */;
KeyMapping["Enter"] = 42 /* Key.Enter */;
KeyMapping["Shift"] = 43 /* Key.Shift */;
KeyMapping[" "] = 44 /* Key.Space */;
KeyMapping["Escape"] = 45 /* Key.Esc */;
let MutedSoundOutput = {
    getSoundOutput: function (soundOutput) {
        return {
            loadSounds: function () { return soundOutput.loadSounds(); },
            setSoundVolume: function (volume) { soundOutput.setSoundVolume(volume); },
            getSoundVolume: function () { return soundOutput.getSoundVolume(); },
            playSound: function (sound, volume) { }
        };
    }
};
let SoftMusicOutput = {
    getMusicOutput: function ({ volume, underlyingMusicOutput }) {
        let playMusic = function (music, v) {
            let finalVolume = Math.floor(v * volume / 100);
            underlyingMusicOutput.playMusic(music, finalVolume);
        };
        return {
            loadMusic: function () { return underlyingMusicOutput.loadMusic(); },
            playMusic: playMusic,
            stopMusic: function () { underlyingMusicOutput.stopMusic(); },
            setMusicVolume: function (v) { underlyingMusicOutput.setMusicVolume(v); },
            getMusicVolume: function () { return underlyingMusicOutput.getMusicVolume(); }
        };
    }
};
let SoftSoundOutput = {
    getSoundOutput: function ({ volume, underlyingSoundOutput }) {
        let playSound = function (sound, v) {
            let finalVolume = Math.floor(v * volume / 100);
            underlyingSoundOutput.playSound(sound, finalVolume);
        };
        return {
            loadSounds: function () { return underlyingSoundOutput.loadSounds(); },
            setSoundVolume: function (v) { underlyingSoundOutput.setSoundVolume(v); },
            getSoundVolume: function () { return underlyingSoundOutput.getSoundVolume(); },
            playSound: playSound
        };
    }
};
let TranslatedDisplayOutput = {
    getTranslatedDisplayOutput: function (displayOutput, xOffsetInPixels, yOffsetInPixels) {
        let drawRectangle = function (x, y, width, height, color, fill) {
            displayOutput.drawRectangle(x + xOffsetInPixels, y + yOffsetInPixels, width, height, color, fill);
        };
        let drawText = function (x, y, text, font, fontSize, color) {
            displayOutput.drawText(x + xOffsetInPixels, y + yOffsetInPixels, text, font, fontSize, color);
        };
        let tryDrawText = function (x, y, text, font, fontSize, color) {
            displayOutput.tryDrawText(x + xOffsetInPixels, y + yOffsetInPixels, text, font, fontSize, color);
        };
        let drawImage = function (image, x, y) {
            displayOutput.drawImage(image, x + xOffsetInPixels, y + yOffsetInPixels);
        };
        let drawImageRotatedClockwise = function (image, imageX, imageY, imageWidth, imageHeight, x, y, degreesScaled, scalingFactorScaled) {
            displayOutput.drawImageRotatedClockwise(image, imageX, imageY, imageWidth, imageHeight, x + xOffsetInPixels, y + yOffsetInPixels, degreesScaled, scalingFactorScaled);
        };
        let getWidth = function (image) {
            return displayOutput.getWidth(image);
        };
        let getHeight = function (image) {
            return displayOutput.getHeight(image);
        };
        return {
            drawRectangle,
            drawText,
            tryDrawText,
            drawImage,
            drawImageRotatedClockwise,
            getWidth,
            getHeight
        };
    }
};
let VersionInfo = {};
VersionInfo.getVersionHistory = function () {
    "use strict";
    return [
        { version: "1.00", alphanumericVersionGuid: "ad3452c3176b8ec393baa35ec5ec3fd1" },
        { version: "1.01", alphanumericVersionGuid: "31b51b385e7956afbd7b44334dcd3317" },
        { version: "1.02", alphanumericVersionGuid: "e30afc174acd4750a8d83a1f4d90d15d" },
        { version: "1.03", alphanumericVersionGuid: "da2e51ccbe2036cbbc7616ec6d8df412" }
    ];
};
VersionInfo.getCurrentVersion = function () {
    "use strict";
    let versionHistory = VersionInfo.getVersionHistory();
    return versionHistory[versionHistory.length - 1];
};
let VolumeUtil = {
    getVolumeSmoothed: function (currentVolume, desiredVolume) {
        let maxChangePerFrame = 3;
        if (Math.abs(desiredVolume - currentVolume) <= maxChangePerFrame)
            return desiredVolume;
        else if (desiredVolume > currentVolume)
            return currentVolume + maxChangePerFrame;
        else
            return currentVolume - maxChangePerFrame;
    }
};
let Background_Level3 = {
    getBackground: function () {
        let getSnapshot = function (thisObj) {
            return thisObj;
        };
        let render = function (displayOutput) {
            displayOutput.drawImageRotatedClockwise(18 /* GameImage.Ocean */, 0, 0, 480, 240, 0, 0, 0, 128 * 3);
        };
        return {
            getSnapshot,
            processFrame: function () { },
            startBoss: function () { },
            render
        };
    }
};
let Background_Ocean = {};
((function () {
    let getBackground = function (xOffsetMibi, bossFrameCounter) {
        let getSnapshot = function (thisObj) {
            return getBackground(xOffsetMibi, bossFrameCounter);
        };
        let processFrame = function () {
            xOffsetMibi -= 256;
            if (xOffsetMibi <= -480 * 3 * 1024)
                xOffsetMibi += 480 * 3 * 1024;
            if (bossFrameCounter !== null && bossFrameCounter < 200)
                bossFrameCounter++;
            if (bossFrameCounter !== null) {
                xOffsetMibi -= 256;
                if (bossFrameCounter > 40)
                    xOffsetMibi -= 256;
                if (bossFrameCounter > 80)
                    xOffsetMibi -= 256;
                if (bossFrameCounter > 120)
                    xOffsetMibi -= 256;
                if (bossFrameCounter > 160)
                    xOffsetMibi -= 256;
                if (xOffsetMibi <= -480 * 3 * 1024)
                    xOffsetMibi += 480 * 3 * 1024;
            }
        };
        let startBoss = function () {
            bossFrameCounter = 0;
        };
        let render = function (displayOutput) {
            displayOutput.drawImageRotatedClockwise(18 /* GameImage.Ocean */, 0, 0, 480, 240, xOffsetMibi >> 10, 0, 0, 128 * 3);
            displayOutput.drawImageRotatedClockwise(18 /* GameImage.Ocean */, 0, 0, 480, 240, (xOffsetMibi >> 10) + 480 * 3, 0, 0, 128 * 3);
            if (bossFrameCounter !== null) {
                let alpha = Math.floor(bossFrameCounter * 5 / 2);
                if (alpha > 200)
                    alpha = 200;
                displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: alpha }, true);
            }
        };
        return {
            getSnapshot,
            processFrame,
            startBoss,
            render
        };
    };
    Background_Ocean.getBackground = function () {
        return getBackground(0, null);
    };
})());
let BossHealthDisplayUtil = {};
((function () {
    let getDisplay = function (desiredHealthPercent, currentHealthPercent) {
        let getSnapshot = function (thisObj) {
            return getDisplay(desiredHealthPercent, currentHealthPercent);
        };
        let processFrame = function () {
            if (desiredHealthPercent === null) {
                if (currentHealthPercent === null)
                    return;
                if (currentHealthPercent === 0) {
                    currentHealthPercent = null;
                    return;
                }
                if (currentHealthPercent <= 3) {
                    currentHealthPercent = 0;
                    return;
                }
                currentHealthPercent -= 3;
                return;
            }
            if (currentHealthPercent === null) {
                currentHealthPercent = 0;
                return;
            }
            if (desiredHealthPercent < currentHealthPercent) {
                if (currentHealthPercent - desiredHealthPercent < 3) {
                    currentHealthPercent = desiredHealthPercent;
                    return;
                }
                currentHealthPercent -= 3;
                return;
            }
            if (desiredHealthPercent > currentHealthPercent) {
                let delta = desiredHealthPercent - currentHealthPercent;
                if (delta > 50) {
                    currentHealthPercent += 10;
                    return;
                }
                if (delta > 20) {
                    currentHealthPercent += 5;
                    return;
                }
                if (delta > 5) {
                    currentHealthPercent += 3;
                    return;
                }
                currentHealthPercent++;
                return;
            }
        };
        let setHealthPercentage = function (percent) {
            desiredHealthPercent = percent;
        };
        let render = function (displayOutput) {
            if (currentHealthPercent === null)
                return;
            displayOutput.drawImageRotatedClockwise(47 /* GameImage.BossHealth */, 50, 0, 10, 8, GlobalConstants.WINDOW_WIDTH - 60, 500, 0, 128 * 3);
            for (let i = 0; i < 10; i++)
                displayOutput.drawImageRotatedClockwise(47 /* GameImage.BossHealth */, 0, 0, 10, 8, GlobalConstants.WINDOW_WIDTH - 60, 500 - 24 - 24 * i, 0, 128 * 3);
            let numPixelsOfHealth = Math.floor(currentHealthPercent * 80 / 100);
            for (let i = 0; i < numPixelsOfHealth; i++) {
                displayOutput.drawImageRotatedClockwise(47 /* GameImage.BossHealth */, 40, 0, 10, 1, GlobalConstants.WINDOW_WIDTH - 60, 260 + i * 3, 0, 128 * 3);
            }
            displayOutput.drawImageRotatedClockwise(47 /* GameImage.BossHealth */, 60, 0, 10, 8, GlobalConstants.WINDOW_WIDTH - 60, 260 - 24, 0, 128 * 3);
            displayOutput.drawImageRotatedClockwise(46 /* GameImage.Skull */, 0, 0, 16, 16, GlobalConstants.WINDOW_WIDTH - 60 - 9, 260 - 48, 0, 128 * 3);
        };
        return {
            getSnapshot,
            processFrame,
            setHealthPercentage,
            render
        };
    };
    BossHealthDisplayUtil.getDisplay = function () {
        return getDisplay(null, null);
    };
})());
let ButtonUtil = {
    STANDARD_PRIMARY_BACKGROUND_COLOR: { r: 235, g: 235, b: 235, alpha: 255 },
    STANDARD_SECONDARY_BACKGROUND_COLOR: { r: 200, g: 200, b: 200, alpha: 255 },
    STANDARD_HOVER_COLOR: { r: 250, g: 249, b: 200, alpha: 255 },
    STANDARD_CLICK_COLOR: { r: 252, g: 251, b: 154, alpha: 255 },
    getButton: function ({ x, y, width, height, backgroundColor, hoverColor, clickColor, text, textXOffset, textYOffset, font, fontSize }) {
        let previousMouseInput = null;
        let isHover = false;
        let isClicked = false;
        let isMouseInRange = function (mouseInput) {
            let mouseX = mouseInput.getX();
            let mouseY = mouseInput.getY();
            return x <= mouseX
                && mouseX <= x + width
                && y <= mouseY
                && mouseY <= y + height;
        };
        let processFrame = function (mouseInput) {
            let didUserClickOnButton = false;
            if (isMouseInRange(mouseInput)) {
                isHover = true;
                if (mouseInput.isLeftMouseButtonPressed() && previousMouseInput !== null && !previousMouseInput.isLeftMouseButtonPressed())
                    isClicked = true;
                if (isClicked && !mouseInput.isLeftMouseButtonPressed() && previousMouseInput !== null && previousMouseInput.isLeftMouseButtonPressed())
                    didUserClickOnButton = true;
            }
            else {
                isHover = false;
            }
            if (!mouseInput.isLeftMouseButtonPressed())
                isClicked = false;
            previousMouseInput = CopiedMouse.getSnapshot(mouseInput);
            return {
                wasClicked: didUserClickOnButton
            };
        };
        let render = function (displayOutput) {
            let color = backgroundColor;
            if (isHover)
                color = hoverColor;
            if (isClicked)
                color = clickColor;
            displayOutput.drawRectangle(x, y, width, height, color, true);
            displayOutput.drawRectangle(x, y, width, height, black, false);
            displayOutput.drawText(x + textXOffset, y + height - textYOffset, text, font, fontSize, black);
        };
        return {
            processFrame,
            render
        };
    }
};
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
let CreditsFrame_DesignAndCoding = {
    render: function (displayOutput, width, height, buildType) {
        let text;
        switch (buildType) {
            case 0 /* BuildType.WebStandalone */:
            case 1 /* BuildType.WebEmbedded */:
                text = "Design and coding by dtsudo. \n"
                    + "\n"
                    + "Level layout was adapted from SuperTux Advance maps; original \n"
                    + "SuperTux Advance maps created by Kelvin Shadewing and FrostC. \n"
                    + "\n"
                    + "This game is a fangame of SuperTux and SuperTux Advance. \n"
                    + "\n"
                    + "This game is open source, licensed under GPL 3.0. \n"
                    + "(Code dependencies and images/font/sound/music licensed under \n"
                    + "other open source licenses.) \n"
                    + "\n"
                    + "See the source code for more information (including licensing \n"
                    + "details).";
                break;
            case 2 /* BuildType.Electron */:
                text = "Design and coding by dtsudo. \n"
                    + "\n"
                    + "Level layout was adapted from SuperTux Advance maps; original \n"
                    + "SuperTux Advance maps created by Kelvin Shadewing and FrostC. \n"
                    + "\n"
                    + "This game is a fangame of SuperTux and SuperTux Advance. \n"
                    + "\n"
                    + "This game is open source, licensed under GPL 3.0. \n"
                    + "(Code dependencies and images/font/sound/music licensed under \n"
                    + "other open source licenses.) \n"
                    + "\n"
                    + "This game uses the Electron framework (https://www.electronjs.org) \n"
                    + "\n"
                    + "See the source code for more information (including licensing \n"
                    + "details).";
                break;
        }
        displayOutput.drawText(10, height - 10, text, 0 /* GameFont.SimpleFont */, 27, black);
    }
};
let CreditsFrame_Font = {
    render: function (displayOutput, width, height, buildType) {
        let text = "The font used in this game was generated by metaflop and then \n"
            + "slightly modified by dtsudo. \n"
            + "https://www.metaflop.com/modulator \n"
            + "\n"
            + "The font is licensed under SIL Open Font License v1.1 \n"
            + "See the source code for more details about the license. \n";
        displayOutput.drawText(10, height - 10, text, 0 /* GameFont.SimpleFont */, 27, black);
    }
};
let CreditsFrame_Images = {
    render: function (displayOutput, width, height, buildType) {
        let text = "Image files created by: \n"
            + "* Benjamin K. Smith, Lanea Zimmerman (AKA Sharm), Daniel Eddeland, \n"
            + "   William.Thompsonj, Nushio, Adrix89 \n"
            + "* Crystalized Sun \n"
            + "* FrostC \n"
            + "* Jetrel \n"
            + "* Kelvin Shadewing \n"
            + "* Kenney \n"
            + "* KnoblePersona \n"
            + "* Nemisys \n"
            + "* UbuntuJackson \n"
            + "\n"
            + "See the source code for more information (including licensing \n"
            + "details).";
        displayOutput.drawText(10, height - 10, text, 0 /* GameFont.SimpleFont */, 27, black);
    }
};
let CreditsFrame_Music = {
    render: function (displayOutput, width, height, buildType) {
        let text = "Music track authors: \n"
            + "* Alex McCulloch \n"
            + "* Cal McEachern \n"
            + "* Juhani Junkala \n"
            + "* migfus20 \n"
            + "* Spring Spring \n"
            + "* wansti \n"
            + "\n"
            + "See the source code for more information (including licensing \n"
            + "details).";
        displayOutput.drawText(10, height - 10, text, 0 /* GameFont.SimpleFont */, 27, black);
    }
};
let CreditsFrame_Sound = {
    render: function (displayOutput, width, height, buildType) {
        let text = "Sound effects created by: \n"
            + "* Basto \n"
            + "* Kenney \n"
            + "* Little Robot Sound Factory \n"
            + "\n"
            + "See the source code for more information (including licensing \n"
            + "details).";
        displayOutput.drawText(10, height - 10, text, 0 /* GameFont.SimpleFont */, 27, black);
    }
};
let Cutscene_Level1Boss = {};
((function () {
    let dialogue = [
        {
            isKonqi: false,
            text: "Are you a dinosaur?",
            width: 250
        },
        {
            isKonqi: true,
            text: "No. I'm a dragon!",
            width: 200
        },
        {
            isKonqi: false,
            text: "You're a flying dragon?",
            width: 295
        },
        {
            isKonqi: true,
            text: "That's right. I'm Konqi the Dragon!",
            width: 400
        },
        {
            isKonqi: false,
            text: "I see. Then I shall use ice attacks!",
            width: 410
        },
        {
            isKonqi: true,
            text: "I only have one hit point in any case.",
            width: 440
        }
    ];
    let getCutscene = function (dialogueIndex, beginBossFightCounter, owlEnemyId, owlXMibi, owlYMibi, playerXMibi, playerYMibi) {
        let getSnapshot = function (thisObj) {
            return getCutscene(dialogueIndex, beginBossFightCounter, owlEnemyId, owlXMibi, owlYMibi, playerXMibi, playerYMibi);
        };
        let processFrame = function ({ gameState, enemyMapping, frameInput, musicOutput }) {
            playerXMibi = gameState.playerState.xMibi;
            playerYMibi = gameState.playerState.yMibi;
            let owlEnemy = enemyMapping[owlEnemyId];
            let owlEnemyAsOwl = owlEnemy;
            owlXMibi = owlEnemyAsOwl.getXMibi();
            owlYMibi = owlEnemyAsOwl.getYMibi();
            if (frameInput.continueDialogue && beginBossFightCounter === null) {
                dialogueIndex++;
                if (dialogueIndex === dialogue.length) {
                    if (beginBossFightCounter === null)
                        beginBossFightCounter = 0;
                }
            }
            if (beginBossFightCounter !== null) {
                beginBossFightCounter++;
                if (beginBossFightCounter === 1) {
                    gameState.background.startBoss();
                    gameState.tilemap.startBoss();
                }
                musicOutput.playMusic(Enemy_Level1Boss_Phase1.BOSS_MUSIC, 100);
            }
            if (beginBossFightCounter !== null && beginBossFightCounter === 100) {
                gameState.cutscene = null;
                owlEnemyAsOwl.transformToLevel1Boss();
            }
            return {
                updatedFrameInput: {
                    up: frameInput.up,
                    down: frameInput.down,
                    left: frameInput.left,
                    right: frameInput.right,
                    shoot: false,
                    continueDialogue: frameInput.continueDialogue,
                    debug_toggleInvulnerability: frameInput.debug_toggleInvulnerability
                },
                shouldCreateAutoSavestate: beginBossFightCounter !== null && beginBossFightCounter === 1
            };
        };
        let drawDialogue = function (x, y, width, text, displayOutput) {
            let height = 24;
            displayOutput.drawRectangle(x, y, width, height, { r: 0, g: 0, b: 0, alpha: 150 }, true);
            displayOutput.drawText(x, y + height, text, 0 /* GameFont.SimpleFont */, 24, white);
        };
        let render = function (displayOutput) {
            if (beginBossFightCounter === null && owlXMibi !== null && owlYMibi !== null && playerXMibi !== null && playerYMibi !== null) {
                let currentText = dialogue[dialogueIndex];
                let isKonqi = currentText.isKonqi;
                let text = currentText.text;
                let x;
                let y;
                let width = currentText.width;
                if (isKonqi) {
                    x = (playerXMibi >> 10) - Math.floor(width / 2);
                    y = (playerYMibi >> 10) + 35;
                }
                else {
                    x = (owlXMibi >> 10) - Math.floor(width / 2);
                    y = (owlYMibi >> 10) + 35;
                }
                drawDialogue(x, y, width, text, displayOutput);
            }
        };
        return {
            getSnapshot,
            processFrame,
            render
        };
    };
    Cutscene_Level1Boss.getCutscene = function (owlEnemyId) {
        return getCutscene(0, null, owlEnemyId, null, null, null, null);
    };
})());
let Cutscene_Level2Boss = {};
((function () {
    let dialogue = [
        {
            isKonqi: false,
            text: "Hello. I'm the level 2 boss.",
            width: 313
        },
        {
            isKonqi: true,
            text: "Who are you?",
            width: 165
        },
        {
            isKonqi: false,
            text: "I'm Dark Konqi!",
            width: 168
        },
        {
            isKonqi: true,
            text: "Are you evil?",
            width: 159
        },
        {
            isKonqi: false,
            text: "No, I'm not evil.",
            width: 177
        },
        {
            isKonqi: false,
            text: "Why would you think that?",
            width: 324
        }
    ];
    let getCutscene = function (dialogueIndex, beginBossFightCounter, darkKonqiEnemyId, darkKonqiXMibi, darkKonqiYMibi, playerXMibi, playerYMibi) {
        let getSnapshot = function (thisObj) {
            return getCutscene(dialogueIndex, beginBossFightCounter, darkKonqiEnemyId, darkKonqiXMibi, darkKonqiYMibi, playerXMibi, playerYMibi);
        };
        let processFrame = function ({ gameState, enemyMapping, frameInput, musicOutput }) {
            playerXMibi = gameState.playerState.xMibi;
            playerYMibi = gameState.playerState.yMibi;
            let darkKonqiEnemy = enemyMapping[darkKonqiEnemyId];
            let darkKonqiEnemyAsDarkKonqi = darkKonqiEnemy;
            darkKonqiXMibi = darkKonqiEnemyAsDarkKonqi.getXMibi();
            darkKonqiYMibi = darkKonqiEnemyAsDarkKonqi.getYMibi();
            if (frameInput.continueDialogue && beginBossFightCounter === null) {
                dialogueIndex++;
                if (dialogueIndex === dialogue.length) {
                    if (beginBossFightCounter === null)
                        beginBossFightCounter = 0;
                }
            }
            if (beginBossFightCounter !== null) {
                beginBossFightCounter++;
                if (beginBossFightCounter === 1) {
                    gameState.background.startBoss();
                    gameState.tilemap.startBoss();
                }
                musicOutput.playMusic(Enemy_Level2Boss_Phase1.BOSS_MUSIC, 100);
            }
            if (beginBossFightCounter !== null && beginBossFightCounter === 100) {
                gameState.cutscene = null;
                darkKonqiEnemyAsDarkKonqi.transformToLevel2Boss();
            }
            return {
                updatedFrameInput: {
                    up: frameInput.up,
                    down: frameInput.down,
                    left: frameInput.left,
                    right: frameInput.right,
                    shoot: false,
                    continueDialogue: frameInput.continueDialogue,
                    debug_toggleInvulnerability: frameInput.debug_toggleInvulnerability
                },
                shouldCreateAutoSavestate: beginBossFightCounter !== null && beginBossFightCounter === 1
            };
        };
        let drawDialogue = function (x, y, width, text, displayOutput) {
            let height = 24;
            displayOutput.drawRectangle(x, y, width, height, { r: 0, g: 0, b: 0, alpha: 150 }, true);
            displayOutput.drawText(x, y + height, text, 0 /* GameFont.SimpleFont */, 24, white);
        };
        let render = function (displayOutput) {
            if (beginBossFightCounter === null && darkKonqiXMibi !== null && darkKonqiYMibi !== null && playerXMibi !== null && playerYMibi !== null) {
                let currentText = dialogue[dialogueIndex];
                let isKonqi = currentText.isKonqi;
                let text = currentText.text;
                let x;
                let y;
                let width = currentText.width;
                if (isKonqi) {
                    x = (playerXMibi >> 10) - Math.floor(width / 2);
                    y = (playerYMibi >> 10) + 35;
                }
                else {
                    x = (darkKonqiXMibi >> 10) - Math.floor(width / 2);
                    y = (darkKonqiYMibi >> 10) + 35;
                }
                drawDialogue(x, y, width, text, displayOutput);
            }
        };
        return {
            getSnapshot,
            processFrame,
            render
        };
    };
    Cutscene_Level2Boss.getCutscene = function (darkKonqiEnemyId) {
        return getCutscene(0, null, darkKonqiEnemyId, null, null, null, null);
    };
})());
let Cutscene_Level3Boss = ((function () {
    let getCutscene = function (xMibi, hasSpawnedBoss, bossEnemyId) {
        let getSnapshot = function (thisObj) {
            return getCutscene(xMibi, hasSpawnedBoss, bossEnemyId);
        };
        let processFrame = function (input) {
            let gameState = input.gameState;
            if (!gameState.tilemap.hasReachedEndOfMap())
                xMibi += gameState.tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            let updatedFrameInput = {
                up: false,
                down: false,
                left: false,
                right: false,
                shoot: false,
                continueDialogue: input.frameInput.continueDialogue,
                debug_toggleInvulnerability: input.frameInput.debug_toggleInvulnerability
            };
            if (gameState.tilemap.hasReachedEndOfMap() && gameState.playerState.xMibi < xMibi)
                gameState.playerState.xMibi += 900;
            if (gameState.playerState.xMibi > xMibi)
                gameState.playerState.xMibi = xMibi;
            if (!hasSpawnedBoss && gameState.tilemap.hasReachedEndOfMap()) {
                hasSpawnedBoss = true;
                bossEnemyId = gameState.nextEnemyId++;
                let boss = Enemy_Level3Boss.getEnemy({ enemyId: bossEnemyId });
                gameState.enemies.push(boss);
                input.enemyMapping[bossEnemyId] = boss;
            }
            if (bossEnemyId !== null) {
                let bossEnemy = input.enemyMapping[bossEnemyId];
                if (bossEnemy) {
                    let bossEnemyAsLevel3BossEnemy = bossEnemy;
                    if (bossEnemyAsLevel3BossEnemy.hasStartedBossFight()) {
                        gameState.background.startBoss();
                        gameState.tilemap.startBoss();
                        gameState.tilemap = Level3BossTilemap.getTilemap({ underlyingTilemap: gameState.tilemap });
                        gameState.cutscene = null;
                    }
                }
            }
            return {
                updatedFrameInput: updatedFrameInput,
                shouldCreateAutoSavestate: false
            };
        };
        return {
            getSnapshot,
            processFrame,
            render: function (displayOutput) { }
        };
    };
    return {
        getCutscene: function ({ xMibi }) {
            return getCutscene(xMibi, false, null);
        }
    };
})());
let DifficultyUtil = {
    getDifficultyIdFromDifficulty: function (difficulty) {
        switch (difficulty) {
            case 0 /* Difficulty.Easy */: return 1;
            case 1 /* Difficulty.Normal */: return 2;
            case 2 /* Difficulty.Hard */: return 3;
        }
    },
    getDifficultyFromDifficultyId: function (difficultyId) {
        if (difficultyId === 1)
            return 0 /* Difficulty.Easy */;
        if (difficultyId === 2)
            return 1 /* Difficulty.Normal */;
        if (difficultyId === 3)
            return 2 /* Difficulty.Hard */;
        throw new Error("Unrecognized difficultyId");
    }
};
let EnemyCollision = {
    processCollisionBetweenPlayerAndEnemies: function (gameState) {
        if (gameState.playerState.isDeadFrameCount !== null)
            return;
        let playerXMibi = gameState.playerState.xMibi;
        let playerYMibi = gameState.playerState.yMibi;
        for (let enemy of gameState.enemies) {
            let hitboxes = enemy.getHitboxes();
            if (hitboxes !== null) {
                let hasCollided = false;
                for (let hitbox of hitboxes) {
                    if (hitbox.xMibi <= playerXMibi
                        && playerXMibi < hitbox.xMibi + hitbox.widthMibi
                        && hitbox.yMibi <= playerYMibi
                        && playerYMibi < hitbox.yMibi + hitbox.heightMibi) {
                        hasCollided = true;
                        break;
                    }
                }
                if (hasCollided) {
                    let shouldKillPlayer = enemy.onCollideWithPlayer(gameState.playerState);
                    if (shouldKillPlayer && !gameState.debug_isInvulnerable)
                        gameState.playerState.isDeadFrameCount = 0;
                }
            }
        }
    },
    processCollisionBetweenPlayerBulletsAndEnemies: function (gameState) {
        let playerBullets = gameState.playerBulletState.playerBullets;
        for (let enemy of gameState.enemies) {
            let newPlayerBullets = [];
            for (let playerBullet of playerBullets) {
                let hasCollided = false;
                let damageboxes = enemy.getDamageboxes();
                if (damageboxes !== null) {
                    for (let damagebox of damageboxes) {
                        if (damagebox.xMibi <= playerBullet.xMibi
                            && playerBullet.xMibi < damagebox.xMibi + damagebox.widthMibi
                            && damagebox.yMibi <= playerBullet.yMibi
                            && playerBullet.yMibi < damagebox.yMibi + damagebox.heightMibi) {
                            hasCollided = true;
                            break;
                        }
                    }
                }
                if (hasCollided) {
                    let shouldDeletePlayerBullet = enemy.onCollideWithPlayerBullet(playerBullet);
                    if (!shouldDeletePlayerBullet)
                        newPlayerBullets.push(playerBullet);
                }
                else {
                    newPlayerBullets.push(playerBullet);
                }
            }
            playerBullets = newPlayerBullets;
        }
        gameState.playerBulletState.playerBullets = playerBullets;
    }
};
let EnemyProcessing = {
    processFrame: function (gameState, enemyMapping, frameInput, soundOutput, musicOutput) {
        let enemiesToBeProcessed = gameState.enemies;
        let newEnemies = [];
        let shouldScreenWipe = false;
        let shouldCreateAutoSavestate = false;
        let cutscene = null;
        let bossHealthDisplayValue = null;
        let shouldEndLevel = false;
        while (true) {
            if (enemiesToBeProcessed.length === 0)
                break;
            let newlyCreatedEnemies = [];
            for (let enemy of enemiesToBeProcessed) {
                let result = enemy.processFrame({
                    thisObj: enemy,
                    enemyMapping: enemyMapping,
                    rngSeed: gameState.rngSeed,
                    nextEnemyId: gameState.nextEnemyId,
                    difficulty: gameState.difficulty,
                    playerState: gameState.playerState,
                    tilemap: gameState.tilemap,
                    soundOutput: soundOutput
                });
                gameState.nextEnemyId = result.nextEnemyId;
                gameState.rngSeed = result.newRngSeed;
                if (result.shouldEndLevel)
                    shouldEndLevel = true;
                if (result.musicToPlay)
                    musicOutput.playMusic(result.musicToPlay, 100);
                if (result.shouldScreenWipe)
                    shouldScreenWipe = true;
                if (result.shouldCreateAutoSavestate)
                    shouldCreateAutoSavestate = true;
                if (result.shouldScreenShake)
                    gameState.screenShakeFrameCounter = 0;
                if (result.bossHealthDisplayValue !== undefined && result.bossHealthDisplayValue !== null)
                    bossHealthDisplayValue = result.bossHealthDisplayValue;
                if (result.cutscene)
                    cutscene = result.cutscene;
                for (let resultEnemy of result.enemies) {
                    if (resultEnemy.enemyId === enemy.enemyId) {
                        newEnemies.push(resultEnemy);
                        enemyMapping[resultEnemy.enemyId] = resultEnemy;
                    }
                    else {
                        newlyCreatedEnemies.push(resultEnemy);
                        enemyMapping[resultEnemy.enemyId] = resultEnemy;
                    }
                }
            }
            enemiesToBeProcessed = newlyCreatedEnemies;
        }
        gameState.enemies = newEnemies;
        return {
            shouldScreenWipe,
            shouldCreateAutoSavestate,
            cutscene,
            bossHealthDisplayValue,
            enemyMapping,
            shouldEndLevel
        };
    }
};
let Enemy_Background_Explode = {};
((function () {
    let onCollideFunction = function () { return false; };
    let getEnemy = function (xMibi, yMibi, displayAngleScaled, scalingFactorScaled, frameCount, renderOnTop, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
            if (frameCount === 0)
                soundOutput.playSound(3 /* GameSound.StandardDeath */, 100);
            frameCount++;
            if (frameCount >= 30)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, displayAngleScaled, scalingFactorScaled, frameCount, renderOnTop, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCount / 6);
            displayOutput.drawImageRotatedClockwise(21 /* GameImage.ExplodeF */, spriteNum * 24, 0, 24, 24, (xMibi >> 10) - Math.floor(12 * scalingFactorScaled / 128), (yMibi >> 10) - Math.floor(12 * scalingFactorScaled / 128), displayAngleScaled, scalingFactorScaled);
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: renderOnTop ? true : false,
            isBackground: renderOnTop ? false : true,
            processFrame,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: onCollideFunction,
            onCollideWithPlayerBullet: onCollideFunction,
            onScreenWipe: function () { },
            render
        };
    };
    Enemy_Background_Explode.getEnemy = function ({ xMibi, yMibi, displayAngleScaled, scalingFactorScaled, renderOnTop, enemyId }) {
        return getEnemy(xMibi, yMibi, displayAngleScaled, scalingFactorScaled, 0, renderOnTop, enemyId);
    };
})());
let Enemy_Background_ExplodeI = {};
((function () {
    let onCollideFunction = function () { return false; };
    let getEnemy = function (xMibi, yMibi, displayAngleScaled, scalingFactorScaled, frameCount, renderOnTop, gameImage, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
            if (frameCount === 0)
                soundOutput.playSound(3 /* GameSound.StandardDeath */, 100);
            frameCount++;
            if (frameCount >= 30)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, displayAngleScaled, scalingFactorScaled, frameCount, renderOnTop, gameImage, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCount / 6);
            displayOutput.drawImageRotatedClockwise(gameImage, spriteNum * 30, 0, 30, 30, (xMibi >> 10) - Math.floor(15 * scalingFactorScaled / 128), (yMibi >> 10) - Math.floor(15 * scalingFactorScaled / 128), displayAngleScaled, scalingFactorScaled);
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: renderOnTop ? true : false,
            isBackground: renderOnTop ? false : true,
            processFrame,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: onCollideFunction,
            onCollideWithPlayerBullet: onCollideFunction,
            onScreenWipe: function () { },
            render
        };
    };
    Enemy_Background_ExplodeI.getEnemy = function ({ xMibi, yMibi, displayAngleScaled, scalingFactorScaled, renderOnTop, gameImage, enemyId }) {
        return getEnemy(xMibi, yMibi, displayAngleScaled, scalingFactorScaled, 0, renderOnTop, gameImage !== undefined ? gameImage : 49 /* GameImage.ExplodeI */, enemyId);
    };
})());
let Enemy_Background_Instructions = {};
((function () {
    let onCollideFunction = function () { return false; };
    let getEnemy = function (xMibi, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
            xMibi -= 600;
            if (xMibi < -1000 * 1024)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, enemyId);
        };
        let render = function (displayOutput) {
            displayOutput.drawRectangle(xMibi >> 10, 50, 570, GlobalConstants.WINDOW_HEIGHT - 100, { r: 0, g: 0, b: 0, alpha: 150 }, true);
            displayOutput.drawText(xMibi >> 10, GlobalConstants.WINDOW_HEIGHT - 50, " Controls: \n\n Arrow keys to move \n Z to shoot \n\n Shift to slow down time \n\n C to create a save state \n X to load a save state \n\n "
                + "You only have one life. \n Use save states to overcome tough patterns! \n\n Your hitbox is a single pixel.", 0 /* GameFont.SimpleFont */, 24, white);
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: true,
            processFrame,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: onCollideFunction,
            onCollideWithPlayerBullet: onCollideFunction,
            onScreenWipe: function () { },
            render
        };
    };
    Enemy_Background_Instructions.getEnemy = function ({ enemyId }) {
        return getEnemy(GlobalConstants.WINDOW_WIDTH << 10, enemyId);
    };
})());
let Enemy_Background_Poof = {};
((function () {
    let onCollideFunction = function () { return false; };
    let getEnemy = function (xMibi, yMibi, frameCount, scalingFactorScaled, isInFrontOfForeground, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
            frameCount++;
            if (frameCount >= 24)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, frameCount, scalingFactorScaled, isInFrontOfForeground, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCount / 6);
            displayOutput.drawImageRotatedClockwise(24 /* GameImage.Poof */, spriteNum * 16, 0, 16, 16, (xMibi >> 10) - Math.floor(8 * scalingFactorScaled / 128), (yMibi >> 10) - Math.floor(8 * scalingFactorScaled / 128), 0, scalingFactorScaled);
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: isInFrontOfForeground ? false : true,
            isInFrontOfForeground: isInFrontOfForeground,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: onCollideFunction,
            onCollideWithPlayerBullet: onCollideFunction,
            onScreenWipe: function () { },
            render
        };
    };
    Enemy_Background_Poof.getEnemy = function ({ xMibi, yMibi, scalingFactorScaled, isInFrontOfForeground, enemyId }) {
        return getEnemy(xMibi, yMibi, 0, scalingFactorScaled, isInFrontOfForeground !== undefined ? isInFrontOfForeground : false, enemyId);
    };
})());
let Enemy_Bullet_BouncySnow = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, explodeYMibi, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            xMibi += xSpeed;
            yMibi += ySpeed;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if ((yMibi < explodeYMibi && screenWipeCountdown === null) || tilemap.isSolid(xMibi, yMibi)) {
                let enemies = [];
                let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
                let increment = 45 * 128;
                let startingAngle = rng.nextInt(increment);
                for (let i = startingAngle; i < 360 * 128; i += increment) {
                    if (screenWipeCountdown === null) {
                        enemies.push(Enemy_Bullet_Iceball.getEnemy({
                            xMibi: xMibi,
                            yMibi: yMibi,
                            speed: 512,
                            angleScaled: i,
                            xVelocityOffsetInMibipixelsPerFrame: 0,
                            hasCollisionWithTilemap: false,
                            gameImage: 42 /* GameImage.Iceball */,
                            enemyId: nextEnemyId++
                        }));
                    }
                }
                enemies.push(Enemy_Background_ExplodeI.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: -startingAngle,
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                }));
                return {
                    enemies: enemies,
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 50 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 50)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 16 * 1024,
                yMibi: yMibi - 16 * 1024,
                widthMibi: 32 * 1024,
                heightMibi: 32 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, explodeYMibi, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            displayOutput.drawImageRotatedClockwise(51 /* GameImage.BouncySnow */, 0, 0, 16, 16, (xMibi >> 10) - 8 * 3, (yMibi >> 10) - 8 * 3, displayAngleScaled, 3 * 128);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    Enemy_Bullet_BouncySnow.getEnemy = function ({ xMibi, angleScaled, explodeYMibi, difficulty, enemyId }) {
        let doubledSpeed;
        switch (difficulty) {
            case 0 /* Difficulty.Easy */:
                doubledSpeed = 5;
                break;
            case 1 /* Difficulty.Normal */:
                doubledSpeed = 7;
                break;
            case 2 /* Difficulty.Hard */:
                doubledSpeed = 9;
                break;
        }
        let xSpeed = Math.floor(doubledSpeed * DTMath.cosineScaled(angleScaled) / 2);
        let ySpeed = Math.floor(doubledSpeed * DTMath.sineScaled(angleScaled) / 2);
        let displayAngleScaled = -angleScaled - 90 * 128;
        let yMibi = (GlobalConstants.WINDOW_HEIGHT + 50) << 10;
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, explodeYMibi, null, enemyId);
    };
})());
let Enemy_Bullet_Coin = ((function () {
    let getEnemy = function (xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, hitboxOffsets, displayAngleScaled, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            xMibi += xSpeedInMibipixelsPerFrame + tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            yMibi += ySpeedInMibipixelsPerFrame;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 50 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 50)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            let hasCollidedWithTilemap = false;
            for (let hitboxOffset of hitboxOffsets) {
                if (tilemap.isSolid(xMibi + hitboxOffset.xMibiOffset, yMibi + hitboxOffset.yMibiOffset)) {
                    hasCollidedWithTilemap = true;
                    break;
                }
            }
            if (hasCollidedWithTilemap) {
                let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                return {
                    enemies: [poof],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitboxes = [];
            for (let hitboxOffset of hitboxOffsets) {
                hitboxes.push({
                    xMibi: xMibi - 2 * 3 * 1024 + hitboxOffset.xMibiOffset,
                    yMibi: yMibi - 2 * 3 * 1024 + hitboxOffset.yMibiOffset,
                    widthMibi: 4 * 3 * 1024,
                    heightMibi: 4 * 3 * 1024
                });
            }
            return hitboxes;
        };
        let getSnapshot = function (thisObj) {
            // Note that hitboxOffsets is immutable
            return getEnemy(xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, hitboxOffsets, displayAngleScaled, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            displayOutput.drawImageRotatedClockwise(45 /* GameImage.Coin */, 32, 0, 16, 16, (xMibi >> 10) - 8 * 3, (yMibi >> 10) - 8 * 3, displayAngleScaled, 3 * 128);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    return {
        getEnemy: function ({ xMibi, yMibi, speedInMibipixelsPerFrame, angleScaled, enemyId }) {
            angleScaled = DTMath.normalizeDegreesScaled(angleScaled);
            let xSpeedInMibipixelsPerFrame = (speedInMibipixelsPerFrame * DTMath.cosineScaled(angleScaled)) >> 10;
            let ySpeedInMibipixelsPerFrame = (speedInMibipixelsPerFrame * DTMath.sineScaled(angleScaled)) >> 10;
            let hitboxOffsets = [];
            hitboxOffsets.push({
                xMibiOffset: 4 * 3 * DTMath.cosineScaled(angleScaled),
                yMibiOffset: 4 * 3 * DTMath.sineScaled(angleScaled)
            });
            hitboxOffsets.push({
                xMibiOffset: -(hitboxOffsets[0].xMibiOffset),
                yMibiOffset: -(hitboxOffsets[0].yMibiOffset)
            });
            hitboxOffsets.push({
                xMibiOffset: 0,
                yMibiOffset: 0
            });
            let displayAngleScaled = -angleScaled + 90 * 128;
            return getEnemy(xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, hitboxOffsets, displayAngleScaled, null, enemyId);
        }
    };
})());
let Enemy_Bullet_Fireball_Gravity = ((function () {
    let computeDisplayAngleScaled = function (xSpeed, ySpeed) {
        if (xSpeed === 0 && ySpeed === 0)
            return 0;
        return -DTMath.arcTangentScaled(xSpeed, ySpeed) - 90 * 128;
    };
    let getEnemy = function (xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            ySpeedInMibipixelsPerFrame -= 180;
            xMibi += xSpeedInMibipixelsPerFrame;
            yMibi += ySpeedInMibipixelsPerFrame;
            displayAngleScaled = computeDisplayAngleScaled(xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -100 || x > GlobalConstants.WINDOW_WIDTH + 100 || y < -100 || y > GlobalConstants.WINDOW_HEIGHT + 3000)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            frameCounter++;
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 5 * 3 * 1024,
                yMibi: yMibi - 5 * 3 * 1024,
                widthMibi: 10 * 3 * 1024,
                heightMibi: 10 * 3 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 12) % 5;
            displayOutput.drawImageRotatedClockwise(36 /* GameImage.Flame */, 14 * spriteNum, 0, 14, 20, (xMibi >> 10) - 7 * 3, (yMibi >> 10) - 10 * 3, displayAngleScaled, 3 * 128);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    return {
        getEnemy: function ({ xInitialMibi, yInitialMibi, xSpeedInMibipixelsPerFrame, yInitialSpeedInMibipixelsPerFrame, enemyId }) {
            xInitialMibi += 4 * xSpeedInMibipixelsPerFrame;
            yInitialMibi += 4 * yInitialSpeedInMibipixelsPerFrame;
            let displayAngleScaled = computeDisplayAngleScaled(xSpeedInMibipixelsPerFrame, yInitialSpeedInMibipixelsPerFrame);
            return getEnemy(xInitialMibi, yInitialMibi, xSpeedInMibipixelsPerFrame, yInitialSpeedInMibipixelsPerFrame, displayAngleScaled, 0, null, enemyId);
        }
    };
})());
let Enemy_Bullet_Fireball_Homing = ((function () {
    let arcTangentScaled = function (x, y) {
        if (x === 0 && y === 0)
            return 0;
        return DTMath.arcTangentScaled(x, y);
    };
    let getEnemy = function (xMibi, yMibi, targetPixelXMibi, targetPixelYMibi, targetPixelSpeedInMibipixelsPerFrame, targetPixelAngleScaled1, targetPixelAngleScaled2, targetPixelAngleScaled3, targetPixelAngleOffsetScaled3, switchToPhase2Cutoff, switchToPhase3Cutoff, speedInMibipixelsPerFrame, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            frameCounter++;
            if (frameCounter < switchToPhase2Cutoff) {
                targetPixelXMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.cosineScaled(targetPixelAngleScaled1)) >> 8;
                targetPixelYMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.sineScaled(targetPixelAngleScaled1)) >> 8;
            }
            else if (frameCounter < switchToPhase3Cutoff) {
                targetPixelXMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.cosineScaled(targetPixelAngleScaled2)) >> 8;
                targetPixelYMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.sineScaled(targetPixelAngleScaled2)) >> 8;
            }
            else {
                if (targetPixelAngleScaled3 === null)
                    targetPixelAngleScaled3 = arcTangentScaled(playerState.xMibi - targetPixelXMibi, playerState.yMibi - targetPixelYMibi) + targetPixelAngleOffsetScaled3;
                targetPixelXMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.cosineScaled(targetPixelAngleScaled3)) >> 8;
                targetPixelYMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.sineScaled(targetPixelAngleScaled3)) >> 8;
            }
            let angleScaled = arcTangentScaled(targetPixelXMibi - xMibi, targetPixelYMibi - yMibi);
            xMibi += ((speedInMibipixelsPerFrame >> 2) * DTMath.cosineScaled(angleScaled)) >> 8;
            yMibi += ((speedInMibipixelsPerFrame >> 2) * DTMath.sineScaled(angleScaled)) >> 8;
            displayAngleScaled = -angleScaled - 90 * 128;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -100 || x > GlobalConstants.WINDOW_WIDTH + 1000 || y < -1000 || y > GlobalConstants.WINDOW_HEIGHT + 1000)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 5 * 3 * 1024,
                yMibi: yMibi - 5 * 3 * 1024,
                widthMibi: 10 * 3 * 1024,
                heightMibi: 10 * 3 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, targetPixelXMibi, targetPixelYMibi, targetPixelSpeedInMibipixelsPerFrame, targetPixelAngleScaled1, targetPixelAngleScaled2, targetPixelAngleScaled3, targetPixelAngleOffsetScaled3, switchToPhase2Cutoff, switchToPhase3Cutoff, speedInMibipixelsPerFrame, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 12) % 5;
            displayOutput.drawImageRotatedClockwise(38 /* GameImage.FlameGreen */, 14 * spriteNum, 0, 14, 20, (xMibi >> 10) - 7 * 3, (yMibi >> 10) - 10 * 3, displayAngleScaled, 3 * 128);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    return {
        getEnemy: function ({ xInitialMibi, yInitialMibi, targetPixelSpeedInMibipixelsPerFrame, targetPixelAngleScaled1, targetPixelAngleScaled2, targetPixelAngleOffsetScaled3, switchToPhase2Cutoff, switchToPhase3Cutoff, speedInMibipixelsPerFrame, enemyId }) {
            xInitialMibi += 2 * (((speedInMibipixelsPerFrame >> 2) * DTMath.cosineScaled(targetPixelAngleScaled1)) >> 8);
            yInitialMibi += 2 * (((speedInMibipixelsPerFrame >> 2) * DTMath.sineScaled(targetPixelAngleScaled1)) >> 8);
            return getEnemy(xInitialMibi, yInitialMibi, xInitialMibi, yInitialMibi, targetPixelSpeedInMibipixelsPerFrame, targetPixelAngleScaled1, targetPixelAngleScaled2, null, targetPixelAngleOffsetScaled3, switchToPhase2Cutoff, switchToPhase3Cutoff, speedInMibipixelsPerFrame, -targetPixelAngleScaled1 - 90 * 128, 0, null, enemyId);
        }
    };
})());
let Enemy_Bullet_Fireball_Normal = ((function () {
    let getEnemy = function (xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            xMibi += xSpeedInMibipixelsPerFrame;
            yMibi += ySpeedInMibipixelsPerFrame;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -100 || x > GlobalConstants.WINDOW_WIDTH + 100 || y < -100 || y > GlobalConstants.WINDOW_HEIGHT + 100)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            frameCounter++;
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 5 * 3 * 1024,
                yMibi: yMibi - 5 * 3 * 1024,
                widthMibi: 10 * 3 * 1024,
                heightMibi: 10 * 3 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 12) % 5;
            displayOutput.drawImageRotatedClockwise(36 /* GameImage.Flame */, 14 * spriteNum, 0, 14, 20, (xMibi >> 10) - 7 * 3, (yMibi >> 10) - 10 * 3, displayAngleScaled, 3 * 128);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    return {
        getEnemy: function ({ xInitialMibi, yInitialMibi, angleScaled, speedInMibipixelsPerFrame, enemyId }) {
            let xSpeedInMibipixelsPerFrame = (speedInMibipixelsPerFrame * DTMath.cosineScaled(angleScaled)) >> 10;
            let ySpeedInMibipixelsPerFrame = (speedInMibipixelsPerFrame * DTMath.sineScaled(angleScaled)) >> 10;
            let displayAngleScaled = -angleScaled - 90 * 128;
            xInitialMibi += 15 * DTMath.cosineScaled(angleScaled);
            yInitialMibi += 15 * DTMath.sineScaled(angleScaled);
            return getEnemy(xInitialMibi, yInitialMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, displayAngleScaled, 0, null, enemyId);
        }
    };
})());
let Enemy_Bullet_Fireball_Spiral = ((function () {
    let getEnemy = function (xMibi, yMibi, xInitialMibi, yInitialMibi, angleScaled, radiusInMibipixels, angularSpeedInAngleScaledPerFrame, radiusSpeedInMibipixelsPerFrame, isRotatingClockwise, frameCounter, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            if (isRotatingClockwise) {
                angleScaled -= angularSpeedInAngleScaledPerFrame;
                while (angleScaled < 0)
                    angleScaled += 360 * 128;
            }
            else {
                angleScaled += angularSpeedInAngleScaledPerFrame;
                while (angleScaled >= 360 * 128)
                    angleScaled -= 360 * 128;
            }
            radiusInMibipixels += radiusSpeedInMibipixelsPerFrame;
            xMibi = xInitialMibi + (((radiusInMibipixels >> 2) * DTMath.cosineScaled(angleScaled)) >> 8);
            yMibi = yInitialMibi + (((radiusInMibipixels >> 2) * DTMath.sineScaled(angleScaled)) >> 8);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -1500 || x > GlobalConstants.WINDOW_WIDTH + 1500 || y < -1500 || y > GlobalConstants.WINDOW_HEIGHT + 1500)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            frameCounter++;
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 5 * 3 * 1024,
                yMibi: yMibi - 5 * 3 * 1024,
                widthMibi: 10 * 3 * 1024,
                heightMibi: 10 * 3 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xInitialMibi, yInitialMibi, angleScaled, radiusInMibipixels, angularSpeedInAngleScaledPerFrame, radiusSpeedInMibipixelsPerFrame, isRotatingClockwise, frameCounter, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 12) % 5;
            let displayAngleScaled = isRotatingClockwise
                ? -angleScaled
                : (-angleScaled + 180 * 128);
            displayOutput.drawImageRotatedClockwise(37 /* GameImage.FlameBlue */, 14 * spriteNum, 0, 14, 20, (xMibi >> 10) - 7 * 3, (yMibi >> 10) - 10 * 3, displayAngleScaled, 3 * 128);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    return {
        getEnemy: function ({ xInitialMibi, yInitialMibi, angleScaled, angularSpeedInAngleScaledPerFrame, radiusSpeedInMibipixelsPerFrame, isRotatingClockwise, enemyId }) {
            angleScaled = DTMath.normalizeDegreesScaled(angleScaled);
            return getEnemy(xInitialMibi, yInitialMibi, xInitialMibi, yInitialMibi, angleScaled, 0, angularSpeedInAngleScaledPerFrame, radiusSpeedInMibipixelsPerFrame, isRotatingClockwise, 0, null, enemyId);
        }
    };
})());
let Enemy_Bullet_Freezewave = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, frameCounter, screenWipeCountdown, scalingFactorScaled, hasCollisionWithTilemap, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            xMibi += xSpeed;
            yMibi += ySpeed;
            frameCounter++;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            let boundaryBuffer = (34 * scalingFactorScaled) >> 7;
            if (x < -boundaryBuffer || x > GlobalConstants.WINDOW_WIDTH + boundaryBuffer || y < -boundaryBuffer || y > GlobalConstants.WINDOW_HEIGHT + boundaryBuffer)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (hasCollisionWithTilemap && tilemap.isSolid(xMibi, yMibi)) {
                let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: scalingFactorScaled * 2, enemyId: nextEnemyId++ });
                return {
                    enemies: [poof],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: scalingFactorScaled * 2, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - ((10 * scalingFactorScaled) >> 7) * 1024,
                yMibi: yMibi - ((10 * scalingFactorScaled) >> 7) * 1024,
                widthMibi: ((20 * scalingFactorScaled) >> 7) * 1024,
                heightMibi: ((20 * scalingFactorScaled) >> 7) * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, frameCounter, screenWipeCountdown, scalingFactorScaled, hasCollisionWithTilemap, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 2;
            displayOutput.drawImageRotatedClockwise(23 /* GameImage.Freezewave */, spriteNum * 28, 0, 28, 24, (xMibi >> 10) - ((14 * scalingFactorScaled) >> 7), (yMibi >> 10) - ((12 * scalingFactorScaled) >> 7), displayAngleScaled, scalingFactorScaled);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    Enemy_Bullet_Freezewave.getEnemy = function ({ xMibi, yMibi, playerState, speed, scalingFactorScaled, hasCollisionWithTilemap, enemyId }) {
        let x = playerState.xMibi - xMibi;
        let y = playerState.yMibi - yMibi;
        if (x === 0 && y === 0)
            x = 1;
        let angleScaled = DTMath.arcTangentScaled(x, y);
        let xSpeed = speed * DTMath.cosineScaled(angleScaled);
        let ySpeed = speed * DTMath.sineScaled(angleScaled);
        let displayAngleScaled = -angleScaled;
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, 0, null, scalingFactorScaled, hasCollisionWithTilemap, enemyId);
    };
})());
let Enemy_Bullet_Homing = {};
((function () {
    let getEnemy = function (xMibi, yMibi, displayAngleScaled, homingTargetXMibi, homingTargetYMibi, homingTargetAngleScaled, frameCounter, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let arcTangentScaled = function (x, y) {
            if (x === 0 && y === 0)
                return 0;
            return DTMath.arcTangentScaled(x, y);
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
            let angleScaled = arcTangentScaled(homingTargetXMibi - xMibi, homingTargetYMibi - yMibi);
            let doubledSpeed;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    doubledSpeed = 12;
                    break;
                case 1 /* Difficulty.Normal */:
                    doubledSpeed = 25;
                    break;
                case 2 /* Difficulty.Hard */:
                    doubledSpeed = 35;
                    break;
            }
            let xSpeed = Math.floor(DTMath.cosineScaled(angleScaled) * doubledSpeed / 2);
            let ySpeed = Math.floor(DTMath.sineScaled(angleScaled) * doubledSpeed / 2);
            xMibi += xSpeed;
            yMibi += ySpeed;
            displayAngleScaled = -angleScaled;
            frameCounter++;
            if (frameCounter === 12) {
                let targetX = playerState.xMibi;
                let targetY = playerState.yMibi;
                let deltaX = xMibi - targetX;
                let deltaY = yMibi - targetY;
                targetX -= deltaX >> 1;
                targetY -= deltaY >> 1;
                homingTargetAngleScaled = arcTangentScaled(targetX - homingTargetXMibi, targetY - homingTargetYMibi);
            }
            homingTargetXMibi += Math.floor(DTMath.cosineScaled(homingTargetAngleScaled) * 95 / 2);
            homingTargetYMibi += Math.floor(DTMath.sineScaled(homingTargetAngleScaled) * 95 / 2);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -100 || x > GlobalConstants.WINDOW_WIDTH + 100 || y < -100 || y > GlobalConstants.WINDOW_HEIGHT + 100)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        scalingFactorScaled: 3 * 128 * 2,
                        enemyId: nextEnemyId++
                    });
                    return {
                        enemies: [poof],
                        nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 30 * 1024,
                yMibi: yMibi - 30 * 1024,
                widthMibi: 60 * 1024,
                heightMibi: 60 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, displayAngleScaled, homingTargetXMibi, homingTargetYMibi, homingTargetAngleScaled, frameCounter, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 2;
            displayOutput.drawImageRotatedClockwise(23 /* GameImage.Freezewave */, spriteNum * 28, 0, 28, 24, (xMibi >> 10) - 14 * 3, (yMibi >> 10) - 12 * 3, displayAngleScaled, 3 * 128);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    Enemy_Bullet_Homing.getEnemy = function ({ xMibi, yMibi, initialAngleScaled, enemyId }) {
        let displayAngleScaled = -initialAngleScaled;
        return getEnemy(xMibi, yMibi, displayAngleScaled, xMibi, yMibi, initialAngleScaled, 0, null, enemyId);
    };
})());
let Enemy_Bullet_Iceball = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, screenWipeCountdown, hasCollisionWithTilemap, collisionWithTilemapCountdown, gameImage, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            xMibi += xSpeed;
            yMibi += ySpeed;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 50 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 50)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            if (hasCollisionWithTilemap && collisionWithTilemapCountdown === null && tilemap.isSolid(xMibi, yMibi)) {
                collisionWithTilemapCountdown = 5;
            }
            if (collisionWithTilemapCountdown !== null)
                collisionWithTilemapCountdown--;
            if (collisionWithTilemapCountdown === 0 || collisionWithTilemapCountdown !== null && !tilemap.isSolid(xMibi, yMibi)) {
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 8 * 1024,
                yMibi: yMibi - 8 * 1024,
                widthMibi: 17 * 1024,
                heightMibi: 17 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, screenWipeCountdown, hasCollisionWithTilemap, collisionWithTilemapCountdown, gameImage, enemyId);
        };
        let render = function (displayOutput) {
            displayOutput.drawImageRotatedClockwise(gameImage, 0, 0, 6, 6, (xMibi >> 10) - 3 * 3, (yMibi >> 10) - 3 * 3, displayAngleScaled, 3 * 128);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    Enemy_Bullet_Iceball.getEnemy = function ({ xMibi, yMibi, speed, angleScaled, xVelocityOffsetInMibipixelsPerFrame, hasCollisionWithTilemap, gameImage, enemyId }) {
        let xSpeed = ((speed * DTMath.cosineScaled(angleScaled)) >> 10) + xVelocityOffsetInMibipixelsPerFrame;
        let ySpeed = (speed * DTMath.sineScaled(angleScaled)) >> 10;
        let displayAngleScaled = -angleScaled - 90 * 128;
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, null, hasCollisionWithTilemap, null, gameImage, enemyId);
    };
})());
let Enemy_Bullet_Noone = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, rotatesClockwise, displayAngleScaled, screenWipeCountdown, gameImage, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, tilemap }) {
            xMibi += xSpeed;
            yMibi += ySpeed;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 50 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 50)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (tilemap.isSolid(xMibi, yMibi)) {
                let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                return {
                    enemies: [poof],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            if (rotatesClockwise) {
                displayAngleScaled += 192;
                if (displayAngleScaled >= 360 * 128)
                    displayAngleScaled -= 360 * 128;
            }
            else {
                displayAngleScaled -= 192;
                if (displayAngleScaled < 0)
                    displayAngleScaled += 360 * 128;
            }
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128 * 2, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 16 * 1024,
                yMibi: yMibi - 16 * 1024,
                widthMibi: 32 * 1024,
                heightMibi: 32 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, rotatesClockwise, displayAngleScaled, screenWipeCountdown, gameImage, enemyId);
        };
        let render = function (displayOutput) {
            displayOutput.drawImageRotatedClockwise(gameImage, 0, 0, 16, 16, (xMibi >> 10) - 8 * 3, (yMibi >> 10) - 8 * 3, displayAngleScaled, 3 * 128);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    Enemy_Bullet_Noone.getEnemy = function ({ xMibi, yMibi, directionScaled, xVelocityOffsetInMibipixelsPerFrame, rotatesClockwise, displayAngleScaled, gameImage, difficulty, enemyId }) {
        displayAngleScaled = DTMath.normalizeDegreesScaled(displayAngleScaled);
        let doubledSpeed;
        switch (difficulty) {
            case 0 /* Difficulty.Easy */:
                doubledSpeed = 3;
                break;
            case 1 /* Difficulty.Normal */:
                doubledSpeed = 4;
                break;
            case 2 /* Difficulty.Hard */:
                doubledSpeed = 5;
                break;
        }
        let xSpeed = Math.floor(DTMath.cosineScaled(directionScaled) * doubledSpeed / 2) + xVelocityOffsetInMibipixelsPerFrame;
        let ySpeed = Math.floor(DTMath.sineScaled(directionScaled) * doubledSpeed / 2);
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, rotatesClockwise, displayAngleScaled, null, gameImage, enemyId);
    };
})());
let Enemy_Bullet_Strawberry = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, screenWipeCountdown, hasCollisionWithTilemap, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, tilemap, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput }) {
            xMibi += xSpeed;
            yMibi += ySpeed;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 50 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 50)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (hasCollisionWithTilemap && tilemap.isSolid(xMibi, yMibi)) {
                let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                return {
                    enemies: [poof],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 10 * 1024,
                yMibi: yMibi - 10 * 1024,
                widthMibi: 20 * 1024,
                heightMibi: 20 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, screenWipeCountdown, hasCollisionWithTilemap, enemyId);
        };
        let render = function (displayOutput) {
            displayOutput.drawImageRotatedClockwise(22 /* GameImage.Strawberry */, 0, 0, 10, 12, (xMibi >> 10) - 5 * 3, (yMibi >> 10) - 6 * 3, displayAngleScaled, 3 * 128);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    Enemy_Bullet_Strawberry.getEnemy = function ({ xMibi, yMibi, angleScaled, xVelocityOffsetInMibipixelsPerFrame, hasCollisionWithTilemap, enemyId }) {
        let speed = 2;
        let xSpeed = speed * DTMath.cosineScaled(angleScaled) + xVelocityOffsetInMibipixelsPerFrame;
        let ySpeed = speed * DTMath.sineScaled(angleScaled);
        let displayAngleScaled = -angleScaled - 90 * 128;
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, null, hasCollisionWithTilemap, enemyId);
    };
})());
let Enemy_Bullet_TinyFlameBlue = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, screenWipeCountdown, hasCollisionWithTilemap, collisionWithTilemapCountdown, frameCounter, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            xMibi += xSpeed;
            yMibi += ySpeed;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -750 || x > GlobalConstants.WINDOW_WIDTH + 750 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 50)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 192, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            if (hasCollisionWithTilemap && collisionWithTilemapCountdown === null && tilemap.isSolid(xMibi, yMibi)) {
                collisionWithTilemapCountdown = 5;
            }
            if (collisionWithTilemapCountdown !== null)
                collisionWithTilemapCountdown--;
            if (collisionWithTilemapCountdown === 0 || collisionWithTilemapCountdown !== null && !tilemap.isSolid(xMibi, yMibi)) {
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            frameCounter++;
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 3 * 3 * 1024,
                yMibi: yMibi - 3 * 3 * 1024,
                widthMibi: 6 * 3 * 1024,
                heightMibi: 6 * 3 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, screenWipeCountdown, hasCollisionWithTilemap, collisionWithTilemapCountdown, frameCounter, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 8) % 4;
            displayOutput.drawImageRotatedClockwise(10 /* GameImage.TinyFlameBlue */, spriteNum <= 2 ? (spriteNum * 8) : 0, spriteNum <= 2 ? 0 : 8, 8, 8, (xMibi >> 10) - 4 * 3, (yMibi >> 10) - 4 * 3, displayAngleScaled, 3 * 128);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    Enemy_Bullet_TinyFlameBlue.getEnemy = function ({ xMibi, yMibi, speed, angleScaled, xVelocityOffsetInMibipixelsPerFrame, hasCollisionWithTilemap, enemyId }) {
        let xSpeed = ((speed * DTMath.cosineScaled(angleScaled)) >> 10) + xVelocityOffsetInMibipixelsPerFrame;
        let ySpeed = (speed * DTMath.sineScaled(angleScaled)) >> 10;
        let displayAngleScaled = -angleScaled - 90 * 128;
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, null, hasCollisionWithTilemap, null, 0, enemyId);
    };
})());
let Enemy_FireChain = ((function () {
    let getAttackCooldown = function (difficulty) {
        switch (difficulty) {
            case 0 /* Difficulty.Easy */: return 6;
            case 1 /* Difficulty.Normal */: return 5;
            case 2 /* Difficulty.Hard */: return 3;
        }
    };
    let getEnemy = function (xMibi, yMibi, direction, angleScaled, fireballs, attackCooldown, attackAngleScaled, screenWipeCountdown, difficulty, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (direction === 2 /* Direction.Down */ && y < -110)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            if (screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            angleScaled += 2445;
            if (angleScaled >= 360 * 128)
                angleScaled -= 360 * 128;
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            switch (direction) {
                case 0 /* Direction.Up */:
                    yMibi += 4608;
                    if (tilemap.isSolid(xMibi, yMibi + 1024 * 16 * 3 * 2))
                        direction = 1 /* Direction.Right */;
                    break;
                case 1 /* Direction.Right */:
                    xMibi += 4608;
                    if (tilemap.isSolid(xMibi + 1024 * 16 * 3 * 2, yMibi))
                        direction = 2 /* Direction.Down */;
                    break;
                case 2 /* Direction.Down */:
                    yMibi -= 4608;
                    break;
            }
            if (fireballs === null) {
                fireballs = [];
                for (let i = 0; i < 5; i++) {
                    fireballs.push({ xMibi: 0, yMibi: 0, frameCounter: rng.nextInt(100) });
                }
            }
            for (let i = 0; i < 5; i++) {
                fireballs[i].frameCounter++;
                fireballs[i].xMibi = xMibi + i * (8 * 3) * DTMath.cosineScaled(angleScaled - i * 6518);
                fireballs[i].yMibi = yMibi - i * (8 * 3) * DTMath.sineScaled(angleScaled - i * 6518);
            }
            let enemies = [thisObj];
            if (attackCooldown === null)
                attackCooldown = rng.nextInt(getAttackCooldown(difficulty));
            attackCooldown--;
            if (attackCooldown <= 0 && screenWipeCountdown === null) {
                attackCooldown = getAttackCooldown(difficulty);
                let increment;
                let numBullets;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        increment = 3000;
                        numBullets = 2;
                        break;
                    case 1 /* Difficulty.Normal */:
                        increment = 2500;
                        numBullets = 3;
                        break;
                    case 2 /* Difficulty.Hard */:
                        increment = 1500;
                        numBullets = 3;
                        break;
                }
                let delta = Math.floor(360 * 128 / numBullets);
                if (attackAngleScaled === null)
                    attackAngleScaled = rng.nextInt(360 * 128);
                attackAngleScaled += increment;
                if (attackAngleScaled >= 360 * 128)
                    attackAngleScaled -= 360 * 128;
                for (let i = 0; i < numBullets; i++) {
                    enemies.push(Enemy_Bullet_TinyFlameBlue.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        speed: 1400,
                        angleScaled: attackAngleScaled + delta * i,
                        xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                        hasCollisionWithTilemap: true,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            if (fireballs === null)
                return null;
            let returnVal = [];
            for (let fireball of fireballs) {
                returnVal.push({
                    xMibi: fireball.xMibi - 3 * 3 * 1024,
                    yMibi: fireball.yMibi - 3 * 3 * 1024,
                    widthMibi: 3 * 6 * 1024,
                    heightMibi: 3 * 6 * 1024
                });
            }
            return returnVal;
        };
        let getDamageboxes = function () {
            return null;
        };
        let render = function (displayOutput) {
            if (fireballs === null)
                return;
            for (let fireball of fireballs) {
                let spriteNum = Math.floor(fireball.frameCounter / 8) % 4;
                displayOutput.drawImageRotatedClockwise(39 /* GameImage.Fireball */, spriteNum * 8, 0, 8, 8, (fireball.xMibi >> 10) - 3 * 4, (fireball.yMibi >> 10) - 3 * 4, 0, 128 * 3);
            }
        };
        let getSnapshot = function (thisObj) {
            let fireballsCopy;
            if (fireballs !== null)
                fireballsCopy = fireballs.map(fireball => ({ xMibi: fireball.xMibi, yMibi: fireball.yMibi, frameCounter: fireball.frameCounter }));
            else
                fireballsCopy = null;
            return getEnemy(xMibi, yMibi, direction, angleScaled, fireballsCopy, attackCooldown, attackAngleScaled, screenWipeCountdown, difficulty, enemyId);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    return {
        getEnemy: function ({ xMibi, angleScaled, difficulty, enemyId }) {
            angleScaled = DTMath.normalizeDegreesScaled(angleScaled);
            return getEnemy(xMibi, -110 * 1024, 0 /* Direction.Up */, angleScaled, null, null, null, null, difficulty, enemyId);
        }
    };
})());
let Enemy_FireChainSpawner = ((function () {
    let getAttackCooldown = function (difficulty) {
        switch (difficulty) {
            case 0 /* Difficulty.Easy */: return 575;
            case 1 /* Difficulty.Normal */: return 450;
            case 2 /* Difficulty.Hard */: return 275;
        }
    };
    let getEnemy = function (xMibi, attackCooldown, screenWipeCountdown, difficulty, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            if (screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            if (xMibi < -1000 * 1024)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            let enemies = [thisObj];
            if (attackCooldown === null)
                attackCooldown = rng.nextInt(getAttackCooldown(difficulty));
            attackCooldown--;
            if (attackCooldown <= 0 && screenWipeCountdown === null) {
                attackCooldown = getAttackCooldown(difficulty);
                enemies.push(Enemy_FireChain.getEnemy({
                    xMibi: xMibi,
                    angleScaled: rng.nextInt(360 * 128),
                    difficulty: difficulty,
                    enemyId: nextEnemyId++
                }));
            }
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            return null;
        };
        let render = function (displayOutput) {
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, attackCooldown, screenWipeCountdown, difficulty, enemyId);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: true,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    return {
        getEnemy: function ({ xMibi, difficulty, enemyId }) {
            return getEnemy(xMibi, null, null, difficulty, enemyId);
        }
    };
})());
let Enemy_Flyamanita = {};
((function () {
    let getAttackCooldown = function (difficulty) {
        switch (difficulty) {
            case 0 /* Difficulty.Easy */: return 190;
            case 1 /* Difficulty.Normal */: return 72;
            case 2 /* Difficulty.Hard */: return 26;
        }
    };
    let getEnemy = function (xMibi, yMibi, yInitialMibi, yAngleScaled, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 250 || y < -250 || y > GlobalConstants.WINDOW_HEIGHT + 250)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            if (hp <= 0 || screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            yAngleScaled += 192;
            if (yAngleScaled >= 360 * 128)
                yAngleScaled -= 360 * 128;
            yMibi = yInitialMibi + 90 * DTMath.sineScaled(yAngleScaled);
            let enemies = [thisObj];
            if (attackCooldown === null)
                attackCooldown = rng.nextInt(getAttackCooldown(difficulty));
            attackCooldown--;
            if (attackCooldown <= 0 && screenWipeCountdown === null) {
                attackCooldown = getAttackCooldown(difficulty);
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let freezewaveSpeed;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        freezewaveSpeed = 3;
                        break;
                    case 1 /* Difficulty.Normal */:
                        freezewaveSpeed = 4;
                        break;
                    case 2 /* Difficulty.Hard */:
                        freezewaveSpeed = 4;
                        break;
                }
                enemies.push(Enemy_Bullet_Freezewave.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    playerState: playerState,
                    speed: freezewaveSpeed,
                    scalingFactorScaled: 192,
                    hasCollisionWithTilemap: true,
                    enemyId: nextEnemyId++
                }));
            }
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            frameCounter++;
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 7 * 1024,
                    yMibi: yMibi - 3 * 7 * 1024,
                    widthMibi: 3 * 14 * 1024,
                    heightMibi: 3 * 14 * 1024
                }];
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 8 * 1024,
                    yMibi: yMibi - 3 * 8 * 1024,
                    widthMibi: 3 * 16 * 1024,
                    heightMibi: 3 * 16 * 1024
                }];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 4;
            displayOutput.drawImageRotatedClockwise(11 /* GameImage.FlyAmanita */, spriteNum * 20, 0, 20, 20, (xMibi >> 10) - 3 * 10, (yMibi >> 10) - 3 * 10, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, yInitialMibi, yAngleScaled, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            hp--;
            return true;
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe,
            render
        };
    };
    Enemy_Flyamanita.getEnemy = function ({ xMibi, yInitialMibi, yAngleScaled, difficulty, enemyId }) {
        yAngleScaled = DTMath.normalizeDegreesScaled(yAngleScaled);
        let hp;
        switch (difficulty) {
            case 0 /* Difficulty.Easy */:
                hp = 42;
                break;
            case 1 /* Difficulty.Normal */:
                hp = 46;
                break;
            case 2 /* Difficulty.Hard */:
                hp = 50;
                break;
        }
        let yMibi = yInitialMibi + 90 * DTMath.sineScaled(yAngleScaled);
        return getEnemy(xMibi, yMibi, yInitialMibi, yAngleScaled, hp, null, 0, null, enemyId);
    };
})());
let Enemy_FlyamanitaBig = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
            let ATTACK_COOLDOWN;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN = 100;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN = 34;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN = 22;
                    break;
            }
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi -= xSpeed;
            xSpeed -= 10;
            if (xSpeed <= 0)
                xSpeed = 0;
            if (xSpeed > 0) {
                if (difficulty === 2 /* Difficulty.Hard */)
                    attackCooldown = rng.nextInt(ATTACK_COOLDOWN);
            }
            if (hp <= 0 || frameCounter >= 1200 || screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(360 * 128),
                    scalingFactorScaled: 128 * 3 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            let enemies = [thisObj];
            if (xSpeed === 0) {
                attackCooldown--;
                if (attackCooldown <= 0 && screenWipeCountdown === null) {
                    attackCooldown = ATTACK_COOLDOWN;
                    soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                    let freezewaveSpeed;
                    switch (difficulty) {
                        case 0 /* Difficulty.Easy */:
                            freezewaveSpeed = 5;
                            break;
                        case 1 /* Difficulty.Normal */:
                            freezewaveSpeed = 10;
                            break;
                        case 2 /* Difficulty.Hard */:
                            freezewaveSpeed = 15;
                            break;
                    }
                    enemies.push(Enemy_Bullet_Freezewave.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        playerState: playerState,
                        speed: freezewaveSpeed,
                        scalingFactorScaled: 3 * 128,
                        hasCollisionWithTilemap: true,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            frameCounter++;
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 3 * 8 * 3 * 1024,
                yMibi: yMibi - 3 * 8 * 3 * 1024,
                widthMibi: 3 * 16 * 3 * 1024,
                heightMibi: 3 * 16 * 3 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            let hitbox = {
                xMibi: xMibi - 3 * 8 * 3 * 1024,
                yMibi: yMibi - 3 * 8 * 3 * 1024,
                widthMibi: 3 * 16 * 3 * 1024,
                heightMibi: 3 * 16 * 3 * 1024
            };
            return [hitbox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 4;
            displayOutput.drawImageRotatedClockwise(11 /* GameImage.FlyAmanita */, spriteNum * 20, 0, 20, 20, (xMibi >> 10) - 3 * 3 * 10, (yMibi >> 10) - 3 * 3 * 10, 0, 128 * 3 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            hp--;
            return true;
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe: onScreenWipe,
            render: render
        };
    };
    Enemy_FlyamanitaBig.getEnemy = function ({ yMibi, enemyId }) {
        let hp = 250;
        let xSpeed = 2500;
        return getEnemy((GlobalConstants.WINDOW_WIDTH + 100) << 10, yMibi, xSpeed, hp, 0, 0, null, enemyId);
    };
})());
let Enemy_LargeFireChain_EasyNormal = ((function () {
    let getAttackCooldown = function (difficulty) {
        switch (difficulty) {
            case 0 /* Difficulty.Easy */: return 15;
            case 1 /* Difficulty.Normal */: return 7;
            case 2 /* Difficulty.Hard */: return 7;
        }
    };
    let getEnemy = function (xMibi, yMibi, angleScaled, shouldRotateClockwise, fireballs, attackCooldown, screenWipeCountdown, difficulty, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -1000)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            if (screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            if (shouldRotateClockwise) {
                angleScaled -= 61;
                if (angleScaled < 0)
                    angleScaled += 360 * 128;
            }
            else {
                angleScaled += 61;
                if (angleScaled >= 360 * 128)
                    angleScaled -= 360 * 128;
            }
            let numFireballRows = difficulty === 0 /* Difficulty.Easy */ ? 3 : 5;
            let numFireballsPerRow = 20;
            if (fireballs === null) {
                fireballs = [];
                let angleScaledIncrement = Math.floor(360 * 128 / numFireballRows);
                for (let i = 0; i < numFireballsPerRow; i++) {
                    for (let j = 0; j < (i === 0 ? 1 : numFireballRows); j++) {
                        fireballs.push({
                            xMibi: 0,
                            yMibi: 0,
                            radius: i * (8 * 3),
                            angleScaledOffset: j * angleScaledIncrement + (shouldRotateClockwise ? 1 : -1) * i * 163,
                            frameCounter: rng.nextInt(100)
                        });
                    }
                }
            }
            for (let fireball of fireballs) {
                fireball.frameCounter++;
                fireball.xMibi = xMibi + fireball.radius * DTMath.cosineScaled(angleScaled + fireball.angleScaledOffset);
                fireball.yMibi = yMibi + fireball.radius * DTMath.sineScaled(angleScaled + fireball.angleScaledOffset);
            }
            let enemies = [thisObj];
            if (attackCooldown === null)
                attackCooldown = rng.nextInt(getAttackCooldown(difficulty));
            attackCooldown--;
            if (attackCooldown <= 0 && screenWipeCountdown === null) {
                attackCooldown = getAttackCooldown(difficulty);
                enemies.push(Enemy_Bullet_TinyFlameBlue.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    speed: 1200 + rng.nextInt(3600),
                    angleScaled: rng.nextInt(360 * 128),
                    xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                    hasCollisionWithTilemap: true,
                    enemyId: nextEnemyId++
                }));
            }
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            if (fireballs === null)
                return null;
            let returnVal = [];
            for (let fireball of fireballs) {
                returnVal.push({
                    xMibi: fireball.xMibi - 3 * 4 * 1024,
                    yMibi: fireball.yMibi - 3 * 4 * 1024,
                    widthMibi: 3 * 8 * 1024,
                    heightMibi: 3 * 8 * 1024
                });
            }
            return returnVal;
        };
        let getDamageboxes = function () {
            return null;
        };
        let render = function (displayOutput) {
            if (fireballs === null)
                return;
            for (let fireball of fireballs) {
                let spriteNum = Math.floor(fireball.frameCounter / 8) % 4;
                displayOutput.drawImageRotatedClockwise(39 /* GameImage.Fireball */, spriteNum * 8, 0, 8, 8, (fireball.xMibi >> 10) - 3 * 4, (fireball.yMibi >> 10) - 3 * 4, 0, 128 * 3);
            }
        };
        let getSnapshot = function (thisObj) {
            let fireballsCopy;
            if (fireballs !== null)
                fireballsCopy = fireballs.map(fireball => ({ xMibi: fireball.xMibi, yMibi: fireball.yMibi, radius: fireball.radius, angleScaledOffset: fireball.angleScaledOffset, frameCounter: fireball.frameCounter }));
            else
                fireballsCopy = null;
            return getEnemy(xMibi, yMibi, angleScaled, shouldRotateClockwise, fireballsCopy, attackCooldown, screenWipeCountdown, difficulty, enemyId);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    return {
        getEnemy: function ({ xMibi, yMibi, angleScaled, shouldRotateClockwise, difficulty, enemyId }) {
            angleScaled = DTMath.normalizeDegreesScaled(angleScaled);
            return getEnemy(xMibi, yMibi, angleScaled, shouldRotateClockwise, null, null, null, difficulty, enemyId);
        }
    };
})());
let Enemy_LargeFireChain_Hard = ((function () {
    let getEnemy = function (xMibi, yMibi, angleScaled, shouldRotateClockwise, fireballs, attackCooldown, screenWipeCountdown, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            let x = xMibi >> 10;
            if (x < -1000)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            if (screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            if (shouldRotateClockwise) {
                angleScaled -= 15;
                if (angleScaled < 0)
                    angleScaled += 360 * 128;
            }
            else {
                angleScaled += 15;
                if (angleScaled >= 360 * 128)
                    angleScaled -= 360 * 128;
            }
            if (fireballs === null) {
                fireballs = [];
                let numFireballRows = 5;
                let numFireballsPerRow = 20;
                let angleScaledIncrement = Math.floor(360 * 128 / numFireballRows);
                for (let i = 0; i < numFireballsPerRow; i++) {
                    for (let j = 0; j < (i === 0 ? 1 : numFireballRows); j++) {
                        fireballs.push({
                            xMibi: 0,
                            yMibi: 0,
                            radiusInUnits: i,
                            angleScaledOffset: j * angleScaledIncrement,
                            frameCounter: rng.nextInt(100)
                        });
                    }
                }
            }
            for (let fireball of fireballs) {
                fireball.frameCounter++;
                fireball.xMibi = xMibi + fireball.radiusInUnits * (3 * 8) * DTMath.cosineScaled(fireball.radiusInUnits * angleScaled + fireball.angleScaledOffset);
                fireball.yMibi = yMibi + fireball.radiusInUnits * (3 * 8) * DTMath.sineScaled(fireball.radiusInUnits * angleScaled + fireball.angleScaledOffset);
            }
            let enemies = [thisObj];
            if (attackCooldown === null)
                attackCooldown = rng.nextInt(7);
            attackCooldown--;
            if (attackCooldown <= 0 && screenWipeCountdown === null) {
                attackCooldown = 7;
                enemies.push(Enemy_Bullet_TinyFlameBlue.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    speed: 1200 + rng.nextInt(3600),
                    angleScaled: rng.nextInt(360 * 128),
                    xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                    hasCollisionWithTilemap: true,
                    enemyId: nextEnemyId++
                }));
            }
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            if (fireballs === null)
                return null;
            let returnVal = [];
            for (let fireball of fireballs) {
                returnVal.push({
                    xMibi: fireball.xMibi - 3 * 4 * 1024,
                    yMibi: fireball.yMibi - 3 * 4 * 1024,
                    widthMibi: 3 * 8 * 1024,
                    heightMibi: 3 * 8 * 1024
                });
            }
            return returnVal;
        };
        let render = function (displayOutput) {
            if (fireballs === null)
                return;
            for (let fireball of fireballs) {
                let spriteNum = Math.floor(fireball.frameCounter / 8) % 4;
                displayOutput.drawImageRotatedClockwise(39 /* GameImage.Fireball */, spriteNum * 8, 0, 8, 8, (fireball.xMibi >> 10) - 3 * 4, (fireball.yMibi >> 10) - 3 * 4, 0, 128 * 3);
            }
        };
        let getSnapshot = function (thisObj) {
            let fireballsCopy;
            if (fireballs !== null)
                fireballsCopy = fireballs.map(fireball => ({ xMibi: fireball.xMibi, yMibi: fireball.yMibi, radiusInUnits: fireball.radiusInUnits, angleScaledOffset: fireball.angleScaledOffset, frameCounter: fireball.frameCounter }));
            else
                fireballsCopy = null;
            return getEnemy(xMibi, yMibi, angleScaled, shouldRotateClockwise, fireballsCopy, attackCooldown, screenWipeCountdown, enemyId);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render,
            enemyId
        };
    };
    return {
        getEnemy: function ({ xMibi, yMibi, angleScaled, shouldRotateClockwise, enemyId }) {
            angleScaled = DTMath.normalizeDegreesScaled(angleScaled);
            return getEnemy(xMibi, yMibi, angleScaled, shouldRotateClockwise, null, null, null, enemyId);
        }
    };
})());
let Enemy_Level1 = {};
((function () {
    let getEnemy = function (frameCount, bossSpawnCounter, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let enemies = [thisObj];
            frameCount++;
            if (frameCount === 10)
                enemies.push(Enemy_Background_Instructions.getEnemy({ enemyId: nextEnemyId++ }));
            let newTilemapEnemies = tilemap.getNewEnemies();
            for (let newTilemapEnemy of newTilemapEnemies) {
                if (newTilemapEnemy.id === 0) {
                    enemies.push(Enemy_Flyamanita.getEnemy({
                        xMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        yAngleScaled: rng.nextInt(360 * 128),
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 1) {
                    enemies.push(Enemy_Smartcap.getEnemy({
                        xInitialMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        isFacingRight: false,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 2) {
                    enemies.push(Enemy_Snowball.getEnemy({
                        xInitialMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        isFacingRight: false,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else {
                    throw new Error("Unrecognized id: " + newTilemapEnemy.id);
                }
            }
            if (bossSpawnCounter !== null)
                bossSpawnCounter++;
            if (bossSpawnCounter === null && tilemap.hasReachedEndOfMap())
                bossSpawnCounter = 0;
            let shouldScreenWipe = false;
            let shouldCreateAutoSavestate = false;
            if (bossSpawnCounter !== null && bossSpawnCounter === 1)
                shouldScreenWipe = true;
            if (bossSpawnCounter !== null && bossSpawnCounter === 1 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 40)
                shouldCreateAutoSavestate = true;
            if (bossSpawnCounter !== null && bossSpawnCounter === 1 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 80)
                enemies.push(Enemy_Level1BossCutscene.getEnemy({ enemyId: nextEnemyId++ }));
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                shouldScreenWipe,
                shouldCreateAutoSavestate
            };
            if (bossSpawnCounter === null || bossSpawnCounter < 1 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 80)
                returnVal.musicToPlay = 2 /* GameMusic.ForestTop */;
            return returnVal;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(frameCount, bossSpawnCounter, enemyId);
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: true,
            processFrame,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe: function () { },
            render: function (displayOutput) { }
        };
    };
    Enemy_Level1.getEnemy = function ({ enemyId }) {
        return getEnemy(0, null, enemyId);
    };
})());
let Enemy_Level1BossCutscene = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, frameCounter, hasStartedCutscene, transformToBoss, enemyId) {
        let getXMibi = function () { return xMibi; };
        let getYMibi = function () { return yMibi; };
        let transformToLevel1Boss = function () {
            transformToBoss = true;
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
            if (transformToBoss) {
                let boss = Enemy_Level1Boss_Phase1.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    frameCounter: frameCounter,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [boss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            xMibi -= xSpeed;
            xSpeed -= 10;
            if (xSpeed < 0)
                xSpeed = 0;
            frameCounter++;
            let cutscene = null;
            if (xSpeed <= 0 && !hasStartedCutscene) {
                hasStartedCutscene = true;
                cutscene = Cutscene_Level1Boss.getCutscene(enemyId);
            }
            let returnVal = {
                enemies: [thisObj],
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
            if (cutscene !== null)
                returnVal.cutscene = cutscene;
            return returnVal;
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 16 * 3 * 1024,
                yMibi: yMibi - 16 * 3 * 1024,
                widthMibi: 32 * 3 * 1024,
                heightMibi: 32 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 4;
            displayOutput.drawImageRotatedClockwise(30 /* GameImage.OwlBrown */, 32 + spriteNum * 32, 0, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, frameCounter, hasStartedCutscene, transformToBoss, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            return true;
        };
        return {
            getXMibi,
            getYMibi,
            transformToLevel1Boss,
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet,
            onScreenWipe: function (countdown) { },
            render
        };
    };
    Enemy_Level1BossCutscene.getEnemy = function ({ enemyId }) {
        let xMibi = (GlobalConstants.WINDOW_WIDTH + 100) << 10;
        return getEnemy(xMibi, 350 * 1024, 2500, 0, false, false, enemyId);
    };
})());
let Enemy_Level1Boss_Dead = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, deadFrameCount, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += xSpeed;
            yMibi += ySpeed;
            if (-8 < ySpeed && ySpeed < 8)
                ySpeed = 0;
            if (ySpeed < 0)
                ySpeed += 8;
            if (ySpeed > 0)
                ySpeed -= 8;
            let handleCollisionWithTilemapResult = Enemy_Level1Boss_Phase1.handleCollisionWithTilemap({ xMibi, yMibi, ySpeed, tilemap });
            yMibi = handleCollisionWithTilemapResult.newYMibi;
            ySpeed = handleCollisionWithTilemapResult.newYSpeed;
            let enemies = [thisObj];
            frameCounter++;
            deadFrameCount++;
            if (deadFrameCount % 8 === 0) {
                let explodeXMibi = xMibi;
                let explodeYMibi = yMibi;
                explodeXMibi += (rng.nextInt(100) - 50) << 10;
                explodeYMibi += (rng.nextInt(100) - 50) << 10;
                enemies.push(Enemy_Background_Explode.getEnemy({
                    xMibi: explodeXMibi,
                    yMibi: explodeYMibi,
                    displayAngleScaled: rng.nextInt(128 * 360),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: true,
                    enemyId: nextEnemyId++
                }));
            }
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: Enemy_Level1Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: 0
            };
            if (deadFrameCount === 1)
                returnVal.shouldScreenWipe = true;
            if (deadFrameCount > GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 180 && playerState.isDeadFrameCount === null)
                returnVal.shouldEndLevel = true;
            return returnVal;
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 16 * 3 * 1024,
                yMibi: yMibi - 16 * 3 * 1024,
                widthMibi: 32 * 3 * 1024,
                heightMibi: 32 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 4;
            displayOutput.drawImageRotatedClockwise(30 /* GameImage.OwlBrown */, 32 + spriteNum * 32, 0, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, deadFrameCount, enemyId);
        };
        return {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: function () { return true; },
            onScreenWipe: function () { },
            render: render
        };
    };
    Enemy_Level1Boss_Dead.getEnemy = function ({ xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, enemyId);
    };
})());
let Enemy_Level1Boss_Phase1 = {};
Enemy_Level1Boss_Phase1.BOSS_MUSIC = 1 /* GameMusic.ChiptuneLevel3 */;
Enemy_Level1Boss_Phase1.handleCollisionWithTilemap = function ({ xMibi, yMibi, ySpeed, tilemap }) {
    let yMibiLowerBound = yMibi - 16 * 3 * 1024;
    if (!tilemap.isSolid(xMibi, yMibiLowerBound)) {
        return {
            newYMibi: yMibi,
            newYSpeed: ySpeed
        };
    }
    let yMibiIncrease = 0;
    while (true) {
        if (!tilemap.isSolid(xMibi, yMibiLowerBound + yMibiIncrease + 100))
            break;
        yMibiIncrease += 100;
    }
    while (true) {
        if (!tilemap.isSolid(xMibi, yMibiLowerBound + yMibiIncrease + 20))
            break;
        yMibiIncrease += 20;
    }
    while (true) {
        if (!tilemap.isSolid(xMibi, yMibiLowerBound + yMibiIncrease + 4))
            break;
        yMibiIncrease += 4;
    }
    while (true) {
        if (!tilemap.isSolid(xMibi, yMibiLowerBound + yMibiIncrease + 1))
            break;
        yMibiIncrease += 1;
    }
    return {
        newYMibi: yMibi + yMibiIncrease + 1,
        newYSpeed: 0
    };
};
((function () {
    let INITIAL_HP = 1000;
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, attack2AngleScaled1, attack2AngleScaled2, transitionToPhase2Counter, hp, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            frameCounter++;
            xMibi += xSpeed;
            yMibi += ySpeed;
            if (playerState.yMibi - yMibi >= 1024 * 20) {
                if (ySpeed < 500)
                    ySpeed += 8;
            }
            if (playerState.yMibi - yMibi <= -1024 * 20) {
                if (ySpeed > -500)
                    ySpeed -= 8;
            }
            let handleCollisionWithTilemapResult = Enemy_Level1Boss_Phase1.handleCollisionWithTilemap({ xMibi, yMibi, ySpeed, tilemap });
            yMibi = handleCollisionWithTilemapResult.newYMibi;
            ySpeed = handleCollisionWithTilemapResult.newYSpeed;
            let enemies = [thisObj];
            let ATTACK_COOLDOWN_1 = 180;
            attackCooldown1--;
            if (attackCooldown1 <= 0 && transitionToPhase2Counter === null) {
                attackCooldown1 = ATTACK_COOLDOWN_1;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let increment;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        increment = 120 * 128;
                        break;
                    case 1 /* Difficulty.Normal */:
                        increment = 60 * 128;
                        break;
                    case 2 /* Difficulty.Hard */:
                        increment = 30 * 128;
                        break;
                }
                for (let i = rng.nextInt(increment); i < 360 * 128; i += increment) {
                    enemies.push(Enemy_Bullet_Noone.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        directionScaled: i,
                        xVelocityOffsetInMibipixelsPerFrame: 0,
                        rotatesClockwise: rng.nextBool(),
                        displayAngleScaled: rng.nextInt(360 * 128),
                        gameImage: 20 /* GameImage.NooneIce */,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            let ATTACK_COOLDOWN_2;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_2 = 40;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_2 = 48;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_2 = 20;
                    break;
            }
            attackCooldown2--;
            if (attackCooldown2 <= 0 && transitionToPhase2Counter === null) {
                attackCooldown2 = ATTACK_COOLDOWN_2;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let increment;
                let numBullets;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        increment = 500;
                        numBullets = 3;
                        break;
                    case 1 /* Difficulty.Normal */:
                        increment = 600;
                        numBullets = 5;
                        break;
                    case 2 /* Difficulty.Hard */:
                        increment = 500;
                        numBullets = 10;
                        break;
                }
                attack2AngleScaled1 += increment;
                if (attack2AngleScaled1 >= 360 * 128)
                    attack2AngleScaled1 -= 360 * 128;
                let delta = Math.floor(360 * 128 / numBullets);
                for (let i = 0; i < numBullets; i++) {
                    enemies.push(Enemy_Bullet_Strawberry.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        angleScaled: attack2AngleScaled1 + delta * i,
                        xVelocityOffsetInMibipixelsPerFrame: 0,
                        hasCollisionWithTilemap: false,
                        enemyId: nextEnemyId++
                    }));
                }
                attack2AngleScaled2 -= increment;
                if (attack2AngleScaled2 < 0)
                    attack2AngleScaled2 += 360 * 128;
                for (let i = 0; i < numBullets; i++) {
                    enemies.push(Enemy_Bullet_Strawberry.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        angleScaled: attack2AngleScaled2 + delta * i,
                        xVelocityOffsetInMibipixelsPerFrame: 0,
                        hasCollisionWithTilemap: false,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            if (hp <= 0 && transitionToPhase2Counter === null)
                transitionToPhase2Counter = 0;
            if (transitionToPhase2Counter !== null)
                transitionToPhase2Counter++;
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter >= 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 180) {
                let phase2Boss = Enemy_Level1Boss_Phase2.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    xSpeed: xSpeed,
                    ySpeed: ySpeed,
                    frameCounter: frameCounter,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [phase2Boss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: Enemy_Level1Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: Math.ceil(hp * 100 / INITIAL_HP)
            };
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter === 2)
                returnVal.shouldScreenWipe = true;
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter === 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 60)
                returnVal.shouldCreateAutoSavestate = true;
            return returnVal;
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 16 * 3 * 1024,
                yMibi: yMibi - 16 * 3 * 1024,
                widthMibi: 32 * 3 * 1024,
                heightMibi: 32 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 4;
            displayOutput.drawImageRotatedClockwise(30 /* GameImage.OwlBrown */, 32 + spriteNum * 32, 0, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, attack2AngleScaled1, attack2AngleScaled2, transitionToPhase2Counter, hp, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            if (hp > 0)
                hp--;
            return true;
        };
        return {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe: function (countdown) { },
            render: render
        };
    };
    Enemy_Level1Boss_Phase1.getEnemy = function ({ xMibi, yMibi, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, 0, 0, frameCounter, 0, 0, 0, 0, null, INITIAL_HP, enemyId);
    };
})());
let Enemy_Level1Boss_Phase2 = {};
((function () {
    const INITIAL_HP = 500;
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, hp, transitionToPhase3Counter, enemyId) {
        let arcTangentScaled = function (x, y) {
            if (x === 0 && y === 0)
                return 0;
            return DTMath.arcTangentScaled(x, y);
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += xSpeed;
            yMibi += ySpeed;
            if (playerState.yMibi - yMibi >= 1024 * 20) {
                if (ySpeed < 500)
                    ySpeed += 8;
            }
            if (playerState.yMibi - yMibi <= -1024 * 20) {
                if (ySpeed > -500)
                    ySpeed -= 8;
            }
            let handleCollisionWithTilemapResult = Enemy_Level1Boss_Phase1.handleCollisionWithTilemap({ xMibi, yMibi, ySpeed, tilemap });
            yMibi = handleCollisionWithTilemapResult.newYMibi;
            ySpeed = handleCollisionWithTilemapResult.newYSpeed;
            frameCounter++;
            let enemies = [thisObj];
            let ATTACK_COOLDOWN_1;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_1 = 100;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_1 = 60;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_1 = 24;
                    break;
            }
            attackCooldown1--;
            if (attackCooldown1 <= 0 && transitionToPhase3Counter === null) {
                attackCooldown1 = ATTACK_COOLDOWN_1;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let increment;
                let speed;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        increment = 30 * 128;
                        speed = 1536;
                        break;
                    case 1 /* Difficulty.Normal */:
                        increment = 15 * 128;
                        speed = 2 * 1024;
                        break;
                    case 2 /* Difficulty.Hard */:
                        increment = 10 * 128;
                        speed = 3 * 1024;
                        break;
                }
                for (let i = rng.nextInt(increment); i < 360 * 128; i += increment) {
                    enemies.push(Enemy_Bullet_Iceball.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        speed: speed,
                        angleScaled: i,
                        xVelocityOffsetInMibipixelsPerFrame: 0,
                        hasCollisionWithTilemap: false,
                        gameImage: 42 /* GameImage.Iceball */,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            let ATTACK_COOLDOWN_2;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_2 = 236;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_2 = 160;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_2 = 70;
                    break;
            }
            attackCooldown2--;
            if (attackCooldown2 <= 0 && transitionToPhase3Counter === null) {
                attackCooldown2 = ATTACK_COOLDOWN_2;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let freezewaveSpeed;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        freezewaveSpeed = 5;
                        break;
                    case 1 /* Difficulty.Normal */:
                        freezewaveSpeed = 10;
                        break;
                    case 2 /* Difficulty.Hard */:
                        freezewaveSpeed = 15;
                        break;
                }
                enemies.push(Enemy_Bullet_Freezewave.getEnemy({ xMibi: xMibi, yMibi: yMibi, playerState: playerState, speed: freezewaveSpeed, scalingFactorScaled: 3 * 128, hasCollisionWithTilemap: false, enemyId: nextEnemyId++ }));
                let initialAngleScaled = arcTangentScaled(playerState.xMibi - xMibi, playerState.yMibi - yMibi);
                enemies.push(Enemy_Bullet_Homing.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    initialAngleScaled: initialAngleScaled + 50 * 128,
                    enemyId: nextEnemyId++
                }));
                enemies.push(Enemy_Bullet_Homing.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    initialAngleScaled: initialAngleScaled - 50 * 128,
                    enemyId: nextEnemyId++
                }));
            }
            if (hp <= 0 && transitionToPhase3Counter === null)
                transitionToPhase3Counter = 0;
            if (transitionToPhase3Counter !== null)
                transitionToPhase3Counter++;
            if (transitionToPhase3Counter !== null && transitionToPhase3Counter >= 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 180) {
                let phase3Boss = Enemy_Level1Boss_Phase3.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    xSpeed: xSpeed,
                    ySpeed: ySpeed,
                    frameCounter: frameCounter,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [phase3Boss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: Enemy_Level1Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: Math.ceil(hp * 100 / INITIAL_HP)
            };
            if (transitionToPhase3Counter !== null && transitionToPhase3Counter === 2)
                returnVal.shouldScreenWipe = true;
            if (transitionToPhase3Counter !== null && transitionToPhase3Counter === 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 60)
                returnVal.shouldCreateAutoSavestate = true;
            return returnVal;
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 16 * 3 * 1024,
                yMibi: yMibi - 16 * 3 * 1024,
                widthMibi: 32 * 3 * 1024,
                heightMibi: 32 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 4;
            displayOutput.drawImageRotatedClockwise(30 /* GameImage.OwlBrown */, 32 + spriteNum * 32, 0, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, hp, transitionToPhase3Counter, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            if (hp > 0)
                hp--;
            return true;
        };
        return {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe: function (countdown) { },
            render: render
        };
    };
    Enemy_Level1Boss_Phase2.getEnemy = function ({ xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, 240, INITIAL_HP, null, enemyId);
    };
})());
let Enemy_Level1Boss_Phase3 = {};
((function () {
    const INITIAL_HP = 500;
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown, hp, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += xSpeed;
            yMibi += ySpeed;
            if (playerState.yMibi - yMibi >= 1024 * 20) {
                if (ySpeed < 500)
                    ySpeed += 8;
            }
            if (playerState.yMibi - yMibi <= -1024 * 20) {
                if (ySpeed > -500)
                    ySpeed -= 8;
            }
            let handleCollisionWithTilemapResult = Enemy_Level1Boss_Phase1.handleCollisionWithTilemap({ xMibi, yMibi, ySpeed, tilemap });
            yMibi = handleCollisionWithTilemapResult.newYMibi;
            ySpeed = handleCollisionWithTilemapResult.newYSpeed;
            frameCounter++;
            let enemies = [thisObj];
            let ATTACK_COOLDOWN;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN = 100;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN = 44;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN = 8;
                    break;
            }
            attackCooldown--;
            if (attackCooldown <= 0) {
                attackCooldown = ATTACK_COOLDOWN;
                enemies.push(Enemy_Bullet_BouncySnow.getEnemy({
                    xMibi: (100 + rng.nextInt(800)) << 10,
                    angleScaled: -128 * (70 + rng.nextInt(40)),
                    explodeYMibi: (50 + rng.nextInt(400)) << 10,
                    difficulty: difficulty,
                    enemyId: nextEnemyId++
                }));
            }
            if (hp <= 0) {
                let deadBoss = Enemy_Level1Boss_Dead.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    xSpeed: xSpeed,
                    ySpeed: ySpeed,
                    frameCounter: frameCounter,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [deadBoss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: Enemy_Level1Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: Math.ceil(hp * 100 / INITIAL_HP)
            };
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 16 * 3 * 1024,
                yMibi: yMibi - 16 * 3 * 1024,
                widthMibi: 32 * 3 * 1024,
                heightMibi: 32 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 4;
            displayOutput.drawImageRotatedClockwise(30 /* GameImage.OwlBrown */, 32 + spriteNum * 32, 0, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown, hp, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            if (hp > 0)
                hp--;
            return true;
        };
        return {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe: function (countdown) { },
            render: render
        };
    };
    Enemy_Level1Boss_Phase3.getEnemy = function ({ xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, INITIAL_HP, enemyId);
    };
})());
let Enemy_Level2 = ((function () {
    let getEnemy = function (bossSpawnCounter, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let enemies = [thisObj];
            let newTilemapEnemies = tilemap.getNewEnemies();
            for (let newTilemapEnemy of newTilemapEnemies) {
                if (newTilemapEnemy.id === 0) {
                    enemies.push(Enemy_Flyamanita.getEnemy({
                        xMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        yAngleScaled: rng.nextInt(360 * 128),
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 1) {
                    enemies.push(Enemy_Smartcap.getEnemy({
                        xInitialMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        isFacingRight: false,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 2) {
                    enemies.push(Enemy_Snowball.getEnemy({
                        xInitialMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        isFacingRight: false,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 3) {
                    enemies.push(Enemy_Snowfly.getEnemy({
                        xMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        yAngleScaled: rng.nextInt(360 * 128),
                        attackAngle1: rng.nextInt(360 * 128),
                        attackAngle2: rng.nextInt(360 * 128),
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 4) {
                    enemies.push(Enemy_OgJumpy.getEnemy({
                        xInitialMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else {
                    throw new Error("Unrecognized id: " + newTilemapEnemy.id);
                }
            }
            if (bossSpawnCounter !== null)
                bossSpawnCounter++;
            if (bossSpawnCounter === null && tilemap.hasReachedEndOfMap())
                bossSpawnCounter = 0;
            let shouldScreenWipe = false;
            let shouldCreateAutoSavestate = false;
            if (bossSpawnCounter !== null && bossSpawnCounter === 1)
                shouldScreenWipe = true;
            if (bossSpawnCounter !== null && bossSpawnCounter === 1 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 40)
                shouldCreateAutoSavestate = true;
            if (bossSpawnCounter !== null && bossSpawnCounter === 1 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 80)
                enemies.push(Enemy_Level2BossCutscene.getEnemy({ enemyId: nextEnemyId++ }));
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                shouldScreenWipe,
                shouldCreateAutoSavestate
            };
            if (bossSpawnCounter === null || bossSpawnCounter < 1 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 80)
                returnVal.musicToPlay = 2 /* GameMusic.ForestTop */;
            return returnVal;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(bossSpawnCounter, enemyId);
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: true,
            processFrame,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe: function () { },
            render: function (displayOutput) { }
        };
    };
    return {
        getEnemy: function ({ enemyId }) {
            return getEnemy(null, enemyId);
        }
    };
})());
let Enemy_Level2BossCutscene = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, frameCounter, hasStartedCutscene, transformToBoss, enemyId) {
        let getXMibi = function () { return xMibi; };
        let getYMibi = function () { return yMibi; };
        let transformToLevel2Boss = function () {
            transformToBoss = true;
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
            if (transformToBoss) {
                let boss = Enemy_Level2Boss_Phase1.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    frameCounter: frameCounter,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [boss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            xMibi -= xSpeed;
            xSpeed -= 10;
            if (xSpeed < 0)
                xSpeed = 0;
            frameCounter++;
            let cutscene = null;
            if (xSpeed <= 0 && !hasStartedCutscene) {
                hasStartedCutscene = true;
                cutscene = Cutscene_Level2Boss.getCutscene(enemyId);
            }
            let returnVal = {
                enemies: [thisObj],
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
            if (cutscene !== null)
                returnVal.cutscene = cutscene;
            return returnVal;
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 9 * 3 * 1024,
                yMibi: yMibi - 12 * 3 * 1024,
                widthMibi: 22 * 3 * 1024,
                heightMibi: 23 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 24) % 6;
            displayOutput.drawImageRotatedClockwise(32 /* GameImage.DarkKonqi_Mirrored */, spriteNum * 32, 128, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, frameCounter, hasStartedCutscene, transformToBoss, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            return true;
        };
        return {
            getXMibi,
            getYMibi,
            transformToLevel2Boss,
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet,
            onScreenWipe: function (countdown) { },
            render
        };
    };
    Enemy_Level2BossCutscene.getEnemy = function ({ enemyId }) {
        let xMibi = (GlobalConstants.WINDOW_WIDTH + 100) << 10;
        return getEnemy(xMibi, 350 * 1024, 2500, 0, false, false, enemyId);
    };
})());
let Enemy_Level2Boss_Dead = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, deadFrameCount, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += xSpeed;
            yMibi += ySpeed;
            if (-8 < ySpeed && ySpeed < 8)
                ySpeed = 0;
            if (ySpeed < 0)
                ySpeed += 8;
            if (ySpeed > 0)
                ySpeed -= 8;
            let enemies = [thisObj];
            frameCounter++;
            deadFrameCount++;
            if (deadFrameCount % 8 === 0) {
                let explodeXMibi = xMibi;
                let explodeYMibi = yMibi;
                explodeXMibi += (rng.nextInt(100) - 50) << 10;
                explodeYMibi += (rng.nextInt(100) - 50) << 10;
                enemies.push(Enemy_Background_Explode.getEnemy({
                    xMibi: explodeXMibi,
                    yMibi: explodeYMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: true,
                    enemyId: nextEnemyId++
                }));
            }
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: Enemy_Level2Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: 0
            };
            if (deadFrameCount === 1)
                returnVal.shouldScreenWipe = true;
            if (deadFrameCount > GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 180 && playerState.isDeadFrameCount === null)
                returnVal.shouldEndLevel = true;
            return returnVal;
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 9 * 3 * 1024,
                yMibi: yMibi - 12 * 3 * 1024,
                widthMibi: 22 * 3 * 1024,
                heightMibi: 23 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 24) % 6;
            displayOutput.drawImageRotatedClockwise(32 /* GameImage.DarkKonqi_Mirrored */, spriteNum * 32, 128, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, deadFrameCount, enemyId);
        };
        return {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: function () { return true; },
            onScreenWipe: function () { },
            render: render
        };
    };
    Enemy_Level2Boss_Dead.getEnemy = function ({ xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, enemyId);
    };
})());
let Enemy_Level2Boss_Phase1 = {};
Enemy_Level2Boss_Phase1.BOSS_MUSIC = 1 /* GameMusic.ChiptuneLevel3 */;
((function () {
    let INITIAL_HP = 575;
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, attack2IsNextAttackClockwise, transitionToPhase2Counter, hp, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            frameCounter++;
            xMibi += xSpeed;
            yMibi += ySpeed;
            if (playerState.yMibi - yMibi >= 1024 * 20) {
                if (ySpeed < 500)
                    ySpeed += 8;
            }
            if (playerState.yMibi - yMibi <= -1024 * 20) {
                if (ySpeed > -500)
                    ySpeed -= 8;
            }
            let enemies = [thisObj];
            let ATTACK_COOLDOWN_1;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_1 = 5;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_1 = 4;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_1 = 3;
                    break;
            }
            attackCooldown1--;
            if (attackCooldown1 <= 0 && transitionToPhase2Counter === null) {
                attackCooldown1 = ATTACK_COOLDOWN_1;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let numFireballs;
                let baseSpeed;
                let maxSpeedIncrement;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        numFireballs = 1;
                        baseSpeed = 1150;
                        maxSpeedIncrement = 2000;
                        break;
                    case 1 /* Difficulty.Normal */:
                        numFireballs = 2;
                        baseSpeed = 1700;
                        maxSpeedIncrement = 2950;
                        break;
                    case 2 /* Difficulty.Hard */:
                        numFireballs = 5;
                        baseSpeed = 2300;
                        maxSpeedIncrement = 4000;
                        break;
                }
                for (let i = 0; i < numFireballs; i++) {
                    enemies.push(Enemy_Bullet_Fireball_Normal.getEnemy({
                        xInitialMibi: xMibi,
                        yInitialMibi: yMibi,
                        angleScaled: rng.nextInt(360 * 128),
                        speedInMibipixelsPerFrame: baseSpeed + rng.nextInt(maxSpeedIncrement),
                        enemyId: nextEnemyId++
                    }));
                }
            }
            let ATTACK_COOLDOWN_2;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_2 = 360;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_2 = 160;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_2 = 40;
                    break;
            }
            attackCooldown2--;
            if (attackCooldown2 <= 0 && transitionToPhase2Counter === null) {
                attackCooldown2 = ATTACK_COOLDOWN_2;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let numBullets;
                let angularSpeed;
                let radiusSpeed;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        numBullets = 5;
                        angularSpeed = 43;
                        radiusSpeed = 853;
                        break;
                    case 1 /* Difficulty.Normal */:
                        numBullets = 7;
                        angularSpeed = 64;
                        radiusSpeed = 1280;
                        break;
                    case 2 /* Difficulty.Hard */:
                        numBullets = 12;
                        angularSpeed = 128;
                        radiusSpeed = 2560;
                        break;
                }
                let delta = Math.floor(360 * 128 / numBullets);
                let offset = rng.nextInt(delta);
                for (let i = 0; i < numBullets; i++) {
                    enemies.push(Enemy_Bullet_Fireball_Spiral.getEnemy({
                        xInitialMibi: xMibi,
                        yInitialMibi: yMibi,
                        angleScaled: offset + delta * i,
                        angularSpeedInAngleScaledPerFrame: angularSpeed,
                        radiusSpeedInMibipixelsPerFrame: radiusSpeed,
                        isRotatingClockwise: attack2IsNextAttackClockwise,
                        enemyId: nextEnemyId++
                    }));
                }
                attack2IsNextAttackClockwise = !attack2IsNextAttackClockwise;
            }
            if (hp <= 0 && transitionToPhase2Counter === null)
                transitionToPhase2Counter = 0;
            if (transitionToPhase2Counter !== null)
                transitionToPhase2Counter++;
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter >= 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 180) {
                let phase2Boss = Enemy_Level2Boss_Phase2.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    xSpeed: xSpeed,
                    ySpeed: ySpeed,
                    frameCounter: frameCounter,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [phase2Boss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: Enemy_Level2Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: Math.ceil(hp * 100 / INITIAL_HP)
            };
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter === 2)
                returnVal.shouldScreenWipe = true;
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter === 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 60)
                returnVal.shouldCreateAutoSavestate = true;
            return returnVal;
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 9 * 3 * 1024,
                yMibi: yMibi - 12 * 3 * 1024,
                widthMibi: 22 * 3 * 1024,
                heightMibi: 23 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 24) % 6;
            displayOutput.drawImageRotatedClockwise(32 /* GameImage.DarkKonqi_Mirrored */, spriteNum * 32, 128, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, attack2IsNextAttackClockwise, transitionToPhase2Counter, hp, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            if (hp > 0)
                hp--;
            return true;
        };
        return {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe: function (countdown) { },
            render: render
        };
    };
    Enemy_Level2Boss_Phase1.getEnemy = function ({ xMibi, yMibi, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, 0, 0, frameCounter, 0, 0, true, null, INITIAL_HP, enemyId);
    };
})());
let Enemy_Level2Boss_Phase2 = {};
((function () {
    const INITIAL_HP = 525;
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown, hp, transitionToPhase3Counter, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += xSpeed;
            yMibi += ySpeed;
            if (playerState.yMibi - yMibi >= 1024 * 20) {
                if (ySpeed < 500)
                    ySpeed += 8;
            }
            if (playerState.yMibi - yMibi <= -1024 * 20) {
                if (ySpeed > -500)
                    ySpeed -= 8;
            }
            frameCounter++;
            let enemies = [thisObj];
            let ATTACK_COOLDOWN;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN = 5;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN = 4;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN = 3;
                    break;
            }
            attackCooldown--;
            if (attackCooldown <= 0 && transitionToPhase3Counter === null) {
                attackCooldown = ATTACK_COOLDOWN;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let numFireballs;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        numFireballs = 1;
                        break;
                    case 1 /* Difficulty.Normal */:
                        numFireballs = 2;
                        break;
                    case 2 /* Difficulty.Hard */:
                        numFireballs = 5;
                        break;
                }
                for (let i = 0; i < numFireballs; i++) {
                    enemies.push(Enemy_Bullet_Fireball_Gravity.getEnemy({
                        xInitialMibi: xMibi,
                        yInitialMibi: yMibi,
                        xSpeedInMibipixelsPerFrame: rng.nextInt(16000) - 8000,
                        yInitialSpeedInMibipixelsPerFrame: 4000 + rng.nextInt(8000),
                        enemyId: nextEnemyId++
                    }));
                }
            }
            if (hp <= 0 && transitionToPhase3Counter === null)
                transitionToPhase3Counter = 0;
            if (transitionToPhase3Counter !== null)
                transitionToPhase3Counter++;
            if (transitionToPhase3Counter !== null && transitionToPhase3Counter >= 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 180) {
                let phase3Boss = Enemy_Level2Boss_Phase3.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    xSpeed: xSpeed,
                    ySpeed: ySpeed,
                    frameCounter: frameCounter,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [phase3Boss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: Enemy_Level2Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: Math.ceil(hp * 100 / INITIAL_HP)
            };
            if (transitionToPhase3Counter !== null && transitionToPhase3Counter === 2)
                returnVal.shouldScreenWipe = true;
            if (transitionToPhase3Counter !== null && transitionToPhase3Counter === 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 60)
                returnVal.shouldCreateAutoSavestate = true;
            return returnVal;
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 9 * 3 * 1024,
                yMibi: yMibi - 12 * 3 * 1024,
                widthMibi: 22 * 3 * 1024,
                heightMibi: 23 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 24) % 6;
            displayOutput.drawImageRotatedClockwise(32 /* GameImage.DarkKonqi_Mirrored */, spriteNum * 32, 128, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown, hp, transitionToPhase3Counter, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            if (hp > 0)
                hp--;
            return true;
        };
        return {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe: function (countdown) { },
            render: render
        };
    };
    Enemy_Level2Boss_Phase2.getEnemy = function ({ xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, INITIAL_HP, null, enemyId);
    };
})());
let Enemy_Level2Boss_Phase3 = {};
((function () {
    const INITIAL_HP = 400;
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown, hp, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += xSpeed;
            yMibi += ySpeed;
            if (playerState.yMibi - yMibi >= 1024 * 20) {
                if (ySpeed < 500)
                    ySpeed += 8;
            }
            if (playerState.yMibi - yMibi <= -1024 * 20) {
                if (ySpeed > -500)
                    ySpeed -= 8;
            }
            frameCounter++;
            let enemies = [thisObj];
            let ATTACK_COOLDOWN;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN = 15;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN = 7;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN = 4;
                    break;
            }
            attackCooldown--;
            if (attackCooldown <= 0) {
                attackCooldown = ATTACK_COOLDOWN;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let angleToPlayer = DTMath.arcTangentScaledSafe(playerState.xMibi - xMibi, playerState.yMibi - yMibi);
                let direction = rng.nextBool() ? -1 : 1;
                enemies.push(Enemy_Bullet_Fireball_Homing.getEnemy({
                    xInitialMibi: xMibi,
                    yInitialMibi: yMibi,
                    targetPixelSpeedInMibipixelsPerFrame: 48000,
                    targetPixelAngleScaled1: angleToPlayer + (130 * 128 + rng.nextInt(40 * 128)) * direction,
                    targetPixelAngleScaled2: angleToPlayer + (50 * 128 + rng.nextInt(40 * 128)) * direction,
                    targetPixelAngleOffsetScaled3: rng.nextInt(10 * 128) - 5 * 128,
                    switchToPhase2Cutoff: 8 + rng.nextInt(5),
                    switchToPhase3Cutoff: 18 + rng.nextInt(5),
                    speedInMibipixelsPerFrame: 12000 + rng.nextInt(4000),
                    enemyId: nextEnemyId++
                }));
            }
            if (hp <= 0) {
                let deadBoss = Enemy_Level2Boss_Dead.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    xSpeed: xSpeed,
                    ySpeed: ySpeed,
                    frameCounter: frameCounter,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [deadBoss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: Enemy_Level2Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: Math.ceil(hp * 100 / INITIAL_HP)
            };
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 9 * 3 * 1024,
                yMibi: yMibi - 12 * 3 * 1024,
                widthMibi: 22 * 3 * 1024,
                heightMibi: 23 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 24) % 6;
            displayOutput.drawImageRotatedClockwise(32 /* GameImage.DarkKonqi_Mirrored */, spriteNum * 32, 128, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown, hp, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            if (hp > 0)
                hp--;
            return true;
        };
        return {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe: function (countdown) { },
            render: render
        };
    };
    Enemy_Level2Boss_Phase3.getEnemy = function ({ xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, INITIAL_HP, enemyId);
    };
})());
let Enemy_Level3 = ((function () {
    let getEnemy = function (enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let enemies = [thisObj];
            let newTilemapEnemies = tilemap.getNewEnemies();
            for (let newTilemapEnemy of newTilemapEnemies) {
                if (newTilemapEnemy.id === 0) {
                    enemies.push(Enemy_Flyamanita.getEnemy({
                        xMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        yAngleScaled: rng.nextInt(360 * 128),
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 1) {
                    enemies.push(Enemy_Smartcap.getEnemy({
                        xInitialMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        isFacingRight: false,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 2) {
                    enemies.push(Enemy_Snowball.getEnemy({
                        xInitialMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        isFacingRight: false,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 3) {
                    enemies.push(Enemy_Snowfly.getEnemy({
                        xMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        yAngleScaled: rng.nextInt(360 * 128),
                        attackAngle1: rng.nextInt(360 * 128),
                        attackAngle2: rng.nextInt(360 * 128),
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 4) {
                    enemies.push(Enemy_OgJumpy.getEnemy({
                        xInitialMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 5) {
                    enemies.push(Enemy_FireChainSpawner.getEnemy({
                        xMibi: newTilemapEnemy.xMibi + 1024 * 8 * 3,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 6) {
                    enemies.push(Enemy_Sawblade.getEnemy({
                        xMibi: newTilemapEnemy.xMibi,
                        yMibi: newTilemapEnemy.yMibi,
                        speedInMibipixelsPerFrame: 3072,
                        direction: 1 /* EnemySawbladeDirection.Up */,
                        movementLowerBound: newTilemapEnemy.yMibi,
                        movementUpperBound: newTilemapEnemy.yMibi + 1024 * 3 * 4 * 16,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 7) {
                    enemies.push(Enemy_Sawblade.getEnemy({
                        xMibi: newTilemapEnemy.xMibi,
                        yMibi: newTilemapEnemy.yMibi,
                        speedInMibipixelsPerFrame: 4608,
                        direction: 1 /* EnemySawbladeDirection.Up */,
                        movementLowerBound: newTilemapEnemy.yMibi,
                        movementUpperBound: newTilemapEnemy.yMibi + 1024 * 3 * 7 * 16,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                    enemies.push(Enemy_Sawblade.getEnemy({
                        xMibi: newTilemapEnemy.xMibi + 1024 * 3 * 16,
                        yMibi: newTilemapEnemy.yMibi + 1024 * 3 * 7 * 16,
                        speedInMibipixelsPerFrame: 4608,
                        direction: 0 /* EnemySawbladeDirection.Down */,
                        movementLowerBound: newTilemapEnemy.yMibi,
                        movementUpperBound: newTilemapEnemy.yMibi + 1024 * 3 * 7 * 16,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 8) {
                    enemies.push(Enemy_Sawblade.getEnemy({
                        xMibi: newTilemapEnemy.xMibi,
                        yMibi: newTilemapEnemy.yMibi,
                        speedInMibipixelsPerFrame: 3072,
                        direction: 3 /* EnemySawbladeDirection.Right */,
                        movementLowerBound: newTilemapEnemy.xMibi,
                        movementUpperBound: newTilemapEnemy.xMibi + 1024 * 3 * 6 * 16,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 9) {
                    enemies.push(Enemy_Sawblade.getEnemy({
                        xMibi: newTilemapEnemy.xMibi,
                        yMibi: newTilemapEnemy.yMibi,
                        speedInMibipixelsPerFrame: 3072,
                        direction: 1 /* EnemySawbladeDirection.Up */,
                        movementLowerBound: newTilemapEnemy.yMibi,
                        movementUpperBound: newTilemapEnemy.yMibi + 1024 * 3 * 7 * 16,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 10) {
                    enemies.push(Enemy_Level3Checkpoint.getEnemy({
                        xMibi: newTilemapEnemy.xMibi - 1024 * 3 * 8,
                        yMibi: newTilemapEnemy.yMibi - 1024 * 3 * 8,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 11) {
                    if (difficulty === 0 /* Difficulty.Easy */ || difficulty === 1 /* Difficulty.Normal */) {
                        enemies.push(Enemy_LargeFireChain_EasyNormal.getEnemy({
                            xMibi: newTilemapEnemy.xMibi + 565248,
                            yMibi: 350 * 1024,
                            angleScaled: rng.nextInt(360 * 128),
                            shouldRotateClockwise: rng.nextBool(),
                            difficulty: difficulty,
                            enemyId: nextEnemyId++
                        }));
                    }
                    else if (difficulty === 2 /* Difficulty.Hard */) {
                        enemies.push(Enemy_LargeFireChain_Hard.getEnemy({
                            xMibi: newTilemapEnemy.xMibi + 565248,
                            yMibi: 350 * 1024,
                            angleScaled: rng.nextInt(360 * 128),
                            shouldRotateClockwise: rng.nextBool(),
                            enemyId: nextEnemyId++
                        }));
                    }
                    else {
                        throw new Error("Unrecognized difficulty");
                    }
                }
                else if (newTilemapEnemy.id === 12) {
                    enemies.push(Enemy_Level3BossCreator.getEnemy({
                        xMibi: newTilemapEnemy.xMibi - 1024 * 3 * 8,
                        enemyId: nextEnemyId++
                    }));
                }
                else {
                    throw new Error("Unrecognized id: " + newTilemapEnemy.id);
                }
            }
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
            if (!tilemap.hasReachedEndOfMap())
                returnVal.musicToPlay = 3 /* GameMusic.Level3Theme */;
            return returnVal;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(enemyId);
        };
        return {
            getSnapshot,
            isBullet: false,
            isBackground: true,
            processFrame,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe: function () { },
            render: function (displayOutput) { },
            enemyId
        };
    };
    return {
        getEnemy: function ({ enemyId }) {
            return getEnemy(enemyId);
        }
    };
})());
let Enemy_Level3Boss = ((function () {
    let INITIAL_HP = 5000;
    let getEnemy = function (bossPhase, bossMinionEnemyIds, hp, deadFrameCount, enemyId) {
        let getSnapshot = function () {
            return getEnemy(bossPhase.getSnapshot(), [...bossMinionEnemyIds], hp, deadFrameCount, enemyId);
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            bossMinionEnemyIds = bossMinionEnemyIds.filter(bossMinionEnemyId => enemyMapping[bossMinionEnemyId]);
            let processFrameResult = bossPhase.processFrame({
                bossEnemyId: enemyId,
                thisPhaseObj: bossPhase,
                rngSeed: rngSeed,
                nextEnemyId: nextEnemyId,
                difficulty: difficulty,
                playerState: playerState,
                tilemap: tilemap,
                soundOutput: soundOutput
            });
            bossPhase = processFrameResult.newBossPhase;
            nextEnemyId = processFrameResult.nextEnemyId;
            let enemies = [thisObj];
            for (let newBossMinionEnemy of processFrameResult.newBossMinionEnemies) {
                enemies.push(newBossMinionEnemy);
                bossMinionEnemyIds.push(newBossMinionEnemy.getLevel3BossMinionEnemyId());
            }
            for (let newNonMinionEnemy of processFrameResult.newNonMinionEnemies) {
                enemies.push(newNonMinionEnemy);
            }
            if (processFrameResult.hasBossJump1Finished) {
                for (let bossMinionEnemyId of bossMinionEnemyIds) {
                    let bossMinionEnemy = enemyMapping[bossMinionEnemyId];
                    if (bossMinionEnemy) {
                        bossMinionEnemy.notifyBossJump1Finished();
                    }
                }
            }
            if (processFrameResult.hasBossJump2Finished) {
                for (let bossMinionEnemyId of bossMinionEnemyIds) {
                    let bossMinionEnemy = enemyMapping[bossMinionEnemyId];
                    if (bossMinionEnemy) {
                        bossMinionEnemy.notifyBossJump2Finished();
                    }
                }
            }
            if (processFrameResult.hasBossJump3Finished) {
                for (let bossMinionEnemyId of bossMinionEnemyIds) {
                    let bossMinionEnemy = enemyMapping[bossMinionEnemyId];
                    if (bossMinionEnemy) {
                        bossMinionEnemy.notifyBossJump3Finished();
                    }
                }
            }
            if (processFrameResult.hasBossCrashedIntoWall) {
                for (let bossMinionEnemyId of bossMinionEnemyIds) {
                    let bossMinionEnemy = enemyMapping[bossMinionEnemyId];
                    if (bossMinionEnemy) {
                        bossMinionEnemy.notifyBossCrashIntoWall();
                    }
                }
            }
            let actualBossHealthDisplayValue = Math.ceil(hp * 100 / INITIAL_HP);
            let displayedBossHealthDisplayValue = bossPhase.hasStartedBossFight() && !bossPhase.hasFinishedBossFight()
                ? actualBossHealthDisplayValue
                : null;
            for (let bossMinionEnemyId of bossMinionEnemyIds) {
                let bossMinionEnemy = enemyMapping[bossMinionEnemyId];
                if (bossMinionEnemy) {
                    bossMinionEnemy.notifyBossHealthPercentage(actualBossHealthDisplayValue);
                }
            }
            if (hp <= 0 && deadFrameCount === null) {
                deadFrameCount = 0;
                bossPhase = Enemy_Level3BossDeadPhase.getBossPhase({ xMibi: bossPhase.getXMibi(), yMibi: bossPhase.getYMibi() });
            }
            let shouldEndLevel = false;
            let shouldScreenWipe = false;
            if (deadFrameCount !== null) {
                deadFrameCount++;
                if (deadFrameCount === 1)
                    shouldScreenWipe = true;
                if (deadFrameCount > GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 180 && playerState.isDeadFrameCount === null)
                    shouldEndLevel = true;
            }
            return {
                enemies: enemies,
                newRngSeed: processFrameResult.newRngSeed,
                nextEnemyId: nextEnemyId,
                shouldEndLevel: shouldEndLevel,
                musicToPlay: bossPhase.hasStartedBossFight() ? 6 /* GameMusic.FortressLoop */ : 7 /* GameMusic.NolokTalk */,
                shouldScreenWipe: shouldScreenWipe,
                shouldCreateAutoSavestate: processFrameResult.shouldCreateAutoSavestate,
                bossHealthDisplayValue: displayedBossHealthDisplayValue,
                shouldScreenShake: processFrameResult.hasBossCrashedIntoWall
            };
        };
        let render = function (displayOutput) {
            bossPhase.render(displayOutput);
        };
        let getXMibi = function () {
            return bossPhase.getXMibi();
        };
        let getYMibi = function () {
            return bossPhase.getYMibi();
        };
        let hasStartedBossFight = function () {
            return bossPhase.hasStartedBossFight();
        };
        let getHitboxes = function () {
            return bossPhase.getHitboxes();
        };
        let getDamageboxes = function () {
            return bossPhase.getDamageboxes();
        };
        let onCollideWithPlayerBullet = function () {
            hp--;
            return true;
        };
        return {
            getXMibi,
            getYMibi,
            hasStartedBossFight,
            getSnapshot,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet,
            onScreenWipe: function (countdown) { },
            render,
            enemyId
        };
    };
    return {
        getEnemy: function ({ enemyId }) {
            let bossPhase = Enemy_Level3BossIntro1Phase.getBossPhase();
            return getEnemy(bossPhase, [], INITIAL_HP, null, enemyId);
        }
    };
})());
let Enemy_Level3BossChargePhase = ((function () {
    let getBossPhase = function (xMibi, yMibi, isFacingRight, frameCounter) {
        let getSnapshot = function () {
            return getBossPhase(xMibi, yMibi, isFacingRight, frameCounter);
        };
        let processFrame = function ({ thisPhaseObj, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            frameCounter++;
            if (frameCounter > 60) {
                let hasBossCrashedIntoWall = false;
                if (isFacingRight) {
                    xMibi += 16667;
                    if (tilemap.isSolid(xMibi + 32 * 3 * 1024, yMibi))
                        hasBossCrashedIntoWall = true;
                }
                else {
                    xMibi -= 16667;
                    if (tilemap.isSolid(xMibi - 32 * 3 * 1024, yMibi))
                        hasBossCrashedIntoWall = true;
                }
                if (hasBossCrashedIntoWall) {
                    soundOutput.playSound(5 /* GameSound.Explosion00 */, 100);
                    while (tilemap.isSolid(xMibi + 32 * 3 * 1024 - 100, yMibi))
                        xMibi -= 100;
                    while (tilemap.isSolid(xMibi + 32 * 3 * 1024 - 10, yMibi))
                        xMibi -= 10;
                    while (tilemap.isSolid(xMibi + 32 * 3 * 1024, yMibi))
                        xMibi--;
                    while (tilemap.isSolid(xMibi - 32 * 3 * 1024 + 100, yMibi))
                        xMibi += 100;
                    while (tilemap.isSolid(xMibi - 32 * 3 * 1024 + 10, yMibi))
                        xMibi += 10;
                    while (tilemap.isSolid(xMibi - 32 * 3 * 1024, yMibi))
                        xMibi++;
                    return {
                        newBossPhase: Enemy_Level3BossCrashPhase.getBossPhase({ xMibi: xMibi, yMibi: yMibi, isFacingRight: isFacingRight }),
                        newBossMinionEnemies: [],
                        newNonMinionEnemies: [],
                        newRngSeed: rngSeed,
                        nextEnemyId: nextEnemyId,
                        hasBossJump1Finished: false,
                        hasBossJump2Finished: false,
                        hasBossJump3Finished: false,
                        hasBossCrashedIntoWall: true,
                        shouldCreateAutoSavestate: false
                    };
                }
            }
            return {
                newBossPhase: thisPhaseObj,
                newBossMinionEnemies: [],
                newNonMinionEnemies: [],
                newRngSeed: rngSeed,
                nextEnemyId: nextEnemyId,
                hasBossJump1Finished: false,
                hasBossJump2Finished: false,
                hasBossJump3Finished: false,
                hasBossCrashedIntoWall: false,
                shouldCreateAutoSavestate: false
            };
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 3) % 8;
            displayOutput.drawImageRotatedClockwise(isFacingRight ? 64 /* GameImage.Yeti */ : 65 /* GameImage.Yeti_Mirrored */, spriteNum * 64, 2 * 64, 64, 64, (xMibi >> 10) - 32 * 3, (yMibi >> 10) - 32 * 3, 0, 3 * 128);
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 16 * 3 * 1024,
                    yMibi: yMibi - 24 * 3 * 1024,
                    widthMibi: 32 * 3 * 1024,
                    heightMibi: 32 * 3 * 1024
                }, {
                    xMibi: xMibi - 12 * 3 * 1024,
                    yMibi: yMibi + 8 * 3 * 1024,
                    widthMibi: 24 * 3 * 1024,
                    heightMibi: 8 * 3 * 1024
                }];
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 16 * 3 * 1024,
                    yMibi: yMibi - 32 * 3 * 1024,
                    widthMibi: 32 * 3 * 1024,
                    heightMibi: 40 * 3 * 1024
                }, {
                    xMibi: xMibi - 12 * 3 * 1024,
                    yMibi: yMibi + 8 * 3 * 1024,
                    widthMibi: 24 * 3 * 1024,
                    heightMibi: 8 * 3 * 1024
                }];
        };
        return {
            getSnapshot,
            getXMibi: function () { return xMibi; },
            getYMibi: function () { return yMibi; },
            hasStartedBossFight: function () { return true; },
            hasFinishedBossFight: function () { return false; },
            processFrame,
            render,
            getHitboxes,
            getDamageboxes
        };
    };
    return {
        getBossPhase: function ({ xMibi, yMibi, isFacingRight }) {
            return getBossPhase(xMibi, yMibi, isFacingRight, 0);
        }
    };
})());
let Enemy_Level3BossCrashPhase = ((function () {
    let getBossPhase = function (xMibi, yMibi, ySpeedInMibipixelsPerFrame, isFacingRight, frameCounter) {
        let getSnapshot = function () {
            return getBossPhase(xMibi, yMibi, ySpeedInMibipixelsPerFrame, isFacingRight, frameCounter);
        };
        let processFrame = function ({ thisPhaseObj, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            frameCounter++;
            if (ySpeedInMibipixelsPerFrame < 0 && tilemap.isSolid(xMibi, yMibi - 32 * 3 * 1024)) {
                while (tilemap.isSolid(xMibi, yMibi - 32 * 3 * 1024 + 10)) {
                    yMibi += 10;
                }
                while (tilemap.isSolid(xMibi, yMibi - 32 * 3 * 1024)) {
                    yMibi += 1;
                }
                return {
                    newBossPhase: Enemy_Level3BossStunnedPhase.getBossPhase({ xMibi: xMibi, yMibi: yMibi, isFacingRight: isFacingRight }),
                    newBossMinionEnemies: [],
                    newNonMinionEnemies: [],
                    newRngSeed: rngSeed,
                    nextEnemyId: nextEnemyId,
                    hasBossJump1Finished: false,
                    hasBossJump2Finished: false,
                    hasBossJump3Finished: false,
                    hasBossCrashedIntoWall: false,
                    shouldCreateAutoSavestate: false
                };
            }
            if (isFacingRight)
                xMibi -= 4096;
            else
                xMibi += 4096;
            yMibi += ySpeedInMibipixelsPerFrame;
            ySpeedInMibipixelsPerFrame -= 180;
            return {
                newBossPhase: thisPhaseObj,
                newBossMinionEnemies: [],
                newNonMinionEnemies: [],
                newRngSeed: rngSeed,
                nextEnemyId: nextEnemyId,
                hasBossJump1Finished: false,
                hasBossJump2Finished: false,
                hasBossJump3Finished: false,
                hasBossCrashedIntoWall: false,
                shouldCreateAutoSavestate: false
            };
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 2;
            displayOutput.drawImageRotatedClockwise(isFacingRight ? 64 /* GameImage.Yeti */ : 65 /* GameImage.Yeti_Mirrored */, spriteNum * 64, 4 * 64, 64, 64, (xMibi >> 10) - 32 * 3, (yMibi >> 10) - 32 * 3, 0, 3 * 128);
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 16 * 3 * 1024,
                    yMibi: yMibi - 24 * 3 * 1024,
                    widthMibi: 32 * 3 * 1024,
                    heightMibi: 32 * 3 * 1024
                }, {
                    xMibi: xMibi - 12 * 3 * 1024,
                    yMibi: yMibi + 8 * 3 * 1024,
                    widthMibi: 24 * 3 * 1024,
                    heightMibi: 8 * 3 * 1024
                }];
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 16 * 3 * 1024,
                    yMibi: yMibi - 32 * 3 * 1024,
                    widthMibi: 32 * 3 * 1024,
                    heightMibi: 32 * 3 * 1024
                }, {
                    xMibi: xMibi - 9 * 3 * 1024,
                    yMibi: yMibi,
                    widthMibi: 18 * 3 * 1024,
                    heightMibi: 16 * 3 * 1024
                }, {
                    xMibi: xMibi - 4 * 3 * 1024,
                    yMibi: yMibi + 16 * 3 * 1024,
                    widthMibi: 8 * 3 * 1024,
                    heightMibi: 4 * 3 * 1024
                }];
        };
        return {
            getSnapshot,
            getXMibi: function () { return xMibi; },
            getYMibi: function () { return yMibi; },
            hasStartedBossFight: function () { return true; },
            hasFinishedBossFight: function () { return false; },
            processFrame,
            render,
            getHitboxes,
            getDamageboxes
        };
    };
    return {
        getBossPhase: function ({ xMibi, yMibi, isFacingRight }) {
            return getBossPhase(xMibi, yMibi, 5000, isFacingRight, 0);
        }
    };
})());
let Enemy_Level3BossCreator = ((function () {
    let getEnemy = function (xMibi, enemyId) {
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, enemyId);
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, difficulty, tilemap }) {
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            if (playerState.xMibi >= xMibi) {
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed,
                    cutscene: Cutscene_Level3Boss.getCutscene({
                        xMibi: xMibi + 1024 * 48 * 4
                    })
                };
            }
            return {
                enemies: [thisObj],
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        return {
            getSnapshot,
            isBullet: false,
            isBackground: true,
            processFrame,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe: function () { },
            render: function (displayOutput) { },
            enemyId
        };
    };
    return {
        getEnemy: function ({ xMibi, enemyId }) {
            return getEnemy(xMibi, enemyId);
        }
    };
})());
let Enemy_Level3BossDeadPhase = ((function () {
    let getBossPhase = function (xMibi, yMibi, ySpeedInMibipixelsPerFrame, frameCounter) {
        let getSnapshot = function () {
            return getBossPhase(xMibi, yMibi, ySpeedInMibipixelsPerFrame, frameCounter);
        };
        let processFrame = function ({ bossEnemyId, thisPhaseObj, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += 650;
            yMibi += ySpeedInMibipixelsPerFrame;
            ySpeedInMibipixelsPerFrame -= 180;
            if (yMibi < -1000 * 1024) {
                yMibi = -1000 * 1024;
                ySpeedInMibipixelsPerFrame = 0;
            }
            frameCounter++;
            let newNonMinionEnemies = [];
            if (frameCounter % 8 === 0) {
                let explodeXMibi = xMibi;
                let explodeYMibi = yMibi;
                explodeXMibi += (rng.nextInt(100) - 50) << 10;
                explodeYMibi += (rng.nextInt(60) - 50) << 10;
                newNonMinionEnemies.push(Enemy_Background_Explode.getEnemy({
                    xMibi: explodeXMibi,
                    yMibi: explodeYMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: true,
                    enemyId: nextEnemyId++
                }));
            }
            return {
                newBossPhase: thisPhaseObj,
                newBossMinionEnemies: [],
                newNonMinionEnemies: newNonMinionEnemies,
                newRngSeed: rng.getSeed(),
                nextEnemyId: nextEnemyId,
                hasBossJump1Finished: false,
                hasBossJump2Finished: false,
                hasBossJump3Finished: false,
                hasBossCrashedIntoWall: false,
                shouldCreateAutoSavestate: false
            };
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 2;
            displayOutput.drawImageRotatedClockwise(65 /* GameImage.Yeti_Mirrored */, spriteNum * 64, 4 * 64, 64, 64, (xMibi >> 10) - 32 * 3, (yMibi >> 10) - 32 * 3, 0, 3 * 128);
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 16 * 3 * 1024,
                    yMibi: yMibi - 32 * 3 * 1024,
                    widthMibi: 32 * 3 * 1024,
                    heightMibi: 40 * 3 * 1024
                }, {
                    xMibi: xMibi - 12 * 3 * 1024,
                    yMibi: yMibi + 8 * 3 * 1024,
                    widthMibi: 24 * 3 * 1024,
                    heightMibi: 8 * 3 * 1024
                }];
        };
        return {
            getSnapshot,
            getXMibi: function () { return xMibi; },
            getYMibi: function () { return yMibi; },
            hasStartedBossFight: function () { return true; },
            hasFinishedBossFight: function () { return true; },
            processFrame,
            render,
            getHitboxes: function () { return null; },
            getDamageboxes
        };
    };
    return {
        getBossPhase: function ({ xMibi, yMibi }) {
            return getBossPhase(xMibi, yMibi, 5000, 0);
        }
    };
})());
let Enemy_Level3BossIntro1Phase = ((function () {
    let getBossPhase = function (xMibi, yMibi, endXMibi, hasSpawnedOrbiterSpikes, frameCounter) {
        let getSnapshot = function () {
            return getBossPhase(xMibi, yMibi, endXMibi, hasSpawnedOrbiterSpikes, frameCounter);
        };
        let processFrame = function ({ bossEnemyId, thisPhaseObj, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            frameCounter++;
            let newBossMinionEnemies = [];
            if (!hasSpawnedOrbiterSpikes) {
                hasSpawnedOrbiterSpikes = true;
                let orbiter1EnemyId = nextEnemyId++;
                let orbiter2EnemyId = nextEnemyId++;
                let orbiter3EnemyId = nextEnemyId++;
                let angleScaled = rng.nextInt(360 * 128);
                let isRotatingClockwise = rng.nextBool();
                newBossMinionEnemies.push(Enemy_Level3Boss_OrbiterSpike.getEnemy({
                    angleScaled: angleScaled,
                    isRotatingClockwise: isRotatingClockwise,
                    bossEnemyId: bossEnemyId,
                    enemyId: orbiter1EnemyId
                }));
                newBossMinionEnemies.push(Enemy_Level3Boss_OrbiterSpike.getEnemy({
                    angleScaled: angleScaled + 120 * 128,
                    isRotatingClockwise: isRotatingClockwise,
                    bossEnemyId: bossEnemyId,
                    enemyId: orbiter2EnemyId
                }));
                newBossMinionEnemies.push(Enemy_Level3Boss_OrbiterSpike.getEnemy({
                    angleScaled: angleScaled + 240 * 128,
                    isRotatingClockwise: isRotatingClockwise,
                    bossEnemyId: bossEnemyId,
                    enemyId: orbiter3EnemyId
                }));
            }
            if (xMibi <= endXMibi) {
                return {
                    newBossPhase: Enemy_Level3BossIntro2Phase.getBossPhase({ xMibi: xMibi, yMibi: yMibi }),
                    newBossMinionEnemies: newBossMinionEnemies,
                    newNonMinionEnemies: [],
                    newRngSeed: rng.getSeed(),
                    nextEnemyId: nextEnemyId,
                    hasBossJump1Finished: false,
                    hasBossJump2Finished: false,
                    hasBossJump3Finished: false,
                    hasBossCrashedIntoWall: false,
                    shouldCreateAutoSavestate: false
                };
            }
            xMibi -= 768;
            return {
                newBossPhase: thisPhaseObj,
                newBossMinionEnemies: newBossMinionEnemies,
                newNonMinionEnemies: [],
                newRngSeed: rng.getSeed(),
                nextEnemyId: nextEnemyId,
                hasBossJump1Finished: false,
                hasBossJump2Finished: false,
                hasBossJump3Finished: false,
                hasBossCrashedIntoWall: false,
                shouldCreateAutoSavestate: false
            };
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 8;
            displayOutput.drawImageRotatedClockwise(65 /* GameImage.Yeti_Mirrored */, spriteNum * 64, 64, 64, 64, (xMibi >> 10) - 32 * 3, (yMibi >> 10) - 32 * 3, 0, 3 * 128);
        };
        return {
            getSnapshot,
            getXMibi: function () { return xMibi; },
            getYMibi: function () { return yMibi; },
            hasStartedBossFight: function () { return false; },
            hasFinishedBossFight: function () { return false; },
            processFrame,
            render,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; }
        };
    };
    return {
        getBossPhase: function () {
            return getBossPhase(1024 * (GlobalConstants.WINDOW_WIDTH + 340 + 32 * 3), 1024 * 16 * 3 * 2 + 32 * 1024 * 3, 1024 * (GlobalConstants.WINDOW_WIDTH + 340 + 32 * 3 - 190 * 3), false, 0);
        }
    };
})());
let Enemy_Level3BossIntro2Phase = ((function () {
    let getBossPhase = function (xMibi, yMibi, frameCounter) {
        let getSnapshot = function () {
            return getBossPhase(xMibi, yMibi, frameCounter);
        };
        let processFrame = function ({ bossEnemyId, thisPhaseObj, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            frameCounter++;
            if (frameCounter >= 320) {
                let icicles = [];
                for (let i = 0; i < 19; i++) {
                    icicles.push(Enemy_Level3Boss_Icicle.getEnemy({
                        xMibi: (64 + i * 48) * 1024,
                        bossEnemyId: bossEnemyId,
                        enemyId: nextEnemyId++
                    }));
                }
                return {
                    newBossPhase: Enemy_Level3BossJumpPhase.getBossPhase({ xMibi: xMibi, yMibi: yMibi, isFacingRight: false }),
                    newBossMinionEnemies: icicles,
                    newNonMinionEnemies: [],
                    newRngSeed: rngSeed,
                    nextEnemyId: nextEnemyId,
                    hasBossJump1Finished: false,
                    hasBossJump2Finished: false,
                    hasBossJump3Finished: false,
                    hasBossCrashedIntoWall: false,
                    shouldCreateAutoSavestate: true
                };
            }
            return {
                newBossPhase: thisPhaseObj,
                newBossMinionEnemies: [],
                newNonMinionEnemies: [],
                newRngSeed: rngSeed,
                nextEnemyId: nextEnemyId,
                hasBossJump1Finished: false,
                hasBossJump2Finished: false,
                hasBossJump3Finished: false,
                hasBossCrashedIntoWall: false,
                shouldCreateAutoSavestate: false
            };
        };
        let render = function (displayOutput) {
            if (frameCounter <= 120) {
                let spriteNum = Math.floor(frameCounter / 13) % 8;
                displayOutput.drawImageRotatedClockwise(65 /* GameImage.Yeti_Mirrored */, spriteNum * 64, 0, 64, 64, (xMibi >> 10) - 32 * 3, (yMibi >> 10) - 32 * 3, 0, 3 * 128);
            }
            else {
                let spriteNum = Math.floor((frameCounter - 120) / 10) % 4;
                displayOutput.drawImageRotatedClockwise(65 /* GameImage.Yeti_Mirrored */, spriteNum * 64 + 256, 64 * 5, 64, 64, (xMibi >> 10) - 32 * 3, (yMibi >> 10) - 32 * 3, 0, 3 * 128);
            }
        };
        return {
            getSnapshot,
            getXMibi: function () { return xMibi; },
            getYMibi: function () { return yMibi; },
            hasStartedBossFight: function () { return false; },
            hasFinishedBossFight: function () { return false; },
            processFrame,
            render,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; }
        };
    };
    return {
        getBossPhase: function ({ xMibi, yMibi }) {
            return getBossPhase(xMibi, yMibi, 0);
        }
    };
})());
let Enemy_Level3BossJumpPhase = ((function () {
    const FIRST_JUMP_COOLDOWN = 120;
    const SUBSEQUENT_JUMP_COOLDOWN = 60;
    let getBossPhase = function (xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, isFacingRight, jumpCooldown, numJumpsCompleted, animationFrameCounter) {
        let getSnapshot = function () {
            return getBossPhase(xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, isFacingRight, jumpCooldown, numJumpsCompleted, animationFrameCounter);
        };
        let processFrame = function ({ bossEnemyId, thisPhaseObj, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let hasBossJump1Finished = false;
            let hasBossJump2Finished = false;
            let hasBossJump3Finished = false;
            let newBossMinionEnemies = [];
            if (jumpCooldown !== null) {
                isFacingRight = playerState.xMibi > xMibi;
                jumpCooldown--;
                if (jumpCooldown <= 0) {
                    if (numJumpsCompleted === 3) {
                        return {
                            newBossPhase: Enemy_Level3BossThrowPhase.getBossPhase({ xMibi: xMibi, yMibi: yMibi, isFacingRight: isFacingRight }),
                            newBossMinionEnemies: newBossMinionEnemies,
                            newNonMinionEnemies: [],
                            newRngSeed: rngSeed,
                            nextEnemyId: nextEnemyId,
                            hasBossJump1Finished: hasBossJump1Finished,
                            hasBossJump2Finished: hasBossJump2Finished,
                            hasBossJump3Finished: hasBossJump3Finished,
                            hasBossCrashedIntoWall: false,
                            shouldCreateAutoSavestate: false
                        };
                    }
                    ySpeedInMibipixelsPerFrame = 10160;
                    let deltaX = playerState.xMibi - xMibi;
                    xSpeedInMibipixelsPerFrame = Math.floor(deltaX * 9 / 1000);
                    jumpCooldown = null;
                    animationFrameCounter = 0;
                }
            }
            else {
                let proposedNewXMibi = xMibi + xSpeedInMibipixelsPerFrame;
                if (!tilemap.isSolid(proposedNewXMibi - 24 * 3 * 1024, yMibi) && !tilemap.isSolid(proposedNewXMibi + 24 * 3 * 1024, yMibi))
                    xMibi = proposedNewXMibi;
                else
                    xSpeedInMibipixelsPerFrame = 0;
                let proposedNewYMibi = yMibi + ySpeedInMibipixelsPerFrame;
                if (!tilemap.isSolid(xMibi, proposedNewYMibi + 32 * 3 * 1024))
                    yMibi = proposedNewYMibi;
                else
                    ySpeedInMibipixelsPerFrame = 0;
                ySpeedInMibipixelsPerFrame -= 180;
                let hasLanded = false;
                while (tilemap.isSolid(xMibi, yMibi - 32 * 3 * 1024 + 1024)) {
                    hasLanded = true;
                    yMibi += 1024;
                }
                while (tilemap.isSolid(xMibi, yMibi - 32 * 3 * 1024 + 128)) {
                    hasLanded = true;
                    yMibi += 128;
                }
                while (tilemap.isSolid(xMibi, yMibi - 32 * 3 * 1024 + 8)) {
                    hasLanded = true;
                    yMibi += 8;
                }
                while (tilemap.isSolid(xMibi, yMibi - 32 * 3 * 1024)) {
                    hasLanded = true;
                    yMibi += 1;
                }
                if (hasLanded) {
                    soundOutput.playSound(5 /* GameSound.Explosion00 */, 100);
                    newBossMinionEnemies.push(Enemy_Level3Boss_BigSpark.getEnemy({
                        xMibi: xMibi - 1024 * 35,
                        yMibi: yMibi - 32 * 3 * 1024,
                        isFacingRight: false,
                        bossEnemyId: bossEnemyId,
                        enemyId: nextEnemyId++
                    }));
                    newBossMinionEnemies.push(Enemy_Level3Boss_BigSpark.getEnemy({
                        xMibi: xMibi + 1024 * 35,
                        yMibi: yMibi - 32 * 3 * 1024,
                        isFacingRight: true,
                        bossEnemyId: bossEnemyId,
                        enemyId: nextEnemyId++
                    }));
                    xSpeedInMibipixelsPerFrame = 0;
                    ySpeedInMibipixelsPerFrame = 0;
                    isFacingRight = playerState.xMibi > xMibi;
                    numJumpsCompleted++;
                    jumpCooldown = SUBSEQUENT_JUMP_COOLDOWN;
                    if (numJumpsCompleted === 1)
                        hasBossJump1Finished = true;
                    else if (numJumpsCompleted === 2)
                        hasBossJump2Finished = true;
                    else if (numJumpsCompleted === 3)
                        hasBossJump3Finished = true;
                }
            }
            animationFrameCounter++;
            return {
                newBossPhase: thisPhaseObj,
                newBossMinionEnemies: newBossMinionEnemies,
                newNonMinionEnemies: [],
                newRngSeed: rngSeed,
                nextEnemyId: nextEnemyId,
                hasBossJump1Finished: hasBossJump1Finished,
                hasBossJump2Finished: hasBossJump2Finished,
                hasBossJump3Finished: hasBossJump3Finished,
                hasBossCrashedIntoWall: false,
                shouldCreateAutoSavestate: false
            };
        };
        let render = function (displayOutput) {
            let imageX;
            if (jumpCooldown !== null)
                imageX = jumpCooldown <= Math.floor(SUBSEQUENT_JUMP_COOLDOWN / 2) ? 1 : 0;
            else if (ySpeedInMibipixelsPerFrame > 0)
                imageX = animationFrameCounter < 30 ? 2 : 3;
            else
                imageX = 4;
            displayOutput.drawImageRotatedClockwise(isFacingRight ? 64 /* GameImage.Yeti */ : 65 /* GameImage.Yeti_Mirrored */, imageX * 64, 3 * 64, 64, 64, (xMibi >> 10) - 32 * 3, (yMibi >> 10) - 32 * 3, 0, 3 * 128);
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 16 * 3 * 1024,
                    yMibi: yMibi - 24 * 3 * 1024,
                    widthMibi: 32 * 3 * 1024,
                    heightMibi: 32 * 3 * 1024
                }, {
                    xMibi: xMibi - 12 * 3 * 1024,
                    yMibi: yMibi + 8 * 3 * 1024,
                    widthMibi: 24 * 3 * 1024,
                    heightMibi: 8 * 3 * 1024
                }];
        };
        let getDamageboxes = function () {
            let damageboxes = [{
                    xMibi: xMibi - 16 * 3 * 1024,
                    yMibi: yMibi - 32 * 3 * 1024,
                    widthMibi: 32 * 3 * 1024,
                    heightMibi: 40 * 3 * 1024
                }, {
                    xMibi: xMibi - 12 * 3 * 1024,
                    yMibi: yMibi + 8 * 3 * 1024,
                    widthMibi: 24 * 3 * 1024,
                    heightMibi: 8 * 3 * 1024
                }];
            if (jumpCooldown === null && ySpeedInMibipixelsPerFrame < 0)
                damageboxes.push({
                    xMibi: xMibi - 12 * 3 * 1024,
                    yMibi: yMibi + 16 * 3 * 1024,
                    widthMibi: 24 * 3 * 1024,
                    heightMibi: 12 * 3 * 1024
                });
            return damageboxes;
        };
        return {
            getSnapshot,
            getXMibi: function () { return xMibi; },
            getYMibi: function () { return yMibi; },
            hasStartedBossFight: function () { return true; },
            hasFinishedBossFight: function () { return false; },
            processFrame,
            render,
            getHitboxes,
            getDamageboxes
        };
    };
    return {
        getBossPhase: function ({ xMibi, yMibi, isFacingRight }) {
            return getBossPhase(xMibi, yMibi, 0, 0, isFacingRight, FIRST_JUMP_COOLDOWN, 0, 0);
        }
    };
})());
let Enemy_Level3BossStunnedPhase = ((function () {
    let getBossPhase = function (xMibi, yMibi, isFacingRight, frameCounter) {
        let getSnapshot = function () {
            return getBossPhase(xMibi, yMibi, isFacingRight, frameCounter);
        };
        let processFrame = function ({ thisPhaseObj, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            frameCounter++;
            if (frameCounter === 650) {
                return {
                    newBossPhase: Enemy_Level3BossJumpPhase.getBossPhase({ xMibi: xMibi, yMibi: yMibi, isFacingRight: xMibi < playerState.xMibi }),
                    newBossMinionEnemies: [],
                    newNonMinionEnemies: [],
                    newRngSeed: rngSeed,
                    nextEnemyId: nextEnemyId,
                    hasBossJump1Finished: false,
                    hasBossJump2Finished: false,
                    hasBossJump3Finished: false,
                    hasBossCrashedIntoWall: false,
                    shouldCreateAutoSavestate: false
                };
            }
            return {
                newBossPhase: thisPhaseObj,
                newBossMinionEnemies: [],
                newNonMinionEnemies: [],
                newRngSeed: rngSeed,
                nextEnemyId: nextEnemyId,
                hasBossJump1Finished: false,
                hasBossJump2Finished: false,
                hasBossJump3Finished: false,
                hasBossCrashedIntoWall: false,
                shouldCreateAutoSavestate: false
            };
        };
        let render = function (displayOutput) {
            let spriteNum;
            if (frameCounter <= 430)
                spriteNum = (Math.floor(frameCounter / 20) % 2) + 2;
            else
                spriteNum = (Math.floor(frameCounter / 20) % 4) + 4;
            displayOutput.drawImageRotatedClockwise(isFacingRight ? 64 /* GameImage.Yeti */ : 65 /* GameImage.Yeti_Mirrored */, spriteNum * 64, 4 * 64, 64, 64, (xMibi >> 10) - 32 * 3, (yMibi >> 10) - 32 * 3, 0, 3 * 128);
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 16 * 3 * 1024,
                    yMibi: yMibi - 24 * 3 * 1024,
                    widthMibi: 32 * 3 * 1024,
                    heightMibi: 16 * 3 * 1024
                }, {
                    xMibi: xMibi - 10 * 3 * 1024,
                    yMibi: yMibi - 8 * 3 * 1024,
                    widthMibi: 20 * 3 * 1024,
                    heightMibi: 12 * 3 * 1024
                }];
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 20 * 3 * 1024,
                    yMibi: yMibi - 32 * 3 * 1024,
                    widthMibi: 40 * 3 * 1024,
                    heightMibi: 24 * 3 * 1024
                }, {
                    xMibi: xMibi - 10 * 3 * 1024,
                    yMibi: yMibi - 8 * 3 * 1024,
                    widthMibi: 20 * 3 * 1024,
                    heightMibi: 16 * 3 * 1024
                }];
        };
        return {
            getSnapshot,
            getXMibi: function () { return xMibi; },
            getYMibi: function () { return yMibi; },
            hasStartedBossFight: function () { return true; },
            hasFinishedBossFight: function () { return false; },
            processFrame,
            render,
            getHitboxes,
            getDamageboxes
        };
    };
    return {
        getBossPhase: function ({ xMibi, yMibi, isFacingRight }) {
            return getBossPhase(xMibi, yMibi, isFacingRight, 0);
        }
    };
})());
let Enemy_Level3BossThrowPhase = ((function () {
    let getBossPhase = function (xMibi, yMibi, isFacingRight, frameCounter) {
        let getSnapshot = function () {
            return getBossPhase(xMibi, yMibi, isFacingRight, frameCounter);
        };
        let processFrame = function ({ bossEnemyId, thisPhaseObj, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            frameCounter++;
            let newBossMinionEnemies = [];
            if (frameCounter === 24) {
                newBossMinionEnemies.push(Enemy_Level3Boss_Snowball.getEnemy({
                    xMibi: xMibi + 1024 * 30 * (isFacingRight ? 1 : -1),
                    yMibi: yMibi + 1024 * 20,
                    isFacingRight: isFacingRight,
                    ySpeedInMibipixelsPerFrame: 6700,
                    bossEnemyId: bossEnemyId,
                    difficulty: difficulty,
                    enemyId: nextEnemyId++
                }));
            }
            if (frameCounter === 60) {
                return {
                    newBossPhase: Enemy_Level3BossChargePhase.getBossPhase({ xMibi: xMibi, yMibi: yMibi, isFacingRight: playerState.xMibi > xMibi }),
                    newBossMinionEnemies: newBossMinionEnemies,
                    newNonMinionEnemies: [],
                    newRngSeed: rngSeed,
                    nextEnemyId: nextEnemyId,
                    hasBossJump1Finished: false,
                    hasBossJump2Finished: false,
                    hasBossJump3Finished: false,
                    hasBossCrashedIntoWall: false,
                    shouldCreateAutoSavestate: false
                };
            }
            return {
                newBossPhase: thisPhaseObj,
                newBossMinionEnemies: newBossMinionEnemies,
                newNonMinionEnemies: [],
                newRngSeed: rngSeed,
                nextEnemyId: nextEnemyId,
                hasBossJump1Finished: false,
                hasBossJump2Finished: false,
                hasBossJump3Finished: false,
                hasBossCrashedIntoWall: false,
                shouldCreateAutoSavestate: false
            };
        };
        let render = function (displayOutput) {
            let imageX;
            if (frameCounter < 24)
                imageX = 0;
            else if (frameCounter < 28)
                imageX = 1;
            else if (frameCounter < 32)
                imageX = 2;
            else
                imageX = 3;
            displayOutput.drawImageRotatedClockwise(isFacingRight ? 64 /* GameImage.Yeti */ : 65 /* GameImage.Yeti_Mirrored */, imageX * 64, 5 * 64, 64, 64, (xMibi >> 10) - 32 * 3, (yMibi >> 10) - 32 * 3, 0, 3 * 128);
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 16 * 3 * 1024,
                    yMibi: yMibi - 24 * 3 * 1024,
                    widthMibi: 32 * 3 * 1024,
                    heightMibi: 32 * 3 * 1024
                }, {
                    xMibi: xMibi - 12 * 3 * 1024,
                    yMibi: yMibi + 8 * 3 * 1024,
                    widthMibi: 24 * 3 * 1024,
                    heightMibi: 8 * 3 * 1024
                }];
        };
        let getDamageboxes = function () {
            let damageboxes = [];
            damageboxes.push({
                xMibi: xMibi - 16 * 3 * 1024,
                yMibi: yMibi - 32 * 3 * 1024,
                widthMibi: 32 * 3 * 1024,
                heightMibi: 40 * 3 * 1024
            });
            damageboxes.push({
                xMibi: xMibi - 12 * 3 * 1024,
                yMibi: yMibi + 8 * 3 * 1024,
                widthMibi: 24 * 3 * 1024,
                heightMibi: 8 * 3 * 1024
            });
            if (frameCounter < 24)
                damageboxes.push({
                    xMibi: xMibi + (isFacingRight ? (-16 * 3 * 1024) : 0),
                    yMibi: yMibi + 16 * 3 * 1024,
                    widthMibi: 16 * 3 * 1024,
                    heightMibi: 8 * 3 * 1024
                });
            else
                damageboxes.push({
                    xMibi: xMibi + (isFacingRight ? 0 : (-16 * 3 * 1024)),
                    yMibi: yMibi + 16 * 3 * 1024,
                    widthMibi: 16 * 3 * 1024,
                    heightMibi: 8 * 3 * 1024
                });
            return damageboxes;
        };
        return {
            getSnapshot,
            getXMibi: function () { return xMibi; },
            getYMibi: function () { return yMibi; },
            hasStartedBossFight: function () { return true; },
            hasFinishedBossFight: function () { return false; },
            processFrame,
            render,
            getHitboxes,
            getDamageboxes
        };
    };
    return {
        getBossPhase: function ({ xMibi, yMibi, isFacingRight }) {
            return getBossPhase(xMibi, yMibi, isFacingRight, 0);
        }
    };
})());
let Enemy_Level3Boss_BigSpark = ((function () {
    let getEnemy = function (xMibi, yMibi, isFacingRight, bossHealthPercentage, attackCooldown, sparks, bossEnemyId, screenWipeCountdown, enemyId) {
        let getSnapshot = function () {
            let sparksSnapshot = sparks.map(spark => ({ xMibi: spark.xMibi, yMibi: spark.yMibi, frameCounter: spark.frameCounter }));
            return getEnemy(xMibi, yMibi, isFacingRight, bossHealthPercentage, attackCooldown, sparksSnapshot, bossEnemyId, screenWipeCountdown, enemyId);
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let enemies = [thisObj];
            let isSolid = tilemap.isSolid(xMibi, yMibi);
            if (isSolid && sparks.length === 0) {
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            if (!isSolid) {
                if (isFacingRight) {
                    xMibi += 3072;
                }
                else {
                    xMibi -= 3072;
                }
            }
            if (attackCooldown === null)
                attackCooldown = 0;
            attackCooldown--;
            if (attackCooldown <= 0) {
                attackCooldown = 20;
                if (screenWipeCountdown === null && !isSolid) {
                    sparks.push({ xMibi: xMibi, yMibi: yMibi, frameCounter: 0 });
                }
            }
            let newSparks = [];
            for (let spark of sparks) {
                spark.frameCounter++;
                if (spark.frameCounter === 8 && bossHealthPercentage !== null && screenWipeCountdown === null) {
                    let numProjectiles;
                    switch (difficulty) {
                        case 0 /* Difficulty.Easy */:
                            if (bossHealthPercentage >= 50)
                                numProjectiles = 2;
                            else
                                numProjectiles = 3;
                            break;
                        case 1 /* Difficulty.Normal */:
                            if (bossHealthPercentage >= 50)
                                numProjectiles = 2;
                            else
                                numProjectiles = 3;
                            break;
                        case 2 /* Difficulty.Hard */:
                            if (bossHealthPercentage >= 83)
                                numProjectiles = 2;
                            else if (bossHealthPercentage >= 67)
                                numProjectiles = 3;
                            else if (bossHealthPercentage >= 50)
                                numProjectiles = 4;
                            else
                                numProjectiles = 5;
                            break;
                    }
                    for (let i = 0; i < numProjectiles; i++) {
                        enemies.push(Enemy_Bullet_Coin.getEnemy({
                            xMibi: spark.xMibi,
                            yMibi: spark.yMibi + 1024 * 30,
                            speedInMibipixelsPerFrame: 6500 + rng.nextInt(2500),
                            angleScaled: isFacingRight ? (90 * 128 - rng.nextInt(10 * 128)) : (90 * 128 + rng.nextInt(10 * 128)),
                            enemyId: nextEnemyId++
                        }));
                    }
                }
                if (spark.frameCounter < 48) {
                    newSparks.push(spark);
                }
            }
            sparks = newSparks;
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poofEnemies = [];
                    for (let spark of sparks) {
                        poofEnemies.push(Enemy_Background_Poof.getEnemy({ xMibi: spark.xMibi, yMibi: spark.yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ }));
                    }
                    return {
                        enemies: poofEnemies,
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rng.getSeed()
                    };
                }
            }
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            let hitboxes = [];
            for (let spark of sparks) {
                hitboxes.push({
                    xMibi: spark.xMibi - 1024 * 3 * 5,
                    yMibi: spark.yMibi - 1024 * 3 * 20,
                    widthMibi: 1024 * 3 * 10,
                    heightMibi: 1024 * 3 * 40
                });
            }
            return hitboxes;
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        let render = function (displayOutput) {
            for (let spark of sparks) {
                let spriteNum = Math.floor(spark.frameCounter / 8);
                if (spriteNum > 5)
                    spriteNum = 5;
                displayOutput.drawImageRotatedClockwise(isFacingRight ? 66 /* GameImage.HitYellow */ : 67 /* GameImage.HitYellow_Mirrored */, spriteNum * 55, 0, 55, 68, (spark.xMibi >> 10) - 3 * 27, (spark.yMibi >> 10) - 3 * 34, 0, 3 * 128);
            }
        };
        let notifyBossHealthPercentage = function (healthPercentage) {
            if (bossHealthPercentage === null)
                bossHealthPercentage = healthPercentage;
        };
        return {
            getLevel3BossMinionEnemyId: function () { return enemyId; },
            notifyBossHealthPercentage,
            notifyBossJump1Finished: function () { },
            notifyBossJump2Finished: function () { },
            notifyBossJump3Finished: function () { },
            notifyBossCrashIntoWall: function () { },
            getSnapshot,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render,
            enemyId
        };
    };
    return {
        getEnemy: function ({ xMibi, yMibi, isFacingRight, bossEnemyId, enemyId }) {
            return getEnemy(xMibi, yMibi, isFacingRight, null, null, [], bossEnemyId, null, enemyId);
        }
    };
})());
let Enemy_Level3Boss_Iceball = ((function () {
    let getEnemy = function (xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, hasBossCrashedIntoWall, displayAngleScaled, screenWipeCountdown, gameImage, enemyId) {
        let thisEnemyArray = null;
        let getSnapshot = function () {
            return getEnemy(xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, hasBossCrashedIntoWall, displayAngleScaled, screenWipeCountdown, gameImage, enemyId);
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            if (tilemap.isSolid(xMibi, yMibi)) {
                let poof = Enemy_Background_Poof.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    scalingFactorScaled: 192,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [poof],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            if (hasBossCrashedIntoWall)
                ySpeedInMibipixelsPerFrame -= 20;
            xMibi += xSpeedInMibipixelsPerFrame;
            yMibi += ySpeedInMibipixelsPerFrame;
            displayAngleScaled = -90 * 128 - DTMath.arcTangentScaledSafe(xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame);
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        scalingFactorScaled: 3 * 128,
                        enemyId: nextEnemyId++
                    });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rng.getSeed()
                    };
                }
            }
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 8 * 1024,
                    yMibi: yMibi - 8 * 1024,
                    widthMibi: 17 * 1024,
                    heightMibi: 17 * 1024
                }];
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        let render = function (displayOutput) {
            if (displayAngleScaled === null)
                return;
            displayOutput.drawImageRotatedClockwise(gameImage, 0, 0, 6, 6, (xMibi >> 10) - 3 * 3, (yMibi >> 10) - 3 * 3, displayAngleScaled, 3 * 128);
        };
        let notifyBossCrashIntoWall = function () {
            if (ySpeedInMibipixelsPerFrame > 0)
                ySpeedInMibipixelsPerFrame = ySpeedInMibipixelsPerFrame >> 2;
            hasBossCrashedIntoWall = true;
        };
        return {
            getLevel3BossSubMinionEnemyId: function () { return enemyId; },
            notifyBossCrashIntoWall,
            getSnapshot,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render,
            enemyId
        };
    };
    return {
        getEnemy: function ({ xMibi, yMibi, speedInMibipixelsPerFrame, angleScaled, gameImage, enemyId }) {
            let xSpeedInMibipixelsPerFrame = (speedInMibipixelsPerFrame * DTMath.cosineScaled(angleScaled)) >> 10;
            let ySpeedInMibipixelsPerFrame = (speedInMibipixelsPerFrame * DTMath.sineScaled(angleScaled)) >> 10;
            return getEnemy(xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, false, null, null, gameImage, enemyId);
        }
    };
})());
let Enemy_Level3Boss_Icicle = ((function () {
    let CEILING_Y_MIBI = 572 * 1024;
    let getEnemy = function (xMibi, yMibi, originalXMibi, bossHealthPercentage, bossJump1Finished, bossJump2Finished, bossJump3Finished, bossCrashedIntoWall, subMinionEnemyIds, fallingFrameCounter, fallingStartValue, isHoming, homingShouldCheckForTilemapCollision, homingSpeedInMibipixelsPerFrame, homingAngleScaled, hasExploded, screenWipeCountdown, bossEnemyId, enemyId) {
        let getSnapshot = function () {
            return getEnemy(xMibi, yMibi, originalXMibi, bossHealthPercentage, bossJump1Finished, bossJump2Finished, bossJump3Finished, bossCrashedIntoWall, [...subMinionEnemyIds], fallingFrameCounter, fallingStartValue, isHoming, homingShouldCheckForTilemapCollision, homingSpeedInMibipixelsPerFrame, homingAngleScaled, hasExploded, screenWipeCountdown, bossEnemyId, enemyId);
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, difficulty, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            if (fallingStartValue === null)
                fallingStartValue = 15 + rng.nextInt(30);
            if (bossCrashedIntoWall) {
                bossCrashedIntoWall = false;
                for (let subMinionEnemyId of subMinionEnemyIds) {
                    let subMinionEnemy = enemyMapping[subMinionEnemyId];
                    if (subMinionEnemy) {
                        let subMinionEnemyAsSubMinionEnemy = subMinionEnemy;
                        subMinionEnemyAsSubMinionEnemy.notifyBossCrashIntoWall();
                    }
                }
                subMinionEnemyIds = [];
                if (hasExploded && screenWipeCountdown === null) {
                    hasExploded = false;
                    xMibi = originalXMibi;
                    yMibi = 600 * 1024;
                    fallingFrameCounter = null;
                    fallingStartValue = 15 + rng.nextInt(30);
                    if (difficulty === 2 /* Difficulty.Hard */ && bossHealthPercentage <= 50) {
                        isHoming = true;
                        homingAngleScaled = null;
                        homingSpeedInMibipixelsPerFrame = null;
                        homingShouldCheckForTilemapCollision = false;
                    }
                }
            }
            if (fallingFrameCounter === null && !hasExploded) {
                if (yMibi > CEILING_Y_MIBI) {
                    yMibi -= 400;
                    if (yMibi < CEILING_Y_MIBI) {
                        yMibi = CEILING_Y_MIBI;
                    }
                }
            }
            if (!hasExploded && screenWipeCountdown === null && yMibi === CEILING_Y_MIBI && fallingFrameCounter === null) {
                let percentageAdjustment;
                if (bossHealthPercentage >= 80)
                    percentageAdjustment = 0;
                else if (bossHealthPercentage > 50)
                    percentageAdjustment = (80 - bossHealthPercentage) * 3 + 10;
                else
                    percentageAdjustment = 100;
                if (difficulty === 1 /* Difficulty.Normal */)
                    percentageAdjustment = percentageAdjustment >> 1;
                if (difficulty === 0 /* Difficulty.Easy */)
                    percentageAdjustment = 0;
                if (bossJump1Finished) {
                    bossJump1Finished = false;
                    if (!hasExploded && rng.nextInt(100) < Math.floor(33 * percentageAdjustment / 100))
                        fallingFrameCounter = 0;
                }
                if (bossJump2Finished) {
                    bossJump2Finished = false;
                    if (!hasExploded && rng.nextInt(100) < Math.floor(50 * percentageAdjustment / 100))
                        fallingFrameCounter = 0;
                }
                if (bossJump3Finished) {
                    bossJump3Finished = false;
                    if (!hasExploded && rng.nextInt(100) < Math.floor(90 * percentageAdjustment / 100))
                        fallingFrameCounter = 0;
                }
            }
            else {
                bossJump1Finished = false;
                bossJump2Finished = false;
                bossJump3Finished = false;
            }
            let shouldExplode = false;
            if (fallingFrameCounter !== null && !hasExploded) {
                fallingFrameCounter++;
                if (fallingFrameCounter > fallingStartValue) {
                    if (isHoming) {
                        if (homingAngleScaled === null)
                            homingAngleScaled = 270 * 128;
                        if (homingSpeedInMibipixelsPerFrame === null)
                            homingSpeedInMibipixelsPerFrame = 0;
                        if (homingSpeedInMibipixelsPerFrame < 5000)
                            homingSpeedInMibipixelsPerFrame += 100;
                        let angleToPlayer = DTMath.arcTangentScaledSafe(playerState.xMibi - xMibi, playerState.yMibi - yMibi);
                        homingAngleScaled = DTMath.normalizeDegreesScaled(homingAngleScaled);
                        angleToPlayer = DTMath.normalizeDegreesScaled(angleToPlayer);
                        let angleDifferenceClockwise;
                        if (homingAngleScaled >= angleToPlayer)
                            angleDifferenceClockwise = homingAngleScaled - angleToPlayer;
                        else
                            angleDifferenceClockwise = homingAngleScaled - angleToPlayer + 360 * 128;
                        let angleDifferenceCounterclockwise;
                        if (angleToPlayer >= homingAngleScaled)
                            angleDifferenceCounterclockwise = angleToPlayer - homingAngleScaled;
                        else
                            angleDifferenceCounterclockwise = angleToPlayer - homingAngleScaled + 360 * 128;
                        if (angleDifferenceClockwise > angleDifferenceCounterclockwise)
                            homingAngleScaled = DTMath.normalizeDegreesScaled(homingAngleScaled + 128);
                        else
                            homingAngleScaled = DTMath.normalizeDegreesScaled(homingAngleScaled - 128);
                        let proposedXMibi = xMibi + ((homingSpeedInMibipixelsPerFrame * DTMath.cosineScaled(homingAngleScaled)) >> 10);
                        let proposedYMibi = yMibi + ((homingSpeedInMibipixelsPerFrame * DTMath.sineScaled(homingAngleScaled)) >> 10);
                        if (tilemap.isSolid(proposedXMibi, proposedYMibi) && homingShouldCheckForTilemapCollision) {
                            shouldExplode = true;
                        }
                        else {
                            xMibi = proposedXMibi;
                            yMibi = proposedYMibi;
                        }
                        if (!tilemap.isSolid(xMibi, yMibi))
                            homingShouldCheckForTilemapCollision = true;
                        if (Math.abs(playerState.xMibi - xMibi) + Math.abs(playerState.yMibi - yMibi) < 1024 * 50) {
                            if (rng.nextInt(100) > 40)
                                shouldExplode = true;
                        }
                        if (angleDifferenceClockwise > 90 * 128 && angleDifferenceCounterclockwise > 90 * 128)
                            shouldExplode = true;
                    }
                    else {
                        let speed = (fallingFrameCounter - fallingStartValue) * 100;
                        yMibi -= speed;
                        if (tilemap.isSolid(xMibi, yMibi)) {
                            shouldExplode = true;
                            while (tilemap.isSolid(xMibi, yMibi))
                                yMibi += 1024;
                        }
                    }
                }
            }
            let enemies = [thisObj];
            if (shouldExplode) {
                hasExploded = true;
                enemies.push(Enemy_Background_ExplodeI.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: isHoming && homingAngleScaled !== null ? -homingAngleScaled : 0,
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    gameImage: isHoming ? 50 /* GameImage.ExplodeIGreen */ : 49 /* GameImage.ExplodeI */,
                    enemyId: nextEnemyId++
                }));
                if (screenWipeCountdown === null) {
                    for (let i = rng.nextInt(40); i < 360; i += 40) {
                        let subMinionEnemy = Enemy_Level3Boss_Iceball.getEnemy({
                            xMibi: xMibi,
                            yMibi: yMibi,
                            speedInMibipixelsPerFrame: 1024,
                            angleScaled: i * 128,
                            gameImage: isHoming ? 44 /* GameImage.IceballGreen */ : 43 /* GameImage.IceballBlue */,
                            enemyId: nextEnemyId++
                        });
                        enemies.push(subMinionEnemy);
                        subMinionEnemyIds.push(subMinionEnemy.getLevel3BossSubMinionEnemyId());
                    }
                }
            }
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    if (hasExploded)
                        return {
                            enemies: [],
                            nextEnemyId: nextEnemyId,
                            newRngSeed: rngSeed
                        };
                    let poof = Enemy_Background_Poof.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi >= CEILING_Y_MIBI ? (yMibi - 1024 * 5) : yMibi,
                        scalingFactorScaled: 3 * 128,
                        enemyId: nextEnemyId++
                    });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            if (hasExploded)
                return null;
            if (fallingFrameCounter !== null && fallingStartValue !== null && fallingFrameCounter > fallingStartValue) {
                if (isHoming)
                    return [{
                            xMibi: xMibi - 3 * 3 * 1024,
                            yMibi: yMibi - 3 * 3 * 1024,
                            widthMibi: 6 * 3 * 1024,
                            heightMibi: 6 * 3 * 1024
                        }];
                return [{
                        xMibi: xMibi - 3 * 3 * 1024,
                        yMibi: yMibi - 6 * 3 * 1024,
                        widthMibi: 6 * 3 * 1024,
                        heightMibi: 12 * 3 * 1024
                    }];
            }
            else {
                return [{
                        xMibi: xMibi - 2 * 3 * 1024,
                        yMibi: yMibi - 10 * 3 * 1024,
                        widthMibi: 4 * 3 * 1024,
                        heightMibi: 20 * 3 * 1024
                    }];
            }
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        let render = function (displayOutput) {
            if (!hasExploded) {
                let xMibiAdjustment = 0;
                if (fallingFrameCounter !== null && fallingStartValue !== null && yMibi === CEILING_Y_MIBI && fallingFrameCounter <= fallingStartValue) {
                    xMibiAdjustment = 4 * DTMath.sineScaled(fallingFrameCounter * 128 * 30);
                }
                displayOutput.drawImageRotatedClockwise(isHoming ? 35 /* GameImage.IcicleGreen */ : 34 /* GameImage.Icicle */, 0, 0, 10, 16, ((xMibi + xMibiAdjustment) >> 10) - 5 * 3, (yMibi >> 10) - 8 * 3, isHoming && fallingFrameCounter !== null && fallingStartValue !== null && (fallingFrameCounter > fallingStartValue) ? (-90 * 128 - homingAngleScaled) : 0, 128 * 3);
            }
        };
        let notifyBossHealthPercentage = function (healthPercentage) {
            bossHealthPercentage = healthPercentage;
        };
        let notifyBossCrashIntoWall = function () {
            bossCrashedIntoWall = true;
        };
        let notifyBossJump1Finished = function () {
            bossJump1Finished = true;
        };
        let notifyBossJump2Finished = function () {
            bossJump2Finished = true;
        };
        let notifyBossJump3Finished = function () {
            bossJump3Finished = true;
        };
        return {
            getLevel3BossMinionEnemyId: function () { return enemyId; },
            notifyBossHealthPercentage,
            notifyBossJump1Finished,
            notifyBossJump2Finished,
            notifyBossJump3Finished,
            notifyBossCrashIntoWall,
            getSnapshot,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render,
            enemyId
        };
    };
    return {
        getEnemy: function ({ xMibi, bossEnemyId, enemyId }) {
            return getEnemy(xMibi, 600 * 1024, xMibi, 100, false, false, false, false, [], null, null, false, false, null, null, false, null, bossEnemyId, enemyId);
        }
    };
})());
let Enemy_Level3Boss_OrbiterSpike = ((function () {
    let getEnemy = function (xMibi, yMibi, bossHealthPercentage, angleScaled, isRotatingClockwise, attackCooldown, attackAngleScaled1, attackAngleScaled2, subMinionEnemyIds, bossEnemyId, bossCrashedIntoWall, screenWipeCountdown, enemyId) {
        let getSnapshot = function () {
            return getEnemy(xMibi, yMibi, bossHealthPercentage, angleScaled, isRotatingClockwise, attackCooldown, attackAngleScaled1, attackAngleScaled2, [...subMinionEnemyIds], bossEnemyId, bossCrashedIntoWall, screenWipeCountdown, enemyId);
        };
        let getAttackCooldown = function (difficulty, bossHealthPercentage) {
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    return Math.max(bossHealthPercentage + 10, 60);
                case 1 /* Difficulty.Normal */:
                    return Math.max(bossHealthPercentage + 10, 60);
                case 2 /* Difficulty.Hard */:
                    return Math.max(bossHealthPercentage, 50);
            }
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            if (isRotatingClockwise) {
                angleScaled -= 128;
                if (angleScaled < 0) {
                    angleScaled += 360 * 128;
                }
            }
            else {
                angleScaled += 128;
                if (angleScaled >= 360 * 128) {
                    angleScaled -= 360 * 128;
                }
            }
            let bossEnemyAsIEnemy = enemyMapping[bossEnemyId];
            let bossEnemy = bossEnemyAsIEnemy;
            xMibi = bossEnemy.getXMibi() + 120 * DTMath.cosineScaled(angleScaled);
            yMibi = bossEnemy.getYMibi() + 120 * DTMath.sineScaled(angleScaled);
            let enemies = [thisObj];
            if (bossEnemy.hasStartedBossFight() && screenWipeCountdown === null) {
                if (attackCooldown === null)
                    attackCooldown = rng.nextInt(getAttackCooldown(difficulty, bossHealthPercentage));
                if (attackAngleScaled1 === null)
                    attackAngleScaled1 = rng.nextInt(360 * 128);
                if (attackAngleScaled2 === null)
                    attackAngleScaled2 = rng.nextInt(360 * 128);
                attackCooldown--;
                attackAngleScaled1 += 256;
                if (attackAngleScaled1 >= 360 * 128)
                    attackAngleScaled1 -= 360 * 128;
                attackAngleScaled2 -= 256;
                if (attackAngleScaled2 < 0)
                    attackAngleScaled2 += 360 * 128;
                if (attackCooldown <= 0) {
                    attackCooldown = getAttackCooldown(difficulty, bossHealthPercentage);
                    let subMinionEnemy = Enemy_Level3Boss_OrbiterSpikeProjectile.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        speedInMibipixelsPerFrame: 2048,
                        angleScaled: attackAngleScaled1,
                        enemyId: nextEnemyId++
                    });
                    enemies.push(subMinionEnemy);
                    subMinionEnemyIds.push(subMinionEnemy.getLevel3BossSubMinionEnemyId());
                    subMinionEnemy = Enemy_Level3Boss_OrbiterSpikeProjectile.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        speedInMibipixelsPerFrame: 2048,
                        angleScaled: attackAngleScaled2,
                        enemyId: nextEnemyId++
                    });
                    enemies.push(subMinionEnemy);
                    subMinionEnemyIds.push(subMinionEnemy.getLevel3BossSubMinionEnemyId());
                }
            }
            if (bossCrashedIntoWall) {
                bossCrashedIntoWall = false;
                for (let subMinionEnemyId of subMinionEnemyIds) {
                    let subMinionEnemy = enemyMapping[subMinionEnemyId];
                    if (subMinionEnemy) {
                        let subMinionEnemyAsSubMinionEnemy = subMinionEnemy;
                        subMinionEnemyAsSubMinionEnemy.notifyBossCrashIntoWall();
                    }
                }
                subMinionEnemyIds = [];
            }
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, isInFrontOfForeground: true, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rng.getSeed()
                    };
                }
            }
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            if (xMibi === null || yMibi === null)
                return null;
            return [{
                    xMibi: xMibi - 1024 * 3 * 5,
                    yMibi: yMibi - 1024 * 3 * 5,
                    widthMibi: 1024 * 3 * 10,
                    heightMibi: 1024 * 3 * 10
                }];
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        let render = function (displayOutput) {
            if (xMibi === null || yMibi === null)
                return;
            displayOutput.drawImageRotatedClockwise(33 /* GameImage.Spikes */, 0, 0, 16, 16, (xMibi >> 10) - 3 * 8, (yMibi >> 10) - 3 * 8, 0, 128 * 3);
        };
        let notifyBossHealthPercentage = function (healthPercentage) {
            bossHealthPercentage = healthPercentage;
        };
        let notifyBossCrashIntoWall = function () {
            bossCrashedIntoWall = true;
        };
        return {
            getLevel3BossMinionEnemyId: function () { return enemyId; },
            notifyBossHealthPercentage,
            notifyBossJump1Finished: function () { },
            notifyBossJump2Finished: function () { },
            notifyBossJump3Finished: function () { },
            notifyBossCrashIntoWall,
            getSnapshot,
            isBullet: true,
            isInFrontOfForeground: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render,
            enemyId
        };
    };
    return {
        getEnemy: function ({ angleScaled, isRotatingClockwise, bossEnemyId, enemyId }) {
            angleScaled = DTMath.normalizeDegreesScaled(angleScaled);
            return getEnemy(null, null, 100, angleScaled, isRotatingClockwise, null, null, null, [], bossEnemyId, false, null, enemyId);
        }
    };
})());
let Enemy_Level3Boss_OrbiterSpikeProjectile = ((function () {
    let getEnemy = function (xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, hasBossCrashedIntoWall, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId) {
        let getSnapshot = function () {
            return getEnemy(xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, hasBossCrashedIntoWall, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId);
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            frameCounter++;
            if (tilemap.isSolid(xMibi, yMibi)) {
                let poof = Enemy_Background_Poof.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    scalingFactorScaled: 192,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [poof],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            if (hasBossCrashedIntoWall)
                ySpeedInMibipixelsPerFrame -= 20;
            xMibi += xSpeedInMibipixelsPerFrame;
            yMibi += ySpeedInMibipixelsPerFrame;
            displayAngleScaled = -90 * 128 - DTMath.arcTangentScaledSafe(xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame);
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        scalingFactorScaled: 3 * 128,
                        enemyId: nextEnemyId++
                    });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            return {
                enemies: [thisObj],
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 3 * 1024,
                    yMibi: yMibi - 3 * 3 * 1024,
                    widthMibi: 6 * 3 * 1024,
                    heightMibi: 6 * 3 * 1024
                }];
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        let render = function (displayOutput) {
            if (displayAngleScaled === null)
                return;
            let spriteNum = Math.floor(frameCounter / 8) % 4;
            displayOutput.drawImageRotatedClockwise(10 /* GameImage.TinyFlameBlue */, spriteNum <= 2 ? (spriteNum * 8) : 0, spriteNum <= 2 ? 0 : 8, 8, 8, (xMibi >> 10) - 4 * 3, (yMibi >> 10) - 4 * 3, displayAngleScaled, 3 * 128);
        };
        let notifyBossCrashIntoWall = function () {
            if (ySpeedInMibipixelsPerFrame > 0)
                ySpeedInMibipixelsPerFrame = ySpeedInMibipixelsPerFrame >> 2;
            hasBossCrashedIntoWall = true;
        };
        return {
            getLevel3BossSubMinionEnemyId: function () { return enemyId; },
            notifyBossCrashIntoWall,
            getSnapshot,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render,
            enemyId
        };
    };
    return {
        getEnemy: function ({ xMibi, yMibi, speedInMibipixelsPerFrame, angleScaled, enemyId }) {
            let xSpeedInMibipixelsPerFrame = (speedInMibipixelsPerFrame * DTMath.cosineScaled(angleScaled)) >> 10;
            let ySpeedInMibipixelsPerFrame = (speedInMibipixelsPerFrame * DTMath.sineScaled(angleScaled)) >> 10;
            return getEnemy(xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, false, null, 0, null, enemyId);
        }
    };
})());
let Enemy_Level3Boss_Snowball = ((function () {
    let getEnemy = function (xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, bossHealthPercentage, bossCrashedIntoWall, subMinionEnemyIds, hp, frameCounter, screenWipeCountdown, bossEnemyId, enemyId) {
        let getSnapshot = function () {
            return getEnemy(xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, bossHealthPercentage, bossCrashedIntoWall, [...subMinionEnemyIds], hp, frameCounter, screenWipeCountdown, bossEnemyId, enemyId);
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, difficulty, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            frameCounter++;
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            if (hp <= 0 || screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            let movementSpeed = 3500;
            if (isFacingRight) {
                let testX = xMibi + movementSpeed + 1024 * 7 * 3;
                let testY1 = yMibi + 1024 * 8 * 3;
                let testY2 = yMibi - 1024 * 5 * 3;
                if (tilemap.isSolid(testX, testY1) || tilemap.isSolid(testX, testY2)) {
                    isFacingRight = false;
                }
                else {
                    xMibi += movementSpeed;
                }
            }
            else {
                let testX = xMibi - movementSpeed - 1024 * 7 * 3;
                let testY1 = yMibi + 1024 * 8 * 3;
                let testY2 = yMibi - 1024 * 5 * 3;
                if (tilemap.isSolid(testX, testY1) || tilemap.isSolid(testX, testY2)) {
                    isFacingRight = true;
                }
                else {
                    xMibi -= movementSpeed;
                }
            }
            let shouldAttack = false;
            yMibi += ySpeedInMibipixelsPerFrame;
            while (true) {
                if (tilemap.isSolid(xMibi - 1024 * 7 * 3, yMibi - 1024 * 8 * 3) || tilemap.isSolid(xMibi + 1024 * 7 * 3, yMibi - 1024 * 8 * 3)) {
                    ySpeedInMibipixelsPerFrame = 8000;
                    yMibi += 1024;
                    shouldAttack = true;
                }
                else {
                    break;
                }
            }
            ySpeedInMibipixelsPerFrame -= 180;
            let enemies = [thisObj];
            if (shouldAttack && screenWipeCountdown === null && bossHealthPercentage !== null) {
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let numBullets;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        if (bossHealthPercentage >= 75)
                            numBullets = 7;
                        else if (bossHealthPercentage >= 50)
                            numBullets = 8;
                        else
                            numBullets = 9;
                        break;
                    case 1 /* Difficulty.Normal */:
                        if (bossHealthPercentage >= 75)
                            numBullets = 8;
                        else if (bossHealthPercentage >= 50)
                            numBullets = 9;
                        else
                            numBullets = 10;
                        break;
                    case 2 /* Difficulty.Hard */:
                        if (bossHealthPercentage >= 83)
                            numBullets = 12;
                        else if (bossHealthPercentage >= 67)
                            numBullets = 13;
                        else
                            numBullets = 14;
                        break;
                }
                let increment = Math.floor(360 * 128 / numBullets);
                let initialAngleScaled = rng.nextInt(increment);
                for (let i = 0; i < numBullets; i++) {
                    let subMinionEnemy = Enemy_Level3Boss_Iceball.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        speedInMibipixelsPerFrame: 3000,
                        angleScaled: initialAngleScaled + i * increment,
                        gameImage: 42 /* GameImage.Iceball */,
                        enemyId: nextEnemyId++
                    });
                    enemies.push(subMinionEnemy);
                    subMinionEnemyIds.push(subMinionEnemy.getLevel3BossSubMinionEnemyId());
                    if (difficulty === 2 /* Difficulty.Hard */ && bossHealthPercentage <= 50) {
                        subMinionEnemy = Enemy_Level3Boss_Iceball.getEnemy({
                            xMibi: xMibi,
                            yMibi: yMibi,
                            speedInMibipixelsPerFrame: 5000,
                            angleScaled: initialAngleScaled + i * increment,
                            gameImage: 42 /* GameImage.Iceball */,
                            enemyId: nextEnemyId++
                        });
                        enemies.push(subMinionEnemy);
                        subMinionEnemyIds.push(subMinionEnemy.getLevel3BossSubMinionEnemyId());
                    }
                }
            }
            if (bossCrashedIntoWall) {
                bossCrashedIntoWall = false;
                for (let subMinionEnemyId of subMinionEnemyIds) {
                    let subMinionEnemy = enemyMapping[subMinionEnemyId];
                    if (subMinionEnemy) {
                        let subMinionEnemyAsSubMinionEnemy = subMinionEnemy;
                        subMinionEnemyAsSubMinionEnemy.notifyBossCrashIntoWall();
                    }
                }
                subMinionEnemyIds = [];
            }
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 7 * 1024,
                    yMibi: yMibi - 3 * 7 * 1024,
                    widthMibi: 3 * 14 * 1024,
                    heightMibi: 3 * 14 * 1024
                }];
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 8 * 1024,
                    yMibi: yMibi - 3 * 8 * 1024,
                    widthMibi: 3 * 16 * 1024,
                    heightMibi: 3 * 16 * 1024
                }];
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 16) % 8;
            displayOutput.drawImageRotatedClockwise(isFacingRight ? 51 /* GameImage.BouncySnow */ : 52 /* GameImage.BouncySnow_Mirrored */, spriteNum * 16, 0, 16, 16, (xMibi >> 10) - 3 * 8, (yMibi >> 10) - 3 * 8, 0, 128 * 3);
        };
        let notifyBossHealthPercentage = function (healthPercentage) {
            if (bossHealthPercentage === null)
                bossHealthPercentage = healthPercentage;
        };
        let notifyBossCrashIntoWall = function () {
            bossCrashedIntoWall = true;
        };
        let onCollideWithPlayerBullet = function () {
            hp--;
            return true;
        };
        return {
            getLevel3BossMinionEnemyId: function () { return enemyId; },
            notifyBossHealthPercentage,
            notifyBossJump1Finished: function () { },
            notifyBossJump2Finished: function () { },
            notifyBossJump3Finished: function () { },
            notifyBossCrashIntoWall,
            getSnapshot,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet,
            onScreenWipe,
            render,
            enemyId
        };
    };
    return {
        getEnemy: function ({ xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, bossEnemyId, difficulty, enemyId }) {
            let hp;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    hp = 36;
                    break;
                case 1 /* Difficulty.Normal */:
                    hp = 46;
                    break;
                case 2 /* Difficulty.Hard */:
                    hp = 50;
                    break;
            }
            return getEnemy(xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, null, false, [], hp, 0, null, bossEnemyId, enemyId);
        }
    };
})());
let Enemy_Level3Checkpoint = ((function () {
    let getEnemy = function (xMibi, yMibi, hasCreatedSavestate, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            let x = xMibi >> 10;
            if (x < -250)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            let shouldCreateAutoSavestate = false;
            if (!hasCreatedSavestate
                && xMibi <= playerState.xMibi
                && playerState.xMibi <= xMibi + 1024 * 3 * 3 * 16
                && yMibi <= playerState.yMibi
                && playerState.yMibi <= yMibi + 1024 * 3 * 16
                && xMibi >= -1024 * 3 * 16) {
                hasCreatedSavestate = true;
                shouldCreateAutoSavestate = true;
            }
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed,
                shouldCreateAutoSavestate: shouldCreateAutoSavestate
            };
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, hasCreatedSavestate, enemyId);
        };
        return {
            getSnapshot,
            isBullet: false,
            isBackground: true,
            processFrame,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe: function (countdown) { },
            render: function (displayOutput) { },
            enemyId
        };
    };
    return {
        getEnemy: function ({ xMibi, yMibi, enemyId }) {
            return getEnemy(xMibi, yMibi, false, enemyId);
        }
    };
})());
let Enemy_OgJumpy = ((function () {
    let getEnemy = function (xMibi, yMibi, ySpeedInMibipixelsPerFrame, hp, animationFrameCounter, screenWipeCountdown, enemyId) {
        let arcTangentScaled = function (x, y) {
            if (x === 0 && y === 0)
                return 0;
            return DTMath.arcTangentScaled(x, y);
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 250 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 50) {
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            if (hp <= 0 || screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            yMibi += ySpeedInMibipixelsPerFrame;
            while (true) {
                if (tilemap.isSolid(xMibi - 1024 * 7 * 3, yMibi - 1024 * 8 * 3) || tilemap.isSolid(xMibi + 1024 * 7 * 3, yMibi - 1024 * 8 * 3)) {
                    ySpeedInMibipixelsPerFrame = 8000;
                    yMibi += 1024;
                    animationFrameCounter = 0;
                }
                else {
                    break;
                }
            }
            let oldYSpeed = ySpeedInMibipixelsPerFrame;
            ySpeedInMibipixelsPerFrame -= 180;
            let shouldAttack = oldYSpeed >= 1800 && ySpeedInMibipixelsPerFrame < 1800;
            let enemies = [thisObj];
            if (shouldAttack && screenWipeCountdown === null) {
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let attackAngleScaled = arcTangentScaled(playerState.xMibi - xMibi, playerState.yMibi - yMibi);
                let angleArray;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        angleArray = [-1, 1];
                        break;
                    case 1 /* Difficulty.Normal */:
                        angleArray = [-1, 0, 1];
                        break;
                    case 2 /* Difficulty.Hard */:
                        angleArray = [-2, -1, 0, 1, 2];
                        break;
                }
                for (let i of angleArray) {
                    enemies.push(Enemy_Bullet_Iceball.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        speed: 3000,
                        angleScaled: attackAngleScaled + i * (128 * 15),
                        xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                        hasCollisionWithTilemap: true,
                        gameImage: 42 /* GameImage.Iceball */,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            animationFrameCounter++;
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 7 * 1024,
                    yMibi: yMibi - 3 * 7 * 1024,
                    widthMibi: 3 * 14 * 1024,
                    heightMibi: 3 * 14 * 1024
                }];
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 8 * 1024,
                    yMibi: yMibi - 3 * 8 * 1024,
                    widthMibi: 3 * 16 * 1024,
                    heightMibi: 3 * 16 * 1024
                }];
        };
        let render = function (displayOutput) {
            let spriteNum;
            if (animationFrameCounter < 16)
                spriteNum = 2;
            else if (animationFrameCounter < 32)
                spriteNum = 1;
            else
                spriteNum = 0;
            displayOutput.drawImageRotatedClockwise(17 /* GameImage.OgJumpy_Mirrored */, spriteNum * 16, 0, 16, 25, (xMibi >> 10) - 3 * 8, (yMibi >> 10) - 3 * 12, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, ySpeedInMibipixelsPerFrame, hp, animationFrameCounter, screenWipeCountdown, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            hp--;
            return true;
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe,
            render
        };
    };
    return {
        getEnemy: function ({ xInitialMibi, yInitialMibi, difficulty, enemyId }) {
            let hp;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    hp = 42;
                    break;
                case 1 /* Difficulty.Normal */:
                    hp = 46;
                    break;
                case 2 /* Difficulty.Hard */:
                    hp = 50;
                    break;
            }
            let ySpeedInMibipixelsPerFrame = 0;
            return getEnemy(xInitialMibi, yInitialMibi, ySpeedInMibipixelsPerFrame, hp, 100, null, enemyId);
        }
    };
})());
let Enemy_Sawblade = ((function () {
    let getAttackCooldown = function (difficulty) {
        switch (difficulty) {
            case 0 /* Difficulty.Easy */: return 170;
            case 1 /* Difficulty.Normal */: return 125;
            case 2 /* Difficulty.Hard */: return 85;
        }
    };
    let getEnemy = function (xMibi, yMibi, speedInMibipixelsPerFrame, direction, movementLowerBound, movementUpperBound, attackCooldown, frameCounter, screenWipeCountdown, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let x = xMibi >> 10;
            if ((direction === 0 /* EnemySawbladeDirection.Down */ || direction === 1 /* EnemySawbladeDirection.Up */) && x < -50
                ||
                    (direction === 2 /* EnemySawbladeDirection.Left */ || direction === 3 /* EnemySawbladeDirection.Right */) && movementUpperBound < -50 * 1024) {
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            if (screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            if (direction === 2 /* EnemySawbladeDirection.Left */ || direction === 3 /* EnemySawbladeDirection.Right */) {
                movementLowerBound += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
                movementUpperBound += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            }
            switch (direction) {
                case 0 /* EnemySawbladeDirection.Down */:
                    yMibi -= speedInMibipixelsPerFrame;
                    if (yMibi <= movementLowerBound) {
                        yMibi = movementLowerBound;
                        direction = 1 /* EnemySawbladeDirection.Up */;
                    }
                    break;
                case 1 /* EnemySawbladeDirection.Up */:
                    yMibi += speedInMibipixelsPerFrame;
                    if (yMibi >= movementUpperBound) {
                        yMibi = movementUpperBound;
                        direction = 0 /* EnemySawbladeDirection.Down */;
                    }
                    break;
                case 2 /* EnemySawbladeDirection.Left */:
                    xMibi -= speedInMibipixelsPerFrame;
                    if (xMibi <= movementLowerBound) {
                        xMibi = movementLowerBound;
                        direction = 3 /* EnemySawbladeDirection.Right */;
                    }
                    break;
                case 3 /* EnemySawbladeDirection.Right */:
                    xMibi += speedInMibipixelsPerFrame;
                    if (xMibi >= movementUpperBound) {
                        xMibi = movementUpperBound;
                        direction = 2 /* EnemySawbladeDirection.Left */;
                    }
                    break;
            }
            let enemies = [thisObj];
            if (attackCooldown === null)
                attackCooldown = rng.nextInt(getAttackCooldown(difficulty));
            attackCooldown--;
            if (attackCooldown <= 0 && screenWipeCountdown === null) {
                attackCooldown = getAttackCooldown(difficulty);
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let numBullets;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        numBullets = 3;
                        break;
                    case 1 /* Difficulty.Normal */:
                        numBullets = 5;
                        break;
                    case 2 /* Difficulty.Hard */:
                        numBullets = 7;
                        break;
                }
                let increment = Math.floor(360 * 128 / numBullets);
                let angleScaled = rng.nextInt(increment);
                for (let i = 0; i < numBullets; i++) {
                    enemies.push(Enemy_Bullet_Coin.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        speedInMibipixelsPerFrame: 1024,
                        angleScaled: angleScaled,
                        enemyId: nextEnemyId++
                    }));
                    angleScaled += increment;
                }
            }
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            frameCounter++;
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 7 * 1024,
                    yMibi: yMibi - 3 * 7 * 1024,
                    widthMibi: 3 * 14 * 1024,
                    heightMibi: 3 * 14 * 1024
                }];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 4) % 4;
            displayOutput.drawImageRotatedClockwise(56 /* GameImage.Sawblade */, spriteNum * 16, 0, 16, 16, (xMibi >> 10) - 3 * 8, (yMibi >> 10) - 3 * 8, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, speedInMibipixelsPerFrame, direction, movementLowerBound, movementUpperBound, attackCooldown, frameCounter, screenWipeCountdown, enemyId);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return true; },
            onScreenWipe,
            render,
            enemyId
        };
    };
    return {
        getEnemy: function ({ xMibi, yMibi, speedInMibipixelsPerFrame, direction, movementLowerBound, movementUpperBound, difficulty, enemyId }) {
            return getEnemy(xMibi, yMibi, speedInMibipixelsPerFrame, direction, movementLowerBound, movementUpperBound, null, 0, null, enemyId);
        }
    };
})());
let Enemy_Smartcap = {};
((function () {
    let getAttackCooldown = function (difficulty) {
        switch (difficulty) {
            case 0 /* Difficulty.Easy */: return 260;
            case 1 /* Difficulty.Normal */: return 155;
            case 2 /* Difficulty.Hard */: return 100;
        }
    };
    let getEnemy = function (xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 250 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 50)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            if (hp <= 0 || screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            let movementSpeed = 1000;
            if (isFacingRight) {
                let testX = xMibi + movementSpeed + 1024 * 8 * 3;
                let testY1 = yMibi + 1024 * 8 * 3;
                let testY2 = yMibi - 1024 * 5 * 3;
                if (tilemap.isSolid(testX, testY1) || tilemap.isSolid(testX, testY2)) {
                    isFacingRight = false;
                }
                else {
                    xMibi += movementSpeed;
                }
            }
            else {
                let testX = xMibi - movementSpeed - 1024 * 8 * 3;
                let testY1 = yMibi + 1024 * 8 * 3;
                let testY2 = yMibi - 1024 * 5 * 3;
                if (tilemap.isSolid(testX, testY1) || tilemap.isSolid(testX, testY2)) {
                    isFacingRight = true;
                }
                else {
                    xMibi -= movementSpeed;
                }
            }
            yMibi += ySpeedInMibipixelsPerFrame;
            while (true) {
                if (tilemap.isSolid(xMibi - 1024 * 7 * 3, yMibi - 1024 * 8 * 3) || tilemap.isSolid(xMibi + 1024 * 7 * 3, yMibi - 1024 * 8 * 3)) {
                    ySpeedInMibipixelsPerFrame = 0;
                    yMibi += 1024;
                }
                else {
                    break;
                }
            }
            ySpeedInMibipixelsPerFrame -= 180;
            let enemies = [thisObj];
            attackCooldown--;
            if (attackCooldown <= 0 && screenWipeCountdown === null) {
                attackCooldown = getAttackCooldown(difficulty);
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let increment;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        increment = 120 * 128;
                        break;
                    case 1 /* Difficulty.Normal */:
                        increment = 60 * 128;
                        break;
                    case 2 /* Difficulty.Hard */:
                        increment = 45 * 128;
                        break;
                }
                for (let i = rng.nextInt(increment); i < 360 * 128; i += increment) {
                    enemies.push(Enemy_Bullet_Noone.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        directionScaled: i,
                        xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                        rotatesClockwise: rng.nextBool(),
                        displayAngleScaled: rng.nextInt(360 * 128),
                        gameImage: 19 /* GameImage.Noone */,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            frameCounter++;
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 7 * 1024,
                    yMibi: yMibi - 3 * 7 * 1024,
                    widthMibi: 3 * 14 * 1024,
                    heightMibi: 3 * 14 * 1024
                }];
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 8 * 1024,
                    yMibi: yMibi - 3 * 8 * 1024,
                    widthMibi: 3 * 16 * 1024,
                    heightMibi: 3 * 16 * 1024
                }];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 16) % 4;
            displayOutput.drawImageRotatedClockwise(isFacingRight ? 12 /* GameImage.Smartcap */ : 13 /* GameImage.Smartcap_Mirrored */, spriteNum * 16, 0, 16, 18, (xMibi >> 10) - 3 * 8, (yMibi >> 10) - 3 * 9, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            hp--;
            return true;
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe,
            render
        };
    };
    Enemy_Smartcap.getEnemy = function ({ xInitialMibi, yInitialMibi, isFacingRight, difficulty, enemyId }) {
        let hp;
        switch (difficulty) {
            case 0 /* Difficulty.Easy */:
                hp = 42;
                break;
            case 1 /* Difficulty.Normal */:
                hp = 46;
                break;
            case 2 /* Difficulty.Hard */:
                hp = 50;
                break;
        }
        let ySpeedInMibipixelsPerFrame = 0;
        let attackCooldown = getAttackCooldown(difficulty);
        return getEnemy(xInitialMibi, yInitialMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, attackCooldown, 0, null, enemyId);
    };
})());
let Enemy_Snowball = {};
((function () {
    let getEnemy = function (xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, frameCounter, screenWipeCountdown, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 250 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 250) {
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            if (hp <= 0 || screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            let movementSpeed = 1000;
            if (isFacingRight) {
                let testX = xMibi + movementSpeed + 1024 * 7 * 3;
                let testY1 = yMibi + 1024 * 8 * 3;
                let testY2 = yMibi - 1024 * 5 * 3;
                if (tilemap.isSolid(testX, testY1) || tilemap.isSolid(testX, testY2)) {
                    isFacingRight = false;
                }
                else {
                    xMibi += movementSpeed;
                }
            }
            else {
                let testX = xMibi - movementSpeed - 1024 * 7 * 3;
                let testY1 = yMibi + 1024 * 8 * 3;
                let testY2 = yMibi - 1024 * 5 * 3;
                if (tilemap.isSolid(testX, testY1) || tilemap.isSolid(testX, testY2)) {
                    isFacingRight = true;
                }
                else {
                    xMibi -= movementSpeed;
                }
            }
            let shouldAttack = false;
            yMibi += ySpeedInMibipixelsPerFrame;
            while (true) {
                if (tilemap.isSolid(xMibi - 1024 * 7 * 3, yMibi - 1024 * 8 * 3) || tilemap.isSolid(xMibi + 1024 * 7 * 3, yMibi - 1024 * 8 * 3)) {
                    ySpeedInMibipixelsPerFrame = 8000;
                    yMibi += 1024;
                    shouldAttack = true;
                }
                else {
                    break;
                }
            }
            while (true) {
                if (tilemap.isSolid(xMibi - 1024 * 7 * 3, yMibi + 1024 * 8 * 3) || tilemap.isSolid(xMibi + 1024 * 7 * 3, yMibi + 1024 * 8 * 3)) {
                    ySpeedInMibipixelsPerFrame = 0;
                    yMibi -= 1024;
                }
                else {
                    break;
                }
            }
            if (!tilemap.isSolid(xMibi - 1024 * 7 * 3, yMibi - 1024 * 8 * 3) && !tilemap.isSolid(xMibi + 1024 * 7 * 3, yMibi - 1024 * 8 * 3)) {
                ySpeedInMibipixelsPerFrame -= 180;
            }
            let enemies = [thisObj];
            if (shouldAttack && screenWipeCountdown === null) {
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let increment;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        increment = 120 * 128;
                        break;
                    case 1 /* Difficulty.Normal */:
                        increment = 60 * 128;
                        break;
                    case 2 /* Difficulty.Hard */:
                        increment = 15 * 128;
                        break;
                }
                for (let i = rng.nextInt(increment); i < 360 * 128; i += increment) {
                    enemies.push(Enemy_Bullet_Iceball.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        speed: 3000,
                        angleScaled: i,
                        xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                        hasCollisionWithTilemap: true,
                        gameImage: 42 /* GameImage.Iceball */,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            frameCounter++;
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 7 * 1024,
                    yMibi: yMibi - 3 * 7 * 1024,
                    widthMibi: 3 * 14 * 1024,
                    heightMibi: 3 * 14 * 1024
                }];
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 8 * 1024,
                    yMibi: yMibi - 3 * 8 * 1024,
                    widthMibi: 3 * 16 * 1024,
                    heightMibi: 3 * 16 * 1024
                }];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 16) % 8;
            displayOutput.drawImageRotatedClockwise(isFacingRight ? 51 /* GameImage.BouncySnow */ : 52 /* GameImage.BouncySnow_Mirrored */, spriteNum * 16, 0, 16, 16, (xMibi >> 10) - 3 * 8, (yMibi >> 10) - 3 * 8, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, frameCounter, screenWipeCountdown, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            hp--;
            return true;
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe,
            render
        };
    };
    Enemy_Snowball.getEnemy = function ({ xInitialMibi, yInitialMibi, isFacingRight, difficulty, enemyId }) {
        let hp;
        switch (difficulty) {
            case 0 /* Difficulty.Easy */:
                hp = 36;
                break;
            case 1 /* Difficulty.Normal */:
                hp = 46;
                break;
            case 2 /* Difficulty.Hard */:
                hp = 50;
                break;
        }
        let ySpeedInMibipixelsPerFrame = 0;
        return getEnemy(xInitialMibi, yInitialMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, 0, null, enemyId);
    };
})());
let Enemy_Snowfly = ((function () {
    let getAttackCooldown = function (difficulty) {
        switch (difficulty) {
            case 0 /* Difficulty.Easy */: return 70;
            case 1 /* Difficulty.Normal */: return 48;
            case 2 /* Difficulty.Hard */: return 20;
        }
    };
    let getEnemy = function (xMibi, yMibi, yInitialMibi, yAngleScaled, hp, attackCooldown, attackAngle1, attackAngle2, frameCounter, screenWipeCountdown, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 250 || y < -250 || y > GlobalConstants.WINDOW_HEIGHT + 250)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            if (hp <= 0 || screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            yAngleScaled += 48;
            if (yAngleScaled >= 360 * 128)
                yAngleScaled -= 360 * 128;
            yMibi = yInitialMibi + 90 * DTMath.sineScaled(yAngleScaled);
            let enemies = [thisObj];
            if (attackCooldown === null)
                attackCooldown = rng.nextInt(getAttackCooldown(difficulty));
            attackCooldown--;
            if (attackCooldown <= 0 && screenWipeCountdown === null) {
                attackCooldown = getAttackCooldown(difficulty);
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let increment;
                let numBullets;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        increment = 700;
                        numBullets = 3;
                        break;
                    case 1 /* Difficulty.Normal */:
                        increment = 600;
                        numBullets = 3;
                        break;
                    case 2 /* Difficulty.Hard */:
                        increment = 1500;
                        numBullets = 3;
                        break;
                }
                attackAngle1 += increment;
                if (attackAngle1 >= 360 * 128)
                    attackAngle1 -= 360 * 128;
                let delta = Math.floor(360 * 128 / numBullets);
                for (let i = 0; i < numBullets; i++) {
                    enemies.push(Enemy_Bullet_Strawberry.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        angleScaled: attackAngle1 + delta * i,
                        xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                        hasCollisionWithTilemap: true,
                        enemyId: nextEnemyId++
                    }));
                }
                attackAngle2 -= increment;
                if (attackAngle2 < 0)
                    attackAngle2 += 360 * 128;
                for (let i = 0; i < numBullets; i++) {
                    enemies.push(Enemy_Bullet_Strawberry.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        angleScaled: attackAngle2 + delta * i,
                        xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                        hasCollisionWithTilemap: true,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            frameCounter++;
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 7 * 1024,
                    yMibi: yMibi - 3 * 7 * 1024,
                    widthMibi: 3 * 14 * 1024,
                    heightMibi: 3 * 14 * 1024
                }];
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 7 * 1024,
                    yMibi: yMibi - 3 * 8 * 1024,
                    widthMibi: 3 * 14 * 1024,
                    heightMibi: 3 * 16 * 1024
                }];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 4;
            displayOutput.drawImageRotatedClockwise(15 /* GameImage.Snowfly_Mirrored */, spriteNum * 15, 0, 15, 18, (xMibi >> 10) - 3 * 7, (yMibi >> 10) - 3 * 9, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, yInitialMibi, yAngleScaled, hp, attackCooldown, attackAngle1, attackAngle2, frameCounter, screenWipeCountdown, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            hp--;
            return true;
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe,
            render
        };
    };
    return {
        getEnemy: function ({ xMibi, yInitialMibi, yAngleScaled, attackAngle1, attackAngle2, difficulty, enemyId }) {
            yAngleScaled = DTMath.normalizeDegreesScaled(yAngleScaled);
            attackAngle1 = DTMath.normalizeDegreesScaled(attackAngle1);
            attackAngle2 = DTMath.normalizeDegreesScaled(attackAngle2);
            let hp;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    hp = 42;
                    break;
                case 1 /* Difficulty.Normal */:
                    hp = 46;
                    break;
                case 2 /* Difficulty.Hard */:
                    hp = 50;
                    break;
            }
            let yMibi = yInitialMibi + 90 * DTMath.sineScaled(yAngleScaled);
            return getEnemy(xMibi, yMibi, yInitialMibi, yAngleScaled, hp, null, attackAngle1, attackAngle2, 0, null, enemyId);
        }
    };
})());
let FadeInFrame = ((function () {
    let getFrame = function ({ alpha, underlyingFrame }) {
        let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
            underlyingFrame = underlyingFrame.getNextFrame({
                keyboardInput,
                mouseInput,
                previousKeyboardInput,
                previousMouseInput,
                displayProcessing,
                soundOutput,
                musicOutput,
                thisFrame: underlyingFrame
            });
            alpha -= 3;
            if (alpha <= 0)
                return underlyingFrame;
            return thisFrame;
        };
        let render = function (displayOutput) {
            underlyingFrame.render(displayOutput);
            displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: alpha }, true);
        };
        return {
            getNextFrame,
            render,
            getClickUrl: function () { return underlyingFrame.getClickUrl(); },
            getCompletedAchievements: function () { return underlyingFrame.getCompletedAchievements(); }
        };
    };
    return {
        getFrame
    };
})());
let FrameInputUtil = {
    getFrameInput: function (keyboardInput, previousKeyboardInput, debugMode) {
        let debug_toggleInvulnerability = false;
        if (debugMode) {
            if (keyboardInput.isPressed(8 /* Key.I */) && !previousKeyboardInput.isPressed(8 /* Key.I */))
                debug_toggleInvulnerability = true;
        }
        return {
            up: keyboardInput.isPressed(36 /* Key.UpArrow */) && !keyboardInput.isPressed(37 /* Key.DownArrow */),
            down: keyboardInput.isPressed(37 /* Key.DownArrow */) && !keyboardInput.isPressed(36 /* Key.UpArrow */),
            left: keyboardInput.isPressed(38 /* Key.LeftArrow */) && !keyboardInput.isPressed(39 /* Key.RightArrow */),
            right: keyboardInput.isPressed(39 /* Key.RightArrow */) && !keyboardInput.isPressed(38 /* Key.LeftArrow */),
            shoot: keyboardInput.isPressed(25 /* Key.Z */),
            continueDialogue: keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */),
            debug_toggleInvulnerability: debug_toggleInvulnerability
        };
    },
    getEmptyFrameInput: function () {
        return {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,
            continueDialogue: false,
            debug_toggleInvulnerability: false
        };
    }
};
let GameEntryFrame = {
    getFirstFrame: function (buildType, debugMode) {
        let versionInfo = VersionInfo.getCurrentVersion();
        if (versionInfo.version === "1.03")
            SavedDataMigration_ToV1_03.migrateAllDataFromOlderVersionsToV1_03IfNeeded();
        else
            throw new Error("Unrecognized version");
        let globalState = {
            buildType: buildType,
            allowSavingReplays: buildType !== 2 /* BuildType.Electron */,
            debugMode: debugMode,
            saveAndLoadData: SaveAndLoadDataUtil.getSaveAndLoadData()
        };
        return InitialLoadingScreenFrame.getFrame(globalState);
    }
};
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
    let debug_renderDamageboxes = false;
    let debug_renderHitboxes = false;
    let previousFrameInput = FrameInputUtil.getEmptyFrameInput();
    let suggestedFrameInput = FrameInputUtil.getEmptyFrameInput();
    let endLevelCounter = null;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return PauseMenuFrame.getFrame(globalState, sessionState, thisFrame, gameState.level, gameState.difficulty);
        if (endLevelCounter !== null)
            endLevelCounter++;
        let frame = getNextFrameHelper({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame });
        if (!keyboardInput.isPressed(43 /* Key.Shift */))
            frame = getNextFrameHelper({ keyboardInput, mouseInput, previousKeyboardInput: keyboardInput, previousMouseInput: mouseInput, displayProcessing, soundOutput, musicOutput, thisFrame });
        if (globalState.debugMode) {
            if (keyboardInput.isPressed(26 /* Key.Zero */) && !previousKeyboardInput.isPressed(26 /* Key.Zero */) && endLevelCounter === null)
                endLevelCounter = 0;
            if (keyboardInput.isPressed(3 /* Key.D */) && !previousKeyboardInput.isPressed(3 /* Key.D */))
                debug_renderDamageboxes = !debug_renderDamageboxes;
            if (keyboardInput.isPressed(7 /* Key.H */) && !previousKeyboardInput.isPressed(7 /* Key.H */))
                debug_renderHitboxes = !debug_renderHitboxes;
        }
        if (endLevelCounter === GameFrame.END_LEVEL_NUM_FRAMES_TO_WAIT) {
            if (!sessionState.completedLevels.includes(gameState.level))
                sessionState.completedLevels.push(gameState.level);
            if (globalState.allowSavingReplays) {
                let replay = ReplayUtil.generateReplayFromFrameInputHistory({
                    frameInputHistory: frameInputHistory,
                    level: gameState.level,
                    difficulty: gameState.difficulty,
                    replayId: sessionState.replayCollection.nextReplayId++
                });
                sessionState.replayCollection.replays = sessionState.replayCollection.replays.filter(x => x.level !== replay.level || x.difficulty !== replay.difficulty);
                sessionState.replayCollection.replays.push(replay);
            }
            globalState.saveAndLoadData.saveSessionState(sessionState);
            let finalLevel = LevelUtil.getFinalLevel();
            if (gameState.level === finalLevel)
                return VictoryScreenFrame.getFrame(globalState, sessionState, thisFrame);
            else
                return LevelCompleteFrame.getFrame(globalState, sessionState, thisFrame, gameState.level, gameState.difficulty, frameInputHistory);
        }
        if (globalState.debugMode && keyboardInput.isPressed(27 /* Key.One */)) {
            let emptyKeyboard = EmptyKeyboard.getEmptyKeyboard();
            let emptyMouse = EmptyMouse.getEmptyMouse();
            for (let i = 0; i < 20; i++)
                frame = getNextFrameHelper({ keyboardInput: emptyKeyboard, mouseInput: emptyMouse, previousKeyboardInput: emptyKeyboard, previousMouseInput: emptyMouse, displayProcessing, soundOutput, musicOutput, thisFrame });
        }
        return frame;
    };
    let getNextFrameHelper = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        renderKonqiHitbox = keyboardInput.isPressed(43 /* Key.Shift */);
        if (keyboardInput.isPressed(23 /* Key.X */) && endLevelCounter === null) {
            if (savedGameState !== null) {
                gameState = GameStateUtil.getSnapshot(savedGameState.gameStateSnapshot);
                frameInputHistory = savedGameState.frameInputHistory;
                previousFrameInput = FrameInputUtil.getEmptyFrameInput();
                suggestedFrameInput = FrameInputUtil.getEmptyFrameInput();
                return thisFrame;
            }
        }
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
            if (suggestedFrameInput.debug_toggleInvulnerability)
                frameInput.debug_toggleInvulnerability = true;
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
        if (keyboardInput.isPressed(2 /* Key.C */) && gameState.playerState.isDeadFrameCount === null)
            savedGameState = { gameStateSnapshot: GameStateUtil.getSnapshot(gameState), frameInputHistory: frameInputHistory };
        return thisFrame;
    };
    let render = function (displayOutput) {
        GameStateRendering.render(gameState, displayOutput, renderKonqiHitbox, debug_renderDamageboxes, debug_renderHitboxes);
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
let GameStateUtil = {
    getSnapshot: function (gameState) {
        let playerState = gameState.playerState;
        let playerStateSnapshot = {
            xMibi: playerState.xMibi,
            yMibi: playerState.yMibi,
            attackCooldown: playerState.attackCooldown,
            attackSoundCooldown: playerState.attackSoundCooldown,
            isDeadFrameCount: playerState.isDeadFrameCount
        };
        let playerBulletStateSnapshot = {
            playerBullets: gameState.playerBulletState.playerBullets.map(x => ({
                xMibi: x.xMibi,
                yMibi: x.yMibi,
                xSpeedInMibipixelsPerFrame: x.xSpeedInMibipixelsPerFrame,
                ySpeedInMibipixelsPerFrame: x.ySpeedInMibipixelsPerFrame,
                displayRotationScaled: x.displayRotationScaled,
                animationOffset: x.animationOffset
            }))
        };
        let enemiesSnapshot = gameState.enemies.map(x => x.getSnapshot(x));
        return {
            playerState: playerStateSnapshot,
            playerBulletState: playerBulletStateSnapshot,
            enemies: enemiesSnapshot,
            nextEnemyId: gameState.nextEnemyId,
            tilemap: gameState.tilemap.getSnapshot(gameState.tilemap),
            frameCount: gameState.frameCount,
            rngSeed: gameState.rngSeed,
            level: gameState.level,
            difficulty: gameState.difficulty,
            cutscene: gameState.cutscene !== null ? gameState.cutscene.getSnapshot(gameState.cutscene) : null,
            bossHealthDisplay: gameState.bossHealthDisplay.getSnapshot(gameState.bossHealthDisplay),
            background: gameState.background.getSnapshot(gameState.background),
            screenShakeFrameCounter: gameState.screenShakeFrameCounter,
            debug_isInvulnerable: gameState.debug_isInvulnerable
        };
    },
    getInitialGameState: function (level, difficulty, displayProcessing) {
        let enemy;
        let background;
        let nextEnemyId = 1;
        let tilemap;
        switch (level) {
            case 0 /* Level.Level1 */:
                enemy = Enemy_Level1.getEnemy({ enemyId: nextEnemyId++ });
                background = Background_Ocean.getBackground();
                tilemap = TilemapUtil.getTilemap(MapData.Level1, TilemapLevelInfo_Level1.getLevel1TilemapLevelInfo(), displayProcessing);
                break;
            case 1 /* Level.Level2 */:
                enemy = Enemy_Level2.getEnemy({ enemyId: nextEnemyId++ });
                background = Background_Ocean.getBackground();
                tilemap = TilemapUtil.getTilemap(MapData.Level2, TilemapLevelInfo_Level2.getLevel2TilemapLevelInfo(), displayProcessing);
                break;
            case 2 /* Level.Level3 */:
                enemy = Enemy_Level3.getEnemy({ enemyId: nextEnemyId++ });
                background = Background_Level3.getBackground();
                tilemap = TilemapUtil.getTilemap(MapData.Level3, TilemapLevelInfo_Level3.getLevel3TilemapLevelInfo(), displayProcessing);
                break;
        }
        return {
            playerState: {
                xMibi: 50 * 1024,
                yMibi: Math.floor(GlobalConstants.WINDOW_HEIGHT / 2) * 1024,
                attackCooldown: 0,
                attackSoundCooldown: 0,
                isDeadFrameCount: null
            },
            playerBulletState: {
                playerBullets: []
            },
            enemies: [enemy],
            nextEnemyId: nextEnemyId,
            tilemap: tilemap,
            frameCount: 0,
            rngSeed: 0,
            level: level,
            difficulty: difficulty,
            cutscene: null,
            bossHealthDisplay: BossHealthDisplayUtil.getDisplay(),
            background: background,
            screenShakeFrameCounter: null,
            debug_isInvulnerable: false
        };
    }
};
let GameStateProcessing = {
    SCREEN_WIPE_MAX_COUNTDOWN: 60,
    SCREEN_SHAKE_DURATION: 60,
    processFrame: function (gameState, frameInput, soundOutput, musicOutput) {
        // The tilemap should be processed before the player or enemies.
        // (Otherwise, the player or enemy may end up being stuck inside solids
        // if the player/enemy is adjacent to a solid and the tilemap moves.)
        gameState.tilemap.processFrame();
        let enemyMapping = {};
        for (let enemy of gameState.enemies)
            enemyMapping[enemy.enemyId] = enemy;
        let shouldCreateAutoSavestate = false;
        if (gameState.cutscene !== null) {
            let cutsceneResult = gameState.cutscene.processFrame({ gameState, enemyMapping, frameInput, musicOutput });
            frameInput = cutsceneResult.updatedFrameInput;
            if (cutsceneResult.shouldCreateAutoSavestate)
                shouldCreateAutoSavestate = true;
        }
        if (frameInput.debug_toggleInvulnerability)
            gameState.debug_isInvulnerable = !gameState.debug_isInvulnerable;
        PlayerStateProcessing.processFrame(gameState, frameInput, soundOutput);
        PlayerBulletStateProcessing.processFrame(gameState);
        let enemyProcessingResult = EnemyProcessing.processFrame(gameState, enemyMapping, frameInput, soundOutput, musicOutput);
        let shouldScreenWipe = enemyProcessingResult.shouldScreenWipe;
        if (enemyProcessingResult.shouldCreateAutoSavestate)
            shouldCreateAutoSavestate = true;
        let shouldEndLevel = enemyProcessingResult.shouldEndLevel;
        if (enemyProcessingResult.cutscene !== null)
            gameState.cutscene = enemyProcessingResult.cutscene;
        gameState.bossHealthDisplay.setHealthPercentage(enemyProcessingResult.bossHealthDisplayValue);
        enemyMapping = enemyProcessingResult.enemyMapping;
        gameState.bossHealthDisplay.processFrame();
        EnemyCollision.processCollisionBetweenPlayerAndEnemies(gameState);
        EnemyCollision.processCollisionBetweenPlayerBulletsAndEnemies(gameState);
        if (shouldScreenWipe) {
            let rng = DTDeterministicRandomUtil.getRandom(gameState.rngSeed);
            for (let enemy of gameState.enemies) {
                let screenWipeCountdown = rng.nextInt(GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN);
                enemy.onScreenWipe(screenWipeCountdown);
            }
            gameState.rngSeed = rng.getSeed();
        }
        let rng = DTDeterministicRandomUtil.getRandom(gameState.rngSeed);
        if (frameInput.up) {
            rng.addSeed(gameState.frameCount);
            rng.nextInt(2);
        }
        if (frameInput.down) {
            rng.addSeed(gameState.frameCount + 1);
            rng.nextInt(2);
            rng.nextInt(2);
        }
        if (frameInput.left) {
            rng.addSeed(gameState.frameCount + 2);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
        }
        if (frameInput.right) {
            rng.addSeed(gameState.frameCount + 3);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
        }
        if (frameInput.shoot) {
            rng.addSeed(gameState.frameCount + 4);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
        }
        gameState.rngSeed = rng.getSeed();
        gameState.background.processFrame();
        if (gameState.screenShakeFrameCounter !== null) {
            gameState.screenShakeFrameCounter++;
            if (gameState.screenShakeFrameCounter >= GameStateProcessing.SCREEN_SHAKE_DURATION)
                gameState.screenShakeFrameCounter = null;
        }
        gameState.frameCount++;
        return {
            shouldCreateAutoSavestate: shouldCreateAutoSavestate && gameState.playerState.isDeadFrameCount === null,
            shouldEndLevel: shouldEndLevel && gameState.playerState.isDeadFrameCount === null
        };
    }
};
let GameStateRendering = {
    render: function (gameState, displayOutput, renderKonqiHitbox, debug_renderDamageboxes, debug_renderHitboxes) {
        let screenShakeDisplayOutput;
        if (gameState.screenShakeFrameCounter !== null) {
            let xOffset = Math.floor(DTMath.sineScaled(gameState.screenShakeFrameCounter * 128 * 15) * (GameStateProcessing.SCREEN_SHAKE_DURATION - gameState.screenShakeFrameCounter) / (50 * GameStateProcessing.SCREEN_SHAKE_DURATION));
            screenShakeDisplayOutput = TranslatedDisplayOutput.getTranslatedDisplayOutput(displayOutput, xOffset, 0);
        }
        else {
            screenShakeDisplayOutput = displayOutput;
        }
        gameState.background.render(screenShakeDisplayOutput);
        gameState.tilemap.renderMidgroundAndBackground(screenShakeDisplayOutput);
        let backgroundEnemies = [];
        let normalEnemies = [];
        let bulletEnemies = [];
        let inFrontOfForegroundEnemies = [];
        for (let enemy of gameState.enemies) {
            if (enemy.isInFrontOfForeground === true)
                inFrontOfForegroundEnemies.push(enemy);
            else if (enemy.isBullet)
                bulletEnemies.push(enemy);
            else if (enemy.isBackground)
                backgroundEnemies.push(enemy);
            else
                normalEnemies.push(enemy);
        }
        for (let enemy of backgroundEnemies) {
            enemy.render(screenShakeDisplayOutput);
        }
        if (gameState.playerState.isDeadFrameCount === null) {
            let konqiSpriteNum = Math.floor(gameState.frameCount / 24) % 6;
            screenShakeDisplayOutput.drawImageRotatedClockwise(gameState.debug_isInvulnerable ? 31 /* GameImage.DarkKonqi */ : 8 /* GameImage.KonqiAir */, 32 * konqiSpriteNum, 128, 32, 32, (gameState.playerState.xMibi >> 10) - 56, (gameState.playerState.yMibi >> 10) - 48, 0, 128 * 3);
            if (renderKonqiHitbox)
                screenShakeDisplayOutput.drawRectangle((gameState.playerState.xMibi >> 10) - 2, (gameState.playerState.yMibi >> 10) - 2, 5, 5, white, true);
        }
        else {
            let konqiSpriteNum = Math.floor(gameState.frameCount / 24) % 2;
            let yPositionOffset = 15000 * gameState.playerState.isDeadFrameCount - 250 * gameState.playerState.isDeadFrameCount * gameState.playerState.isDeadFrameCount;
            screenShakeDisplayOutput.drawImageRotatedClockwise(8 /* GameImage.KonqiAir */, 128 + 32 * konqiSpriteNum, 32, 32, 32, (gameState.playerState.xMibi >> 10) - 56, ((gameState.playerState.yMibi + yPositionOffset) >> 10) - 48, 0, 128 * 3);
        }
        for (let playerBullet of gameState.playerBulletState.playerBullets) {
            let bulletSpriteNum = Math.floor((gameState.frameCount + playerBullet.animationOffset) / 8) % 6;
            let imageX = (bulletSpriteNum % 3) * 8;
            let imageY = bulletSpriteNum <= 2 ? 0 : 8;
            screenShakeDisplayOutput.drawImageRotatedClockwise(9 /* GameImage.TinyFlame */, imageX, imageY, 8, 8, (playerBullet.xMibi >> 10) - 3 * 4, (playerBullet.yMibi >> 10) - 3 * 4, playerBullet.displayRotationScaled, 128 * 3);
        }
        for (let enemy of normalEnemies) {
            enemy.render(screenShakeDisplayOutput);
        }
        for (let enemy of bulletEnemies) {
            enemy.render(screenShakeDisplayOutput);
        }
        if (debug_renderDamageboxes) {
            for (let enemy of gameState.enemies) {
                let damageboxes = enemy.getDamageboxes();
                if (damageboxes !== null) {
                    for (let damagebox of damageboxes) {
                        screenShakeDisplayOutput.drawRectangle(damagebox.xMibi >> 10, damagebox.yMibi >> 10, damagebox.widthMibi >> 10, damagebox.heightMibi >> 10, { r: 255, g: 0, b: 0, alpha: 200 }, true);
                    }
                }
            }
        }
        if (debug_renderHitboxes) {
            for (let enemy of gameState.enemies) {
                let hitboxes = enemy.getHitboxes();
                if (hitboxes !== null) {
                    for (let hitbox of hitboxes) {
                        screenShakeDisplayOutput.drawRectangle(hitbox.xMibi >> 10, hitbox.yMibi >> 10, hitbox.widthMibi >> 10, hitbox.heightMibi >> 10, { r: 255, g: 0, b: 0, alpha: 200 }, true);
                    }
                }
            }
        }
        gameState.tilemap.renderForeground(screenShakeDisplayOutput);
        for (let enemy of inFrontOfForegroundEnemies) {
            enemy.render(screenShakeDisplayOutput);
        }
        gameState.bossHealthDisplay.render(displayOutput);
        if (gameState.cutscene !== null)
            gameState.cutscene.render(screenShakeDisplayOutput);
    }
};
let GlobalConstants = {
    FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME: 1,
    FILE_ID_FOR_SESSION_STATE_WITHOUT_REPLAY_COLLECTION: 2,
    FILE_ID_FOR_REPLAY_COLLECTION: 3,
    WINDOW_WIDTH: 1000,
    WINDOW_HEIGHT: 700,
    STANDARD_BACKGROUND_COLOR: { r: 225, g: 225, b: 225, alpha: 255 }
};
let InitialLoadingScreenFrame = {};
InitialLoadingScreenFrame.getFrame = function (globalState) {
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        let isDoneLoadingDisplayProcessing = displayProcessing.load();
        let isDoneLoadingSounds = soundOutput.loadSounds();
        let isDoneLoadingMusic = musicOutput.loadMusic();
        if (!isDoneLoadingDisplayProcessing || !isDoneLoadingSounds || !isDoneLoadingMusic)
            return thisFrame;
        let soundVolume = globalState.saveAndLoadData.loadSoundVolume();
        let musicVolume = globalState.saveAndLoadData.loadMusicVolume();
        soundOutput.setSoundVolume(soundVolume !== null ? soundVolume : 50);
        musicOutput.setMusicVolume(musicVolume !== null ? musicVolume : 50);
        let sessionState = SessionStateUtil.generateInitialSessionState();
        globalState.saveAndLoadData.loadSessionState(sessionState);
        return TitleScreenFrame.getFrame(globalState, sessionState);
    };
    let render = function (displayOutput) {
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, GlobalConstants.STANDARD_BACKGROUND_COLOR, true);
        displayOutput.tryDrawText(Math.floor(GlobalConstants.WINDOW_WIDTH / 2) - 80, Math.floor(GlobalConstants.WINDOW_HEIGHT / 2) + 33, "Loading...", 0 /* GameFont.SimpleFont */, 32, black);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
let LevelUtil = {
    getLevelIdFromLevel: function (level) {
        switch (level) {
            case 0 /* Level.Level1 */: return 1;
            case 1 /* Level.Level2 */: return 2;
            case 2 /* Level.Level3 */: return 3;
        }
    },
    getLevelFromLevelId: function (levelId) {
        if (levelId === 1)
            return 0 /* Level.Level1 */;
        if (levelId === 2)
            return 1 /* Level.Level2 */;
        if (levelId === 3)
            return 2 /* Level.Level3 */;
        throw new Error("Unrecognized levelId");
    },
    getFinalLevel: function () {
        return 2 /* Level.Level3 */;
    }
};
let Level3BossTilemap = ((function () {
    let getTilemap = function (frameCounter, underlyingTilemap) {
        let getSnapshot = function (thisObj) {
            return getTilemap(frameCounter, underlyingTilemap.getSnapshot(underlyingTilemap));
        };
        let isSolid = function (xMibi, yMibi) {
            if (underlyingTilemap.isSolid(xMibi, yMibi))
                return true;
            if (xMibi <= 1024 * (GlobalConstants.WINDOW_WIDTH - 960))
                return true;
            if (xMibi >= 1024 * (GlobalConstants.WINDOW_WIDTH - 48))
                return true;
            return false;
        };
        let processFrame = function () {
            underlyingTilemap.processFrame();
            frameCounter++;
        };
        let renderForeground = function (displayOutput) {
            let numAnimationFrames = 25;
            let frameCounterCapped = frameCounter > numAnimationFrames ? numAnimationFrames : frameCounter;
            let bottomDoorYMibi = Math.floor(96 * 1024 * frameCounterCapped / numAnimationFrames);
            let topDoorYMibi = Math.floor(96 * 1024 * (numAnimationFrames - frameCounterCapped) / numAnimationFrames) + 192 * 1024;
            displayOutput.drawImageRotatedClockwise(48 /* GameImage.BossDoor */, 0, 0, 16, 32, GlobalConstants.WINDOW_WIDTH - 1008, bottomDoorYMibi >> 10, 0, 128 * 3);
            displayOutput.drawImageRotatedClockwise(48 /* GameImage.BossDoor */, 0, 0, 16, 32, GlobalConstants.WINDOW_WIDTH - 1008, topDoorYMibi >> 10, 0, 128 * 3);
            displayOutput.drawImageRotatedClockwise(48 /* GameImage.BossDoor */, 0, 0, 16, 32, GlobalConstants.WINDOW_WIDTH - 48, bottomDoorYMibi >> 10, 0, 128 * 3);
            displayOutput.drawImageRotatedClockwise(48 /* GameImage.BossDoor */, 0, 0, 16, 32, GlobalConstants.WINDOW_WIDTH - 48, topDoorYMibi >> 10, 0, 128 * 3);
            underlyingTilemap.renderForeground(displayOutput);
        };
        let renderMidgroundAndBackground = function (displayOutput) {
            underlyingTilemap.renderMidgroundAndBackground(displayOutput);
        };
        return {
            getSnapshot,
            getXVelocityForEnemiesInMibipixelsPerFrame: function () { return underlyingTilemap.getXVelocityForEnemiesInMibipixelsPerFrame(); },
            hasReachedEndOfMap: function () { return true; },
            isSolid,
            isDeadly: function (xMibi, yMibi) {
                return underlyingTilemap.isDeadly(xMibi, yMibi);
            },
            startBoss: function () { underlyingTilemap.startBoss(); },
            getNewEnemies: function () { return underlyingTilemap.getNewEnemies(); },
            processFrame,
            renderForeground,
            renderMidgroundAndBackground
        };
    };
    return {
        getTilemap: function ({ underlyingTilemap }) {
            return getTilemap(0, underlyingTilemap);
        }
    };
})());
let LevelCompleteFrame = {};
LevelCompleteFrame.getFrame = function (globalState, sessionState, underlyingFrame, level, difficulty, frameInputHistory) {
    /*
        1 = Continue
        2 = Watch replay
        3 = Restart level
    */
    let option = 1;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        underlyingFrame = underlyingFrame.getNextFrame({
            keyboardInput: EmptyKeyboard.getEmptyKeyboard(),
            mouseInput: EmptyMouse.getEmptyMouse(),
            previousKeyboardInput: EmptyKeyboard.getEmptyKeyboard(),
            previousMouseInput: EmptyMouse.getEmptyMouse(),
            displayProcessing: displayProcessing,
            soundOutput: MutedSoundOutput.getSoundOutput(soundOutput),
            musicOutput: musicOutput,
            thisFrame: underlyingFrame
        });
        if (keyboardInput.isPressed(36 /* Key.UpArrow */) && !previousKeyboardInput.isPressed(36 /* Key.UpArrow */)) {
            option--;
            if (option === 0)
                option = 3;
        }
        if (keyboardInput.isPressed(37 /* Key.DownArrow */) && !previousKeyboardInput.isPressed(37 /* Key.DownArrow */)) {
            option++;
            if (option === 4)
                option = 1;
        }
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            switch (option) {
                case 1: return OverworldFrame.getFrame(globalState, sessionState);
                case 2: return ReplayFrame.getFrame(globalState, sessionState, frameInputHistory, level, difficulty, displayProcessing);
                case 3: return GameFrame.getFrame(globalState, sessionState, GameStateUtil.getInitialGameState(level, difficulty, displayProcessing));
                default: throw new Error("Unrecognized option");
            }
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        underlyingFrame.render(displayOutput);
        displayOutput.drawText(Math.floor(GlobalConstants.WINDOW_WIDTH / 2) - 184, 600, "Level Complete", 0 /* GameFont.SimpleFont */, 48, white);
        displayOutput.drawText(365, 500, "Continue", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(365, 400, "Watch replay", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(365, 300, "Restart level", 0 /* GameFont.SimpleFont */, 24, white);
        let y;
        switch (option) {
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
                throw new Error("Unrecognized option");
        }
        displayOutput.drawRectangle(362, y, 174, 30, white, false);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
let LevelStartFrame = ((function () {
    let getFrame = function (globalState, sessionState, level, overworldMapFrame) {
        let selectedDifficulty = sessionState.lastSelectedDifficulty;
        let selectedStartGame = true;
        let hasEasyDifficultyReplay = globalState.allowSavingReplays && sessionState.replayCollection.replays.some(replay => replay.level === level && replay.difficulty === 0 /* Difficulty.Easy */);
        let hasNormalDifficultyReplay = globalState.allowSavingReplays && sessionState.replayCollection.replays.some(replay => replay.level === level && replay.difficulty === 1 /* Difficulty.Normal */);
        let hasHardDifficultyReplay = globalState.allowSavingReplays && sessionState.replayCollection.replays.some(replay => replay.level === level && replay.difficulty === 2 /* Difficulty.Hard */);
        let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
            if (keyboardInput.isPressed(38 /* Key.LeftArrow */) && !previousKeyboardInput.isPressed(38 /* Key.LeftArrow */)) {
                switch (selectedDifficulty) {
                    case 0 /* Difficulty.Easy */:
                        break;
                    case 1 /* Difficulty.Normal */:
                        if (selectedStartGame) {
                            selectedDifficulty = 0 /* Difficulty.Easy */;
                        }
                        else {
                            selectedDifficulty = 0 /* Difficulty.Easy */;
                            if (!hasEasyDifficultyReplay)
                                selectedStartGame = true;
                        }
                        break;
                    case 2 /* Difficulty.Hard */:
                        if (selectedStartGame) {
                            selectedDifficulty = 1 /* Difficulty.Normal */;
                        }
                        else {
                            if (hasNormalDifficultyReplay)
                                selectedDifficulty = 1 /* Difficulty.Normal */;
                            else if (hasEasyDifficultyReplay)
                                selectedDifficulty = 0 /* Difficulty.Easy */;
                            else {
                                selectedDifficulty = 1 /* Difficulty.Normal */;
                                selectedStartGame = true;
                            }
                        }
                        break;
                }
            }
            if (keyboardInput.isPressed(39 /* Key.RightArrow */) && !previousKeyboardInput.isPressed(39 /* Key.RightArrow */)) {
                switch (selectedDifficulty) {
                    case 0 /* Difficulty.Easy */:
                        if (selectedStartGame) {
                            selectedDifficulty = 1 /* Difficulty.Normal */;
                        }
                        else {
                            if (hasNormalDifficultyReplay)
                                selectedDifficulty = 1 /* Difficulty.Normal */;
                            else if (hasHardDifficultyReplay)
                                selectedDifficulty = 2 /* Difficulty.Hard */;
                            else {
                                selectedDifficulty = 1 /* Difficulty.Normal */;
                                selectedStartGame = true;
                            }
                        }
                        break;
                    case 1 /* Difficulty.Normal */:
                        if (selectedStartGame) {
                            selectedDifficulty = 2 /* Difficulty.Hard */;
                        }
                        else {
                            selectedDifficulty = 2 /* Difficulty.Hard */;
                            if (!hasHardDifficultyReplay)
                                selectedStartGame = true;
                        }
                        break;
                    case 2 /* Difficulty.Hard */:
                        break;
                }
            }
            if (keyboardInput.isPressed(36 /* Key.UpArrow */) && !previousKeyboardInput.isPressed(36 /* Key.UpArrow */))
                selectedStartGame = true;
            if (keyboardInput.isPressed(37 /* Key.DownArrow */) && !previousKeyboardInput.isPressed(37 /* Key.DownArrow */)) {
                switch (selectedDifficulty) {
                    case 0 /* Difficulty.Easy */:
                        if (hasEasyDifficultyReplay) {
                            selectedStartGame = false;
                        }
                        else if (hasNormalDifficultyReplay) {
                            selectedStartGame = false;
                            selectedDifficulty = 1 /* Difficulty.Normal */;
                        }
                        else if (hasHardDifficultyReplay) {
                            selectedStartGame = false;
                            selectedDifficulty = 2 /* Difficulty.Hard */;
                        }
                        break;
                    case 1 /* Difficulty.Normal */:
                        if (hasNormalDifficultyReplay) {
                            selectedStartGame = false;
                        }
                        else if (hasEasyDifficultyReplay) {
                            selectedStartGame = false;
                            selectedDifficulty = 0 /* Difficulty.Easy */;
                        }
                        else if (hasHardDifficultyReplay) {
                            selectedStartGame = false;
                            selectedDifficulty = 2 /* Difficulty.Hard */;
                        }
                        break;
                    case 2 /* Difficulty.Hard */:
                        if (hasHardDifficultyReplay) {
                            selectedStartGame = false;
                        }
                        else if (hasNormalDifficultyReplay) {
                            selectedStartGame = false;
                            selectedDifficulty = 1 /* Difficulty.Normal */;
                        }
                        else if (hasEasyDifficultyReplay) {
                            selectedStartGame = false;
                            selectedDifficulty = 0 /* Difficulty.Easy */;
                        }
                        break;
                }
            }
            if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
                || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
                || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
                soundOutput.playSound(0 /* GameSound.Click */, 100);
                sessionState.lastSelectedDifficulty = selectedDifficulty;
                globalState.saveAndLoadData.saveSessionState(sessionState);
                if (selectedStartGame) {
                    let gameState = GameStateUtil.getInitialGameState(level, selectedDifficulty, displayProcessing);
                    return GameFrame.getFrame(globalState, sessionState, gameState);
                }
                else {
                    let replay = sessionState.replayCollection.replays.find(replay => replay.level === level && replay.difficulty === selectedDifficulty);
                    let frameInputHistory = ReplayUtil.generateFrameInputHistoryFromReplay(replay);
                    return ReplayFrame.getFrame(globalState, sessionState, frameInputHistory, level, selectedDifficulty, displayProcessing);
                }
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
                    levelScreenshot = 61 /* GameImage.Level1Screenshot */;
                    break;
                case 1 /* Level.Level2 */:
                    levelName = "Icyfall Forest";
                    levelNameX = 383;
                    levelScreenshot = 62 /* GameImage.Level2Screenshot */;
                    break;
                case 2 /* Level.Level3 */:
                    levelName = "Fort Borealis";
                    levelNameX = 390;
                    levelScreenshot = 63 /* GameImage.Level3Screenshot */;
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
            if (hasEasyDifficultyReplay || hasNormalDifficultyReplay || hasHardDifficultyReplay)
                displayOutput.drawText(100, 100, "Watch replay:", 0 /* GameFont.SimpleFont */, 28, black);
            if (hasEasyDifficultyReplay)
                displayOutput.drawText(325, 100, "Easy", 0 /* GameFont.SimpleFont */, 28, black);
            if (hasNormalDifficultyReplay)
                displayOutput.drawText(457, 100, "Normal", 0 /* GameFont.SimpleFont */, 28, black);
            if (hasHardDifficultyReplay)
                displayOutput.drawText(625, 100, "Hard", 0 /* GameFont.SimpleFont */, 28, black);
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
            displayOutput.drawRectangle(startLevelX, 122 - (selectedStartGame ? 0 : 50), 120, 30, black, false);
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
let MapData = {
    "Level1": { "compressionlevel": -1,
        "height": 15,
        "infinite": false,
        "layers": [
            {
                "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 138, 145, 146, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 473, 472, 474, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 156, 157, 143, 143, 150, 150, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 154, 141, 150, 150, 150, 150, 150, 150, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 473, 472, 474, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 473, 472, 474, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 473, 472, 474, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 473, 472, 474, 0, 0, 0, 0, 0, 473, 472, 474, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 152, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 473, 472, 474, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 163, 183, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 473, 472, 474, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 404, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 149, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 0, 0, 0, 0, 0, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 473, 472, 474, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 499, 500, 0, 433, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 406, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1131, 1132, 1133, 433, 0, 0, 0, 404, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 149, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 531, 472, 502, 0, 0, 0, 0, 473, 377, 472, 377, 474, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 405, 443, 444, 500, 433, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1136, 1146, 1138, 433, 0, 0, 0, 433, 0, 0, 0, 404, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 149, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    0, 501, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 473, 472, 474, 0, 0, 0, 531, 377, 377, 472, 377, 377, 502, 0, 0, 0, 0, 0, 501, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 499, 443, 529, 528, 442, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 499, 471, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1141, 1142, 1143, 433, 0, 0, 0, 433, 0, 0, 0, 433, 0, 0, 0, 404, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 169, 172, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 473, 377, 377, 472, 377, 377, 474, 0, 0, 0, 0, 531, 472, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 405, 471, 436, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 473, 472, 474, 0, 0, 0, 499, 407, 0, 0, 0, 499, 471, 435, 0, 0, 0, 0, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 433, 0, 0, 0, 433, 0, 0, 0, 433, 0, 0, 404, 0, 0, 404, 0, 0, 0, 473, 472, 474, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1090, 436, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 180, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    473, 472, 474, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 531, 377, 377, 472, 377, 377, 502, 1131, 1132, 1133, 0, 473, 472, 474, 0, 0, 0, 0, 499, 500, 0, 0, 0, 499, 443, 435, 436, 0, 0, 0, 0, 470, 500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 434, 436, 0, 0, 499, 471, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 433, 0, 0, 0, 433, 0, 0, 0, 433, 0, 0, 433, 0, 0, 433, 0, 0, 531, 377, 472, 377, 502, 0, 0, 501, 501, 501, 501, 501, 501, 501, 1102, 0, 1079, 1079, 1079, 0, 501, 501, 501, 501, 501, 501, 0, 178, 191, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    377, 472, 377, 502, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 1136, 1134, 1138, 531, 377, 472, 377, 502, 499, 406, 406, 471, 470, 406, 406, 406, 443, 529, 0, 529, 0, 0, 0, 0, 435, 470, 500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 434, 436, 0, 499, 471, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 433, 0, 0, 0, 433, 0, 0, 0, 433, 0, 0, 433, 0, 0, 433, 0, 0, 0, 0, 433, 0, 0, 0, 0, 433, 433, 433, 433, 433, 433, 433, 1114, 0, 0, 0, 0, 0, 433, 433, 433, 433, 433, 433, 178, 189, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    0, 433, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 1141, 1142, 1143, 0, 0, 433, 0, 499, 471, 435, 435, 435, 435, 435, 435, 435, 529, 0, 0, 0, 0, 0, 0, 0, 435, 435, 470, 406, 406, 406, 406, 406, 406, 406, 406, 0, 0, 0, 0, 0, 0, 0, 434, 436, 0, 434, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 435, 435, 435, 435, 441, 529, 0, 0, 0, 0, 0, 0, 0, 0, 435, 528, 442, 435, 435, 435, 435, 435, 435, 435, 435, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 435, 435, 435, 435, 436, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 499, 471, 435, 435, 435, 435, 435, 435, 435, 435, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 150, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                "height": 15,
                "id": 3,
                "name": "Background",
                "opacity": 1,
                "type": "tilelayer",
                "visible": true,
                "width": 265,
                "x": 0,
                "y": 0
            },
            {
                "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 83, 84, 84, 84, 68, 69, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 65, 78, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 558, 0, 558, 79, 80, 66, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 76, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 77, 64, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 67, 87, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 291, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 67, 78, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 322, 262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 66, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 70, 71, 78, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 320, 0, 0, 0, 0, 260, 261, 262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 77, 68, 69, 73, 73, 73, 73, 73, 73, 73, 70, 71, 84, 84, 68, 69, 73, 73, 73, 73, 70, 71, 81, 82, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 320, 0, 0, 0, 0, 271, 272, 290, 290, 290, 291, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 290, 290, 290, 291, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 290, 290, 290, 291, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 271, 272, 355, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 260, 261, 262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 79, 80, 84, 84, 84, 84, 84, 84, 84, 81, 82, 0, 558, 79, 80, 84, 84, 84, 84, 81, 82, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 320, 0, 0, 0, 0, 329, 301, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 725, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 580, 319, 319, 319, 319, 319, 319, 319, 319, 319, 563, 319, 302, 303, 273, 274, 0, 0, 0, 271, 272, 300, 301, 319, 319, 354, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 260, 261, 262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 558, 0, 0, 558, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 291, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 320, 0, 0, 0, 0, 318, 319, 564, 696, 319, 354, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 355, 319, 319, 319, 319, 354, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 355, 319, 319, 319, 319, 354, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 355, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 302, 303, 290, 290, 290, 300, 301, 319, 319, 319, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 260, 261, 262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1072, 1073, 1074, 1075, 1076, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 271, 272, 290, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 347, 349, 0, 0, 0, 0, 318, 319, 319, 319, 579, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 580, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 260, 261, 261, 262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1083, 1084, 1085, 1086, 1087, 1088, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 275, 300, 301, 319, 319, 302, 303, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 290, 290, 355, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1095, 1096, 1097, 1098, 1099, 1100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 275, 304, 319, 319, 319, 564, 319, 319, 319, 302, 303, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 725, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 696, 319, 319, 319, 319, 319, 319, 319, 319, 578, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 578, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 696, 319, 319, 319, 319, 319, 319, 319, 319, 578, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 725, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1095, 1108, 1109, 1110, 1111, 1112, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 271, 272, 304, 319, 319, 319, 319, 319, 319, 319, 319, 696, 580, 319, 302, 303, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 290, 290, 290, 290, 355, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 290, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 696, 319, 725, 319, 319, 319, 564, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 696, 319, 725, 319, 319, 319, 564, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 696, 319, 319, 319, 319, 319, 319, 319, 319, 319, 302, 303, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 291, 61, 62, 62, 62, 62, 62, 62, 62, 62, 99, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    290, 290, 290, 290, 290, 300, 301, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 564, 319, 319, 319, 319, 302, 303, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 355, 319, 319, 319, 319, 319, 319, 725, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 580, 319, 319, 302, 303, 290, 290, 290, 290, 290, 290, 290, 290, 290, 355, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 564, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 564, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 578, 319, 319, 696, 319, 319, 319, 319, 319, 319, 319, 319, 579, 319, 319, 319, 319, 319, 319, 564, 319, 319, 319, 319, 563, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 578, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 72, 73, 73, 73, 73, 73, 73, 73, 73, 110, 111, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62, 62,
                    319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 580, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 580, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 725, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 725, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 696, 319, 580, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 580, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 72, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73],
                "height": 15,
                "id": 1,
                "name": "Foreground",
                "opacity": 1,
                "type": "tilelayer",
                "visible": true,
                "width": 265,
                "x": 0,
                "y": 0
            },
            {
                "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 1173, 1172, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 1172, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 1172, 1172, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 1172, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 1172, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                "height": 15,
                "id": 4,
                "name": "Enemies",
                "opacity": 1,
                "type": "tilelayer",
                "visible": true,
                "width": 265,
                "x": 0,
                "y": 0
            },
            {
                "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 13, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 12, 1, 1, 1, 1, 1, 1, 1, 13, 14, 0, 0, 11, 12, 1, 1, 1, 1, 13, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 1, 1, 1, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 10, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                "height": 15,
                "id": 2,
                "name": "Solid",
                "opacity": 0.5,
                "type": "tilelayer",
                "visible": true,
                "width": 265,
                "x": 0,
                "y": 0
            }
        ],
        "nextlayerid": 5,
        "nextobjectid": 1,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.8.5",
        "tileheight": 16,
        "tilesets": [
            {
                "columns": 5,
                "firstgid": 1,
                "image": "../Images/KelvinShadewing/solid.png",
                "imageheight": 192,
                "imagewidth": 80,
                "margin": 0,
                "name": "Solid",
                "spacing": 0,
                "tilecount": 60,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 11,
                "firstgid": 61,
                "image": "../Images/KelvinShadewing/icecavetiles.png",
                "imageheight": 288,
                "imagewidth": 176,
                "margin": 0,
                "name": "IceCave",
                "spacing": 0,
                "tilecount": 198,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 29,
                "firstgid": 259,
                "image": "../Images/KelvinShadewing/tssnow.png",
                "imageheight": 448,
                "imagewidth": 464,
                "margin": 0,
                "name": "Snow",
                "spacing": 0,
                "tilecount": 812,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 12,
                "firstgid": 1071,
                "image": "../Images/KelvinShadewing/igloo.png",
                "imageheight": 80,
                "imagewidth": 192,
                "margin": 0,
                "name": "Igloo",
                "spacing": 0,
                "tilecount": 60,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 5,
                "firstgid": 1131,
                "image": "../Images/Nemisys/signpost.png",
                "imageheight": 128,
                "imagewidth": 80,
                "margin": 0,
                "name": "Sign",
                "spacing": 0,
                "tilecount": 40,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 5,
                "firstgid": 1171,
                "image": "../Images/dtsudo/EnemySpawns.png",
                "imageheight": 48,
                "imagewidth": 80,
                "margin": 0,
                "name": "EnemySpawns",
                "spacing": 0,
                "tilecount": 15,
                "tileheight": 16,
                "tilewidth": 16
            }
        ],
        "tilewidth": 16,
        "type": "map",
        "version": "1.8",
        "width": 265
    },
    "Level2": { "compressionlevel": -1,
        "height": 15,
        "infinite": false,
        "layers": [
            {
                "data": [0, 0, 0, 0, 0, 0, 1250, 1251, 1252, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 1131, 1132, 1133, 0, 1218, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1131, 1132, 1133, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 1131, 1132, 1133, 0, 0, 1227, 0, 0, 0, 0, 0, 0, 0, 1200, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 503, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 0, 0, 1141, 1168, 1143, 0, 1236, 0, 1131, 1132, 1133, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1141, 1167, 1143, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 1141, 1167, 1143, 0, 0, 1227, 0, 0, 1131, 1132, 1133, 0, 0, 1200, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 473, 472, 474, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 1294, 1295, 1296, 1297, 1298, 1131, 1132, 1133, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1249, 1250, 1251, 1252, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 0, 0, 1145, 0, 0, 1218, 0, 1141, 1168, 1143, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1145, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 1145, 0, 0, 0, 1218, 0, 0, 1141, 1168, 1143, 0, 0, 1200, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 1227, 0, 0, 1141, 1167, 1143, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 1131, 1132, 1133, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 0,
                    1258, 1259, 1260, 1261, 1262, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 1209, 0, 0, 0, 0, 0, 0, 0, 0, 1145, 0, 0, 1236, 0, 0, 1145, 0, 0, 0, 0, 1227, 0, 1131, 1132, 1133, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1145, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 1145, 0, 0, 0, 1245, 0, 0, 0, 1145, 0, 0, 0, 1209, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 473, 377, 472, 377, 474, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 1200, 0, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 0, 0, 1236, 0, 0, 0, 1141, 1167, 1143, 0, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 0,
                    1267, 1268, 1269, 1270, 1271, 1285, 1286, 1287, 1288, 1289, 1131, 1132, 1133, 0, 0, 1236, 0, 0, 0, 0, 1209, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1218, 0, 0, 1145, 0, 0, 0, 0, 1200, 0, 1141, 1168, 1143, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 0, 0, 0, 1218, 0, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 0, 1145, 0, 0, 0, 1191, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 377, 472, 377, 502, 0, 0, 0, 1227, 0, 0, 0, 0, 0, 0, 0, 1209, 0, 0, 0, 0, 0, 1227, 0, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0, 0, 1209, 0, 0, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 0,
                    1276, 1277, 1278, 1279, 1280, 1294, 1295, 1296, 1297, 1298, 1141, 1167, 1143, 0, 0, 1236, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1227, 0, 0, 1145, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 1244, 1245, 1246, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 0, 1145, 0, 0, 0, 1218, 0, 0, 0, 1227, 0, 0, 0, 0, 0, 0, 0, 0, 0, 499, 435, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 1244, 1245, 1246, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1244, 1245, 1246, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1131, 1132, 1133, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0,
                    1285, 1286, 1287, 1288, 1289, 0, 0, 1191, 0, 0, 0, 1145, 0, 0, 0, 1227, 0, 0, 0, 0, 1200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1244, 1245, 1246, 0, 1145, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 1285, 1286, 1287, 1288, 1289, 0, 1285, 1286, 1287, 1288, 1289, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 1249, 1250, 1251, 1252, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1200, 0, 0, 1244, 1245, 1246, 0, 0, 0, 0, 0, 0, 0, 499, 471, 435, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 1141, 1167, 1143, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 0, 0, 0, 1200, 0, 0, 0, 0, 1145, 1249, 1250, 1251, 1252, 1253, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 0, 1249, 1250, 1251, 1252, 1253, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0,
                    1294, 1295, 1296, 1297, 1298, 0, 0, 1191, 0, 0, 0, 1145, 0, 0, 0, 1236, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 1294, 1295, 1296, 1297, 1298, 0, 1294, 1295, 1296, 1297, 1298, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 406, 406, 438, 377, 464, 464, 464, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 433, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 1145, 0, 0, 0, 1209, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 1294, 1295, 1296, 1297, 1298, 1249, 1250, 1251, 1252, 1253, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 1294, 1295, 1296, 1297, 1298, 1249, 1250, 1251, 1252, 1253,
                    0, 0, 1218, 0, 0, 0, 0, 1236, 0, 0, 0, 1145, 0, 0, 0, 1209, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 1131, 1132, 1133, 0, 0, 0, 1227, 0, 0, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 1227, 0, 0, 0, 0, 0, 1227, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 441, 529, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 437, 500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 1145, 0, 0, 1244, 1245, 1246, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 1200, 1249, 1250, 1251, 1252, 1253, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 1191, 0, 0, 1258, 1259, 1260, 1261, 1262, 0, 0, 1200, 1249, 1250, 1251, 1252, 1253, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 0, 1191, 0, 0, 1258, 1259, 1260, 1261, 1262,
                    0, 0, 1236, 0, 0, 0, 0, 1209, 0, 0, 0, 1145, 0, 0, 0, 1236, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1200, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 1131, 1132, 1133, 0, 0, 0, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 1141, 1167, 1143, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 1218, 0, 0, 0, 0, 0, 1191, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 436, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 499, 435, 436, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 1218, 1258, 1259, 1260, 1261, 1262, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 1200, 0, 0, 1267, 1268, 1269, 1270, 1271, 0, 0, 1218, 1258, 1259, 1260, 1261, 1262, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 0, 1200, 0, 0, 1267, 1268, 1269, 1270, 1271,
                    0, 1244, 1245, 1246, 0, 0, 1244, 1245, 1246, 0, 0, 1145, 0, 0, 0, 1227, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 1218, 0, 0, 1141, 1167, 1143, 0, 0, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 1145, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 1236, 0, 0, 0, 0, 0, 1236, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 470, 500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 434, 435, 436, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 1249, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 1191, 1267, 1268, 1269, 1270, 1271, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 1218, 0, 0, 1276, 1277, 1278, 1279, 1280, 0, 0, 1191, 1267, 1268, 1269, 1270, 1271, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 1218, 0, 0, 1276, 1277, 1278, 1279, 1280,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1145, 0, 0, 0, 1236, 0, 0, 0, 0, 1209, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 1244, 1245, 1246, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1227, 0, 0, 0, 1145, 0, 0, 0, 1244, 1245, 1246, 0, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 1218, 0, 0, 0, 0, 0, 1236, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 435, 435, 438, 377, 377, 377, 377, 377, 377, 377, 377, 377, 377, 377, 377, 377, 466, 464, 468, 377, 440, 406, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 1191, 1276, 1277, 1278, 1279, 1280, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 1191, 0, 0, 1285, 1286, 1287, 1288, 1289, 0, 0, 1191, 1276, 1277, 1278, 1279, 1280, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 1191, 0, 0, 1285, 1286, 1287, 1288, 1289,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1244, 1245, 1246, 0, 0, 1244, 1245, 1246, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1209, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1227, 0, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1227, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 435, 441, 529, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 528, 442, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 0, 1227, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 0, 1191, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 1191, 0, 0, 1294, 1295, 1296, 1297, 1298, 0, 0, 1191, 1285, 1286, 1287, 1288, 1289, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 1191, 0, 0, 1294, 1295, 1296, 1297, 1298,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1145, 0, 0, 0, 0, 0, 0, 0, 0, 1244, 1245, 1246, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1227, 0, 0, 0, 0, 1227, 0, 0, 0, 0, 0, 1227, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 1200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 435, 436, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 434, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1200, 0, 0, 0, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1227, 0, 0, 0, 0, 0, 1191, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 1200, 0, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 1191, 1294, 1295, 1296, 1297, 1298, 0, 0, 0, 1200, 0, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 1191, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1209, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1227, 0, 0, 0, 0, 1227, 0, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435, 435, 470, 500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 499, 471, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 0, 0, 1191, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1236, 0, 0, 0, 0, 0, 1200, 0, 0, 1191, 0, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 1200, 0, 0, 0, 0, 1200, 0, 0, 0, 0, 1200, 0, 0, 1191, 0, 0, 0, 0, 0, 1218, 0, 0, 0, 0, 0, 1200, 0, 0, 0, 0, 1200, 0, 0],
                "height": 15,
                "id": 3,
                "name": "Background",
                "opacity": 1,
                "type": "tilelayer",
                "visible": true,
                "width": 308,
                "x": 0,
                "y": 0
            },
            {
                "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 526, 319, 319, 319, 319, 319, 580, 319, 319, 527, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 555, 497, 319, 319, 319, 319, 319, 319, 498, 556, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 587, 319, 319, 319, 578, 319, 319, 527, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 290, 290, 290, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 498, 556, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 290, 290, 290, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 271, 272, 290, 290, 290, 290, 290, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 588, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 271, 272, 290, 290, 290, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 579, 319, 319, 319, 319, 302, 303, 290, 290, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 271, 272, 300, 301, 319, 319, 319, 319, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 579, 319, 319, 696, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 271, 272, 300, 301, 319, 319, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 616, 319, 319, 319, 319, 319, 580, 319, 319, 319, 319, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 302, 303, 290, 290, 290, 290, 290, 290, 290, 290, 300, 301, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 300, 301, 319, 319, 319, 319, 319, 319, 319, 319, 302, 303, 290, 290, 290, 290, 290, 290, 290, 291, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 271, 272, 290, 290, 290, 290, 291, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 526, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 580, 319, 319, 319, 302, 303, 290, 290, 290, 291, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 302, 303, 290, 290, 290, 290, 290, 291, 0, 0, 0, 0, 0, 347, 348, 348, 348, 348, 348, 349, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 271, 272, 300, 301, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 555, 497, 319, 578, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 271, 272, 300, 301, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 587, 319, 319, 319, 725, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 696, 319, 564, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 289, 290, 290, 290, 290, 290, 290, 290, 290, 300, 301, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 696, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 616, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 617, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 725, 319, 319, 579, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 289, 290, 290, 290, 290, 290, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 271, 272, 290, 290, 290, 290, 290, 290, 291, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 526, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 527, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    319, 319, 319, 319, 319, 319, 319, 696, 319, 319, 563, 319, 319, 302, 303, 290, 290, 290, 290, 290, 290, 290, 290, 290, 290, 355, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 580, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 616, 319, 319, 319, 319, 319, 302, 303, 273, 274, 0, 0, 0, 0, 0, 0, 0, 0, 0, 271, 272, 300, 301, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 555, 497, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 498, 556, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 616, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 617, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    319, 319, 319, 564, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 526, 319, 319, 319, 319, 319, 319, 319, 302, 303, 290, 290, 290, 290, 290, 290, 290, 290, 290, 300, 301, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 526, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 320, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 527, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 526, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 319, 496, 525, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                "height": 15,
                "id": 1,
                "name": "Foreground",
                "opacity": 1,
                "type": "tilelayer",
                "visible": true,
                "width": 308,
                "x": 0,
                "y": 0
            },
            {
                "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1175, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 1172, 0, 0, 0, 1175, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1175, 0, 0, 0, 0, 0, 0, 1172, 1175, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 1172, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1175, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1175, 0, 1172, 1173, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1175, 0, 0, 1175, 1173, 0, 1175, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1175, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1175, 1173, 0, 0, 1175, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 1172, 1173, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 1175, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1175, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 1172, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                "height": 15,
                "id": 4,
                "name": "Enemies",
                "opacity": 1,
                "type": "tilelayer",
                "visible": true,
                "width": 308,
                "x": 0,
                "y": 0
            },
            {
                "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 1, 1, 1, 1, 1, 1, 1, 1, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 1, 1, 1, 1, 1, 1, 1, 1, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 18, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                "height": 15,
                "id": 2,
                "name": "Solid",
                "opacity": 0.5,
                "type": "tilelayer",
                "visible": true,
                "width": 308,
                "x": 0,
                "y": 0
            }
        ],
        "nextlayerid": 5,
        "nextobjectid": 1,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.8.5",
        "tileheight": 16,
        "tilesets": [
            {
                "columns": 5,
                "firstgid": 1,
                "image": "../Images/KelvinShadewing/solid.png",
                "imageheight": 192,
                "imagewidth": 80,
                "margin": 0,
                "name": "Solid",
                "spacing": 0,
                "tilecount": 60,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 11,
                "firstgid": 61,
                "image": "../Images/KelvinShadewing/icecavetiles.png",
                "imageheight": 288,
                "imagewidth": 176,
                "margin": 0,
                "name": "IceCave",
                "spacing": 0,
                "tilecount": 198,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 29,
                "firstgid": 259,
                "image": "../Images/KelvinShadewing/tssnow.png",
                "imageheight": 448,
                "imagewidth": 464,
                "margin": 0,
                "name": "Snow",
                "spacing": 0,
                "tilecount": 812,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 12,
                "firstgid": 1071,
                "image": "../Images/KelvinShadewing/igloo.png",
                "imageheight": 80,
                "imagewidth": 192,
                "margin": 0,
                "name": "Igloo",
                "spacing": 0,
                "tilecount": 60,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 5,
                "firstgid": 1131,
                "image": "../Images/Nemisys/signpost.png",
                "imageheight": 128,
                "imagewidth": 80,
                "margin": 0,
                "name": "Sign",
                "spacing": 0,
                "tilecount": 40,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 5,
                "firstgid": 1171,
                "image": "../Images/dtsudo/EnemySpawns.png",
                "imageheight": 48,
                "imagewidth": 80,
                "margin": 0,
                "name": "EnemySpawns",
                "spacing": 0,
                "tilecount": 15,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 9,
                "firstgid": 1186,
                "image": "../Images/Treetops/treetops.png",
                "imageheight": 208,
                "imagewidth": 144,
                "margin": 0,
                "name": "Treetops",
                "spacing": 0,
                "tilecount": 117,
                "tileheight": 16,
                "tilewidth": 16
            }
        ],
        "tilewidth": 16,
        "type": "map",
        "version": "1.8",
        "width": 308
    },
    "Level3": { "compressionlevel": -1,
        "height": 15,
        "infinite": false,
        "layers": [
            {
                "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1353, 1351, 1351, 1351, 1309, 1375, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1375, 1309, 1351, 1351, 1351, 1353, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1310, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1308, 1309, 1309, 1309, 1309, 1309, 1310, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1325, 1343, 1343, 1322, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1324, 1343, 1343, 1325, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1308, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1310, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1325, 1343, 1343, 1322, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1324, 1343, 1343, 1325, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1308, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1310, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1325, 1309, 1309, 1353, 1337, 1375, 1337, 1337, 1337, 1337, 1313, 1323, 1312, 1337, 1337, 1337, 1337, 1375, 1337, 1353, 1309, 1309, 1325, 0, 0, 0, 0, 1308, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1375, 1310, 0, 0, 0, 1308, 1375, 1309, 1309, 1310, 0, 1311, 0, 1308, 1309, 1309, 1375, 1309, 1375, 1309, 1309, 1310, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 1322, 1323, 1324, 0, 0, 0, 0, 0, 1323, 1322, 1323, 1323, 1324, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1324, 0, 0, 0, 1322, 1375, 1323, 1323, 1324, 0, 1325, 0, 1322, 1323, 1312, 1375, 1337, 1375, 1313, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1308, 1309, 1309, 1309, 1375, 1309, 1309, 1310, 0, 1322, 1323, 1312, 1323, 1313, 1323, 1326, 1375, 1309, 1309, 1309, 1309, 1309, 1310, 0, 0, 0, 1308, 1309, 1310, 0, 0, 0, 1308, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1327, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 1322, 1323, 1324, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1324, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1324, 0, 0, 0, 1322, 1375, 1323, 1323, 1324, 0, 1325, 0, 1322, 1323, 1324, 0, 0, 0, 1322, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1322, 1434, 1435, 1436, 1323, 1323, 1323, 1323, 1434, 1435, 1436, 1323, 1323, 1323, 1323, 1323, 1434, 1435, 1436, 1323, 1323, 1323, 1323, 1434, 1435, 1436, 1323, 1323, 1323, 1323, 1323, 1434, 1435, 1436, 1323, 1323, 1323, 1323, 1434, 1435, 1436, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1375, 1323, 1323, 1326, 1323, 1327, 1323, 1324, 0, 1322, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 1322, 1323, 1326, 1323, 1375, 1323, 1327, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 1336, 1337, 1338, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1324, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1324, 0, 0, 0, 1322, 1375, 1323, 1323, 1324, 0, 1339, 0, 1322, 1323, 1324, 0, 0, 0, 1322, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1434, 1435, 1436, 1323, 1323, 1323, 1434, 1435, 1436, 1323, 1323, 1323, 1434, 1435, 1436, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1327, 1448, 1449, 1450, 1323, 1323, 1323, 1323, 1448, 1449, 1450, 1323, 1323, 1323, 1323, 1323, 1448, 1449, 1450, 1323, 1323, 1323, 1323, 1448, 1449, 1450, 1323, 1323, 1323, 1323, 1323, 1448, 1449, 1450, 1323, 1323, 1323, 1323, 1448, 1449, 1450, 1323, 1323, 1323, 1326, 1375, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1375, 1309, 1327, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 1322, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 1322, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1324, 1323, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1326, 1309, 1309, 1309, 1327, 1375, 1323, 1323, 1324, 0, 0, 0, 1322, 1323, 1324, 0, 0, 0, 1322, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 0, 1323, 1323, 1326, 1309, 1309, 1309, 1309, 1309, 1375, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1327, 1323, 1448, 1449, 1450, 1323, 1323, 1323, 1448, 1449, 1450, 1323, 1323, 1323, 1448, 1449, 1450, 1323, 1326, 1309, 1309, 1309, 1309, 1375, 1309, 1309, 1309, 1309,
                    1323, 1462, 1463, 1464, 1323, 1323, 1323, 1323, 1462, 1463, 1464, 1323, 1323, 1323, 1323, 1323, 1462, 1463, 1464, 1323, 1323, 1323, 1323, 1462, 1463, 1464, 1323, 1323, 1323, 1323, 1323, 1462, 1463, 1464, 1323, 1323, 1323, 1323, 1462, 1463, 1464, 1323, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 1322, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1326, 1323, 1323, 1323, 1327, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1326, 1309, 1309, 1309, 1309, 1327, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1312, 1375, 1337, 1337, 1337, 1337, 1337, 1375, 1313, 1323, 1326, 1309, 1309, 1309, 1327, 1323, 1324, 0, 0, 0, 1322, 1323, 1326, 1309, 1309, 1309, 1309, 1309, 1309, 1309, 1310, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1462, 1463, 1464, 1323, 1323, 1323, 1462, 1463, 1464, 1323, 1323, 1323, 1462, 1463, 1464, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323,
                    1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 1322, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 0, 0, 0, 1322, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1324, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1375, 1323, 1323, 1323, 1323,
                    1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1375, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1375, 1337, 1337, 1337, 1337, 1337, 1375, 1337, 1337, 1337, 1337, 1337, 1337, 1338, 0, 1336, 1337, 1337, 1375, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1375, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1313, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1312, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1338, 0, 0, 0, 0, 0, 0, 0, 1336, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1338, 0, 0, 0, 1336, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1338, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 0, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1375, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1337, 1375, 1337, 1337, 1337, 1337,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1322, 1323, 1323, 1324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 1323, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                "height": 15,
                "id": 3,
                "name": "Background",
                "opacity": 1,
                "type": "tilelayer",
                "visible": true,
                "width": 296,
                "x": 0,
                "y": 0
            },
            {
                "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 419, 420, 421, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 419, 420, 421, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 419, 420, 421, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 448, 533, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 448, 504, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 448, 504, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 448, 504, 446, 421, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 448, 476, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 448, 533, 446, 421, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 477, 418, 476, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 448, 505, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 477, 418, 475, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 419, 420, 421, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1514, 1514, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1514, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 0, 448, 475, 446, 421, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 419, 447, 504, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 448, 504, 446, 421, 0, 0, 0, 0, 0, 0, 0, 0, 419, 447, 417, 479, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1518, 1518, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1518, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 0, 477, 418, 505, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 448, 476, 417, 479, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 477, 418, 475, 450, 0, 0, 0, 0, 0, 0, 0, 419, 447, 417, 479, 0, 0, 0, 0, 419, 421, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1518, 1518, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1518, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 0, 0, 448, 449, 446, 421, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 448, 475, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 448, 533, 446, 421, 0, 0, 0, 0, 0, 419, 447, 417, 479, 0, 0, 0, 0, 419, 447, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1514, 0, 0, 0, 0, 1518, 1518, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1518, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 0, 0, 477, 418, 475, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 448, 449, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 477, 418, 504, 446, 420, 420, 420, 420, 420, 447, 505, 446, 420, 420, 420, 420, 420, 447, 449, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1518, 0, 0, 0, 0, 1518, 1518, 0, 0, 0, 0, 1515, 1517, 1517, 1517, 1517, 1517, 1516, 0, 0, 0, 0, 1518, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 0, 0, 0, 448, 475, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 477, 478, 479, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 477, 478, 478, 478, 478, 478, 478, 478, 478, 478, 478, 478, 478, 478, 478, 478, 478, 478, 479, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1518, 0, 0, 0, 0, 1518, 1518, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1518, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 0, 0, 0, 477, 478, 479, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1518, 0, 0, 0, 0, 1518, 1518, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1518, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1513, 0, 0, 0, 0, 1513, 1513, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1513, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 1343, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                "height": 15,
                "id": 5,
                "name": "Midground",
                "opacity": 1,
                "type": "tilelayer",
                "visible": true,
                "width": 296,
                "x": 0,
                "y": 0
            },
            {
                "data": [1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 668, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 666, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 667, 668, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 666, 667, 667, 667, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407,
                    1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 703, 697, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 724, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348, 726, 1420, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1422, 724, 348, 348, 348, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407,
                    1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 1485, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1341, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 695, 697, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1340, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1341, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407,
                    1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 1405, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 695, 697, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407,
                    1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1341, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 1405, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 695, 697, 1406, 1340, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1341, 1407, 1340, 1421, 1421, 1421, 1421, 1421, 1363, 1421, 1363, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1341, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 637, 638, 639, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 1405, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 695, 697, 1406, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1408, 0, 0, 0, 0, 0, 1405, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 665, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1340, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1422, 1405, 0, 0, 0, 0, 0, 0, 0, 1420, 1421, 1421, 1421, 1421, 1421, 1421, 1341, 1407, 1340, 1421, 1421, 1421, 1341, 1407, 1340, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1422, 0, 0, 0, 0, 1392, 1393, 1393, 1393, 1393, 1394, 0, 0, 0, 1392, 1393, 1393, 1393, 1394, 668, 0, 0, 0, 0, 695, 697, 1406, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1408, 0, 0, 0, 0, 0, 1405, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 694, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 1419, 0, 0, 0, 1306, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1408, 0, 0, 0, 1420, 1421, 1422, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 1406, 1407, 1407, 1340, 1422, 697, 0, 0, 0, 0, 695, 697, 1406, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1408, 0, 0, 0, 0, 0, 1405, 0, 1405, 0, 0, 0, 1392, 1393, 1394, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 694, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1420, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1422, 0, 0, 0, 0, 0, 0, 0, 0, 1307, 0, 0, 0, 1391, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1408, 0, 0, 0, 1364, 1365, 1366, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 1406, 1407, 1407, 1407, 695, 697, 0, 0, 0, 0, 695, 1392, 1355, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1420, 1421, 1422, 0, 0, 0, 0, 0, 1405, 0, 1405, 0, 0, 0, 1406, 1407, 1408, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 656, 657, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 670, 0, 0, 0, 1420, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1422, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1420, 1421, 1421, 1421, 1421, 1421, 1421, 1421, 1421,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1420, 1421, 1422, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1354, 1393, 1393, 1393, 1355, 1407, 1407, 1407, 695, 697, 0, 0, 0, 0, 724, 1420, 1421, 1422, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1356, 1424, 1358, 0, 0, 0, 1406, 1407, 1408, 0, 0, 0, 1420, 1421, 1421, 1421, 1421, 1421, 1421, 1422, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 656, 657, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 685, 686, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1391, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1364, 1365, 1366, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 695, 697, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 637, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 638, 685, 686, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 695, 697, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1392, 1393, 1393, 1393, 1393, 1393, 1394, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1391, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1378, 1379, 1380, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 695, 697, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1406, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1349, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1394, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 695, 697, 0, 0, 0, 0, 1392, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1355, 1407, 1407, 1407, 1407, 1407, 1354, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1355, 1407, 1354, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1394, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393, 1393,
                    1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 695, 697, 0, 0, 0, 0, 1406, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1408, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407, 1407],
                "height": 15,
                "id": 1,
                "name": "Foreground",
                "opacity": 1,
                "type": "tilelayer",
                "visible": true,
                "width": 296,
                "x": 0,
                "y": 0
            },
            {
                "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 1174, 0, 1175, 0, 0, 0, 0, 1175, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 1173, 0, 1175, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1175, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1181, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 1175, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1171, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1174, 0, 1174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1175, 0, 0, 0, 0, 1171, 1171, 1174, 1175, 1175, 1175, 1175, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1179, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1175, 0, 1173, 0, 0, 1173, 0, 1175, 0, 0, 0, 0, 0, 0, 1173, 0, 1173, 0, 1173, 0, 1173, 0, 1175, 0, 1175, 0, 1175, 0, 1175, 0, 0, 1174, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 1173, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 1172, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 1172, 1172, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 0, 1172, 0, 0, 0, 0, 0, 1172, 0, 1172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1177, 0, 0, 0, 0, 1178, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1180, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1183, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1176, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1182, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                "height": 15,
                "id": 4,
                "name": "Enemies",
                "opacity": 1,
                "type": "tilelayer",
                "visible": true,
                "width": 296,
                "x": 0,
                "y": 0
            },
            {
                "data": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 27, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 26, 26, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                "height": 15,
                "id": 2,
                "name": "Solid",
                "opacity": 0.5,
                "type": "tilelayer",
                "visible": true,
                "width": 296,
                "x": 0,
                "y": 0
            }
        ],
        "nextlayerid": 6,
        "nextobjectid": 1,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.8.5",
        "tileheight": 16,
        "tilesets": [
            {
                "columns": 5,
                "firstgid": 1,
                "image": "../Images/KelvinShadewing/solid.png",
                "imageheight": 192,
                "imagewidth": 80,
                "margin": 0,
                "name": "Solid",
                "spacing": 0,
                "tilecount": 60,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 11,
                "firstgid": 61,
                "image": "../Images/KelvinShadewing/icecavetiles.png",
                "imageheight": 288,
                "imagewidth": 176,
                "margin": 0,
                "name": "IceCave",
                "spacing": 0,
                "tilecount": 198,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 29,
                "firstgid": 259,
                "image": "../Images/KelvinShadewing/tssnow.png",
                "imageheight": 448,
                "imagewidth": 464,
                "margin": 0,
                "name": "Snow",
                "spacing": 0,
                "tilecount": 812,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 12,
                "firstgid": 1071,
                "image": "../Images/KelvinShadewing/igloo.png",
                "imageheight": 80,
                "imagewidth": 192,
                "margin": 0,
                "name": "Igloo",
                "spacing": 0,
                "tilecount": 60,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 5,
                "firstgid": 1131,
                "image": "../Images/Nemisys/signpost.png",
                "imageheight": 128,
                "imagewidth": 80,
                "margin": 0,
                "name": "Sign",
                "spacing": 0,
                "tilecount": 40,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 5,
                "firstgid": 1171,
                "image": "../Images/dtsudo/EnemySpawns.png",
                "imageheight": 48,
                "imagewidth": 80,
                "margin": 0,
                "name": "EnemySpawns",
                "spacing": 0,
                "tilecount": 15,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 9,
                "firstgid": 1186,
                "image": "../Images/Treetops/treetops.png",
                "imageheight": 208,
                "imagewidth": 144,
                "margin": 0,
                "name": "Treetops",
                "spacing": 0,
                "tilecount": 117,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 14,
                "firstgid": 1303,
                "image": "../Images/Jetrel/tsCastle.png",
                "imageheight": 240,
                "imagewidth": 224,
                "margin": 0,
                "name": "Castle",
                "spacing": 0,
                "tilecount": 210,
                "tileheight": 16,
                "tilewidth": 16
            },
            {
                "columns": 8,
                "firstgid": 1513,
                "image": "../Images/KelvinShadewing/rail.png",
                "imageheight": 48,
                "imagewidth": 128,
                "margin": 0,
                "name": "Rail",
                "spacing": 0,
                "tilecount": 24,
                "tileheight": 16,
                "tilewidth": 16
            }
        ],
        "tilewidth": 16,
        "type": "map",
        "version": "1.8",
        "width": 296
    }
};
let MapDataLevelUtil = ((function () {
    let getDisplayLayer = function (mapData, layerName, display) {
        let layer = [];
        for (let i = 0; i < mapData.width; i++) {
            let array = [];
            for (let j = 0; j < mapData.height; j++) {
                array.push(null);
            }
            layer.push(array);
        }
        let x = 0;
        let y = mapData.height - 1;
        let mapDataLayer = mapData.layers.find(x => x.name === layerName).data;
        for (let id of mapDataLayer) {
            if (id > 0) {
                let correspondingTileset = mapData.tilesets.filter(tileset => tileset.firstgid <= id).sort((a, b) => b.firstgid - a.firstgid)[0];
                let tileset = TilesetUtil.getTilesetFromMapDataTileset(correspondingTileset);
                let spriteNum = id - correspondingTileset.firstgid;
                let tilesetImage = TilesetUtil.getGameImageForTileset(tileset);
                let tilesetImageWidth = display.getWidth(tilesetImage);
                let numberOfSpritesPerRow = Math.floor(tilesetImageWidth / 16);
                let row = 0;
                while (spriteNum >= numberOfSpritesPerRow) {
                    row++;
                    spriteNum -= numberOfSpritesPerRow;
                }
                layer[x][y] = {
                    gameImage: tilesetImage,
                    imageX: spriteNum * 16,
                    imageY: row * 16
                };
            }
            x++;
            if (x === mapData.width) {
                x = 0;
                y--;
            }
        }
        return layer;
    };
    let getForegroundLayer = function (mapData, display) {
        return getDisplayLayer(mapData, "Foreground", display);
    };
    let getMidgroundLayer = function (mapData, display) {
        if (mapData.layers.some(layer => layer.name === "Midground"))
            return getDisplayLayer(mapData, "Midground", display);
        return null;
    };
    let getBackgroundLayer = function (mapData, display) {
        return getDisplayLayer(mapData, "Background", display);
    };
    let getSolidLayer = function (mapData) {
        let solidLayer = [];
        for (let i = 0; i < mapData.width; i++) {
            let array = [];
            for (let j = 0; j < mapData.height; j++) {
                array.push(null);
            }
            solidLayer.push(array);
        }
        let x = 0;
        let y = mapData.height - 1;
        let solidTileset = mapData.tilesets.find(tileset => tileset.name === "Solid");
        let mapDataSolidLayer = mapData.layers.find(x => x.name === "Solid").data;
        for (let id of mapDataSolidLayer) {
            if (id > 0)
                solidLayer[x][y] = id - solidTileset.firstgid;
            x++;
            if (x === mapData.width) {
                x = 0;
                y--;
            }
        }
        return solidLayer;
    };
    let getEnemyTiles = function (mapData) {
        let enemyTiles = [];
        let x = 0;
        let y = mapData.height - 1;
        let enemiesTileset = mapData.tilesets.find(tileset => tileset.name === "EnemySpawns");
        let mapDataEnemiesLayer = mapData.layers.find(x => x.name === "Enemies").data;
        for (let id of mapDataEnemiesLayer) {
            if (id > 0)
                enemyTiles.push({
                    x: x,
                    y: y,
                    id: id - enemiesTileset.firstgid
                });
            x++;
            if (x === mapData.width) {
                x = 0;
                y--;
            }
        }
        return enemyTiles;
    };
    return {
        getForegroundLayer,
        getMidgroundLayer,
        getBackgroundLayer,
        getSolidLayer,
        getEnemyTiles
    };
})());
let MusicVolumePickerUtil = {
    getMusicVolumePicker: function (xPos, yPos, initialVolume, color) {
        let currentVolume = initialVolume;
        let unmuteVolume = currentVolume;
        let isDraggingVolumeSlider = false;
        let processFrame = function (mouseInput, previousMouseInput) {
            let mouseX = mouseInput.getX();
            let mouseY = mouseInput.getY();
            if (mouseInput.isLeftMouseButtonPressed()
                && !previousMouseInput.isLeftMouseButtonPressed()
                && xPos <= mouseX
                && mouseX <= xPos + 40
                && yPos <= mouseY
                && mouseY <= yPos + 50) {
                if (currentVolume === 0) {
                    currentVolume = unmuteVolume === 0 ? 50 : unmuteVolume;
                    unmuteVolume = currentVolume;
                }
                else {
                    unmuteVolume = currentVolume;
                    currentVolume = 0;
                }
            }
            if (mouseInput.isLeftMouseButtonPressed()
                && !previousMouseInput.isLeftMouseButtonPressed()
                && xPos + 50 <= mouseX
                && mouseX <= xPos + 150
                && yPos + 10 <= mouseY
                && mouseY <= yPos + 40) {
                isDraggingVolumeSlider = true;
            }
            if (isDraggingVolumeSlider && mouseInput.isLeftMouseButtonPressed()) {
                let volume = Math.round(mouseX - (xPos + 50));
                if (volume < 0)
                    volume = 0;
                if (volume > 100)
                    volume = 100;
                currentVolume = volume;
                unmuteVolume = currentVolume;
            }
            if (!mouseInput.isLeftMouseButtonPressed())
                isDraggingVolumeSlider = false;
        };
        let getCurrentMusicVolume = function () {
            return currentVolume;
        };
        let render = function (displayOutput) {
            let gameImage;
            let dtColor;
            switch (color) {
                case 0 /* VolumePickerColor.Black */:
                    gameImage = currentVolume > 0 ? 2 /* GameImage.MusicOn_Black */ : 3 /* GameImage.MusicOff_Black */;
                    dtColor = black;
                    break;
                case 1 /* VolumePickerColor.White */:
                    gameImage = currentVolume > 0 ? 6 /* GameImage.MusicOn_White */ : 7 /* GameImage.MusicOff_White */;
                    dtColor = white;
                    break;
            }
            displayOutput.drawImage(gameImage, xPos, yPos);
            displayOutput.drawRectangle(xPos + 50, yPos + 10, 101, 31, dtColor, false);
            if (currentVolume > 0)
                displayOutput.drawRectangle(xPos + 50, yPos + 10, currentVolume, 31, dtColor, true);
        };
        return {
            processFrame,
            getCurrentMusicVolume,
            render
        };
    }
};
let OverworldFrame = ((function () {
    let getFrame = function (globalState, sessionState) {
        let overworldMap = OverworldMapGeneration.generateOverworldMap(sessionState.overworldMapSeed);
        let playerTileX = sessionState.overworldLocation.tileX;
        let playerTileY = sessionState.overworldLocation.tileY;
        let playerXMibi = (playerTileX * 48 + 24) * 1024;
        let playerYMibi = (playerTileY * 48 + 24) * 1024;
        let animationFrameCounter = 0;
        let destinationTile = null;
        let reachableTiles = OverworldMapUtil.getReachableTiles(overworldMap, sessionState.completedLevels);
        let reachableTilesMap = {};
        for (let reachableTile of reachableTiles) {
            reachableTilesMap[reachableTile.tileX + "_" + reachableTile.tileY] = true;
        }
        let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
            musicOutput.playMusic(5 /* GameMusic.OverworldTheme */, 100);
            if (destinationTile === null) {
                animationFrameCounter = 0;
                if (sessionState.overworldLocation.tileX !== playerTileX || sessionState.overworldLocation.tileY !== playerTileY) {
                    sessionState.overworldLocation.tileX = playerTileX;
                    sessionState.overworldLocation.tileY = playerTileY;
                    globalState.saveAndLoadData.saveSessionState(sessionState);
                }
                if (keyboardInput.isPressed(38 /* Key.LeftArrow */) && playerTileX > 0 && reachableTilesMap[(playerTileX - 1) + "_" + playerTileY])
                    destinationTile = { tileX: playerTileX - 1, tileY: playerTileY };
                if (keyboardInput.isPressed(39 /* Key.RightArrow */) && playerTileX + 1 < overworldMap.widthInTiles && reachableTilesMap[(playerTileX + 1) + "_" + playerTileY])
                    destinationTile = { tileX: playerTileX + 1, tileY: playerTileY };
                if (keyboardInput.isPressed(37 /* Key.DownArrow */) && playerTileY > 0 && reachableTilesMap[playerTileX + "_" + (playerTileY - 1)])
                    destinationTile = { tileX: playerTileX, tileY: playerTileY - 1 };
                if (keyboardInput.isPressed(36 /* Key.UpArrow */) && playerTileY + 1 < overworldMap.heightInTiles && reachableTilesMap[playerTileX + "_" + (playerTileY + 1)])
                    destinationTile = { tileX: playerTileX, tileY: playerTileY + 1 };
            }
            else {
                let destinationXMibi = (destinationTile.tileX * 48 + 24) * 1024;
                let destinationYMibi = (destinationTile.tileY * 48 + 24) * 1024;
                let distanceToDestination = Math.abs(destinationXMibi - playerXMibi) + Math.abs(destinationYMibi - playerYMibi);
                if (distanceToDestination <= 4000) {
                    let newDestinationTile = null;
                    if (overworldMap.tiles[destinationTile.tileX][destinationTile.tileY].tileType === 0 /* OverworldMapTileType.Path */) {
                        let possibleNewDestinations = [];
                        if (destinationTile.tileX > 0 && reachableTilesMap[(destinationTile.tileX - 1) + "_" + destinationTile.tileY])
                            possibleNewDestinations.push({ tileX: destinationTile.tileX - 1, tileY: destinationTile.tileY });
                        if (destinationTile.tileX + 1 < overworldMap.widthInTiles && reachableTilesMap[(destinationTile.tileX + 1) + "_" + destinationTile.tileY])
                            possibleNewDestinations.push({ tileX: destinationTile.tileX + 1, tileY: destinationTile.tileY });
                        if (destinationTile.tileY > 0 && reachableTilesMap[destinationTile.tileX + "_" + (destinationTile.tileY - 1)])
                            possibleNewDestinations.push({ tileX: destinationTile.tileX, tileY: destinationTile.tileY - 1 });
                        if (destinationTile.tileY + 1 < overworldMap.heightInTiles && reachableTilesMap[destinationTile.tileX + "_" + (destinationTile.tileY + 1)])
                            possibleNewDestinations.push({ tileX: destinationTile.tileX, tileY: destinationTile.tileY + 1 });
                        if (possibleNewDestinations.length === 2) {
                            for (let possibleNewDestination of possibleNewDestinations) {
                                if (possibleNewDestination.tileX !== playerTileX || possibleNewDestination.tileY !== playerTileY) {
                                    newDestinationTile = possibleNewDestination;
                                }
                            }
                        }
                    }
                    playerTileX = destinationTile.tileX;
                    playerTileY = destinationTile.tileY;
                    playerXMibi = destinationXMibi;
                    playerYMibi = destinationYMibi;
                    destinationTile = newDestinationTile;
                }
                else {
                    if (destinationXMibi > playerXMibi)
                        playerXMibi += 4000;
                    else if (destinationXMibi < playerXMibi)
                        playerXMibi -= 4000;
                    else if (destinationYMibi > playerYMibi)
                        playerYMibi += 4000;
                    else if (destinationYMibi < playerYMibi)
                        playerYMibi -= 4000;
                    else
                        throw new Error("Unreachable");
                }
            }
            if (keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)
                || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
                || keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)) {
                let playerTile = overworldMap.tiles[playerTileX][playerTileY];
                if (destinationTile === null && playerTile.tileType === 2 /* OverworldMapTileType.Level */) {
                    soundOutput.playSound(0 /* GameSound.Click */, 100);
                    if (sessionState.overworldLocation.tileX !== playerTileX || sessionState.overworldLocation.tileY !== playerTileY) {
                        sessionState.overworldLocation.tileX = playerTileX;
                        sessionState.overworldLocation.tileY = playerTileY;
                        globalState.saveAndLoadData.saveSessionState(sessionState);
                    }
                    return LevelStartFrame.getFrame(globalState, sessionState, playerTile.level, thisFrame);
                }
            }
            if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */)) {
                soundOutput.playSound(0 /* GameSound.Click */, 100);
                return OverworldPauseMenuFrame.getFrame(globalState, sessionState, thisFrame);
            }
            animationFrameCounter++;
            return thisFrame;
        };
        let render = function (displayOutput) {
            let isMoving = destinationTile !== null;
            OverworldMapRenderer.render(playerXMibi, playerYMibi, isMoving, animationFrameCounter, overworldMap, [...sessionState.completedLevels], displayOutput);
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
let OverworldMapGeneration = {
    generateOverworldMap: function (rngSeed) {
        let generateBackgroundTile = function (random) {
            return {
                gameImage: 25 /* GameImage.OverworldTileset_Snow */,
                imageX: random.nextInt(3) * 16,
                imageY: 80
            };
        };
        let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
        let widthInTiles = Math.ceil(GlobalConstants.WINDOW_WIDTH / 48);
        let heightInTiles = Math.ceil(GlobalConstants.WINDOW_HEIGHT / 48);
        let overworldMap = [];
        for (let i = 0; i < widthInTiles; i++) {
            let array = [];
            for (let j = 0; j < heightInTiles; j++) {
                array.push({
                    tileType: 1 /* OverworldMapTileType.NonPath */,
                    level: null,
                    shouldShowLevelIcon: null,
                    backgroundTile: generateBackgroundTile(rng),
                    foregroundTile: null
                });
            }
            overworldMap.push(array);
        }
        overworldMap[4][5] = {
            tileType: 2 /* OverworldMapTileType.Level */,
            level: 0 /* Level.Level1 */,
            shouldShowLevelIcon: true,
            backgroundTile: generateBackgroundTile(rng),
            foregroundTile: {
                gameImage: 26 /* GameImage.OverworldTileset_PathDirt */,
                imageX: 16,
                imageY: 112
            }
        };
        overworldMap[9][5] = {
            tileType: 2 /* OverworldMapTileType.Level */,
            level: 1 /* Level.Level2 */,
            shouldShowLevelIcon: true,
            backgroundTile: generateBackgroundTile(rng),
            foregroundTile: {
                gameImage: 26 /* GameImage.OverworldTileset_PathDirt */,
                imageX: 32,
                imageY: 48
            }
        };
        overworldMap[14][5] = {
            tileType: 2 /* OverworldMapTileType.Level */,
            level: 2 /* Level.Level3 */,
            shouldShowLevelIcon: false,
            backgroundTile: generateBackgroundTile(rng),
            foregroundTile: null
        };
        for (let i = 5; i <= 8; i++) {
            overworldMap[i][5] = {
                tileType: 0 /* OverworldMapTileType.Path */,
                level: null,
                shouldShowLevelIcon: null,
                backgroundTile: generateBackgroundTile(rng),
                foregroundTile: {
                    gameImage: 26 /* GameImage.OverworldTileset_PathDirt */,
                    imageX: 32,
                    imageY: 48
                }
            };
        }
        for (let i = 10; i <= 13; i++) {
            overworldMap[i][5] = {
                tileType: 0 /* OverworldMapTileType.Path */,
                level: null,
                shouldShowLevelIcon: null,
                backgroundTile: generateBackgroundTile(rng),
                foregroundTile: i < 12
                    ? { gameImage: 26 /* GameImage.OverworldTileset_PathDirt */, imageX: 32, imageY: 48 }
                    : null
            };
        }
        overworldMap[12][5].foregroundTile = {
            gameImage: 26 /* GameImage.OverworldTileset_PathDirt */,
            imageX: 32,
            imageY: 112
        };
        overworldMap[13][6].foregroundTile = {
            gameImage: 27 /* GameImage.OverworldTileset_TownsSnow */,
            imageX: 240,
            imageY: 0
        };
        overworldMap[13][5].foregroundTile = {
            gameImage: 27 /* GameImage.OverworldTileset_TownsSnow */,
            imageX: 240,
            imageY: 16
        };
        overworldMap[13][4].foregroundTile = {
            gameImage: 27 /* GameImage.OverworldTileset_TownsSnow */,
            imageX: 240,
            imageY: 32
        };
        overworldMap[14][6].foregroundTile = {
            gameImage: 27 /* GameImage.OverworldTileset_TownsSnow */,
            imageX: 256,
            imageY: 0
        };
        overworldMap[14][5].foregroundTile = {
            gameImage: 27 /* GameImage.OverworldTileset_TownsSnow */,
            imageX: 256,
            imageY: 16
        };
        overworldMap[14][4].foregroundTile = {
            gameImage: 27 /* GameImage.OverworldTileset_TownsSnow */,
            imageX: 256,
            imageY: 32
        };
        overworldMap[15][6].foregroundTile = {
            gameImage: 27 /* GameImage.OverworldTileset_TownsSnow */,
            imageX: 272,
            imageY: 0
        };
        overworldMap[15][5].foregroundTile = {
            gameImage: 27 /* GameImage.OverworldTileset_TownsSnow */,
            imageX: 272,
            imageY: 16
        };
        overworldMap[15][4].foregroundTile = {
            gameImage: 27 /* GameImage.OverworldTileset_TownsSnow */,
            imageX: 272,
            imageY: 32
        };
        return {
            tiles: overworldMap,
            widthInTiles,
            heightInTiles
        };
    }
};
let OverworldMapRenderer = ((function () {
    let render = function (playerXMibi, playerYMibi, isMoving, animationFrameCounter, overworldMap, completedLevels, displayOutput) {
        let cameraX = (playerXMibi >> 10) - Math.floor(GlobalConstants.WINDOW_WIDTH / 2);
        let cameraY = (playerYMibi >> 10) - Math.floor(GlobalConstants.WINDOW_HEIGHT / 2);
        let maxCameraX = overworldMap.widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH;
        let maxCameraY = overworldMap.heightInTiles * 48 - GlobalConstants.WINDOW_HEIGHT;
        if (cameraX < 0)
            cameraX = 0;
        if (cameraX > maxCameraX)
            cameraX = maxCameraX;
        if (cameraY < 0)
            cameraY = 0;
        if (cameraY > maxCameraY)
            cameraY = maxCameraY;
        let minJ = 0;
        let maxJ = overworldMap.heightInTiles - 1;
        for (let i = 0; i < overworldMap.widthInTiles; i++) {
            if (i * 48 - cameraX + 48 < 0)
                continue;
            if (i * 48 - cameraX > GlobalConstants.WINDOW_WIDTH)
                break;
            for (let j = minJ; j <= maxJ; j++) {
                if (j * 48 - cameraY + 48 < 0) {
                    minJ = j + 1;
                    continue;
                }
                if (j * 48 - cameraY > GlobalConstants.WINDOW_HEIGHT) {
                    maxJ = j - 1;
                    break;
                }
                let tile = overworldMap.tiles[i][j];
                if (tile.backgroundTile !== null)
                    displayOutput.drawImageRotatedClockwise(tile.backgroundTile.gameImage, tile.backgroundTile.imageX, tile.backgroundTile.imageY, 16, 16, i * 48 - cameraX, j * 48 - cameraY, 0, 128 * 3);
                if (tile.foregroundTile !== null)
                    displayOutput.drawImageRotatedClockwise(tile.foregroundTile.gameImage, tile.foregroundTile.imageX, tile.foregroundTile.imageY, 16, 16, i * 48 - cameraX, j * 48 - cameraY, 0, 128 * 3);
                if (tile.tileType === 2 /* OverworldMapTileType.Level */ && tile.shouldShowLevelIcon === true) {
                    let hasCompletedLevel = completedLevels.includes(tile.level);
                    displayOutput.drawImageRotatedClockwise(28 /* GameImage.LevelIcons */, hasCompletedLevel ? 16 : 0, 0, 16, 16, i * 48 - cameraX, j * 48 - cameraY, 0, 128 * 3);
                }
            }
        }
        let konqiImageX;
        if (isMoving)
            konqiImageX = (Math.floor(animationFrameCounter / 15) % 4) * 14;
        else
            konqiImageX = 0;
        displayOutput.drawImageRotatedClockwise(29 /* GameImage.KonqiO */, konqiImageX, 0, 14, 20, (playerXMibi >> 10) - 7 * 3 - cameraX, (playerYMibi >> 10) - 2 * 3 - cameraY, 0, 128 * 3);
    };
    return {
        render
    };
})());
let OverworldMapUtil = {
    getLevelLocations: function (overworldMap) {
        let returnValue = {};
        for (let i = 0; i < overworldMap.widthInTiles; i++) {
            for (let j = 0; j < overworldMap.heightInTiles; j++) {
                let tile = overworldMap.tiles[i][j];
                if (tile.tileType === 2 /* OverworldMapTileType.Level */) {
                    returnValue[tile.level] = { tileX: i, tileY: j };
                }
            }
        }
        return returnValue;
    },
    getReachableTiles: function (overworldMap, completedLevels) {
        let levelLocations = OverworldMapUtil.getLevelLocations(overworldMap);
        if (completedLevels.length === 0)
            return [levelLocations[0 /* Level.Level1 */]];
        let returnValue = [];
        let processedTiles = {};
        let tilesToProcess = [];
        for (let completedLevel of completedLevels) {
            tilesToProcess.push(levelLocations[completedLevel]);
        }
        while (true) {
            if (tilesToProcess.length === 0)
                break;
            let tileToProcess = tilesToProcess.pop();
            let tileKey = tileToProcess.tileX + "_" + tileToProcess.tileY;
            if (processedTiles[tileKey])
                continue;
            returnValue.push(tileToProcess);
            processedTiles[tileKey] = true;
            let overworldMapTile = overworldMap.tiles[tileToProcess.tileX][tileToProcess.tileY];
            if (overworldMapTile.tileType === 0 /* OverworldMapTileType.Path */ || overworldMapTile.tileType === 2 /* OverworldMapTileType.Level */ && completedLevels.includes(overworldMapTile.level)) {
                if (tileToProcess.tileX > 0 && overworldMap.tiles[tileToProcess.tileX - 1][tileToProcess.tileY].tileType !== 1 /* OverworldMapTileType.NonPath */)
                    tilesToProcess.push({ tileX: tileToProcess.tileX - 1, tileY: tileToProcess.tileY });
                if (tileToProcess.tileX + 1 < overworldMap.widthInTiles && overworldMap.tiles[tileToProcess.tileX + 1][tileToProcess.tileY].tileType !== 1 /* OverworldMapTileType.NonPath */)
                    tilesToProcess.push({ tileX: tileToProcess.tileX + 1, tileY: tileToProcess.tileY });
                if (tileToProcess.tileY > 0 && overworldMap.tiles[tileToProcess.tileX][tileToProcess.tileY - 1].tileType !== 1 /* OverworldMapTileType.NonPath */)
                    tilesToProcess.push({ tileX: tileToProcess.tileX, tileY: tileToProcess.tileY - 1 });
                if (tileToProcess.tileY + 1 < overworldMap.heightInTiles && overworldMap.tiles[tileToProcess.tileX][tileToProcess.tileY + 1].tileType !== 1 /* OverworldMapTileType.NonPath */)
                    tilesToProcess.push({ tileX: tileToProcess.tileX, tileY: tileToProcess.tileY + 1 });
            }
        }
        return returnValue;
    }
};
let OverworldPauseMenuFrame = {};
OverworldPauseMenuFrame.getFrame = function (globalState, sessionState, underlyingFrame) {
    let volumePicker = null;
    /*
        1 = Continue
        2 = Return to title screen
    */
    let option = 1;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume(), 1 /* VolumePickerColor.White */);
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        globalState.saveAndLoadData.saveSoundAndMusicVolume(soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        if (keyboardInput.isPressed(36 /* Key.UpArrow */) && !previousKeyboardInput.isPressed(36 /* Key.UpArrow */)) {
            option--;
            if (option === 0)
                option = 2;
        }
        if (keyboardInput.isPressed(37 /* Key.DownArrow */) && !previousKeyboardInput.isPressed(37 /* Key.DownArrow */)) {
            option++;
            if (option === 3)
                option = 1;
        }
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return underlyingFrame;
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            switch (option) {
                case 1: return underlyingFrame;
                case 2: return TitleScreenFrame.getFrame(globalState, sessionState);
                default: throw new Error("Unrecognized option");
            }
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        underlyingFrame.render(displayOutput);
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: 175 }, true);
        if (volumePicker !== null)
            volumePicker.render(displayOutput);
        displayOutput.drawText(400, 600, "Paused", 0 /* GameFont.SimpleFont */, 48, white);
        displayOutput.drawText(365, 500, "Continue", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(365, 400, "Return to title screen", 0 /* GameFont.SimpleFont */, 24, white);
        let y;
        switch (option) {
            case 1:
                y = 473;
                break;
            case 2:
                y = 373;
                break;
            default:
                throw new Error("Unrecognized option");
        }
        displayOutput.drawRectangle(362, y, 275, 30, white, false);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
let PauseMenuFrame = {};
PauseMenuFrame.getFrame = function (globalState, sessionState, underlyingFrame, level, difficulty) {
    let volumePicker = null;
    /*
        1 = Continue
        2 = Restart level
        3 = Return to overworld
    */
    let option = 1;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume(), 1 /* VolumePickerColor.White */);
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        globalState.saveAndLoadData.saveSoundAndMusicVolume(soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        if (keyboardInput.isPressed(36 /* Key.UpArrow */) && !previousKeyboardInput.isPressed(36 /* Key.UpArrow */)) {
            option--;
            if (option === 0)
                option = 3;
        }
        if (keyboardInput.isPressed(37 /* Key.DownArrow */) && !previousKeyboardInput.isPressed(37 /* Key.DownArrow */)) {
            option++;
            if (option === 4)
                option = 1;
        }
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return underlyingFrame;
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            switch (option) {
                case 1: return underlyingFrame;
                case 2: return GameFrame.getFrame(globalState, sessionState, GameStateUtil.getInitialGameState(level, difficulty, displayProcessing));
                case 3: return OverworldFrame.getFrame(globalState, sessionState);
                default: throw new Error("Unrecognized option");
            }
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        underlyingFrame.render(displayOutput);
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: 175 }, true);
        if (volumePicker !== null)
            volumePicker.render(displayOutput);
        displayOutput.drawText(400, 600, "Paused", 0 /* GameFont.SimpleFont */, 48, white);
        displayOutput.drawText(365, 500, "Continue", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(365, 400, "Restart level", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(365, 300, "Quit level and return to map", 0 /* GameFont.SimpleFont */, 24, white);
        let y;
        switch (option) {
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
                throw new Error("Unrecognized option");
        }
        displayOutput.drawRectangle(362, y, 350, 30, white, false);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
let PlayerBulletStateProcessing = {
    processFrame: function (gameState) {
        let currentPlayerBullets = gameState.playerBulletState.playerBullets;
        let tilemap = gameState.tilemap;
        let newPlayerBullets = [];
        for (let currentPlayerBullet of currentPlayerBullets) {
            currentPlayerBullet.xMibi += currentPlayerBullet.xSpeedInMibipixelsPerFrame;
            currentPlayerBullet.yMibi += currentPlayerBullet.ySpeedInMibipixelsPerFrame;
            let newX = currentPlayerBullet.xMibi >> 10;
            let newY = currentPlayerBullet.yMibi >> 10;
            if (newX < -50 || newX > GlobalConstants.WINDOW_WIDTH + 50 || newY < -50 || newY > GlobalConstants.WINDOW_HEIGHT + 50)
                continue;
            if (tilemap.isSolid(currentPlayerBullet.xMibi, currentPlayerBullet.yMibi))
                continue;
            newPlayerBullets.push(currentPlayerBullet);
        }
        gameState.playerBulletState.playerBullets = newPlayerBullets;
    }
};
let PlayerStateProcessing = {
    processFrame: function (gameState, frameInput, soundOutput) {
        if (gameState.playerState.isDeadFrameCount !== null) {
            gameState.playerState.isDeadFrameCount++;
            if (gameState.playerState.isDeadFrameCount === 1)
                soundOutput.playSound(1 /* GameSound.Cut */, 100);
        }
        if (gameState.playerState.isDeadFrameCount === null) {
            PlayerStateProcessing_Movement.processPlayerMovement(gameState, frameInput, soundOutput);
            if (gameState.playerState.attackCooldown > 0)
                gameState.playerState.attackCooldown--;
            if (gameState.playerState.attackSoundCooldown > 0)
                gameState.playerState.attackSoundCooldown--;
            if (frameInput.shoot && gameState.playerState.attackCooldown <= 0) {
                gameState.playerState.attackCooldown = 2;
                if (gameState.playerState.attackSoundCooldown <= 0) {
                    gameState.playerState.attackSoundCooldown = 8;
                    soundOutput.playSound(2 /* GameSound.PlayerShoot */, 100);
                }
                let rng = DTDeterministicRandomUtil.getRandom(gameState.rngSeed);
                for (let i = 0; i < 3; i++) {
                    let xSpeedInMibipixelsPerFrame = 7500 + rng.nextInt(3500);
                    let ySpeedInMibipixelsPerFrame = rng.nextInt(4000) - 2000;
                    let arctanScaled = DTMath.arcTangentScaled(xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame);
                    arctanScaled = -arctanScaled - 90 * 128;
                    let newPlayerBullet = {
                        xMibi: gameState.playerState.xMibi,
                        yMibi: gameState.playerState.yMibi,
                        xSpeedInMibipixelsPerFrame: xSpeedInMibipixelsPerFrame,
                        ySpeedInMibipixelsPerFrame: ySpeedInMibipixelsPerFrame,
                        displayRotationScaled: arctanScaled,
                        animationOffset: rng.nextInt(1000)
                    };
                    gameState.playerBulletState.playerBullets.push(newPlayerBullet);
                }
                gameState.rngSeed = rng.getSeed();
            }
        }
    }
};
let PlayerStateProcessing_Movement = ((function () {
    let collidesWithTilemap = function (xMibi, yMibi, tilemap) {
        return tilemap.isSolid(xMibi + 7 * 3 * 1024, yMibi + 9 * 3 * 1024) && !tilemap.isDeadly(xMibi + 7 * 3 * 1024, yMibi + 9 * 3 * 1024)
            || tilemap.isSolid(xMibi + 7 * 3 * 1024, yMibi + 0 * 3 * 1024) && !tilemap.isDeadly(xMibi + 7 * 3 * 1024, yMibi + 0 * 3 * 1024)
            || tilemap.isSolid(xMibi + 7 * 3 * 1024, yMibi - 13 * 3 * 1024) && !tilemap.isDeadly(xMibi + 7 * 3 * 1024, yMibi - 13 * 3 * 1024)
            || tilemap.isSolid(xMibi - 7 * 3 * 1024, yMibi + 9 * 3 * 1024) && !tilemap.isDeadly(xMibi - 7 * 3 * 1024, yMibi + 9 * 3 * 1024)
            || tilemap.isSolid(xMibi - 7 * 3 * 1024, yMibi + 0 * 3 * 1024) && !tilemap.isDeadly(xMibi - 7 * 3 * 1024, yMibi + 0 * 3 * 1024)
            || tilemap.isSolid(xMibi - 7 * 3 * 1024, yMibi - 13 * 3 * 1024) && !tilemap.isDeadly(xMibi - 7 * 3 * 1024, yMibi - 13 * 3 * 1024);
    };
    let processPlayerMovementHelper = function (gameState, frameInput) {
        let tilemap = gameState.tilemap;
        let collidedWithTilemap = false;
        let playerXMibi = gameState.playerState.xMibi;
        let playerYMibi = gameState.playerState.yMibi;
        let up = frameInput.up;
        let down = frameInput.down;
        let left = frameInput.left;
        let right = frameInput.right;
        let movingDiagonally = up && left || up && right || down && left || down && right;
        let xDelta = 0;
        let yDelta = 0;
        let movement = (movingDiagonally ? 3536 : 5000);
        if (up)
            yDelta += movement;
        else if (down)
            yDelta -= movement;
        if (right)
            xDelta += movement;
        else if (left)
            xDelta -= movement;
        let remainingXDelta = 0;
        if (collidesWithTilemap(playerXMibi + xDelta, playerYMibi, tilemap)) {
            collidedWithTilemap = true;
            while (true) {
                if (xDelta > 0) {
                    xDelta -= 1;
                    remainingXDelta += 1;
                    if (xDelta <= 0) {
                        xDelta = 0;
                        break;
                    }
                }
                else {
                    xDelta += 1;
                    remainingXDelta -= 1;
                    if (xDelta >= 0) {
                        xDelta = 0;
                        break;
                    }
                }
                if (!collidesWithTilemap(playerXMibi + xDelta, playerYMibi, tilemap)) {
                    playerXMibi += xDelta;
                    break;
                }
            }
        }
        else {
            playerXMibi += xDelta;
        }
        if (collidesWithTilemap(playerXMibi, playerYMibi + yDelta, tilemap)) {
            collidedWithTilemap = true;
            while (true) {
                if (yDelta > 0) {
                    yDelta -= 1;
                    if (yDelta <= 0) {
                        yDelta = 0;
                        break;
                    }
                }
                else {
                    yDelta += 1;
                    if (yDelta >= 0) {
                        yDelta = 0;
                        break;
                    }
                }
                if (!collidesWithTilemap(playerXMibi, playerYMibi + yDelta, tilemap)) {
                    playerYMibi += yDelta;
                    break;
                }
            }
        }
        else {
            playerYMibi += yDelta;
        }
        if (collidesWithTilemap(playerXMibi + remainingXDelta, playerYMibi, tilemap)) {
            collidedWithTilemap = true;
            while (true) {
                if (remainingXDelta > 0) {
                    remainingXDelta -= 1;
                    if (remainingXDelta <= 0) {
                        remainingXDelta = 0;
                        break;
                    }
                }
                else {
                    remainingXDelta += 1;
                    if (remainingXDelta >= 0) {
                        remainingXDelta = 0;
                        break;
                    }
                }
                if (!collidesWithTilemap(playerXMibi + remainingXDelta, playerYMibi, tilemap)) {
                    playerXMibi += remainingXDelta;
                    break;
                }
            }
        }
        else {
            playerXMibi += remainingXDelta;
        }
        if (playerXMibi < 32 * 1024)
            playerXMibi = 32 * 1024;
        if (playerXMibi > (GlobalConstants.WINDOW_WIDTH - 24) << 10)
            playerXMibi = (GlobalConstants.WINDOW_WIDTH - 24) << 10;
        if (playerYMibi < 39 * 1024)
            playerYMibi = 39 * 1024;
        if (playerYMibi > (GlobalConstants.WINDOW_HEIGHT - 35) << 10)
            playerYMibi = (GlobalConstants.WINDOW_HEIGHT - 35) << 10;
        return {
            updatedXMibi: playerXMibi,
            updatedYMibi: playerYMibi,
            collidedWithTilemap
        };
    };
    let processPlayerMovement = function (gameState, frameInput, soundOutput) {
        let tilemap = gameState.tilemap;
        if (collidesWithTilemap(gameState.playerState.xMibi, gameState.playerState.yMibi, tilemap)) {
            let tilemapXVelocity = tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            gameState.playerState.xMibi += tilemapXVelocity;
            if (gameState.playerState.xMibi < 32 * 1024) {
                gameState.playerState.xMibi = 32 * 1024;
                let canSurvive = false;
                for (let i = 0; i < 10; i++) {
                    if (!collidesWithTilemap(32 * 1024, gameState.playerState.yMibi + i * 1024, tilemap)) {
                        gameState.playerState.yMibi = gameState.playerState.yMibi + i * 1024;
                        canSurvive = true;
                        break;
                    }
                    if (!collidesWithTilemap(32 * 1024, gameState.playerState.yMibi - i * 1024, tilemap)) {
                        gameState.playerState.yMibi = gameState.playerState.yMibi - i * 1024;
                        canSurvive = true;
                        break;
                    }
                }
                if (!canSurvive) {
                    gameState.playerState.isDeadFrameCount = 0;
                    return;
                }
            }
        }
        let up = frameInput.up;
        let down = frameInput.down;
        let left = frameInput.left;
        let right = frameInput.right;
        let movingDiagonally = up && left || up && right || down && left || down && right;
        let playerMovement = processPlayerMovementHelper(gameState, frameInput);
        if (!movingDiagonally && playerMovement.collidedWithTilemap) {
            let bestPlayerMovement = playerMovement;
            let bestDistance = left || right
                ? Math.abs(bestPlayerMovement.updatedXMibi - gameState.playerState.xMibi)
                : Math.abs(bestPlayerMovement.updatedYMibi - gameState.playerState.yMibi);
            if (up || left) {
                let tryFrameInput = {
                    up: true,
                    down: false,
                    left: true,
                    right: false,
                    shoot: false,
                    continueDialogue: false,
                    debug_toggleInvulnerability: false
                };
                let tryPlayerMovement = processPlayerMovementHelper(gameState, tryFrameInput);
                let tryDistance = left || right
                    ? Math.abs(tryPlayerMovement.updatedXMibi - gameState.playerState.xMibi)
                    : Math.abs(tryPlayerMovement.updatedYMibi - gameState.playerState.yMibi);
                if (tryDistance > bestDistance) {
                    bestPlayerMovement = tryPlayerMovement;
                    bestDistance = tryDistance;
                }
            }
            if (up || right) {
                let tryFrameInput = {
                    up: true,
                    down: false,
                    left: false,
                    right: true,
                    shoot: false,
                    continueDialogue: false,
                    debug_toggleInvulnerability: false
                };
                let tryPlayerMovement = processPlayerMovementHelper(gameState, tryFrameInput);
                let tryDistance = left || right
                    ? Math.abs(tryPlayerMovement.updatedXMibi - gameState.playerState.xMibi)
                    : Math.abs(tryPlayerMovement.updatedYMibi - gameState.playerState.yMibi);
                if (tryDistance > bestDistance) {
                    bestPlayerMovement = tryPlayerMovement;
                    bestDistance = tryDistance;
                }
            }
            if (down || left) {
                let tryFrameInput = {
                    up: false,
                    down: true,
                    left: true,
                    right: false,
                    shoot: false,
                    continueDialogue: false,
                    debug_toggleInvulnerability: false
                };
                let tryPlayerMovement = processPlayerMovementHelper(gameState, tryFrameInput);
                let tryDistance = left || right
                    ? Math.abs(tryPlayerMovement.updatedXMibi - gameState.playerState.xMibi)
                    : Math.abs(tryPlayerMovement.updatedYMibi - gameState.playerState.yMibi);
                if (tryDistance > bestDistance) {
                    bestPlayerMovement = tryPlayerMovement;
                    bestDistance = tryDistance;
                }
            }
            if (down || right) {
                let tryFrameInput = {
                    up: false,
                    down: true,
                    left: false,
                    right: true,
                    shoot: false,
                    continueDialogue: false,
                    debug_toggleInvulnerability: false
                };
                let tryPlayerMovement = processPlayerMovementHelper(gameState, tryFrameInput);
                let tryDistance = left || right
                    ? Math.abs(tryPlayerMovement.updatedXMibi - gameState.playerState.xMibi)
                    : Math.abs(tryPlayerMovement.updatedYMibi - gameState.playerState.yMibi);
                if (tryDistance > bestDistance) {
                    bestPlayerMovement = tryPlayerMovement;
                    bestDistance = tryDistance;
                }
            }
            gameState.playerState.xMibi = bestPlayerMovement.updatedXMibi;
            gameState.playerState.yMibi = bestPlayerMovement.updatedYMibi;
        }
        else {
            gameState.playerState.xMibi = playerMovement.updatedXMibi;
            gameState.playerState.yMibi = playerMovement.updatedYMibi;
        }
        if (tilemap.isDeadly(gameState.playerState.xMibi, gameState.playerState.yMibi) && !gameState.debug_isInvulnerable) {
            gameState.playerState.isDeadFrameCount = 0;
        }
    };
    return {
        processPlayerMovement
    };
})());
let ReplayCollectionUtil = {
    serializeReplayCollection: function (replayCollection) {
        let byteListBuilder = ByteListUtil.getByteListBuilder();
        byteListBuilder.addInt(replayCollection.nextReplayId);
        byteListBuilder.addInt(replayCollection.replays.length);
        for (let replay of replayCollection.replays) {
            let serializedReplay = ReplayUtil.serializeReplay(replay);
            byteListBuilder.addByteList(serializedReplay);
        }
        return byteListBuilder.toByteList();
    },
    deserializeReplayCollection: function (serializedReplayCollection) {
        let byteListIterator = ByteListUtil.getByteListIterator(serializedReplayCollection);
        let nextReplayId = byteListIterator.popInt();
        let length = byteListIterator.popInt();
        let replays = [];
        for (let i = 0; i < length; i++) {
            let serializedReplay = byteListIterator.popByteList();
            let replay = ReplayUtil.deserializeReplay(serializedReplay);
            replays.push(replay);
        }
        if (byteListIterator.hasNextByte())
            throw new Error("Invalid serializedReplayCollection");
        return {
            nextReplayId: nextReplayId,
            replays: replays
        };
    }
};
let ReplayFrame = {};
ReplayFrame.getFrame = function (globalState, sessionState, frameInputHistory, level, difficulty, displayProcessing) {
    let gameState = GameStateUtil.getInitialGameState(level, difficulty, displayProcessing);
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
            return ReplayPauseMenuFrame.getFrame(globalState, sessionState, thisFrame, gameState.level, gameState.difficulty, frameInputHistory);
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
        if (globalState.debugMode && keyboardInput.isPressed(27 /* Key.One */)) {
            let emptyKeyboard = EmptyKeyboard.getEmptyKeyboard();
            let emptyMouse = EmptyMouse.getEmptyMouse();
            for (let i = 0; i < 80; i++) {
                frame = getNextFrameHelper({ keyboardInput: emptyKeyboard, mouseInput: emptyMouse, previousKeyboardInput: emptyKeyboard, previousMouseInput: emptyMouse, displayProcessing, soundOutput, musicOutput, thisFrame });
            }
        }
        if (endLevelCounter !== null)
            endLevelCounter++;
        if (endLevelCounter === GameFrame.END_LEVEL_NUM_FRAMES_TO_WAIT) {
            let overworldFrame = OverworldFrame.getFrame(globalState, sessionState);
            return FadeInFrame.getFrame({
                alpha: GameFrame.getAlphaForEndLevelFadeOut(endLevelCounter),
                underlyingFrame: overworldFrame
            });
        }
        return frame;
    };
    let getNextFrameHelper = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(23 /* Key.X */) && endLevelCounter === null) {
            if (savedGameState !== null) {
                gameState = GameStateUtil.getSnapshot(savedGameState);
                return thisFrame;
            }
        }
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
            if (endLevelCounter !== null) {
                let volumeAdjustment = Math.floor(100 * (GameFrame.END_LEVEL_NUM_FRAMES_TO_WAIT - endLevelCounter) / GameFrame.END_LEVEL_NUM_FRAMES_TO_WAIT);
                if (volumeAdjustment > 100)
                    volumeAdjustment = 100;
                if (volumeAdjustment < 0)
                    volumeAdjustment = 0;
                soundOutput = SoftSoundOutput.getSoundOutput({ volume: volumeAdjustment, underlyingSoundOutput: soundOutput });
                musicOutput = SoftMusicOutput.getMusicOutput({ volume: volumeAdjustment, underlyingMusicOutput: musicOutput });
            }
            let result = GameStateProcessing.processFrame(gameState, frameInput, soundOutput, musicOutput);
            if (result.shouldEndLevel && endLevelCounter === null)
                endLevelCounter = 0;
        }
        if (keyboardInput.isPressed(2 /* Key.C */) && gameState.playerState.isDeadFrameCount === null)
            savedGameState = GameStateUtil.getSnapshot(gameState);
        return thisFrame;
    };
    let render = function (displayOutput) {
        let debug_renderDamageboxes = false;
        let debug_renderHitboxes = false;
        GameStateRendering.render(gameState, displayOutput, false, debug_renderDamageboxes, debug_renderHitboxes);
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
let ReplayPauseMenuFrame = {};
ReplayPauseMenuFrame.getFrame = function (globalState, sessionState, underlyingFrame, level, difficulty, frameInputHistory) {
    let volumePicker = null;
    /*
        1 = Continue
        2 = Restart replay
        3 = Return to overworld
    */
    let option = 1;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume(), 1 /* VolumePickerColor.White */);
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        globalState.saveAndLoadData.saveSoundAndMusicVolume(soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        if (keyboardInput.isPressed(36 /* Key.UpArrow */) && !previousKeyboardInput.isPressed(36 /* Key.UpArrow */)) {
            option--;
            if (option === 0)
                option = 3;
        }
        if (keyboardInput.isPressed(37 /* Key.DownArrow */) && !previousKeyboardInput.isPressed(37 /* Key.DownArrow */)) {
            option++;
            if (option === 4)
                option = 1;
        }
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return underlyingFrame;
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            switch (option) {
                case 1: return underlyingFrame;
                case 2: return ReplayFrame.getFrame(globalState, sessionState, frameInputHistory, level, difficulty, displayProcessing);
                case 3: return OverworldFrame.getFrame(globalState, sessionState);
                default: throw new Error("Unrecognized option");
            }
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        underlyingFrame.render(displayOutput);
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: 175 }, true);
        if (volumePicker !== null)
            volumePicker.render(displayOutput);
        displayOutput.drawText(400, 600, "Paused", 0 /* GameFont.SimpleFont */, 48, white);
        displayOutput.drawText(365, 500, "Continue", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(365, 400, "Restart replay", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(365, 300, "Quit replay and return to map", 0 /* GameFont.SimpleFont */, 24, white);
        let y;
        switch (option) {
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
                throw new Error("Unrecognized option");
        }
        displayOutput.drawRectangle(362, y, 370, 30, white, false);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
let ReplayUtil = ((function () {
    let generateReplayFromFrameInputHistory = function ({ frameInputHistory, level, difficulty, replayId }) {
        let reversedFrameInputs = [];
        while (true) {
            reversedFrameInputs.push(frameInputHistory.frameInput);
            if (frameInputHistory.previousFrameInputs === null)
                break;
            frameInputHistory = frameInputHistory.previousFrameInputs;
        }
        return {
            replayId: replayId,
            frameInputs: [...reversedFrameInputs].reverse(),
            level: level,
            difficulty: difficulty
        };
    };
    let generateFrameInputHistoryFromReplay = function (replay) {
        let frameInputHistory = null;
        let index = 0;
        for (let frameInput of replay.frameInputs) {
            frameInputHistory = {
                frameInput: frameInput,
                index: index++,
                previousFrameInputs: frameInputHistory
            };
        }
        return frameInputHistory;
    };
    let serializeFrameInputsToIntList = function (frameInputs) {
        if (frameInputs.length === 0)
            return [];
        let array = [];
        for (let frameInput of frameInputs)
            array.push(frameInput.up);
        for (let frameInput of frameInputs)
            array.push(frameInput.down);
        for (let frameInput of frameInputs)
            array.push(frameInput.left);
        for (let frameInput of frameInputs)
            array.push(frameInput.right);
        for (let frameInput of frameInputs)
            array.push(frameInput.shoot);
        for (let frameInput of frameInputs)
            array.push(frameInput.continueDialogue);
        for (let frameInput of frameInputs)
            array.push(frameInput.debug_toggleInvulnerability);
        let output = [];
        output.push(array.length);
        output.push(array[0] ? 1 : 0);
        for (let i = 1; i < array.length; i++) {
            if (array[i] !== array[i - 1])
                output.push(i);
        }
        return output;
    };
    let serializeReplay = function (replay) {
        let byteListBuilder = ByteListUtil.getByteListBuilder();
        byteListBuilder.addInt(replay.replayId);
        let levelId = LevelUtil.getLevelIdFromLevel(replay.level);
        byteListBuilder.addInt(levelId);
        let difficultyId = DifficultyUtil.getDifficultyIdFromDifficulty(replay.difficulty);
        byteListBuilder.addInt(difficultyId);
        let frameInputIntList = serializeFrameInputsToIntList(replay.frameInputs);
        byteListBuilder.addIntList(frameInputIntList);
        return byteListBuilder.toByteList();
    };
    let deserializeIntListToFrameInputs = function (intList) {
        if (intList.length === 0)
            return [];
        let array = [];
        let shouldBeTrue = intList[1] === 1;
        for (let i = 2; i < intList.length; i++) {
            let index = intList[i];
            while (array.length < index) {
                array.push(shouldBeTrue);
            }
            shouldBeTrue = !shouldBeTrue;
        }
        let length = intList[0];
        while (array.length < length)
            array.push(shouldBeTrue);
        let numberOfFrameInputs = length / 7;
        let output = [];
        for (let i = 0; i < numberOfFrameInputs; i++) {
            output.push({
                up: array[i],
                down: array[i + numberOfFrameInputs],
                left: array[i + 2 * numberOfFrameInputs],
                right: array[i + 3 * numberOfFrameInputs],
                shoot: array[i + 4 * numberOfFrameInputs],
                continueDialogue: array[i + 5 * numberOfFrameInputs],
                debug_toggleInvulnerability: array[i + 6 * numberOfFrameInputs]
            });
        }
        return output;
    };
    let deserializeReplay = function (serializedReplay) {
        let byteListIterator = ByteListUtil.getByteListIterator(serializedReplay);
        let replayId = byteListIterator.popInt();
        let levelId = byteListIterator.popInt();
        let difficultyId = byteListIterator.popInt();
        let frameInputIntList = byteListIterator.popIntList();
        if (byteListIterator.hasNextByte())
            throw new Error("Invalid serializedReplay");
        return {
            replayId: replayId,
            frameInputs: deserializeIntListToFrameInputs(frameInputIntList),
            level: LevelUtil.getLevelFromLevelId(levelId),
            difficulty: DifficultyUtil.getDifficultyFromDifficultyId(difficultyId)
        };
    };
    return {
        generateReplayFromFrameInputHistory,
        generateFrameInputHistoryFromReplay,
        serializeReplay,
        deserializeReplay
    };
})());
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
let SaveAndLoadDataUtil = {
    getSaveAndLoadData: function () {
        let savedSoundVolume = null;
        let savedMusicVolume = null;
        let savedSessionStateWithoutReplayCollection = null;
        let savedNextReplayId = null;
        let savedReplayIds = null;
        let saveSessionState = function (sessionState) {
            saveSessionStateWithoutReplayCollection(sessionState);
            let replayIds = sessionState.replayCollection.replays.map(replay => replay.replayId);
            if (savedNextReplayId !== null && savedNextReplayId === sessionState.replayCollection.nextReplayId && savedReplayIds !== null) {
                if (savedReplayIds.length === replayIds.length) {
                    let isEqual = true;
                    for (let i = 0; i < savedReplayIds.length; i++) {
                        if (savedReplayIds[i] !== replayIds[i]) {
                            isEqual = false;
                            break;
                        }
                    }
                    if (isEqual)
                        return;
                }
            }
            savedNextReplayId = sessionState.replayCollection.nextReplayId;
            savedReplayIds = [...replayIds];
            let serializedReplayCollection = SessionStateUtil.serializeReplayCollection(sessionState);
            let version = VersionInfo.getCurrentVersion();
            FileIO.persistData(GlobalConstants.FILE_ID_FOR_REPLAY_COLLECTION, version, serializedReplayCollection);
        };
        let saveSessionStateWithoutReplayCollection = function (sessionState) {
            let serializedSessionStateWithoutReplayCollection = SessionStateUtil.serializeSessionStateWithoutReplayCollection(sessionState);
            if (savedSessionStateWithoutReplayCollection !== null) {
                if (savedSessionStateWithoutReplayCollection.length === serializedSessionStateWithoutReplayCollection.length) {
                    let isEqual = true;
                    for (let i = 0; i < savedSessionStateWithoutReplayCollection.length; i++) {
                        if (savedSessionStateWithoutReplayCollection[i] !== serializedSessionStateWithoutReplayCollection[i]) {
                            isEqual = false;
                            break;
                        }
                    }
                    if (isEqual)
                        return;
                }
            }
            savedSessionStateWithoutReplayCollection = serializedSessionStateWithoutReplayCollection;
            let version = VersionInfo.getCurrentVersion();
            FileIO.persistData(GlobalConstants.FILE_ID_FOR_SESSION_STATE_WITHOUT_REPLAY_COLLECTION, version, serializedSessionStateWithoutReplayCollection);
        };
        let saveSoundAndMusicVolume = function (soundVolume, musicVolume) {
            if (savedSoundVolume !== null && savedMusicVolume !== null && savedSoundVolume === soundVolume && savedMusicVolume === musicVolume)
                return;
            savedSoundVolume = soundVolume;
            savedMusicVolume = musicVolume;
            let version = VersionInfo.getCurrentVersion();
            let byteList = [soundVolume, musicVolume];
            FileIO.persistData(GlobalConstants.FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME, version, byteList);
        };
        let saveAllData = function (sessionState, soundVolume, musicVolume) {
            saveSessionState(sessionState);
            saveSoundAndMusicVolume(soundVolume, musicVolume);
        };
        let loadSessionState = function (sessionState) {
            let version = VersionInfo.getCurrentVersion();
            let serializedSessionStateWithoutReplayCollection = FileIO.fetchData(GlobalConstants.FILE_ID_FOR_SESSION_STATE_WITHOUT_REPLAY_COLLECTION, version);
            if (serializedSessionStateWithoutReplayCollection === null)
                return;
            SessionStateUtil.deserializeSessionStateWithoutReplayCollection(serializedSessionStateWithoutReplayCollection, sessionState);
            let serializedReplayCollection = FileIO.fetchData(GlobalConstants.FILE_ID_FOR_REPLAY_COLLECTION, version);
            if (serializedReplayCollection !== null)
                SessionStateUtil.deserializeReplayCollection(serializedReplayCollection, sessionState);
        };
        let loadSoundVolume = function () {
            let version = VersionInfo.getCurrentVersion();
            let data = FileIO.fetchData(GlobalConstants.FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME, version);
            if (data === null)
                return null;
            if (data.length === 0)
                return null;
            let soundVolume = data[0];
            if (soundVolume < 0 || soundVolume > 100)
                return null;
            return soundVolume;
        };
        let loadMusicVolume = function () {
            let version = VersionInfo.getCurrentVersion();
            let data = FileIO.fetchData(GlobalConstants.FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME, version);
            if (data === null)
                return null;
            if (data.length <= 1)
                return null;
            let musicVolume = data[1];
            if (musicVolume < 0 || musicVolume > 100)
                return null;
            return musicVolume;
        };
        return {
            saveAllData,
            saveSessionState,
            saveSoundAndMusicVolume,
            loadSessionState,
            loadSoundVolume,
            loadMusicVolume
        };
    }
};
let SavedDataMigration_ToV1_01 = {
    migrateAllDataFromOlderVersionsToV1_01IfNeeded: function () {
        SavedDataMigration_ToV1_01.migrateSessionStateDataFromOlderVersionsToV1_01IfNeeded();
        SavedDataMigration_ToV1_01.migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_01IfNeeded();
    },
    migrateSessionStateDataFromOlderVersionsToV1_01IfNeeded: function () {
        // v1.00 didn't store any session state data
    },
    migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_01IfNeeded: function () {
        let versionInfo = VersionInfo.getVersionHistory();
        let version1_00 = versionInfo.find(x => x.version === "1.00");
        let version1_01 = versionInfo.find(x => x.version === "1.01");
        let fileId = GlobalConstants.FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME;
        let v1_01Data = FileIO.fetchData(fileId, version1_01);
        if (v1_01Data !== null)
            return;
        let v1_00Data = FileIO.fetchData(fileId, version1_00);
        if (v1_00Data === null)
            return;
        FileIO.persistData(fileId, version1_01, v1_00Data);
    }
};
let SavedDataMigration_ToV1_02 = {
    migrateAllDataFromOlderVersionsToV1_02IfNeeded: function () {
        SavedDataMigration_ToV1_02.migrateSessionStateDataFromOlderVersionsToV1_02IfNeeded();
        SavedDataMigration_ToV1_02.migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_02IfNeeded();
    },
    migrateSessionStateDataFromOlderVersionsToV1_02IfNeeded: function () {
        // v1.01 didn't store any session state data
    },
    migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_02IfNeeded: function () {
        let versionInfo = VersionInfo.getVersionHistory();
        let version1_01 = versionInfo.find(x => x.version === "1.01");
        let version1_02 = versionInfo.find(x => x.version === "1.02");
        let fileId = GlobalConstants.FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME;
        let v1_02Data = FileIO.fetchData(fileId, version1_02);
        if (v1_02Data !== null)
            return;
        SavedDataMigration_ToV1_01.migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_01IfNeeded();
        let v1_01Data = FileIO.fetchData(fileId, version1_01);
        if (v1_01Data === null)
            return;
        FileIO.persistData(fileId, version1_02, v1_01Data);
    }
};
let SavedDataMigration_ToV1_03 = {
    migrateAllDataFromOlderVersionsToV1_03IfNeeded: function () {
        SavedDataMigration_ToV1_03.migrateSessionStateDataFromOlderVersionsToV1_03IfNeeded();
        SavedDataMigration_ToV1_03.migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_03IfNeeded();
    },
    migrateSessionStateDataFromOlderVersionsToV1_03IfNeeded: function () {
        /*
            We don't transfer session state data from v1.02 to v1.03
            since v1.02 wasn't widely released.
        */
    },
    migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_03IfNeeded: function () {
        let versionInfo = VersionInfo.getVersionHistory();
        let version1_02 = versionInfo.find(x => x.version === "1.02");
        let version1_03 = versionInfo.find(x => x.version === "1.03");
        let fileId = GlobalConstants.FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME;
        let v1_03Data = FileIO.fetchData(fileId, version1_03);
        if (v1_03Data !== null)
            return;
        SavedDataMigration_ToV1_02.migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_02IfNeeded();
        let v1_02Data = FileIO.fetchData(fileId, version1_02);
        if (v1_02Data === null)
            return;
        FileIO.persistData(fileId, version1_03, v1_02Data);
    }
};
let SessionStateUtil = {
    generateInitialSessionState: function () {
        let seed = Math.floor(Math.random() * (1000 * 1000 * 1000));
        let overworldMap = OverworldMapGeneration.generateOverworldMap(seed);
        let levelLocations = OverworldMapUtil.getLevelLocations(overworldMap);
        let level1Location = levelLocations[0 /* Level.Level1 */];
        return {
            hasStarted: false,
            overworldMapSeed: seed,
            overworldLocation: { tileX: level1Location.tileX, tileY: level1Location.tileY },
            completedLevels: [],
            lastSelectedDifficulty: 1 /* Difficulty.Normal */,
            replayCollection: {
                nextReplayId: 1,
                replays: []
            }
        };
    },
    clearSessionState: function (sessionState) {
        let newSessionState = SessionStateUtil.generateInitialSessionState();
        sessionState.hasStarted = newSessionState.hasStarted;
        sessionState.overworldMapSeed = newSessionState.overworldMapSeed;
        sessionState.overworldLocation = newSessionState.overworldLocation;
        sessionState.completedLevels = newSessionState.completedLevels;
        sessionState.lastSelectedDifficulty = newSessionState.lastSelectedDifficulty;
        sessionState.replayCollection = newSessionState.replayCollection;
    },
    serializeSessionStateWithoutReplayCollection: function (sessionState) {
        let byteListBuilder = ByteListUtil.getByteListBuilder();
        byteListBuilder.addBool(sessionState.hasStarted);
        byteListBuilder.addInt(sessionState.overworldMapSeed);
        byteListBuilder.addInt(sessionState.overworldLocation.tileX);
        byteListBuilder.addInt(sessionState.overworldLocation.tileY);
        let completedLevelIds = sessionState.completedLevels.map(level => LevelUtil.getLevelIdFromLevel(level));
        byteListBuilder.addIntList(completedLevelIds);
        byteListBuilder.addInt(DifficultyUtil.getDifficultyIdFromDifficulty(sessionState.lastSelectedDifficulty));
        let returnValue = byteListBuilder.toByteList();
        return returnValue;
    },
    serializeReplayCollection: function (sessionState) {
        return ReplayCollectionUtil.serializeReplayCollection(sessionState.replayCollection);
    },
    deserializeSessionStateWithoutReplayCollection: function (serializedSessionStateWithoutReplayCollection, sessionState) {
        let byteListIterator = ByteListUtil.getByteListIterator(serializedSessionStateWithoutReplayCollection);
        sessionState.hasStarted = byteListIterator.popBool();
        sessionState.overworldMapSeed = byteListIterator.popInt();
        sessionState.overworldLocation.tileX = byteListIterator.popInt();
        sessionState.overworldLocation.tileY = byteListIterator.popInt();
        let completedLevels = byteListIterator.popIntList().map(levelId => LevelUtil.getLevelFromLevelId(levelId));
        sessionState.completedLevels = completedLevels;
        sessionState.lastSelectedDifficulty = DifficultyUtil.getDifficultyFromDifficultyId(byteListIterator.popInt());
        if (byteListIterator.hasNextByte())
            throw new Error("Invalid serializedSessionStateWithoutReplayCollection");
    },
    deserializeReplayCollection: function (serializedReplayCollection, sessionState) {
        sessionState.replayCollection = ReplayCollectionUtil.deserializeReplayCollection(serializedReplayCollection);
    }
};
let SolidLayerUtil = ((function () {
    let isValidSolidId = function (solidId) {
        if (solidId === null)
            return true;
        return [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26].includes(solidId);
    };
    let isValidSolidLayer = function (solidLayer) {
        for (let i = 0; i < solidLayer.length; i++) {
            for (let j = 0; j < solidLayer[i].length; j++) {
                if (!isValidSolidId(solidLayer[i][j])) {
                    return false;
                }
            }
        }
        return true;
    };
    let isSolidCheck = function (xMibi, yMibi, solidId) {
        if (solidId === null)
            return false;
        if (solidId === 0)
            return true;
        if (solidId === 5)
            return xMibi >= yMibi * 2;
        if (solidId === 6) {
            if (yMibi <= 24 * 1024)
                return true;
            return xMibi >= (yMibi - 24 * 1024) * 2;
        }
        if (solidId === 7)
            return yMibi * 2 + xMibi <= 96 * 1024;
        if (solidId === 8)
            return yMibi * 2 <= 48 * 1024 - xMibi;
        if (solidId === 9)
            return yMibi <= xMibi;
        if (solidId === 10)
            return yMibi * 2 >= 96 * 1024 - xMibi;
        if (solidId === 11)
            return yMibi * 2 >= 48 * 1024 - xMibi;
        if (solidId === 12)
            return yMibi * 2 >= xMibi;
        if (solidId === 13)
            return yMibi * 2 >= 48 * 1024 + xMibi;
        if (solidId === 14)
            return yMibi <= 48 * 1024 - xMibi;
        if (solidId === 15)
            return yMibi <= -48 * 1024 + xMibi * 2;
        if (solidId === 16)
            return yMibi <= 48 * 1024 - xMibi * 2;
        if (solidId === 17)
            return yMibi >= 48 * 1024 - xMibi * 2;
        if (solidId === 18)
            return yMibi >= -48 * 1024 + xMibi * 2;
        if (solidId === 19)
            return yMibi >= 48 * 1024 - xMibi;
        if (solidId === 20)
            return yMibi <= xMibi * 2;
        if (solidId === 21)
            return yMibi <= 96 * 1024 - xMibi * 2;
        if (solidId === 22)
            return yMibi >= 96 * 1024 - xMibi * 2;
        if (solidId === 23)
            return yMibi >= xMibi * 2;
        if (solidId === 24)
            return yMibi >= xMibi;
        if (solidId === 25)
            return yMibi <= 38 * 1024;
        if (solidId === 26)
            return yMibi >= 10 * 1024;
        throw new Error("Unrecognized solidId: " + solidId);
    };
    let isDeadlyCheck = function (xMibi, yMibi, solidId) {
        if (solidId === null)
            return false;
        if (solidId === 25)
            return yMibi <= 44 * 1024;
        if (solidId === 26)
            return yMibi >= 4 * 1024;
        return false;
    };
    let isSolid = function (xMibi, yMibi, xOffsetInMibipixels, widthInTiles, heightInTiles, solidLayer) {
        xMibi -= xOffsetInMibipixels;
        let tileX = Math.floor((xMibi >> 10) / 48);
        let tileY = Math.floor((yMibi >> 10) / 48);
        if (tileX < 0 || tileX >= widthInTiles || tileY < 0 || tileY >= heightInTiles)
            return false;
        let solidId = solidLayer[tileX][tileY];
        let offsetX = xMibi - 48 * 1024 * tileX;
        let offsetY = yMibi - 48 * 1024 * tileY;
        return isSolidCheck(offsetX, offsetY, solidId);
    };
    let isDeadly = function (xMibi, yMibi, xOffsetInMibipixels, widthInTiles, heightInTiles, solidLayer) {
        xMibi -= xOffsetInMibipixels;
        let tileX = Math.floor((xMibi >> 10) / 48);
        let tileY = Math.floor((yMibi >> 10) / 48);
        if (tileX < 0 || tileX >= widthInTiles || tileY < 0 || tileY >= heightInTiles)
            return false;
        let solidId = solidLayer[tileX][tileY];
        let offsetX = xMibi - 48 * 1024 * tileX;
        let offsetY = yMibi - 48 * 1024 * tileY;
        return isDeadlyCheck(offsetX, offsetY, solidId);
    };
    return {
        isSolid,
        isDeadly,
        isValidSolidLayer
    };
})());
let SoundAndMusicVolumePickerUtil = {
    getSoundAndMusicVolumePicker: function (xPos, yPos, initialSoundVolume, initialMusicVolume, color) {
        let soundVolumePicker = SoundVolumePickerUtil.getSoundVolumePicker(xPos, yPos + 50, initialSoundVolume, color);
        let musicVolumePicker = MusicVolumePickerUtil.getMusicVolumePicker(xPos, yPos, initialMusicVolume, color);
        let processFrame = function (mouseInput, previousMouseInput) {
            soundVolumePicker.processFrame(mouseInput, previousMouseInput);
            musicVolumePicker.processFrame(mouseInput, previousMouseInput);
        };
        let render = function (displayOutput) {
            soundVolumePicker.render(displayOutput);
            musicVolumePicker.render(displayOutput);
        };
        return {
            processFrame,
            getCurrentSoundVolume: function () { return soundVolumePicker.getCurrentSoundVolume(); },
            getCurrentMusicVolume: function () { return musicVolumePicker.getCurrentMusicVolume(); },
            render
        };
    }
};
let SoundVolumePickerUtil = {
    getSoundVolumePicker: function (xPos, yPos, initialVolume, color) {
        let currentVolume = initialVolume;
        let unmuteVolume = currentVolume;
        let isDraggingVolumeSlider = false;
        let processFrame = function (mouseInput, previousMouseInput) {
            let mouseX = mouseInput.getX();
            let mouseY = mouseInput.getY();
            if (mouseInput.isLeftMouseButtonPressed()
                && !previousMouseInput.isLeftMouseButtonPressed()
                && xPos <= mouseX
                && mouseX <= xPos + 40
                && yPos <= mouseY
                && mouseY <= yPos + 50) {
                if (currentVolume === 0) {
                    currentVolume = unmuteVolume === 0 ? 50 : unmuteVolume;
                    unmuteVolume = currentVolume;
                }
                else {
                    unmuteVolume = currentVolume;
                    currentVolume = 0;
                }
            }
            if (mouseInput.isLeftMouseButtonPressed()
                && !previousMouseInput.isLeftMouseButtonPressed()
                && xPos + 50 <= mouseX
                && mouseX <= xPos + 150
                && yPos + 10 <= mouseY
                && mouseY <= yPos + 40) {
                isDraggingVolumeSlider = true;
            }
            if (isDraggingVolumeSlider && mouseInput.isLeftMouseButtonPressed()) {
                let volume = Math.round(mouseX - (xPos + 50));
                if (volume < 0)
                    volume = 0;
                if (volume > 100)
                    volume = 100;
                currentVolume = volume;
                unmuteVolume = currentVolume;
            }
            if (!mouseInput.isLeftMouseButtonPressed())
                isDraggingVolumeSlider = false;
        };
        let getCurrentSoundVolume = function () {
            return currentVolume;
        };
        let render = function (displayOutput) {
            let gameImage;
            let dtColor;
            switch (color) {
                case 0 /* VolumePickerColor.Black */:
                    gameImage = currentVolume > 0 ? 0 /* GameImage.SoundOn_Black */ : 1 /* GameImage.SoundOff_Black */;
                    dtColor = black;
                    break;
                case 1 /* VolumePickerColor.White */:
                    gameImage = currentVolume > 0 ? 4 /* GameImage.SoundOn_White */ : 5 /* GameImage.SoundOff_White */;
                    dtColor = white;
                    break;
            }
            displayOutput.drawImage(gameImage, xPos, yPos);
            displayOutput.drawRectangle(xPos + 50, yPos + 10, 101, 31, dtColor, false);
            if (currentVolume > 0)
                displayOutput.drawRectangle(xPos + 50, yPos + 10, currentVolume, 31, dtColor, true);
        };
        return {
            processFrame,
            getCurrentSoundVolume,
            render
        };
    }
};
let TestingAchievementsFrame = {};
TestingAchievementsFrame.getFrame = function (globalState, sessionState) {
    let completedAchievements = [];
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        completedAchievements = [];
        if (keyboardInput.isPressed(27 /* Key.One */))
            completedAchievements.push("test_achievement_1");
        if (keyboardInput.isPressed(28 /* Key.Two */))
            completedAchievements.push("test_achievement_2");
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        displayOutput.drawText(50, GlobalConstants.WINDOW_HEIGHT - 50, "Press 1/2 to earn an achievement!", 0 /* GameFont.SimpleFont */, 24, black);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return completedAchievements; }
    };
};
let TestingClickUrlFrame = {};
TestingClickUrlFrame.getFrame = function (globalState, sessionState) {
    let clickUrl = null;
    let isHover = false;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        let mouseX = mouseInput.getX();
        let mouseY = mouseInput.getY();
        isHover = 50 <= mouseX
            && mouseX <= 250
            && GlobalConstants.WINDOW_HEIGHT - 100 <= mouseY
            && mouseY <= GlobalConstants.WINDOW_HEIGHT - 50;
        if (isHover)
            clickUrl = "https://github.com/dtsudo";
        else
            clickUrl = null;
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        displayOutput.drawRectangle(50, GlobalConstants.WINDOW_HEIGHT - 100, 200, 50, black, false);
        let textColor = isHover ? { r: 180, g: 180, b: 255, alpha: 255 } : black;
        displayOutput.drawText(60, GlobalConstants.WINDOW_HEIGHT - 60, "click me", 0 /* GameFont.SimpleFont */, 30, textColor);
    };
    let getClickUrl = function () {
        return clickUrl;
    };
    return {
        getNextFrame,
        render,
        getClickUrl,
        getCompletedAchievements: function () { return null; }
    };
};
let TestingFontFrame = {};
TestingFontFrame.getFrame = function (globalState, sessionState) {
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */))
            return TestingFontFrame2.getFrame(globalState, sessionState);
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        let red = { r: 255, g: 0, b: 0, alpha: 255 };
        displayOutput.drawRectangle(50, 604, 233, 46, red, false);
        displayOutput.drawText(50, 650, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 12, black);
        displayOutput.drawRectangle(50, 497, 272, 53, red, false);
        displayOutput.drawText(50, 550, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 14, black);
        displayOutput.drawRectangle(50, 389, 310, 60, red, false);
        displayOutput.drawText(50, 450, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 16, black);
        displayOutput.drawRectangle(50, 282, 349, 67, red, false);
        displayOutput.drawText(50, 350, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 18, black);
        displayOutput.drawRectangle(50, 174, 387, 75, red, false);
        displayOutput.drawText(50, 250, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 20, black);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
let TestingFontFrame2 = {};
TestingFontFrame2.getFrame = function (globalState, sessionState) {
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */))
            return TestingFontFrame.getFrame(globalState, sessionState);
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        let red = { r: 255, g: 0, b: 0, alpha: 255 };
        displayOutput.drawRectangle(51, 527, 617, 119, red, false);
        displayOutput.drawText(50, 650, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 32, black);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
let TestingFrame = {};
TestingFrame.getFrame = function (globalState, sessionState) {
    "use strict";
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TitleScreenFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(27 /* Key.One */) && !previousKeyboardInput.isPressed(27 /* Key.One */))
            return TestingKeyboardFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(28 /* Key.Two */) && !previousKeyboardInput.isPressed(28 /* Key.Two */))
            return TestingMouseFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(29 /* Key.Three */) && !previousKeyboardInput.isPressed(29 /* Key.Three */))
            return TestingFontFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(30 /* Key.Four */) && !previousKeyboardInput.isPressed(30 /* Key.Four */))
            return TestingSoundFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(31 /* Key.Five */) && !previousKeyboardInput.isPressed(31 /* Key.Five */))
            return TestingMusicFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(32 /* Key.Six */) && !previousKeyboardInput.isPressed(32 /* Key.Six */))
            return TestingClickUrlFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(33 /* Key.Seven */) && !previousKeyboardInput.isPressed(33 /* Key.Seven */))
            return TestingAchievementsFrame.getFrame(globalState, sessionState);
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        displayOutput.drawText(50, GlobalConstants.WINDOW_HEIGHT - 50, "1) Test keyboard"
            + "\n" + "2) Test mouse"
            + "\n" + "3) Test font"
            + "\n" + "4) Test sound"
            + "\n" + "5) Test music"
            + "\n" + "6) Test click URL"
            + "\n" + "7) Test achievements", 0 /* GameFont.SimpleFont */, 20, black);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
let TestingKeyboardFrame = {};
TestingKeyboardFrame.getFrame = function (globalState, sessionState) {
    let x = 50;
    let y = 50;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        let delta = 8;
        if (keyboardInput.isPressed(43 /* Key.Shift */))
            delta = 2;
        if (keyboardInput.isPressed(38 /* Key.LeftArrow */))
            x -= delta;
        if (keyboardInput.isPressed(39 /* Key.RightArrow */))
            x += delta;
        if (keyboardInput.isPressed(37 /* Key.DownArrow */))
            y -= delta;
        if (keyboardInput.isPressed(36 /* Key.UpArrow */))
            y += delta;
        if (x < 0)
            x = 0;
        if (x > GlobalConstants.WINDOW_WIDTH)
            x = GlobalConstants.WINDOW_WIDTH;
        if (y < 0)
            y = 0;
        if (y > GlobalConstants.WINDOW_HEIGHT)
            y = GlobalConstants.WINDOW_HEIGHT;
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        displayOutput.drawRectangle(x - 5, y - 5, 11, 11, black, true);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
let TestingMouseFrame = {};
TestingMouseFrame.getFrame = function (globalState, sessionState) {
    let x = 0;
    let y = 0;
    let color = 0;
    let shouldFill = true;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        x = mouseInput.getX();
        y = mouseInput.getY();
        if (mouseInput.isLeftMouseButtonPressed() && !previousMouseInput.isLeftMouseButtonPressed()) {
            color++;
            if (color === 4)
                color = 0;
        }
        if (mouseInput.isRightMouseButtonPressed() && !previousMouseInput.isRightMouseButtonPressed())
            shouldFill = !shouldFill;
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        let dtColor;
        switch (color) {
            case 0:
                dtColor = black;
                break;
            case 1:
                dtColor = { r: 255, g: 0, b: 0, alpha: 255 };
                break;
            case 2:
                dtColor = { r: 0, g: 255, b: 0, alpha: 255 };
                break;
            case 3:
                dtColor = { r: 0, g: 0, b: 255, alpha: 255 };
                break;
            default:
                throw new Error("unrecognized color");
        }
        displayOutput.drawRectangle(x - 5, y - 5, 11, 11, dtColor, shouldFill);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
let TestingMusicFrame = {};
TestingMusicFrame.getFrame = function (globalState, sessionState) {
    let volumePicker = null;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume(), 0 /* VolumePickerColor.Black */);
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        let music = null;
        if (keyboardInput.isPressed(27 /* Key.One */))
            music = 0 /* GameMusic.ChiptuneLevel1 */;
        if (keyboardInput.isPressed(28 /* Key.Two */))
            music = 1 /* GameMusic.ChiptuneLevel3 */;
        if (music !== null)
            musicOutput.playMusic(music, 100);
        if (keyboardInput.isPressed(29 /* Key.Three */))
            musicOutput.stopMusic();
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        if (volumePicker !== null)
            volumePicker.render(displayOutput);
        displayOutput.drawText(50, GlobalConstants.WINDOW_HEIGHT - 50, "Press 1/2 to switch music tracks." + "\n" + "Press 3 to stop music.", 0 /* GameFont.SimpleFont */, 24, black);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
let TestingSoundFrame = {};
TestingSoundFrame.getFrame = function (globalState, sessionState) {
    "use strict";
    let volumePicker = null;
    let cooldown = 0;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume(), 0 /* VolumePickerColor.Black */);
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        cooldown--;
        if (cooldown <= 0) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            cooldown += 60;
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
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
let TilemapLevelInfo_Level1 = {
    getLevel1TilemapLevelInfo: function () {
        let xVelocity = -900;
        let getXVelocityForEnemiesInMibipixelsPerFrame = function () {
            return xVelocity;
        };
        let hasReachedEndOfMap = function (xOffsetInMibipixels, widthInTiles) {
            let finalXOffset = -1024 * (widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH);
            return xOffsetInMibipixels <= (finalXOffset + 48 * 1024);
        };
        let getNewXOffsetInMibipixels = function (currentXOffsetInMibipixels, widthInTiles, bossFrameCounter) {
            let newXOffset = currentXOffsetInMibipixels + xVelocity;
            if (bossFrameCounter !== null) {
                newXOffset -= 1024;
                if (bossFrameCounter > 40)
                    newXOffset -= 1024;
                if (bossFrameCounter > 80)
                    newXOffset -= 1024;
                if (bossFrameCounter > 120)
                    newXOffset -= 1024;
                if (bossFrameCounter > 160)
                    newXOffset -= 1024;
            }
            let finalXOffset = -1024 * (widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH);
            while (newXOffset <= finalXOffset) {
                newXOffset += 48 * 1024;
            }
            return newXOffset;
        };
        let getDarkenBackgroundAlpha = function (bossFrameCounter) {
            let alpha = Math.floor(bossFrameCounter * 5 / 4);
            if (alpha > 100)
                alpha = 100;
            return alpha;
        };
        return {
            getXVelocityForEnemiesInMibipixelsPerFrame,
            hasReachedEndOfMap,
            getNewXOffsetInMibipixels,
            getDarkenBackgroundAlpha
        };
    }
};
let TilemapLevelInfo_Level2 = {
    getLevel2TilemapLevelInfo: function () {
        let xVelocity = -900;
        let getXVelocityForEnemiesInMibipixelsPerFrame = function () {
            return xVelocity;
        };
        let hasReachedEndOfMap = function (xOffsetInMibipixels, widthInTiles) {
            let finalXOffset = -1024 * (widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH);
            return xOffsetInMibipixels <= (finalXOffset + 48 * 1024 * 21);
        };
        let getNewXOffsetInMibipixels = function (currentXOffsetInMibipixels, widthInTiles, bossFrameCounter) {
            let newXOffset = currentXOffsetInMibipixels + xVelocity;
            if (bossFrameCounter !== null) {
                newXOffset -= 1024;
                if (bossFrameCounter > 10)
                    newXOffset -= 1024;
                if (bossFrameCounter > 20)
                    newXOffset -= 1024;
                if (bossFrameCounter > 30)
                    newXOffset -= 1024;
                if (bossFrameCounter > 40)
                    newXOffset -= 1024;
                if (bossFrameCounter > 50)
                    newXOffset -= 1024;
                if (bossFrameCounter > 60)
                    newXOffset -= 1024;
                if (bossFrameCounter > 70)
                    newXOffset -= 1024;
                if (bossFrameCounter > 80)
                    newXOffset -= 1024;
                if (bossFrameCounter > 90)
                    newXOffset -= 1024;
                if (bossFrameCounter > 100)
                    newXOffset -= 1024;
                if (bossFrameCounter > 110)
                    newXOffset -= 1024;
                if (bossFrameCounter > 120)
                    newXOffset -= 1024;
                if (bossFrameCounter > 130)
                    newXOffset -= 1024;
                if (bossFrameCounter > 140)
                    newXOffset -= 1024;
                if (bossFrameCounter > 150)
                    newXOffset -= 1024;
                if (bossFrameCounter > 160)
                    newXOffset -= 1024;
                if (bossFrameCounter > 170)
                    newXOffset -= 1024;
                if (bossFrameCounter > 180)
                    newXOffset -= 1024;
            }
            let finalXOffset = -1024 * (widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH);
            while (newXOffset <= finalXOffset) {
                newXOffset += 48 * 1024 * 25;
            }
            return newXOffset;
        };
        let getDarkenBackgroundAlpha = function (bossFrameCounter) {
            let alpha = Math.floor(bossFrameCounter * 5 / 2);
            if (alpha > 215)
                alpha = 215;
            return alpha;
        };
        return {
            getXVelocityForEnemiesInMibipixelsPerFrame,
            hasReachedEndOfMap,
            getNewXOffsetInMibipixels,
            getDarkenBackgroundAlpha
        };
    }
};
let TilemapLevelInfo_Level3 = {
    getLevel3TilemapLevelInfo: function () {
        let xVelocity = -900;
        let getXVelocityForEnemiesInMibipixelsPerFrame = function () {
            return xVelocity;
        };
        let hasReachedEndOfMap = function (xOffsetInMibipixels, widthInTiles) {
            let finalXOffset = -1024 * (widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH);
            return xOffsetInMibipixels <= (finalXOffset + 48 * 1024 * 8);
        };
        let getNewXOffsetInMibipixels = function (currentXOffsetInMibipixels, widthInTiles, bossFrameCounter) {
            let newXOffset = currentXOffsetInMibipixels + xVelocity;
            let finalXOffset = -1024 * (widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH);
            if (newXOffset < finalXOffset + 48 * 1024 * 8)
                newXOffset = finalXOffset + 48 * 1024 * 8;
            return newXOffset;
        };
        let getDarkenBackgroundAlpha = function (bossFrameCounter) {
            let alpha = Math.floor(bossFrameCounter * 5 / 2);
            if (alpha > 215)
                alpha = 215;
            return alpha;
        };
        return {
            getXVelocityForEnemiesInMibipixelsPerFrame,
            hasReachedEndOfMap,
            getNewXOffsetInMibipixels,
            getDarkenBackgroundAlpha
        };
    }
};
let TilemapRendering = ((function () {
    let renderLayer = function (xOffsetInMibipixels, layer, displayOutput) {
        let widthInTiles = layer.length;
        let heightInTiles = widthInTiles > 0 ? layer[0].length : 0;
        let x = 0;
        let displayX = xOffsetInMibipixels >> 10;
        // Render an extra tile to the left and right of the viewport to handle screenshake
        while (displayX < -4800 - 48) {
            x += 100;
            displayX += 4800;
        }
        while (displayX < -480 - 48) {
            x += 10;
            displayX += 480;
        }
        while (displayX < -48 - 48) {
            x += 1;
            displayX += 48;
        }
        while (true) {
            if (x >= widthInTiles)
                break;
            if (displayX > GlobalConstants.WINDOW_WIDTH + 48)
                break;
            for (let y = 0, displayY = 0; y < heightInTiles; y++, displayY += 48) {
                let tile = layer[x][y];
                if (tile !== null) {
                    displayOutput.drawImageRotatedClockwise(tile.gameImage, tile.imageX, tile.imageY, 16, 16, displayX, displayY, 0, 128 * 3);
                }
            }
            x++;
            displayX += 48;
        }
    };
    let renderForeground = function (xOffsetInMibipixels, foregroundLayer, displayOutput) {
        renderLayer(xOffsetInMibipixels, foregroundLayer, displayOutput);
    };
    let renderMidgroundAndBackground = function (xOffsetInMibipixels, midgroundLayer, backgroundLayer, bossFrameCounter, tilemapLevelInfo, displayOutput) {
        renderLayer(xOffsetInMibipixels, backgroundLayer, displayOutput);
        if (midgroundLayer !== null)
            renderLayer(xOffsetInMibipixels, midgroundLayer, displayOutput);
        if (bossFrameCounter !== null) {
            let alpha = tilemapLevelInfo.getDarkenBackgroundAlpha(bossFrameCounter);
            // Render more to handle screenshake
            displayOutput.drawRectangle(-48, 0, GlobalConstants.WINDOW_WIDTH + 48 + 48, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: alpha }, true);
        }
    };
    return {
        renderForeground,
        renderMidgroundAndBackground
    };
})());
let TilemapUtil = ((function () {
    let getTilemap = function (tilemapLevelInfo, xOffsetInMibipixels, bossFrameCounter, widthInTiles, heightInTiles, solidLayer, foregroundLayer, midgroundLayer, backgroundLayer, remainingEnemyTiles) {
        let getSnapshot = function (thisObj) {
            let remainingEnemyTilesSnapshot = remainingEnemyTiles.map(x => ({ x: x.x, y: x.y, id: x.id }));
            return getTilemap(tilemapLevelInfo, xOffsetInMibipixels, bossFrameCounter, widthInTiles, heightInTiles, solidLayer, foregroundLayer, midgroundLayer, backgroundLayer, remainingEnemyTilesSnapshot);
        };
        let startBoss = function () {
            bossFrameCounter = 0;
        };
        let getXVelocityForEnemiesInMibipixelsPerFrame = function () {
            return tilemapLevelInfo.getXVelocityForEnemiesInMibipixelsPerFrame();
        };
        let hasReachedEndOfMap = function () {
            return tilemapLevelInfo.hasReachedEndOfMap(xOffsetInMibipixels, widthInTiles);
        };
        let isSolid = function (xMibi, yMibi) {
            return SolidLayerUtil.isSolid(xMibi, yMibi, xOffsetInMibipixels, widthInTiles, heightInTiles, solidLayer);
        };
        let isDeadly = function (xMibi, yMibi) {
            return SolidLayerUtil.isDeadly(xMibi, yMibi, xOffsetInMibipixels, widthInTiles, heightInTiles, solidLayer);
        };
        let getNewEnemies = function () {
            let returnValue = [];
            let newRemainingEnemyTiles = [];
            for (let enemyTile of remainingEnemyTiles) {
                let rightEdgeOfScreen = GlobalConstants.WINDOW_WIDTH * 1024 - xOffsetInMibipixels;
                let relevantX = Math.floor(rightEdgeOfScreen / (48 * 1024)) + 1;
                if (enemyTile.x <= relevantX) {
                    returnValue.push({
                        xMibi: (enemyTile.x * 48 + 24) * 1024 + xOffsetInMibipixels,
                        yMibi: (enemyTile.y * 48 + 24) * 1024,
                        id: enemyTile.id
                    });
                }
                else {
                    newRemainingEnemyTiles.push(enemyTile);
                }
            }
            remainingEnemyTiles = newRemainingEnemyTiles;
            return returnValue;
        };
        let processFrame = function () {
            if (bossFrameCounter !== null)
                bossFrameCounter++;
            xOffsetInMibipixels = tilemapLevelInfo.getNewXOffsetInMibipixels(xOffsetInMibipixels, widthInTiles, bossFrameCounter);
        };
        let renderForeground = function (displayOutput) {
            TilemapRendering.renderForeground(xOffsetInMibipixels, foregroundLayer, displayOutput);
        };
        let renderMidgroundAndBackground = function (displayOutput) {
            TilemapRendering.renderMidgroundAndBackground(xOffsetInMibipixels, midgroundLayer, backgroundLayer, bossFrameCounter, tilemapLevelInfo, displayOutput);
        };
        return {
            getSnapshot,
            getXVelocityForEnemiesInMibipixelsPerFrame,
            hasReachedEndOfMap,
            isSolid,
            isDeadly,
            startBoss,
            getNewEnemies,
            processFrame,
            renderForeground,
            renderMidgroundAndBackground
        };
    };
    return {
        getTilemap: function (mapData, tilemapLevelInfo, display) {
            let foregroundLayer = MapDataLevelUtil.getForegroundLayer(mapData, display);
            let midgroundLayer = MapDataLevelUtil.getMidgroundLayer(mapData, display);
            let backgroundLayer = MapDataLevelUtil.getBackgroundLayer(mapData, display);
            let solidLayer = MapDataLevelUtil.getSolidLayer(mapData);
            let enemyTiles = MapDataLevelUtil.getEnemyTiles(mapData);
            if (!SolidLayerUtil.isValidSolidLayer(solidLayer))
                throw new Error("Invalid solid layer");
            return getTilemap(tilemapLevelInfo, 0, null, mapData.width, mapData.height, solidLayer, foregroundLayer, midgroundLayer, backgroundLayer, enemyTiles);
        }
    };
})());
let TilesetUtil = {
    getTilesetFromMapDataTileset: function (mapDataTileset) {
        if (mapDataTileset.name === "Snow")
            return 0 /* Tileset.Snow */;
        if (mapDataTileset.name === "Sign")
            return 1 /* Tileset.Sign */;
        if (mapDataTileset.name === "Igloo")
            return 2 /* Tileset.Igloo */;
        if (mapDataTileset.name === "IceCave")
            return 3 /* Tileset.IceCave */;
        if (mapDataTileset.name === "Treetops")
            return 4 /* Tileset.Treetops */;
        if (mapDataTileset.name === "Castle")
            return 5 /* Tileset.Castle */;
        if (mapDataTileset.name === "Rail")
            return 6 /* Tileset.Rail */;
        throw new Error("Unrecognized tileset");
    },
    getGameImageForTileset: function (tileset) {
        switch (tileset) {
            case 0 /* Tileset.Snow */: return 53 /* GameImage.TsSnow */;
            case 1 /* Tileset.Sign */: return 57 /* GameImage.SignPost */;
            case 2 /* Tileset.Igloo */: return 58 /* GameImage.Igloo */;
            case 3 /* Tileset.IceCave */: return 59 /* GameImage.IceCaveTiles */;
            case 4 /* Tileset.Treetops */: return 60 /* GameImage.Treetops */;
            case 5 /* Tileset.Castle */: return 54 /* GameImage.TsCastle */;
            case 6 /* Tileset.Rail */: return 55 /* GameImage.Rail */;
        }
    }
};
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
        musicOutput.playMusic(4 /* GameMusic.MainTheme */, 100);
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
let VictoryScreenFrame = {};
VictoryScreenFrame.getFrame = function (globalState, sessionState, underlyingFrame) {
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        underlyingFrame = underlyingFrame.getNextFrame({
            keyboardInput: EmptyKeyboard.getEmptyKeyboard(),
            mouseInput: EmptyMouse.getEmptyMouse(),
            previousKeyboardInput: EmptyKeyboard.getEmptyKeyboard(),
            previousMouseInput: EmptyMouse.getEmptyMouse(),
            displayProcessing: displayProcessing,
            soundOutput: MutedSoundOutput.getSoundOutput(soundOutput),
            musicOutput: musicOutput,
            thisFrame: underlyingFrame
        });
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            return TitleScreenFrame.getFrame(globalState, sessionState);
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        underlyingFrame.render(displayOutput);
        displayOutput.drawText(Math.floor(GlobalConstants.WINDOW_WIDTH / 2) - 102, 600, "You Win!", 0 /* GameFont.SimpleFont */, 48, white);
        displayOutput.drawText(378, 500, "Back to title screen", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawRectangle(375, 473, 250, 30, white, false);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
