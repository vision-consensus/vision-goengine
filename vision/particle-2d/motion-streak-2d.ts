

/**
 * @packageDocumentation
 * @module particle2d
 */

import { ccclass, executeInEditMode, serializable, playOnFocus, menu, help, editable, type } from 'cc.decorator';
import { EDITOR } from 'internal:constants';
import { Renderable2D } from '../2d/framework';
import { Texture2D } from '../core/assets/texture-2d';
import { IBatcher } from '../2d/renderer/i-batcher';
import { Vec2 } from '../core';

class Point {
    public point = new Vec2();
    public dir = new Vec2();
    public distance = 0;
    public time = 0;

    constructor (point?: Vec2, dir?: Vec2) {
        if (point) this.point.set(point);
        if (dir) this.dir.set(dir);
    }

    public setPoint (x, y) {
        this.point.x = x;
        this.point.y = y;
    }

    public setDir (x, y) {
        this.dir.x = x;
        this.dir.y = y;
    }
}

/**
 * @en
 * cc.MotionStreak manages a Ribbon based on it's motion in absolute space.                 <br/>
 * You construct it with a fadeTime, minimum segment size, texture path, texture            <br/>
 * length and color. The fadeTime controls how long it takes each vertex in                 <br/>
 * the streak to fade out, the minimum segment size it how many pixels the                  <br/>
 * streak will move before adding a new ribbon segment, and the texture                     <br/>
 * length is the how many pixels the texture is stretched across. The texture               <br/>
 * is vertically aligned along the streak segment.
 * @zh 运动轨迹，用于游戏对象的运动轨迹上实现拖尾渐隐效果。
 */
@ccclass('cc.MotionStreak')
@executeInEditMode
@playOnFocus
@menu('Effects/MotionStreak')
@help('i18n:COMPONENT.help_url.motionStreak')
export class MotionStreak extends Renderable2D {
    public static Point = Point;

    /**
     * @en Preview the trailing effect in editor mode.
     * @zh 在编辑器模式下预览拖尾效果。
     */
    @editable
    public get preview () {
        return this._preview;
    }

    public set preview (val: boolean) {
        this._preview = val;
        this.reset();
    }
    /**
     * @en The fade time to fade.
     * @zh 拖尾的渐隐时间，以秒为单位。
     * @example
     * motionStreak.fadeTime = 3;
     */
    @editable
    public get fadeTime () {
        return this._fadeTime;
    }

    public set fadeTime (val) {
        this._fadeTime = val;
        this.reset();
    }
    /**
     * @en The minimum segment size.
     * @zh 拖尾之间最小距离。
     * @example
     * motionStreak.minSeg = 3;
     */
    @editable
    public get minSeg () {
        return this._minSeg;
    }
    public set minSeg (val) {
        this._minSeg = val;
    }
    /**
     * @en The stroke's width.
     * @zh 拖尾的宽度。
     * @example
     * motionStreak.stroke = 64;
     */
    @editable
    public get stroke () {
        return this._stroke;
    }
    public set stroke (val) {
        this._stroke = val;
    }

    /**
     * @en The texture of the MotionStreak.
     * @zh 拖尾的贴图。
     * @example
     * motionStreak.texture = newTexture;
     */
    @type(Texture2D)
    public get texture () {
        return this._texture;
    }

    public set texture (val) {
        if (this._texture === val) return;

        this._texture = val;
    }
    /**
     * @en The fast Mode.
     * @zh 是否启用了快速模式。当启用快速模式，新的点会被更快地添加，但精度较低。
     * @example
     * motionStreak.fastMode = true;
     */
    @editable
    public get fastMode () {
        return this._fastMode;
    }
    public set fastMode (val: boolean) {
        this._fastMode = val;
    }

    public get points () {
        return this._points;
    }

    @serializable
    private _preview = false;
    @serializable
    private _fadeTime = 1;
    @serializable
    private _minSeg = 1;
    @serializable
    private _stroke = 64;
    @serializable
    private _texture: Texture2D | null  = null;
    @serializable
    private _fastMode = false;
    private _points: Point[] = [];

    public onEnable () {
        super.onEnable();
        this.reset();
    }

    protected _flushAssembler () {
        const assembler = MotionStreak.Assembler.getAssembler(this);

        if (this._assembler !== assembler) {
            this._assembler = assembler;
        }

        if (!this._renderData) {
            if (this._assembler && this._assembler.createData) {
                this._renderData = this._assembler.createData(this);
                this._renderData!.material = this.material;
            }
        }
    }

    public onFocusInEditor () {
        if (this._preview) {
            this.reset();
        }
    }

    public onLostFocusInEditor () {
        if (this._preview) {
            this.reset();
        }
    }

    /**
     * @en Remove all living segments of the ribbon.
     * @zh 删除当前所有的拖尾片段。
     * @example
     * // Remove all living segments of the ribbon.
     * myMotionStreak.reset();
     */
    public reset () {
        this._points.length = 0;
        if (this._renderData) this._renderData.clear();
    }

    public lateUpdate (dt) {
        if (EDITOR && !this._preview) return;
        if (this._assembler) this._assembler.update(this, dt);
    }

    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    public _render (render: IBatcher) {
        render.commitComp(this, this.renderData, this._texture, this._assembler, null);
    }
}
