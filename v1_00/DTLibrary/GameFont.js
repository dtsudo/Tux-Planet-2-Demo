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
