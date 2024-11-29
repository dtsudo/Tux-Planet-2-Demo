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
