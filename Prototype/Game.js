// REVIEW ME
if (!window.getNumImagesRendered)
    window.getNumImagesRendered = function () { return 0; };
let Game = ((function () {
    "use strict";
    let beginGame = function () {
        var isEmbeddedVersion = false;
        var isElectronVersion = !isEmbeddedVersion
            && (window.navigator.userAgent.indexOf('Electron') >= 0 || window.navigator.userAgent.indexOf('electron') >= 0);
        var documentAsAny = document;
        var urlParams = (new URL(documentAsAny.location)).searchParams;
        var showFps = urlParams.get('showfps') !== null
            ? (urlParams.get('showfps') === 'true')
            : false;
        var debugMode = urlParams.get('debugmode') !== null
            ? (urlParams.get('debugmode') === 'true')
            : false;
        // TODO: remove this line
        //debugMode = true;
        let buildType;
        if (isEmbeddedVersion)
            buildType = 0 /* BuildType.WebStandalone */;
        else if (isElectronVersion)
            buildType = 2 /* BuildType.Electron */;
        else
            buildType = 0 /* BuildType.WebStandalone */;
        GameInitializer.initializeGame(buildType, debugMode);
        var computeAndRenderNextFrame;
        var fps = 60;
        var nextTimeToAct = Date.now() + (1000.0 / fps);
        computeAndRenderNextFrame = function () {
            var now = Date.now();
            if (nextTimeToAct > now) {
                requestAnimationFrame(computeAndRenderNextFrame);
                return;
            }
            if (nextTimeToAct < now - 5.0 * (1000.0 / fps))
                nextTimeToAct = now - 5.0 * (1000.0 / fps);
            nextTimeToAct = nextTimeToAct + (1000.0 / fps);
            GameInitializer.computeAndRenderNextFrame();
            /**/ //window.FpsDisplayJavascript.frameComputedAndRendered();
            if (showFps) {
                /**/ //window.FpsDisplayJavascript.displayFps();
            }
            requestAnimationFrame(computeAndRenderNextFrame);
        };
        requestAnimationFrame(computeAndRenderNextFrame);
    };
    return {
        beginGame
    };
})());
