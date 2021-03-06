

import { Format, FormatInfos, FormatType, FormatInfo } from '../../core/gfx';
import { sys } from '../../core/platform/sys';

const _typeMap: Record<string, string> = {
    [FormatType.UNORM]: 'Uint',
    [FormatType.SNORM]: 'Int',
    [FormatType.UINT]: 'Uint',
    [FormatType.INT]: 'Int',
    [FormatType.UFLOAT]: 'Float',
    [FormatType.FLOAT]: 'Float',
    default: 'Uint',
};
function _getDataViewType (info: FormatInfo) {
    const type = _typeMap[info.type] || _typeMap.default;
    const bytes = info.size / info.count * 8;
    return `${type}${bytes}`;
}

// default params bahaves just like on an plain, compact Float32Array
export function writeBuffer (target: DataView, data: number[], format: Format = Format.R32F, offset = 0, stride = 0) {
    const info = FormatInfos[format];
    if (!stride) { stride = info.size; }
    const writer = `set${_getDataViewType(info)}`;
    const componentBytesLength = info.size / info.count;
    const nSeg = Math.floor(data.length / info.count);
    const isLittleEndian = sys.isLittleEndian;

    for (let iSeg = 0; iSeg < nSeg; ++iSeg) {
        const x = offset + stride * iSeg;
        for (let iComponent = 0; iComponent < info.count; ++iComponent) {
            const y = x + componentBytesLength * iComponent;
            target[writer](y, data[info.count * iSeg + iComponent], isLittleEndian);
        }
    }
}
export function readBuffer (
    target: DataView, format: Format = Format.R32F, offset = 0,
    length: number = target.byteLength - offset, stride = 0, out: number[] = [],
) {
    const info = FormatInfos[format];
    if (!stride) { stride = info.size; }
    const reader = `get${_getDataViewType(info)}`;
    const componentBytesLength = info.size / info.count;
    const nSeg = Math.floor(length / stride);
    const isLittleEndian = sys.isLittleEndian;

    for (let iSeg = 0; iSeg < nSeg; ++iSeg) {
        const x = offset + stride * iSeg;
        for (let iComponent = 0; iComponent < info.count; ++iComponent) {
            const y = x + componentBytesLength * iComponent;
            out[info.count * iSeg + iComponent] = target[reader](y, isLittleEndian);
        }
    }
    return out;
}
export function mapBuffer (
    target: DataView, callback: (cur: number, idx: number, view: DataView) => number, format: Format = Format.R32F,
    offset = 0, length: number = target.byteLength - offset, stride = 0, out?: DataView,
) {
    if (!out) { out = new DataView(target.buffer.slice(target.byteOffset, target.byteOffset + target.byteLength)); }
    const info = FormatInfos[format];
    if (!stride) { stride = info.size; }
    const writer = `set${_getDataViewType(info)}`;
    const reader = `get${_getDataViewType(info)}`;
    const componentBytesLength = info.size / info.count;
    const nSeg = Math.floor(length / stride);
    const isLittleEndian = sys.isLittleEndian;

    for (let iSeg = 0; iSeg < nSeg; ++iSeg) {
        const x = offset + stride * iSeg;
        for (let iComponent = 0; iComponent < info.count; ++iComponent) {
            const y = x + componentBytesLength * iComponent;
            const cur = target[reader](y, isLittleEndian);
            // iComponent is usually more useful than y
            out[writer](y, callback(cur, iComponent, target), isLittleEndian);
        }
    }
    return out;
}
