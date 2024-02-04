let GameKeyboard = {
    getKeyboard: function (disableArrowKeyScrolling) {
        "use strict";
        let keysBeingPressed = [];
        let mapKeyToCanonicalKey = function (key) {
            if (key === "A")
                return "a";
            if (key === "B")
                return "b";
            if (key === "C")
                return "c";
            if (key === "D")
                return "d";
            if (key === "E")
                return "e";
            if (key === "F")
                return "f";
            if (key === "G")
                return "g";
            if (key === "H")
                return "h";
            if (key === "I")
                return "i";
            if (key === "J")
                return "j";
            if (key === "K")
                return "k";
            if (key === "L")
                return "l";
            if (key === "M")
                return "m";
            if (key === "N")
                return "n";
            if (key === "O")
                return "o";
            if (key === "P")
                return "p";
            if (key === "Q")
                return "q";
            if (key === "R")
                return "r";
            if (key === "S")
                return "s";
            if (key === "T")
                return "t";
            if (key === "U")
                return "u";
            if (key === "V")
                return "v";
            if (key === "W")
                return "w";
            if (key === "X")
                return "x";
            if (key === "Y")
                return "y";
            if (key === "Z")
                return "z";
            if (key === "!")
                return "1";
            if (key === "@")
                return "2";
            if (key === "#")
                return "3";
            if (key === "$")
                return "4";
            if (key === "%")
                return "5";
            if (key === "^")
                return "6";
            if (key === "&")
                return "7";
            if (key === "*")
                return "8";
            if (key === "(")
                return "9";
            if (key === ")")
                return "0";
            return key;
        };
        let keyDownHandler = function (e) {
            if (disableArrowKeyScrolling) {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === " ")
                    e.preventDefault();
            }
            let key = mapKeyToCanonicalKey(e.key);
            for (let i = 0; i < keysBeingPressed.length; i++) {
                if (keysBeingPressed[i] === key)
                    return;
            }
            keysBeingPressed.push(key);
        };
        let keyUpHandler = function (e) {
            let key = mapKeyToCanonicalKey(e.key);
            let newArray = [];
            for (let i = 0; i < keysBeingPressed.length; i++) {
                if (keysBeingPressed[i] !== key)
                    newArray.push(keysBeingPressed[i]);
            }
            keysBeingPressed = newArray;
        };
        document.addEventListener("keydown", function (e) { keyDownHandler(e); }, false);
        document.addEventListener("keyup", function (e) { keyUpHandler(e); }, false);
        let mapping = {};
        let array = Object.keys(KeyMapping);
        for (let i = 0; i < array.length; i++)
            mapping[KeyMapping[array[i]]] = array[i];
        let isPressed = function (key) {
            let k = mapping[key];
            for (let i = 0; i < keysBeingPressed.length; i++) {
                if (keysBeingPressed[i] === k)
                    return true;
            }
            return false;
        };
        return {
            isPressed
        };
    }
};
