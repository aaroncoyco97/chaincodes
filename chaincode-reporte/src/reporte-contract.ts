/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({title: 'ReporteContract', description: 'My Smart Contract' })
export class ReporteContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async reporteExists(ctx: Context, reporteId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(reporteId);
        return (!!buffer && buffer.length > 0);
    }

    @Transaction(false)
    @Returns('object[]')
    public async queryAllReportes(ctx: Context): Promise<object[]> {
        const startKey = 'REPORTE0000000000';
        const endKey = 'REPORTE9999999999';
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
    public async createReporte(ctx: Context, data: string): Promise<string> {
        const reportes = await this.queryAllReportes(ctx);
        const reportesLength = (reportes.length + 1).toString();
        const reporteId = 'REPORTE' + reportesLength.padStart(10, '0000000000');
        const reporte = JSON.parse(data);
        reporte.id = reporteId;
        const buffer = Buffer.from(JSON.stringify(reporte));
        await ctx.stub.putState(reporteId, buffer);
        return reporteId;
    }

    @Transaction(false)
    @Returns('object')
    public async readReporte(ctx: Context, reporteId: string): Promise<object> {
        const exists = await this.reporteExists(ctx, reporteId);
        if (!exists) {
            throw new Error(`The reporte ${reporteId} does not exist`);
        }
        const buffer = await ctx.stub.getState(reporteId);
        const reporte = JSON.parse(buffer.toString());
        return reporte;
    }

    @Transaction()
    public async deleteReporte(ctx: Context, reporteId: string): Promise<void> {
        const exists = await this.reporteExists(ctx, reporteId);
        if (!exists) {
            throw new Error(`The reporte ${reporteId} does not exist`);
        }
        await ctx.stub.deleteState(reporteId);
    }

    @Transaction(false)
    @Returns('object[]')
    public async queryAllReportesTala(ctx: Context): Promise<object[]> {
        const reportes = await this.queryAllReportes(ctx);
        return reportes.filter( (reporte: any) => reporte.tipoReporte === 'ReporteTala' );
    }

    @Transaction(false)
    @Returns('object[]')
    public async queryAllReportesArrastre(ctx: Context): Promise<object[]> {
        const reportes = await this.queryAllReportes(ctx);
        return reportes.filter( (reporte: any) => reporte.tipoReporte === 'ReporteArrastre' );
    }

    @Transaction(false)
    @Returns('object[]')
    public async queryAllReportesPatio(ctx: Context): Promise<object[]> {
        const reportes = await this.queryAllReportes(ctx);
        return reportes.filter( (reporte: any) => reporte.tipoReporte === 'ReportePatio' );
    }
}
