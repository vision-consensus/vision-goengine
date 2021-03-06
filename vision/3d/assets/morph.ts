



import { AttributeName, Device, DescriptorSet } from '../../core/gfx';
import { Mesh } from './mesh';
import { StdMorphRendering } from './morph-rendering';
import { IMacroPatch } from '../../core/renderer';

export interface Morph {
    /**
     * Morph data of each sub-mesh.
     */
    subMeshMorphs: (SubMeshMorph | null)[];

    /**
     * Common initial weights of each sub-mesh.
     */
    weights?: number[];

    /**
     * Name of each target of each sub-mesh morph.
     * This field is only meaningful if every sub-mesh has the same number of targets.
     */
    targetNames?: string[];
}

export interface MorphTarget {
    /**
     * Displacement of each target attribute.
     */
    displacements: Mesh.IBufferView[];
}

export interface SubMeshMorph {
    /**
     * Attributes to morph.
     */
    attributes: AttributeName[];

    /**
     * Targets.
     */
    targets: MorphTarget[];

    /**
     * Initial weights of each target.
     */
    weights?: number[];
}

export function createMorphRendering (mesh: Mesh, gfxDevice: Device): MorphRendering | null {
    return new StdMorphRendering(mesh, gfxDevice);
}

/**
 * Class which control rendering of a morph resource.
 */
export interface MorphRendering {
    createInstance (): MorphRenderingInstance;
}

/**
 * This rendering instance of a morph resource.
 */
export interface MorphRenderingInstance {
    /**
     * Sets weights of targets of specified sub mesh.
     * @param subMeshIndex
     * @param weights
     */
    setWeights (subMeshIndex: number, weights: number[]): void;

    /**
     * Adapts pipeline state to do the rendering.
     * @param subMeshIndex
     * @param pipelineState
     */
    adaptPipelineState (subMeshIndex: number, descriptorSet: DescriptorSet): void;

    requiredPatches (subMeshIndex: number): IMacroPatch[] | null;

    /**
     * Destroy the rendering instance.
     */
    destroy (): void;
}
