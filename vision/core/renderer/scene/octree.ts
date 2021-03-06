

import { JSB } from 'internal:constants';
import { Vec3 } from '../../math/vec3';
import type { OctreeInfo } from '../../scene-graph/scene-globals';
import { NativeOctree } from '../native-scene';

export class Octree {
    /**
     * @en enable octree
     * @zh 是否开启八叉树加速剔除
     */
    set enabled (val: boolean) {
        this._enabled = val;
        if (JSB) {
            this._nativeObj!.enabled = val;
        }
    }
    get enabled (): boolean {
        return this._enabled;
    }

    /**
     * @en min pos of scene bounding box
     * @zh 场景包围盒最小值
     */
    get minPos (): Vec3 {
        return this._minPos;
    }
    set minPos (val: Vec3) {
        this._minPos = val;
        if (JSB) {
            this._nativeObj!.minPos = val;
        }
    }

    /**
     * @en max pos of scene bounding box
     * @zh 场景包围盒最大值
     */
    get maxPos (): Vec3 {
        return this._maxPos;
    }
    set maxPos (val: Vec3) {
        this._maxPos = val;
        if (JSB) {
            this._nativeObj!.maxPos = val;
        }
    }

    /**
     * @en depth of octree
     * @zh 八叉树深度
     */
    get depth (): number {
        return this._depth;
    }

    set depth (val: number) {
        this._depth = val;
        if (JSB) {
            this._nativeObj!.depth = val;
        }
    }

    protected _enabled = false;
    protected _minPos = new Vec3(0, 0, 0);
    protected _maxPos = new Vec3(0, 0, 0);
    protected _depth = 0;
    protected declare _nativeObj: NativeOctree | null;

    get native (): NativeOctree {
        return this._nativeObj!;
    }

    constructor () {
        if (JSB) {
            this._nativeObj = new NativeOctree();
        }
    }

    public initialize (octreeInfo: OctreeInfo) {
        this._enabled = octreeInfo.enabled;
        this._minPos = octreeInfo.minPos;
        this._maxPos = octreeInfo.maxPos;
        this._depth = octreeInfo.depth;

        if (JSB) {
            this._nativeObj!.enabled = this._enabled;
            this._nativeObj!.minPos = this._minPos;
            this._nativeObj!.maxPos = this._maxPos;
            this._nativeObj!.depth = this._depth;
        }
    }

    protected _destroy () {
        if (JSB) {
            this._nativeObj = null;
        }
    }

    public destroy () {
        this._destroy();
    }
}
