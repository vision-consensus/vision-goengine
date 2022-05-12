



import { Pass } from '../renderer';
import { IInstancedAttributeBlock, SubModel } from '../renderer/scene';
import { UNIFORM_LIGHTMAP_TEXTURE_BINDING } from './define';
import { BufferUsageBit, MemoryUsageBit, Device, Texture, InputAssembler, InputAssemblerInfo,
    Attribute, Buffer, BufferInfo, CommandBuffer, Shader, DescriptorSet  } from '../gfx';

export interface IInstancedItem {
    count: number;
    capacity: number;
    vb: Buffer;
    data: Uint8Array;
    ia: InputAssembler;
    stride: number;
    shader: Shader | null;
    descriptorSet: DescriptorSet;
    lightingMap: Texture;
}

const INITIAL_CAPACITY = 32;
const MAX_CAPACITY = 1024;

export class InstancedBuffer {
    public instances: IInstancedItem[] = [];
    public pass: Pass;
    public hasPendingModels = false;
    public dynamicOffsets: number[] = [];
    private _device: Device;

    constructor (pass: Pass) {
        this._device = pass.device;
        this.pass = pass;
    }

    public destroy () {
        for (let i = 0; i < this.instances.length; ++i) {
            const instance = this.instances[i];
            instance.vb.destroy();
            instance.ia.destroy();
        }
        this.instances.length = 0;
    }

    public merge (subModel: SubModel, attrs: IInstancedAttributeBlock, passIdx: number, shaderImplant: Shader | null = null) {
        const stride = attrs.buffer.length;
        if (!stride) { return; } // we assume per-instance attributes are always present
        const sourceIA = subModel.inputAssembler;
        const lightingMap = subModel.descriptorSet.getTexture(UNIFORM_LIGHTMAP_TEXTURE_BINDING);
        let shader  = shaderImplant;
        if (!shader) {
            shader = subModel.shaders[passIdx];
        }
        const descriptorSet = subModel.descriptorSet;
        for (let i = 0; i < this.instances.length; ++i) {
            const instance = this.instances[i];
            if (instance.ia.indexBuffer !== sourceIA.indexBuffer || instance.count >= MAX_CAPACITY) { continue; }

            // check same binding
            if (instance.lightingMap !== lightingMap) {
                continue;
            }

            if (instance.stride !== stride) {
                // we allow this considering both baked and non-baked
                // skinning models may be present in the same buffer
                continue;
            }
            if (instance.count >= instance.capacity) { // resize buffers
                instance.capacity <<= 1;
                const newSize = instance.stride * instance.capacity;
                const oldData = instance.data;
                instance.data = new Uint8Array(newSize);
                instance.data.set(oldData);
                instance.vb.resize(newSize);
            }
            if (instance.shader !== shader) { instance.shader = shader; }
            if (instance.descriptorSet !== descriptorSet) { instance.descriptorSet = descriptorSet; }
            instance.data.set(attrs.buffer, instance.stride * instance.count++);
            this.hasPendingModels = true;
            return;
        }

        // Create a new instance
        const vb = this._device.createBuffer(new BufferInfo(
            BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST,
            MemoryUsageBit.HOST | MemoryUsageBit.DEVICE,
            stride * INITIAL_CAPACITY,
            stride,
        ));
        const data = new Uint8Array(stride * INITIAL_CAPACITY);
        const vertexBuffers = sourceIA.vertexBuffers.slice();
        const attributes = sourceIA.attributes.slice();
        const indexBuffer = sourceIA.indexBuffer;

        for (let i = 0; i < attrs.attributes.length; i++) {
            const attr = attrs.attributes[i];
            const newAttr = new Attribute(attr.name, attr.format, attr.isNormalized, vertexBuffers.length, true);
            attributes.push(newAttr);
        }
        data.set(attrs.buffer);

        vertexBuffers.push(vb);
        const iaInfo = new InputAssemblerInfo(attributes, vertexBuffers, indexBuffer);
        const ia = this._device.createInputAssembler(iaInfo);
        this.instances.push({ count: 1, capacity: INITIAL_CAPACITY, vb, data, ia, stride, shader, descriptorSet, lightingMap });
        this.hasPendingModels = true;
    }

    public uploadBuffers (cmdBuff: CommandBuffer) {
        for (let i = 0; i < this.instances.length; ++i) {
            const instance = this.instances[i];
            if (!instance.count) { continue; }
            instance.ia.instanceCount = instance.count;
            cmdBuff.updateBuffer(instance.vb, instance.data);
        }
    }

    public clear () {
        for (let i = 0; i < this.instances.length; ++i) {
            const instance = this.instances[i];
            instance.count = 0;
        }
        this.hasPendingModels = false;
    }
}
