

/**
 * @packageDocumentation
 * @module gfx
 */

import { RenderPass } from './render-pass';
import { Texture } from './texture';
import { GFXObject, ObjectType, FramebufferInfo } from './define';

/**
 * @en GFX frame buffer.
 * @zh GFX 帧缓冲。
 */
export abstract class Framebuffer extends GFXObject {
    /**
     * @en Get current render pass.
     * @zh GFX 渲染过程。
     */
    public get renderPass (): RenderPass {
        return this._renderPass!;
    }

    /**
     * @en Get current color views.
     * @zh 颜色纹理视图数组。
     */
    public get colorTextures (): (Texture | null)[] {
        return this._colorTextures;
    }

    /**
     * @en Get current depth stencil views.
     * @zh 深度模板纹理视图。
     */
    public get depthStencilTexture (): Texture | null {
        return this._depthStencilTexture;
    }

    protected _renderPass: RenderPass | null = null;
    protected _colorTextures: (Texture | null)[] = [];
    protected _depthStencilTexture: Texture | null = null;

    constructor () {
        super(ObjectType.FRAMEBUFFER);
    }

    public abstract initialize (info: Readonly<FramebufferInfo>): void;

    public abstract destroy (): void;
}
