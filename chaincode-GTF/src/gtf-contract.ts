/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({title: 'GtfContract', description: 'My Smart Contract' })
export class GtfContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async gtfExists(ctx: Context, gtfId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(gtfId);
        return (!!buffer && buffer.length > 0);
    }
    
    @Transaction(false)
    @Returns('object[]')
    public async queryAllGtfs(ctx: Context): Promise<object[]> {
        const startKey = 'GTF0000000000';
        const endKey = 'GTF9999999999';
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
    @Returns('string')
    public async createGtf(ctx: Context, data: string): Promise<string> {
        const gtfs = await this.queryAllGtfs(ctx);
        const gtfsLength = (gtfs.length + 1).toString();
        const gtfId = 'GTF' + gtfsLength.padStart(10, '0000000000');
        const gtf = JSON.parse(data);
        gtf.id = gtfId;
        gtf.fecha = new Date();
        const buffer = Buffer.from(JSON.stringify(gtf));
        await ctx.stub.putState(gtfId, buffer);
        return gtfId;
    }

    @Transaction(false)
    @Returns('object')
    public async readGtf(ctx: Context, gtfId: string): Promise<object> {
        const exists = await this.gtfExists(ctx, gtfId);
        if (!exists) {
            throw new Error(`The gtf ${gtfId} does not exist`);
        }
        const buffer = await ctx.stub.getState(gtfId);
        const gtf = JSON.parse(buffer.toString());
        return gtf;
    }

    @Transaction()
    public async deleteGtf(ctx: Context, gtfId: string): Promise<void> {
        const exists = await this.gtfExists(ctx, gtfId);
        if (!exists) {
            throw new Error(`The gtf ${gtfId} does not exist`);
        }
        await ctx.stub.deleteState(gtfId);
    }

}
