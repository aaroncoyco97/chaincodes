/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({title: 'PgmfContract', description: 'My Smart Contract' })
export class PgmfContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async pgmfExists(ctx: Context, pgmfId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(pgmfId);
        return (!!buffer && buffer.length > 0);
    }

    @Transaction(false)
    @Returns('object[]')
    public async queryAllPgmfs(ctx: Context): Promise<object[]> {
        const startKey = 'PGMF0000000000';
        const endKey = 'PGMF9999999999';
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
    public async createPgmf(ctx: Context, data: string): Promise<string> {
        const pgmfs = await this.queryAllPgmfs(ctx);
        const pgmfsLength = (pgmfs.length + 1).toString();
        const pgmfId = 'PGMF' + pgmfsLength.padStart(10, '0000000000');
        const pgmf = JSON.parse(data);
        pgmf.id = pgmfId;
        pgmf.fecha = new Date();
        const buffer = Buffer.from(JSON.stringify(pgmf));
        await ctx.stub.putState(pgmfId, buffer);
        return pgmfId;
    }

    @Transaction(false)
    @Returns('object')
    public async readPgmf(ctx: Context, pgmfId: string): Promise<object> {
        const exists = await this.pgmfExists(ctx, pgmfId);
        if (!exists) {
            throw new Error(`The pgmf ${pgmfId} does not exist`);
        }
        const buffer = await ctx.stub.getState(pgmfId);
        const pgmf = JSON.parse(buffer.toString());
        return pgmf;
    }

    @Transaction()
    public async deletePgmf(ctx: Context, pgmfId: string): Promise<void> {
        const exists = await this.pgmfExists(ctx, pgmfId);
        if (!exists) {
            throw new Error(`The pgmf ${pgmfId} does not exist`);
        }
        await ctx.stub.deleteState(pgmfId);
    }

}
