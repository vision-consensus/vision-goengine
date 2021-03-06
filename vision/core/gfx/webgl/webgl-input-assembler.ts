

import { InputAssemblerInfo } from '../base/define';
import { InputAssembler } from '../base/input-assembler';
import { WebGLBuffer } from './webgl-buffer';
import { WebGLCmdFuncCreateInputAssember, WebGLCmdFuncDestroyInputAssembler } from './webgl-commands';
import { WebGLDeviceManager } from './webgl-define';
import { IWebGLGPUInputAssembler, IWebGLGPUBuffer } from './webgl-gpu-objects';

export class WebGLInputAssembler extends InputAssembler {
    get gpuInputAssembler (): IWebGLGPUInputAssembler {
        return  this._gpuInputAssembler!;
    }

    private _gpuInputAssembler: IWebGLGPUInputAssembler | null = null;

    public initialize (info: Readonly<InputAssemblerInfo>) {
        if (info.vertexBuffers.length === 0) {
            console.error('InputAssemblerInfo.vertexBuffers is null.');
            return;
        }

        this._attributes = info.attributes;
        this._attributesHash = this.computeAttributesHash();
        this._vertexBuffers = info.vertexBuffers;

        if (info.indexBuffer) {
            this._indexBuffer = info.indexBuffer;
            this._drawInfo.indexCount = this._indexBuffer.size / this._indexBuffer.stride;
            this._drawInfo.firstIndex = 0;
        } else {
            const vertBuff = this._vertexBuffers[0];
            this._drawInfo.vertexCount = vertBuff.size / vertBuff.stride;
            this._drawInfo.firstVertex = 0;
            this._drawInfo.vertexOffset = 0;
        }
        this._drawInfo.instanceCount = 0;
        this._drawInfo.firstInstance = 0;

        this._indirectBuffer = info.indirectBuffer || null;

        const gpuVertexBuffers: IWebGLGPUBuffer[] = new Array<IWebGLGPUBuffer>(info.vertexBuffers.length);
        for (let i = 0; i < info.vertexBuffers.length; ++i) {
            const vb = info.vertexBuffers[i] as WebGLBuffer;
            if (vb.gpuBuffer) {
                gpuVertexBuffers[i] = vb.gpuBuffer;
            }
        }

        let gpuIndexBuffer: IWebGLGPUBuffer | null = null;
        let glIndexType = 0;
        if (info.indexBuffer) {
            gpuIndexBuffer = (info.indexBuffer as WebGLBuffer).gpuBuffer;
            if (gpuIndexBuffer) {
                switch (gpuIndexBuffer.stride) {
                case 1: glIndexType = 0x1401; break; // WebGLRenderingContext.UNSIGNED_BYTE
                case 2: glIndexType = 0x1403; break; // WebGLRenderingContext.UNSIGNED_SHORT
                case 4: glIndexType = 0x1405; break; // WebGLRenderingContext.UNSIGNED_INT
                default: {
                    console.error('Error index buffer stride.');
                }
                }
            }
        }

        let gpuIndirectBuffer: IWebGLGPUBuffer | null = null;
        if (info.indirectBuffer) {
            gpuIndirectBuffer = (info.indirectBuffer as WebGLBuffer).gpuBuffer;
        }

        this._gpuInputAssembler = {
            attributes: info.attributes,
            gpuVertexBuffers,
            gpuIndexBuffer,
            gpuIndirectBuffer,

            glAttribs: [],
            glIndexType,
            glVAOs: new Map<WebGLProgram, WebGLVertexArrayObjectOES>(),
        };

        WebGLCmdFuncCreateInputAssember(WebGLDeviceManager.instance, this._gpuInputAssembler);
    }

    public destroy () {
        const device = WebGLDeviceManager.instance;
        if (this._gpuInputAssembler && device.extensions.useVAO) {
            WebGLCmdFuncDestroyInputAssembler(device, this._gpuInputAssembler);
        }
        this._gpuInputAssembler = null;
    }
}
