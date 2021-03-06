/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Usuario {
    @Property()
    public id: string;
    public empresa: string;
    public email: string;
    public password: string;
    public nombre: string;
    public apellidos: string;
    public dni: string;
    public direccion: string;
    public rol: string;
    public estado: boolean;
    public parentUsuario?: string;
}