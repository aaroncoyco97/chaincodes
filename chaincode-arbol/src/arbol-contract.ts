/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({title: 'ArbolContract', description: 'My Smart Contract' })
export class ArbolContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async arbolExists(ctx: Context, arbolId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(arbolId);
        return (!!buffer && buffer.length > 0);
    }

    @Transaction()
    public async createArbol(ctx: Context, data: string): Promise<void> {
        const arboles = await this.queryAllArboles(ctx); // TENGO 10 ARBOLES
        const arbolesLength = (arboles.length + 1).toString(); // HAY 10 ARBOLES + 1 = 11
        const arbolId = 'ARBOL' + arbolesLength.padStart(10, '0000000000'); // CREA EL ID
        const arbol = JSON.parse(data);
        arbol.id = arbolId;
        const buffer = Buffer.from(JSON.stringify(arbol));
        await ctx.stub.putState(arbolId, buffer);
    }
    
    @Transaction(false)
    @Returns('object')
    public async readArbol(ctx: Context, arbolId: string): Promise<object> {
        const exists = await this.arbolExists(ctx, arbolId);
        if (!exists) {
            throw new Error(`The arbol ${arbolId} does not exist`);
        }
        const buffer = await ctx.stub.getState(arbolId);
        const arbol = JSON.parse(buffer.toString());
        return arbol;
    }

    @Transaction(false)
    @Returns('object[]')
    public async findArbolesByPOA(ctx: Context, poaId: string): Promise<object[]> {
        const arboles = await this.queryAllArboles(ctx);
        const arbolesPoa = arboles.filter( a => a['poaId'] === poaId );
        return arbolesPoa;
    }

    @Transaction()
    @Returns('object[]')
    public async queryAllArboles(ctx: Context): Promise<object[]> {
        const startKey = 'ARBOL0000000000';
        const endKey = 'ARBOL9999999999';
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        while (true) {
            const res = await iterator.next();
            if (res.value) {
                const evaluate = JSON.parse(res.value.value.toString('utf8'));
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
