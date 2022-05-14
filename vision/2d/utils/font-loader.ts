
import { warnID } from '../../core/platform/debug';
import { safeMeasureText } from './text-utils';
import { CompleteCallback, IDownloadParseOptions } from '../../core/asset-manager/shared';
import downloader from '../../core/asset-manager/downloader';
import factory from '../../core/asset-manager/factory';
import { TTFFont } from '../assets/ttf-font';

interface IFontLoadHandle {
    fontFamilyName: string;
    refWidth: number;
    onComplete: CompleteCallback;
    startTime: number;
}

let _canvasContext: CanvasRenderingContext2D | null = null;
let _intervalId = -1;
// letter symbol number CJK
const _testString = 'BES bswy:->@123\u4E01\u3041\u1101';

const _fontFaces = Object.create(null);

const _loadingFonts: IFontLoadHandle[] = [];
// 3 seconds timeout
const _timeout = 3000;

// Refer to https://github.com/typekit/webfontloader/blob/master/src/core/fontwatcher.js
const useNativeCheck = (() => {
    let nativeCheck: boolean;
    return (): boolean => {
        if (nativeCheck === undefined) {
            if ('FontFace' in window) {
                const match = /Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent);
                const safari10Match = /OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent) && /Apple/.exec(window.navigator.vendor);

                if (match) {
                    nativeCheck = parseInt(match[1], 10) > 42;
                } else if (safari10Match) {
                    nativeCheck = false;
                } else {
                    nativeCheck = true;
                }
            } else {
                nativeCheck = false;
            }
        }

        return nativeCheck;
    };
})();

function checkFontLoaded () {
    let allFontsLoaded = true;
    const now = Date.now();

    for (let i = _loadingFonts.length - 1; i >= 0; i--) {
        const fontLoadHandle = _loadingFonts[i];
        const fontFamily = fontLoadHandle.fontFamilyName;
        // load timeout
        if (now - fontLoadHandle.startTime > _timeout) {
            warnID(4933, fontFamily);
            fontLoadHandle.onComplete(null, fontFamily);
            _loadingFonts.splice(i, 1);
            continue;
        }

        const oldWidth = fontLoadHandle.refWidth;
        const fontDesc = `40px ${fontFamily}`;
        _canvasContext!.font = fontDesc;
        const newWidth = safeMeasureText(_canvasContext!, _testString, fontDesc);
        // loaded successfully
        if (oldWidth !== newWidth) {
            _loadingFonts.splice(i, 1);
            fontLoadHandle.onComplete(null, fontFamily);
        } else {
            allFontsLoaded = false;
        }
    }

    if (allFontsLoaded) {
        clearInterval(_intervalId);
        _intervalId = -1;
    }
}

// refer to https://github.com/typekit/webfontloader/blob/master/src/core/nativefontwatchrunner.js
function nativeCheckFontLoaded (start: number, font: string, callback: CompleteCallback): void {
    const loader = new Promise<void>((resolve, reject) => {
        const check = () => {
            const now = Date.now();

            if (now - start >= _timeout) {
                reject();
            } else {
                // @ts-expect-error see https://developer.mozilla.org/en-US/docs/Web/API/Document/fonts
                document.fonts.load(`40px ${font}`).then((fonts) => {
                    if (fonts.length >= 1) {
                        resolve();
                    } else {
                        setTimeout(check, 100);
                    }
                }, () => {
                    reject();
                });
            }
        };

        check();
    });

    let timeoutId: number | null = null;
    const timer = new Promise((resolve, reject) => {
        timeoutId = setTimeout(reject, _timeout);
    });

    Promise.race([timer, loader]).then(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        callback(null, font);
    }, () => {
        warnID(4933, font);
        callback(null, font);
    });
}

export function loadFont (url: string, options: IDownloadParseOptions, onComplete: CompleteCallback) {
    const fontFamilyName = getFontFamily(url);

    // Already loaded fonts
    if (_fontFaces[fontFamilyName]) {
        onComplete(null, fontFamilyName);
        return;
    }

    if (!_canvasContext) {
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 100;
        labelCanvas.height = 100;
        _canvasContext = labelCanvas.getContext('2d');
    }

    // Default width reference to test whether new font is loaded correctly
    const fontDesc = `40px ${fontFamilyName}`;
    const refWidth = safeMeasureText(_canvasContext!, _testString, fontDesc);

    // Setup font face style
    const fontStyle = document.createElement('style');
    fontStyle.type = 'text/css';
    let fontStr = '';
    if (Number.isNaN(fontFamilyName)) {
        fontStr += `@font-face { font-family:${fontFamilyName}; src:`;
    } else {
        fontStr += `@font-face { font-family:"${fontFamilyName}"; src:`;
    }
    fontStr += `url("${url}");`;
    fontStyle.textContent = `${fontStr}}`;
    document.body.appendChild(fontStyle);

    // Preload font with div
    const preloadDiv = document.createElement('div');
    const divStyle = preloadDiv.style;
    divStyle.fontFamily = fontFamilyName;
    preloadDiv.innerHTML = '.';
    divStyle.position = 'absolute';
    divStyle.left = '-100px';
    divStyle.top = '-100px';
    document.body.appendChild(preloadDiv);

    if (useNativeCheck()) {
        nativeCheckFontLoaded(Date.now(), fontFamilyName, onComplete);
    } else {
        // Save loading font
        const fontLoadHandle = {
            fontFamilyName,
            refWidth,
            onComplete,
            startTime: Date.now(),
        };
        _loadingFonts.push(fontLoadHandle);
        if (_intervalId === -1) {
            _intervalId = setInterval(checkFontLoaded, 100);
        }
    }
    _fontFaces[fontFamilyName] = fontStyle;
}

export function getFontFamily (fontHandle: string): string {
    const ttfIndex = fontHandle.lastIndexOf('.ttf');
    if (ttfIndex === -1) { return fontHandle; }

    const slashPos = fontHandle.lastIndexOf('/');
    let fontFamilyName: string;
    if (slashPos === -1) {
        fontFamilyName = `${fontHandle.substring(0, ttfIndex)}_LABEL`;
    } else {
        fontFamilyName = `${fontHandle.substring(slashPos + 1, ttfIndex)}_LABEL`;
    }
    if (fontFamilyName.indexOf(' ') !== -1) {
        fontFamilyName = `"${fontFamilyName}"`;
    }
    return fontFamilyName;
}

function createFont (id: string, data: string, options: IDownloadParseOptions, onComplete: CompleteCallback<TTFFont>) {
    const out = new TTFFont();
    out._nativeUrl = id;
    out._nativeAsset = data;
    onComplete(null, out);
}

downloader.register({
    // font
    '.font': loadFont,
    '.eot': loadFont,
    '.ttf': loadFont,
    '.woff': loadFont,
    '.svg': loadFont,
    '.ttc': loadFont,
});

factory.register({
    // font
    '.font': createFont,
    '.eot': createFont,
    '.ttf': createFont,
    '.woff': createFont,
    '.svg': createFont,
    '.ttc': createFont,
});
