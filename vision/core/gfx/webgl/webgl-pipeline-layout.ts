

import { PipelineLayout } from '../base/pipeline-layout';
import { IWebGLGPUPipelineLayout, IWebGLGPUDescriptorSetLayout } from './webgl-gpu-objects';
import { WebGLDescriptorSetLayout } from './webgl-descriptor-set-layout';
import { PipelineLayoutInfo } from '../base/define';

export class WebGLPipelineLayout extends PipelineLayout {
    get gpuPipelineLayout () { return this._gpuPipelineLayout!; }

    private _gpuPipelineLayout: IWebGLGPUPipelineLayout | null = null;

    public initialize (info: Readonly<PipelineLayoutInfo>) {
        Array.prototype.push.apply(this._setLayouts, info.setLayouts);

        const dynamicOffsetIndices: number[][] = [];

        const gpuSetLayouts: IWebGLGPUDescriptorSetLayout[] = [];
        let dynamicOffsetCount = 0;
        const dynamicOffsetOffsets: number[] = [];
        for (let i = 0; i < this._setLayouts.length; i++) {
            const setLayout = this._setLayouts[i] as WebGLDescriptorSetLayout;
            const dynamicBindings = setLayout.gpuDescriptorSetLayout.dynamicBindings;
            const indices = Array(setLayout.bindingIndices.length).fill(-1);
            for (let j = 0; j < dynamicBindings.length; j++) {
                const binding = dynamicBindings[j];
                if (indices[binding] < 0) indices[binding] = dynamicOffsetCount + j;
            }

            gpuSetLayouts.push(setLayout.gpuDescriptorSetLayout);
            dynamicOffsetIndices.push(indices);
            dynamicOffsetOffsets.push(dynamicOffsetCount);
            dynamicOffsetCount += dynamicBindings.length;
        }

        this._gpuPipelineLayout = {
            gpuSetLayouts,
            dynamicOffsetIndices,
            dynamicOffsetCount,
            dynamicOffsetOffsets,
        };
    }

    public destroy () {
        this._setLayouts.length = 0;
    }
}
