

import { CachedArray } from '../../memop/cached-array';
import {
    WebGL2CmdBeginRenderPass,
    WebGL2CmdBindStates,
    WebGL2CmdCopyBufferToTexture,
    WebGL2CmdDraw,
    WebGL2CmdObject,
    WebGL2CmdPackage,
    WebGL2CmdUpdateBuffer,
} from './webgl2-commands';

export class WebGL2CommandPool<T extends WebGL2CmdObject> {
    private _frees: (T|null)[];
    private _freeIdx = 0;
    private _freeCmds: CachedArray<T>;

    constructor (Clazz: new() => T, count: number) {
        this._frees = new Array(count);
        this._freeCmds = new CachedArray(count);
        for (let i = 0; i < count; ++i) {
            this._frees[i] = new Clazz();
        }
        this._freeIdx = count - 1;
    }

    /*
    public alloc (clazz: new() => T): T {
        return new clazz();
    }
    */

    public alloc (Clazz: new() => T): T {
        if (this._freeIdx < 0) {
            const size = this._frees.length * 2;
            const temp = this._frees;
            this._frees = new Array<T>(size);

            const increase = size - temp.length;
            for (let i = 0; i < increase; ++i) {
                this._frees[i] = new Clazz();
            }

            for (let i = increase, j = 0; i < size; ++i, ++j) {
                this._frees[i] = temp[j];
            }

            this._freeIdx += increase;
        }

        const cmd = this._frees[this._freeIdx]!;
        this._frees[this._freeIdx--] = null;
        ++cmd.refCount;
        return cmd;
    }

    public free (cmd: T) {
        if (--cmd.refCount === 0) {
            this._freeCmds.push(cmd);
        }
    }

    public freeCmds (cmds: CachedArray<T>) {
        // return ;
        for (let i = 0; i < cmds.length; ++i) {
            if (--cmds.array[i].refCount === 0) {
                this._freeCmds.push(cmds.array[i]);
            }
        }
    }

    public release () {
        for (let i = 0; i < this._freeCmds.length; ++i) {
            const cmd = this._freeCmds.array[i];
            cmd.clear();
            this._frees[++this._freeIdx] = cmd;
        }
        this._freeCmds.clear();
    }
}

export class WebGL2CommandAllocator {
    public beginRenderPassCmdPool: WebGL2CommandPool<WebGL2CmdBeginRenderPass>;
    public bindStatesCmdPool: WebGL2CommandPool<WebGL2CmdBindStates>;
    public drawCmdPool: WebGL2CommandPool<WebGL2CmdDraw>;
    public updateBufferCmdPool: WebGL2CommandPool<WebGL2CmdUpdateBuffer>;
    public copyBufferToTextureCmdPool: WebGL2CommandPool<WebGL2CmdCopyBufferToTexture>;

    constructor () {
        this.beginRenderPassCmdPool = new WebGL2CommandPool(WebGL2CmdBeginRenderPass, 1);
        this.bindStatesCmdPool = new WebGL2CommandPool(WebGL2CmdBindStates, 1);
        this.drawCmdPool = new WebGL2CommandPool(WebGL2CmdDraw, 1);
        this.updateBufferCmdPool = new WebGL2CommandPool(WebGL2CmdUpdateBuffer, 1);
        this.copyBufferToTextureCmdPool = new WebGL2CommandPool(WebGL2CmdCopyBufferToTexture, 1);
    }

    public clearCmds (cmdPackage: WebGL2CmdPackage) {
        if (cmdPackage.beginRenderPassCmds.length) {
            this.beginRenderPassCmdPool.freeCmds(cmdPackage.beginRenderPassCmds);
            cmdPackage.beginRenderPassCmds.clear();
        }

        if (cmdPackage.bindStatesCmds.length) {
            this.bindStatesCmdPool.freeCmds(cmdPackage.bindStatesCmds);
            cmdPackage.bindStatesCmds.clear();
        }

        if (cmdPackage.drawCmds.length) {
            this.drawCmdPool.freeCmds(cmdPackage.drawCmds);
            cmdPackage.drawCmds.clear();
        }

        if (cmdPackage.updateBufferCmds.length) {
            this.updateBufferCmdPool.freeCmds(cmdPackage.updateBufferCmds);
            cmdPackage.updateBufferCmds.clear();
        }

        if (cmdPackage.copyBufferToTextureCmds.length) {
            this.copyBufferToTextureCmdPool.freeCmds(cmdPackage.copyBufferToTextureCmds);
            cmdPackage.copyBufferToTextureCmds.clear();
        }

        cmdPackage.cmds.clear();
    }

    public releaseCmds () {
        this.beginRenderPassCmdPool.release();
        this.bindStatesCmdPool.release();
        this.drawCmdPool.release();
        this.updateBufferCmdPool.release();
        this.copyBufferToTextureCmdPool.release();
    }
}
