



import { IVec3Like } from '../../core';

export interface ICollisionMatrix {
    [x: string]: number;
}

export interface IPhysicsMaterial {
    friction: number;
    rollingFriction: number;
    spinningFriction: number;
    restitution: number;
}

export interface ICollisionGroup {
    index: number,
    name: string,
}

export interface IPhysicsConfig {
    gravity?: IVec3Like;
    allowSleep?: boolean;
    fixedTimeStep?: number;
    maxSubSteps?: number;
    sleepThreshold?: number;
    collisionMatrix?: ICollisionMatrix;
    collisionGroups?: ICollisionGroup[];
    defaultMaterial?: IPhysicsMaterial;
    autoSimulation?: boolean;
    useNodeChains?: boolean;
    physicsEngine?: 'builtin' | 'cannon.js' | 'ammo.js' | string;
}
