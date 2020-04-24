/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({title: 'TrozaContract', description: 'My Smart Contract' })
export class TrozaContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async trozaExists(ctx: Context, trozaId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(trozaId);
        return (!!buffer && buffer.length > 0);
    }

    @Transaction()
    @Returns('object[]')
    public async queryAllTrozas(ctx: Context): Promise<object[]> {
        const startKey = 'TROZA0000000000';
        const endKey = 'TROZA9999999999';
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
    @Returns('object')
    public async createTroza(ctx: Context, data: string): Promise<object> {
        const trozas = await this.queryAllTrozas(ctx);
        const trozasLength = (trozas.length + 1).toString();
        const trozaId = 'TROZA' + trozasLength.padStart(10, '0000000000');
        const troza = JSON.parse(data);
        troza.id = trozaId;
        troza.fecha = new Date();
        const buffer = Buffer.from(JSON.stringify(troza));
        await ctx.stub.putState(trozaId, buffer);
        return troza;
    }

    @Transaction(false)
    @Returns('object')
    public async readTroza(ctx: Context, trozaId: string): Promise<object> {
        const exists = await this.trozaExists(ctx, trozaId);
        if (!exists) {
            throw new Error(`The troza ${trozaId} does not exist`);
        }
        const buffer = await ctx.stub.getState(trozaId);
        const troza = JSON.parse(buffer.toString());
        return troza;
    }

    

    @Transaction()
    public async deleteTroza(ctx: Context, trozaId: string): Promise<void> {
        const exists = await this.trozaExists(ctx, trozaId);
        if (!exists) {
            throw new Error(`The troza ${trozaId} does not exist`);
        }
        await ctx.stub.deleteState(trozaId);
    }

    @Transaction(true)
    @Returns('object')
    public async anexarReportePatio(ctx: Context, trozaId: string, reportePatioId: string): Promise<object> {
        const exists = await this.trozaExists(ctx, trozaId);
        if (!exists) {
            throw new Error(`The my asset ${trozaId} does not exist`);
        }
        const bufferTrozaId = await ctx.stub.getState(trozaId);
        const troza = JSON.parse(bufferTrozaId.toString());
        
        if (troza.reportePatioId) {
            throw new Error("Esta troza ya tiene un reporte de patio anexado.");
        }

        troza.reportePatioId = reportePatioId;
        const buffer = Buffer.from(JSON.stringify(troza));
        await ctx.stub.putState(trozaId, buffer);
        return troza;
    }

    @Transaction(true)
    @Returns('object')
    public async anexarGTF(ctx: Context, trozaId: string, gtfId: string): Promise<object> {
        const exists = await this.trozaExists(ctx, trozaId);
        if (!exists) {
            throw new Error(`The my asset ${trozaId} does not exist`);
        }
        const bufferTrozaId = await ctx.stub.getState(trozaId);
        const troza = JSON.parse(bufferTrozaId.toString());
        
        if (troza.gtfId) {
            throw new Error("Esta troza ya tiene un reporte de patio anexado.");
        }

        troza.gtfId = gtfId;
        const buffer = Buffer.from(JSON.stringify(troza));
        await ctx.stub.putState(trozaId, buffer);
        return troza;
    }
}
