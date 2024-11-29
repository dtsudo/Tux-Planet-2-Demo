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
