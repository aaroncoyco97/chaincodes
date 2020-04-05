/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({title: 'PoaContract', description: 'Smart Contract POA' })
export class PoaContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async poaExists(ctx: Context, poaId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(poaId);
        return (!!buffer && buffer.length > 0);
    }

    @Transaction()
    @Returns('string')
    public async createPoa(ctx: Context, data: string): Promise<string> {
        const poas = await this.queryAllPoas(ctx);
        const poasLength = (poas.length + 1).toString();
        const poaId = 'POA' + poasLength.padStart(10, '0000000000');
        const poa = JSON.parse(data);
        poa.id = poaId;
        poa.estado = 'Pendiente';
        const buffer = Buffer.from(JSON.stringify(poa));
        await ctx.stub.putState(poaId, buffer);
        return poaId;
    }

    @Transaction(false)
    @Returns('object')
    public async readPoa(ctx: Context, poaId: string): Promise<object> {
        const exists = await this.poaExists(ctx, poaId);
        if (!exists) {
            throw new Error(`The poa ${poaId} does not exist`);
        }
        const buffer = await ctx.stub.getState(poaId);
        const poa = JSON.parse(buffer.toString());
        return poa;
    }

    @Transaction(false)
    @Returns('number')
    public async findPOAbyParentUsuarioID(ctx: Context, poaId: string, parentUsuario: string): Promise<number> {
        const poa = await this.readPoa(ctx, poaId);
        if (poa['parentUsuario'] !== parentUsuario) {
            throw new Error(`El POA consultado no es valido o no existe.`);
        }
        if (poa['estado'] !== "Aprobado") {
            throw new Error(`El POA consultado no se encuentra aprobado.`);
        }
        return poa['id'];
    }

    @Transaction()
    @Returns('object[]')
    public async queryAllPoas(ctx: Context): Promise<object[]> {
        const startKey = 'POA0000000000';
        const endKey = 'POA9999999999';
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
    public async deletePoa(ctx: Context, poaId: string): Promise<void> {
        const exists = await this.poaExists(ctx, poaId);
        if (!exists) {
            throw new Error(`The poa ${poaId} does not exist`);
        }
        await ctx.stub.deleteState(poaId);
    }

    @Transaction()
    public async updateEstado(ctx: Context, poaId: string, estado: string): Promise<void> {
        const exists = await this.poaExists(ctx, poaId);
        if (!exists) {
            throw new Error(`The my asset ${poaId} does not exist`);
        }
        const bufferPoaId = await ctx.stub.getState(poaId);
        const poa = JSON.parse(bufferPoaId.toString());
        poa.estado = estado;
        const buffer = Buffer.from(JSON.stringify(poa));
        await ctx.stub.putState(poaId, buffer);
    }
}
