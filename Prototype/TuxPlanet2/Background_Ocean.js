// REVIEW ME
let Background_Ocean = {};
((function () {
    let getBackground = function (xOffset, bossFrameCounter) {
        let thisObj;
        let getSnapshot = function (thisObj) {
            return getBackground(xOffset, bossFrameCounter);
        };
        let processFrame = function () {
            xOffset -= 2;
            if (xOffset <= -480 * 3)
                xOffset += 480 * 3;
            if (bossFrameCounter !== null && bossFrameCounter < 1000) {
                bossFrameCounter++;
            }
            if (bossFrameCounter !== null) {
                xOffset -= 1;
                if (bossFrameCounter > 10)
                    xOffset -= 1;
                if (bossFrameCounter > 20)
                    xOffset -= 1;
                if (bossFrameCounter > 30)
                    xOffset -= 1;
                if (bossFrameCounter > 40)
                    xOffset -= 1;
                if (bossFrameCounter > 50)
                    xOffset -= 1;
                if (bossFrameCounter > 60)
                    xOffset -= 1;
                if (bossFrameCounter > 70)
                    xOffset -= 1;
                if (bossFrameCounter > 80)
                    xOffset -= 1;
                if (bossFrameCounter > 90)
                    xOffset -= 1;
            }
        };
        let startBoss = function () {
            bossFrameCounter = 0;
        };
        let render = function (displayOutput) {
            displayOutput.drawImageRotatedClockwise(7 /* GameImage.Ocean */, 0, 0, 480, 240, xOffset, 0, 0, 128 * 3);
            displayOutput.drawImageRotatedClockwise(7 /* GameImage.Ocean */, 0, 0, 480, 240, xOffset + 480 * 3, 0, 0, 128 * 3);
            if (bossFrameCounter !== null) {
                // 0 -> 200
                let alpha = bossFrameCounter * 5;
                if (alpha > 200)
                    alpha = 200;
                displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: alpha }, true);
            }
        };
        thisObj = {
            getSnapshot: getSnapshot,
            processFrame: processFrame,
            startBoss,
            render: render
        };
        return thisObj;
    };
    Background_Ocean.getBackground = function () {
        return getBackground(0, null);
    };
})());
