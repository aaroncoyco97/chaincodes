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
        const arbol = JSON.parse(data);
        if( arbol.ubicacion && arbol.ubicacion.latitud && arbol.ubicacion.longitud ) {
            const arboles = await this.queryAllArboles(ctx);

            const getDistanciaMetros = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                let rad = function(x) {return x*Math.PI/180;}
                var R = 6378.137; //Radio de la tierra en km 
                var dLat = rad( lat2 - lat1 );
                var dLong = rad( lon2 - lon1 );
                var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(rad(lat1)) * 
                Math.cos(rad(lat2)) * Math.sin(dLong/2) * Math.sin(dLong/2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                var d = R * c * 1000; 
                return d; 
            }

            const existeCerca = arboles.filter( (ar: any) => {
                const distancia = getDistanciaMetros( 
                  ar.ubicacion.latitud, ar.ubicacion.longitud, 
                  arbol.ubicacion.latitud, arbol.ubicacion.longitud
                );              
                return distancia < 0.1 ? true : false;
            } );

            if( existeCerca && existeCerca.length > 0 ) {
                throw new Error(`El arbol registrado ya existe en la red.`);
            }

            const arbolesLength = (arboles.length + 1).toString();
            const arbolId = 'ARBOL' + arbolesLength.padStart(10, '0000000000');
            arbol.id = arbolId;
            arbol.fecha = new Date();
            arbol.trozado = 0;
            const buffer = Buffer.from(JSON.stringify(arbol));
            await ctx.stub.putState(arbolId, buffer);
        } else {
            throw new Error(`El arbol no cuenta con ubicación.`);
        }
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

    @Transaction(false)
    @Returns('object[]')
    public async findArbolesByPOAandReporte(ctx: Context, poaId: string, tipoReporte: string): Promise<object[]> {
        const arboles = await this.queryAllArboles(ctx);
        const arbolesPoa = arboles.filter( a => a['poaId'] === poaId );
        const arbolesTipoReporte = arbolesPoa.filter( a => a[tipoReporte] );
        return arbolesTipoReporte;
    }    

    @Transaction()
    public async deleteArbol(ctx: Context, arbolId: string): Promise<void> {
        const exists = await this.arbolExists(ctx, arbolId);
        if (!exists) {
            throw new Error(`The arbol ${arbolId} does not exist`);
        }
        await ctx.stub.deleteState(arbolId);
    }

    @Transaction(true)
    @Returns('object')
    public async anexarReporteTala(ctx: Context, arbolId: string, reporteTalaId: string): Promise<object> {
        const exists = await this.arbolExists(ctx, arbolId);
        if (!exists) {
            throw new Error(`The my asset ${arbolId} does not exist`);
        }
        
        const bufferArbolId = await ctx.stub.getState(arbolId);
        const arbol = JSON.parse(bufferArbolId.toString());
        
        if (arbol.reporteTalaId) {
            throw new Error("Este arbol ya tiene un reporte de tala anexado.");
        }
        
        arbol.reporteTalaId = reporteTalaId;
        const buffer = Buffer.from(JSON.stringify(arbol));
        await ctx.stub.putState(arbolId, buffer);
        return arbol;
    }

    @Transaction(true)
    @Returns('object')
    public async anexarReporteArrastre(ctx: Context, arbolId: string, reporteArrastreId: string): Promise<object> {
        const exists = await this.arbolExists(ctx, arbolId);
        if (!exists) {
            throw new Error(`The my asset ${arbolId} does not exist`);
        }
        const bufferArbolId = await ctx.stub.getState(arbolId);
        const arbol = JSON.parse(bufferArbolId.toString());
        if (arbol.reporteArrastreId) {
            throw new Error("Este arbol ya tiene un reporte de arrastre anexado.");
        }
        
        arbol.reporteArrastreId = reporteArrastreId;
        const buffer = Buffer.from(JSON.stringify(arbol));
        await ctx.stub.putState(arbolId, buffer);
        return arbol;
    }

    @Transaction(true)
    @Returns('object')
    public async trozarArbol(ctx: Context, arbolId: string, trozado: number): Promise<void> {
        const exists = await this.arbolExists(ctx, arbolId);
        if (!exists) {
            throw new Error(`The my asset ${arbolId} does not exist`);
        }
        const bufferArbolId = await ctx.stub.getState(arbolId);
        const arbol = JSON.parse(bufferArbolId.toString());
        arbol.trozado = trozado;
        const buffer = Buffer.from(JSON.stringify(arbol));
        await ctx.stub.putState(arbolId, buffer);
    }
}
