/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Arbol {
    @Property()
    public id: string;
    public especie: object;
    public alturaComercial: number;
    public volumen: number;
    public latitud: number;
    public longitud: number;
    public maximoTrozas: number;
    public poaId?: string;
}
