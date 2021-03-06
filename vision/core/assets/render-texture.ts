

/**
 * @packageDocumentation
 * @module asset
 */

import { ccclass } from 'cc.decorator';
import { EDITOR, TEST } from 'internal:constants';
import { clamp } from '../math/utils';
import { Texture, ColorAttachment, DepthStencilAttachment, GeneralBarrierInfo, AccessFlagBit, RenderPassInfo, Format } from '../gfx';
import { legacyCC } from '../global-exports';
import { RenderWindow, IRenderWindowInfo } from '../renderer/core/render-window';
import { Root } from '../root';
import { TextureBase } from './texture-base';
import { BufferTextureCopy } from '../gfx/base/define';
import { errorID } from '../platform/debug';

export interface IRenderTextureCreateInfo {
    name?: string;
    width: number;
    height: number;
    passInfo?: RenderPassInfo;
}

const _colorAttachment = new ColorAttachment();
_colorAttachment.format = Format.RGBA8;
const _depthStencilAttachment = new DepthStencilAttachment();
_depthStencilAttachment.format = Format.DEPTH_STENCIL;
const passInfo = new RenderPassInfo([_colorAttachment], _depthStencilAttachment);

const _windowInfo: IRenderWindowInfo = {
    width: 1,
    height: 1,
    renderPassInfo: passInfo,
};

/**
 * @en Render texture is a render target for [[Camera]] or [[Canvas]] component,
 * the render pipeline will use its [[RenderWindow]] as the target of the rendering process.
 * @zh 渲染贴图是 [[Camera]] 或 [[Canvas]] 组件的渲染目标对象，渲染管线会使用它的 [[RenderWindow]] 作为渲染的目标窗口。
 */
@ccclass('cc.RenderTexture')
export class RenderTexture extends TextureBase {
    private _window: RenderWindow | null = null;

    /**
     * @en The render window for the render pipeline, it's created internally and cannot be modified.
     * @zh 渲染管线所使用的渲染窗口，内部逻辑创建，无法被修改。
     */
    get window () {
        return this._window;
    }

    public initialize (info: IRenderTextureCreateInfo) {
        this._name = info.name || '';
        this._width = info.width;
        this._height = info.height;
        this._initWindow(info);
    }

    public reset (info: IRenderTextureCreateInfo) { // to be consistent with other assets
        this.initialize(info);
    }

    public destroy () {
        if (this._window) {
            const root = legacyCC.director.root as Root;
            root?.destroyWindow(this._window);
            this._window = null;
        }

        return super.destroy();
    }

    /**
     * @en Resize the render texture
     * @zh 修改渲染贴图的尺寸
     * @param width The pixel width, the range is from 1 to 2048
     * @param height The pixel height, the range is from 1 to 2048
     */
    public resize (width: number, height: number) {
        this._width = Math.floor(clamp(width, 1, 2048));
        this._height = Math.floor(clamp(height, 1, 2048));
        if (this._window) {
            this._window.resize(this._width, this._height);
        }
        this.emit('resize', this._window);
    }

    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    public _serialize (ctxForExporting: any): any {
        if (EDITOR || TEST) {
            return { base: super._serialize(ctxForExporting), w: this._width, h: this._height, n: this._name };
        }
        return {};
    }

    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    public _deserialize (serializedData: any, handle: any) {
        const data = serializedData;
        this._width = data.w;
        this._height = data.h;
        this._name = data.n;
        super._deserialize(data.base, handle);
    }

    // To be compatible with material property interface
    /**
     * @en Gets the related [[Texture]] resource, it's also the color attachment for the render window
     * @zh 获取渲染贴图的 GFX 资源，同时也是渲染窗口所指向的颜色缓冲贴图资源
     */
    public getGFXTexture (): Texture | null {
        return this._window && this._window.framebuffer.colorTextures[0];
    }

    public onLoaded () {
        this._initWindow();
    }

    protected _initWindow (info?: IRenderTextureCreateInfo) {
        const root = legacyCC.director.root as Root;

        _windowInfo.title = this._name;
        _windowInfo.width = this._width;
        _windowInfo.height = this._height;
        _windowInfo.renderPassInfo = info && info.passInfo ? info.passInfo : passInfo;

        _colorAttachment.barrier = root.device.getGeneralBarrier(new GeneralBarrierInfo(
            AccessFlagBit.FRAGMENT_SHADER_READ_TEXTURE,
            AccessFlagBit.FRAGMENT_SHADER_READ_TEXTURE,
        ));

        if (this._window) {
            this._window.destroy();
            this._window.initialize(root.device, _windowInfo);
        } else {
            this._window = root.createWindow(_windowInfo);
        }
    }

    public initDefault (uuid?: string) {
        super.initDefault(uuid);
        this._width = this._height = 1;
        this._initWindow();
    }

    public validate () {
        return this.width >= 1 && this.width <= 2048 && this.height >= 1 && this.height <= 2048;
    }

    /**
     * @en Read pixel buffer from render texture
     * @param x The location on x axis
     * @param y The location on y axis
     * @param width The pixel width
     * @param height The pixel height
     * @zh 从 render texture 读取像素数据
     * @param x 起始位置X轴坐标
     * @param y 起始位置Y轴坐标
     * @param width 像素宽度
     * @param height 像素高度
     * @param buffer 像素缓存
     */
    public readPixels (x = 0, y = 0, width?: number, height?: number, buffer?: Uint8Array) : Uint8Array | null {
        width = width || this.width;
        height = height || this.height;
        const gfxTexture = this.getGFXTexture();
        if (!gfxTexture) {
            errorID(7606);
            return null;
        }
        const needSize = 4 * width * height;
        if (buffer === undefined) {
            buffer = new Uint8Array(needSize);
        } else if (buffer.length < needSize) {
            errorID(7607, needSize);
            return null;
        }

        const gfxDevice = this._getGFXDevice();

        const bufferViews: ArrayBufferView[] = [];
        const regions: BufferTextureCopy[] = [];

        const region0 = new BufferTextureCopy();
        region0.texOffset.x = x;
        region0.texOffset.y = y;
        region0.texExtent.width = width;
        region0.texExtent.height = height;
        regions.push(region0);

        bufferViews.push(buffer);
        gfxDevice?.copyTextureToBuffers(gfxTexture, bufferViews, regions);
        return buffer;
    }
}

legacyCC.RenderTexture = RenderTexture;
