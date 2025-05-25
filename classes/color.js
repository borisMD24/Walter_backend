class Color {
    constructor(rgb) {
        this.rgb = rgb;
        this.xy = this.computeXY();
    }

    computeXY() {
        let [r, g, b] = this.rgb.map(c => c / 255);

        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        const X = r * 0.664511 + g * 0.154324 + b * 0.162028;
        const Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
        const Z = r * 0.000088 + g * 0.072310 + b * 0.986039;

        const sum = X + Y + Z;
        const x = sum === 0 ? 0 : X / sum;
        const y = sum === 0 ? 0 : Y / sum;

        return [x, y];
    }

    static fromXY(xy, brightness = 1.0) {
        const [x, y] = xy;
        const z = 1.0 - x - y;

        const Y = brightness;
        const X = (Y / y) * x;
        const Z = (Y / y) * z;

        let r =  X * 1.656492 - Y * 0.354851 - Z * 0.255038;
        let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
        let b =  X * 0.051713 - Y * 0.121364 + Z * 1.011530

        r = Math.max(0, Math.min(1, r));
        g = Math.max(0, Math.min(1, g));
        b = Math.max(0, Math.min(1, b));

        r = r <= 0.0031308 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055;
        g = g <= 0.0031308 ? 12.92 * g : 1.055 * Math.pow(g, 1 / 2.4) - 0.055;
        b = b <= 0.0031308 ? 12.92 * b : 1.055 * Math.pow(b, 1 / 2.4) - 0.055;

        const rgb = [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];

        return new Color(rgb);
    }
}

export default Color;