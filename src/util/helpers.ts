/**
 * Gray console text maker
 * @param str String to gray
 * @returns Gray string to put in console
 **/
export function unimportant(str: string) {
    return `\x1b[90m${str}\x1b[0m`;
}

/**
 * Pad time strings
 * @param num Number to pad
 * @param padAmount Amount of padding
 * @param padChar Character to pad with
 * @param left Whether to pad left or right
 * @returns Padded string
 **/
export function padNum(
    num: number,
    padAmount: number,
    padChar: string,
    left: boolean = true
) {
    return left
        ? num.toString().padStart(padAmount, padChar)
        : num.toString().padEnd(padAmount, padChar);
}

// ArrayBuffer to text
export const decoder = new TextDecoder();
export const encoder = new TextEncoder();

/**
 * Check if an object has a property
 * @param obj Object to check
 * @param property Property to check
 * @returns Whether the object has the property
 **/
export function hasOwn(obj: any, property: string | number | Symbol) {
    return (Object as unknown as any).hasOwn(obj, property);
}

/**
 * Darken a hex color
 * @param color Hex color string (example: "#8d3f50")
 * @returns Darkened hex color
 */
export function darken(color: string, amount = 0x40) {
    const r = Math.max(0, parseInt(color.substring(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(color.substring(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(color.substring(5, 7), 16) - amount);

    return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// spooky.jsaurus
// NOT the same as poop_text

/**
 * Make text spoopy
 * @param message Message to spoop
 * @returns Spooped message
 **/
export function spoop_text(message: string) {
    var old = message;
    message = "";
    for (var i = 0; i < old.length; i++) {
        if (Math.random() < 0.9) {
            message += String.fromCharCode(
                old.charCodeAt(i) + Math.floor(Math.random() * 20 - 10)
            );
            //message[i] = String.fromCharCode(Math.floor(Math.random() * 255));
        } else {
            message += old[i];
        }
    }
    return message;
}

/**
 * Mix two objects
 * @param obj1 Object to mix into
 * @param obj2 Object to mix
 **/
export function mixin(obj1: any, obj2: any) {
    for (const key of Object.keys(obj2)) {
        obj1[key] = obj2[key];
    }
}

/**
 * HSL to hex color converter
 * https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex
 * @param h Hue (degrees)
 * @param s Saturation (percentage)
 * @param l Lightness (percentage)
 * @returns
 */
export function hsl2hex(h: number, s: number, l: number) {
    l /= 100;

    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0"); // convert to Hex and prefix "0" if needed
    };

    return `#${f(0)}${f(8)}${f(4)}`;
}

export function limit(num: number, min: number, max: number) {
    return Math.min(Math.max(num, min), max);
}

/**
 * Format a future time in milliseconds to a string displaying the time remaining
 * @param ms Time in nilliseconds to format
 */
export function formatMillisecondsRemaining(ms: number) {
    const seconds = ms / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;

    const cdays = Math.floor(days);
    const chours = Math.floor(hours) % 24;
    const cminutes = Math.floor(minutes) % 60;
    const cseconds = Math.floor(seconds) % 60;

    return [
        cdays > 0 ? cdays + " days" : undefined,
        chours > 0 ? chours + " hours" : undefined,
        cminutes > 0 ? cminutes + " minutes" : undefined,
        cseconds > 0 ? cseconds + " seconds" : undefined
    ]
        .filter(v => v !== undefined)
        .join(", ");
}
