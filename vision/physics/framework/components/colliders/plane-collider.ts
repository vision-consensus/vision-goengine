

/**
 * @packageDocumentation
 * @module physics
 */

import {
    ccclass,
    help,
    executeInEditMode,
    menu,
    tooltip,
    type,
    editable,
    serializable,
} from 'cc.decorator';
import { Vec3 } from '../../../../core/math';
import { Collider } from './collider';
import { IPlaneShape } from '../../../spec/i-physics-shape';
import { EColliderType } from '../../physics-enum';

/**
 * @en
 * Plane collider component.
 * @zh
 * 静态平面碰撞器。
 */
@ccclass('cc.PlaneCollider')
@help('i18n:cc.PlaneCollider')
@menu('Physics/PlaneCollider')
@executeInEditMode
export class PlaneCollider extends Collider {
    /// PUBLIC PROPERTY GETTER\SETTER ///

    /**
     * @en
     * Gets or sets the normal of the plane, in local space.
     * @zh
     * 获取或设置平面在本地坐标系下的法线。
     */
    @type(Vec3)
    @tooltip('i18n:physics3d.collider.plane_normal')
    public get normal () {
        return this._normal;
    }

    public set normal (value) {
        if (Vec3.strictEquals(this._normal, value)) return;
        Vec3.copy(this._normal, value);
        if (this._shape) {
            this.shape.setNormal(this._normal);
        }
    }

    /**
     * @en
     * Gets or sets the value of the plane moving along the normal, in local space.
     * @zh
     * 获取或设置平面在本地坐标系下沿着法线移动的数值。
     */
    @editable
    @tooltip('i18n:physics3d.collider.plane_constant')
    public get constant () {
        return this._constant;
    }

    public set constant (v: number) {
        if (this._constant === v) return;
        this._constant = v;
        if (this._shape) {
            this.shape.setConstant(this._constant);
        }
    }

    /**
     * @en
     * Gets the wrapper object, through which the lowLevel instance can be accessed.
     * @zh
     * 获取封装对象，通过此对象可以访问到底层实例。
     */
    public get shape () {
        return this._shape as IPlaneShape;
    }

    /// PRIVATE PROPERTY ///

    @serializable
    private _normal = new Vec3(0, 1, 0);

    @serializable
    private _constant = 0;

    constructor () {
        super(EColliderType.PLANE);
    }
}
