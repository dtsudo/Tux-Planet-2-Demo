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
