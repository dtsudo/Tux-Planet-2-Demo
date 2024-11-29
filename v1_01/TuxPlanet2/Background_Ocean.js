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
            displayOutput.drawImageRotatedClockwise(13 /* GameImage.Ocean */, 0, 0, 480, 240, xOffsetMibi >> 10, 0, 0, 128 * 3);
            displayOutput.drawImageRotatedClockwise(13 /* GameImage.Ocean */, 0, 0, 480, 240, (xOffsetMibi >> 10) + 480 * 3, 0, 0, 128 * 3);
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
