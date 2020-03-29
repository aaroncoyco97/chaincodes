/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Arbol } from './arbol';

@Info({title: 'ArbolContract', description: 'My Smart Contract' })
export class ArbolContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async arbolExists(ctx: Context, arbolId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(arbolId);
        return (!!buffer && buffer.length > 0);
    }

    @Transaction()
    public async createArbol(ctx: Context, arbolId: string, data: string): Promise<void> {
        const exists = await this.arbolExists(ctx, arbolId);
        if (exists) {
            throw new Error(`The arbol ${arbolId} already exists`);
        }
        const arbol = JSON.parse(data) as Arbol;
        arbol.id = arbolId;
        const buffer = Buffer.from(JSON.stringify(arbol));
        await ctx.stub.putState(arbolId, buffer);
    }

    @Transaction(false)
    @Returns('Arbol')
    public async readArbol(ctx: Context, arbolId: string): Promise<Arbol> {
        const exists = await this.arbolExists(ctx, arbolId);
        if (!exists) {
            throw new Error(`The arbol ${arbolId} does not exist`);
        }
        const buffer = await ctx.stub.getState(arbolId);
        const arbol = JSON.parse(buffer.toString()) as Arbol;
        return arbol;
    }

    @Transaction()
    public async setPoaArbol(ctx: Context, arbolId: string, poaId: string): Promise<void> {
        const exists = await this.arbolExists(ctx, arbolId);
        if (!exists) {
            throw new Error(`The arbol ${arbolId} does not exist`);
        }
        const arbol = await this.readArbol(ctx, arbolId);
        arbol.poaId = poaId;
        const buffer = Buffer.from(JSON.stringify(arbol));
        await ctx.stub.putState(arbolId, buffer);
    }

    @Transaction()
    @Returns('Arbol[]')
    public async queryAllArboles(ctx: Context): Promise<Arbol[]> {
        const startKey = 'ARBOL0000000000';
        const endKey = 'ARBOL9999999999';
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        while (true) {
            const res = await iterator.next();
            if (res.value) {
                const evaluate = JSON.parse(res.value.value.toString('utf8')) as Arbol;
                allResults.push(evaluate);
            }
            if (res.done) {
                await iterator.close();
                return allResults;
            }
        }
    }

    @Transaction()
    public async deleteArbol(ctx: Context, arbolId: string): Promise<void> {
        const exists = await this.arbolExists(ctx, arbolId);
        if (!exists) {
            throw new Error(`The arbol ${arbolId} does not exist`);
        }
        await ctx.stub.deleteState(arbolId);
    }

}
