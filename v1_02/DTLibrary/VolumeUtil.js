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
