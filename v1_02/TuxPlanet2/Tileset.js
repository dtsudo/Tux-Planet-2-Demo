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
        throw new Error("Unrecognized tileset");
    },
    getGameImageForTileset: function (tileset) {
        switch (tileset) {
            case 0 /* Tileset.Snow */: return 41 /* GameImage.TsSnow */;
            case 1 /* Tileset.Sign */: return 42 /* GameImage.SignPost */;
            case 2 /* Tileset.Igloo */: return 43 /* GameImage.Igloo */;
            case 3 /* Tileset.IceCave */: return 44 /* GameImage.IceCaveTiles */;
            case 4 /* Tileset.Treetops */: return 45 /* GameImage.Treetops */;
        }
    }
};
