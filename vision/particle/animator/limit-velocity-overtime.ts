

/**
 * @packageDocumentation
 * @module particle
 */

import { ccclass, tooltip, displayOrder, range, type, serializable } from 'cc.decorator';
import { lerp, pseudoRandom, Vec3, Mat4, Quat } from '../../core/math';
import { Space, ModuleRandSeed } from '../enum';
import { Particle, ParticleModuleBase, PARTICLE_MODULE_NAME } from '../particle';
import CurveRange from './curve-range';
import { calculateTransform } from '../particle-general-function';

const LIMIT_VELOCITY_RAND_OFFSET = ModuleRandSeed.LIMIT;

const _temp_v3 = new Vec3();
const _temp_v3_1 = new Vec3();

@ccclass('cc.LimitVelocityOvertimeModule')
export default class LimitVelocityOvertimeModule extends ParticleModuleBase {
    @serializable
    _enable = false;
    /**
     * @zh 是否启用。
     */
    @displayOrder(0)
    public get enable () {
        return this._enable;
    }

    public set enable (val) {
        if (this._enable === val) return;
        this._enable = val;
        if (!this.target) return;
        this.target.enableModule(this.name, val, this);
    }

    /**
     * @zh X 轴方向上的速度下限。
     */
    @type(CurveRange)
    @serializable
    @range([-1, 1])
    @displayOrder(4)
    @tooltip('i18n:limitVelocityOvertimeModule.limitX')
    public limitX = new CurveRange();

    /**
     * @zh Y 轴方向上的速度下限。
     */
    @type(CurveRange)
    @serializable
    @range([-1, 1])
    @displayOrder(5)
    @tooltip('i18n:limitVelocityOvertimeModule.limitY')
    public limitY = new CurveRange();

    /**
     * @zh Z 轴方向上的速度下限。
     */
    @type(CurveRange)
    @serializable
    @range([-1, 1])
    @displayOrder(6)
    @tooltip('i18n:limitVelocityOvertimeModule.limitZ')
    public limitZ = new CurveRange();

    /**
     * @zh 速度下限。
     */
    @type(CurveRange)
    @serializable
    @range([-1, 1])
    @displayOrder(3)
    @tooltip('i18n:limitVelocityOvertimeModule.limit')
    public limit = new CurveRange();

    /**
     * @zh 当前速度与速度下限的插值。
     */
    @serializable
    @displayOrder(7)
    @tooltip('i18n:limitVelocityOvertimeModule.dampen')
    public dampen = 3;

    /**
     * @zh 是否三个轴分开限制。
     */
    @serializable
    @displayOrder(2)
    @tooltip('i18n:limitVelocityOvertimeModule.separateAxes')
    public separateAxes = false;

    /**
     * @zh 计算速度下限时采用的坐标系 [[Space]]。
     */
    @type(Space)
    @serializable
    @displayOrder(1)
    @tooltip('i18n:limitVelocityOvertimeModule.space')
    public space = Space.Local;

    // TODO:functions related to drag are temporarily not supported
    public drag = null;
    public multiplyDragByParticleSize = false;
    public multiplyDragByParticleVelocity = false;
    public name = PARTICLE_MODULE_NAME.LIMIT;
    private rotation: Quat;
    private needTransform: boolean;

    constructor () {
        super();
        this.rotation = new Quat();
        this.needTransform = false;
        this.needUpdate = true;
    }

    public update (space: number, worldTransform: Mat4) {
        this.needTransform = calculateTransform(space, this.space, worldTransform, this.rotation);
    }

    public animate (p: Particle, dt: number) {
        const normalizedTime = 1 - p.remainingLifetime / p.startLifetime;
        const dampedVel = _temp_v3;
        if (this.separateAxes) {
            Vec3.set(_temp_v3_1, this.limitX.evaluate(normalizedTime, pseudoRandom(p.randomSeed + LIMIT_VELOCITY_RAND_OFFSET))!,
                this.limitY.evaluate(normalizedTime, pseudoRandom(p.randomSeed + LIMIT_VELOCITY_RAND_OFFSET))!,
                this.limitZ.evaluate(normalizedTime, pseudoRandom(p.randomSeed + LIMIT_VELOCITY_RAND_OFFSET))!);
            if (this.needTransform) {
                Vec3.transformQuat(_temp_v3_1, _temp_v3_1, this.rotation);
            }
            Vec3.set(dampedVel,
                dampenBeyondLimit(p.ultimateVelocity.x, _temp_v3_1.x, this.dampen),
                dampenBeyondLimit(p.ultimateVelocity.y, _temp_v3_1.y, this.dampen),
                dampenBeyondLimit(p.ultimateVelocity.z, _temp_v3_1.z, this.dampen));
        } else {
            Vec3.normalize(dampedVel, p.ultimateVelocity);
            Vec3.multiplyScalar(dampedVel, dampedVel, dampenBeyondLimit(p.ultimateVelocity.length(), this.limit.evaluate(normalizedTime, pseudoRandom(p.randomSeed + LIMIT_VELOCITY_RAND_OFFSET))!, this.dampen));
        }
        Vec3.copy(p.ultimateVelocity, dampedVel);
    }
}

function dampenBeyondLimit (vel: number, limit: number, dampen: number) {
    const sgn = Math.sign(vel);
    let abs = Math.abs(vel);
    if (abs > limit) {
        abs = lerp(abs, limit, dampen);
    }
    return abs * sgn;
}
