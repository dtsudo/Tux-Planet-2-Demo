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
