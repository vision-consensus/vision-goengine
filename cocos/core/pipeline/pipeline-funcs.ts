

/**
 * @packageDocumentation
 * @module pipeline
 */

import { CommandBuffer, Device, Rect, RenderPass, Swapchain, Viewport } from '../gfx';
import { IVec4Like } from '../math';
import { PipelineStateManager } from './pipeline-state-manager';
import { SetIndex } from './define';
import { Camera, Model } from '../renderer/scene';

const profilerViewport = new Viewport();
const profilerScissor = new Rect();

/**
 * @en Convert color in SRGB space to linear space
 * @zh SRGB 颜色空间转换为线性空间。
 * @param out Output color object
 * @param gamma Gamma value in SRGB space
 */
export function SRGBToLinear (out: IVec4Like, gamma: IVec4Like) {
    // out.x = Math.pow(gamma.x, 2.2);
    // out.y = Math.pow(gamma.y, 2.2);
    // out.z = Math.pow(gamma.z, 2.2);
    out.x = gamma.x * gamma.x;
    out.y = gamma.y * gamma.y;
    out.z = gamma.z * gamma.z;
}

/**
 * @en Convert color in linear space to SRGB space
 * @zh 线性空间转换为 SRGB 颜色空间。
 * @param out Output color object
 * @param linear Color value in linear space
 */
export function LinearToSRGB (out: IVec4Like, linear: IVec4Like) {
    // out.x = Math.pow(linear.x, 0.454545);
    // out.y = Math.pow(linear.y, 0.454545);
    // out.z = Math.pow(linear.z, 0.454545);
    out.x = Math.sqrt(linear.x);
    out.y = Math.sqrt(linear.y);
    out.z = Math.sqrt(linear.z);
}

let profilerCamera: Camera | null = null;

export function decideProfilerCamera (cameras: Camera[]) {
    for (let i = cameras.length - 1; i >= 0; --i) {
        const camera = cameras[i];
        if (camera.window.swapchain) {
            profilerCamera = camera;
            return;
        }
    }
    profilerCamera = null;
}

export function renderProfiler (device: Device, renderPass: RenderPass, cmdBuff: CommandBuffer, profiler: Model | null, camera: Camera) {
    if (profiler && profiler.enabled && camera === profilerCamera) {
        const { inputAssembler, passes, shaders, descriptorSet } = profiler.subModels[0];
        profilerViewport.width = profilerScissor.width = camera.window.width;
        profilerViewport.height = profilerScissor.height = camera.window.height;
        const pso = PipelineStateManager.getOrCreatePipelineState(device, passes[0], shaders[0], renderPass, inputAssembler);

        cmdBuff.setViewport(profilerViewport);
        cmdBuff.setScissor(profilerScissor);
        cmdBuff.bindPipelineState(pso);
        cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, passes[0].descriptorSet);
        cmdBuff.bindDescriptorSet(SetIndex.LOCAL, descriptorSet);
        cmdBuff.bindInputAssembler(inputAssembler);
        cmdBuff.draw(inputAssembler);
    }
}
