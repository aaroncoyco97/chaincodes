/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Troza } from './troza';

@Info({title: 'TrozaContract', description: 'My Smart Contract' })
export class TrozaContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async trozaExists(ctx: Context, trozaId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(trozaId);
        return (!!buffer && buffer.length > 0);
    }

    @Transaction()
    public async createTroza(ctx: Context, trozaId: string, volumen: string, arbolId: string): Promise<void> {
        const exists = await this.trozaExists(ctx, trozaId);
        if (exists) {
            throw new Error(`The troza ${trozaId} already exists`);
        }
        const troza = new Troza();
        troza.id = trozaId;
        troza.volumen = volumen;
        troza.arbolId = arbolId;
        const buffer = Buffer.from(JSON.stringify(troza));
        await ctx.stub.putState(trozaId, buffer);
    }

    @Transaction(false)
    @Returns('Troza')
    public async readTroza(ctx: Context, trozaId: string): Promise<Troza> {
        const exists = await this.trozaExists(ctx, trozaId);
        if (!exists) {
            throw new Error(`The troza ${trozaId} does not exist`);
        }
        const buffer = await ctx.stub.getState(trozaId);
        const troza = JSON.parse(buffer.toString()) as Troza;
        return troza;
    }

    @Transaction()
    @Returns('Troza[]')
    public async queryAllTrozas(ctx: Context): Promise<Troza[]> {
        const startKey = 'TROZA0000000000';
        const endKey = 'TROZA9999999999';
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        while (true) {
            const res = await iterator.next();
            if (res.value) {
                const evaluate = JSON.parse(res.value.value.toString('utf8')) as Troza;
                allResults.push(evaluate);
            }
            if (res.done) {
                await iterator.close();
                return allResults;
            }
        }
    }

    @Transaction()
    public async deleteTroza(ctx: Context, trozaId: string): Promise<void> {
        const exists = await this.trozaExists(ctx, trozaId);
        if (!exists) {
            throw new Error(`The troza ${trozaId} does not exist`);
        }
        await ctx.stub.deleteState(trozaId);
    }

}
