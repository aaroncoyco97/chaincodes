/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Usuario } from './usuario';

@Info({title: 'UsuarioContract', description: 'My Smart Contract' })
export class UsuarioContract extends Contract {
    @Transaction(false)
    @Returns('boolean')
    public async usuarioExists(ctx: Context, usuarioId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(usuarioId);
        return (!!buffer && buffer.length > 0);
    }

    @Transaction()
    public async createUsuario(ctx: Context, email: string, password: string, nombre: string, apellidos: string, rol: string): Promise<void> {
        const usuarios = await this.queryAllUsuarios(ctx);
        const exists = usuarios.find( (user: Usuario) => user.email === email );
        if (exists) {
            throw new Error(`The usuario ${email} does not exist`);
        }
        const buffPassword = new Buffer(password);
        const base64Password = buffPassword.toString('base64');
        const usuariosLength = (usuarios.length + 1).toString();
        const usuarioId = 'USUARIO' + usuariosLength.padStart(10, '0000000000');
        const usuario = new Usuario();
        usuario.id = usuarioId;
        usuario.email = email;
        usuario.password = base64Password;
        usuario.nombre = nombre;
        usuario.apellidos = apellidos;
        usuario.rol = rol;
        usuario.estado = true;
        const buffer = Buffer.from(JSON.stringify(usuario));
        await ctx.stub.putState(usuarioId, buffer);
    }

    @Transaction()
    @Returns('Usuario[]')
    public async queryAllUsuarios(ctx: Context): Promise<Usuario[]> {
        const startKey = 'USUARIO0000000000';
        const endKey = 'USUARIO9999999999';
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        while (true) {
            const res = await iterator.next();
            if (res.value) {
                const evaluate = JSON.parse(res.value.value.toString('utf8')) as Usuario;
                allResults.push(evaluate);
            }
            if (res.done) {
                await iterator.close();
                return allResults;
            }
        }
    }

    @Transaction(false)
    @Returns('Usuario')
    public async readUsuario(ctx: Context, usuarioId: string): Promise<Usuario> {
        const exists = await this.usuarioExists(ctx, usuarioId);
        if (!exists) {
            throw new Error(`The usuario ${usuarioId} does not exist`);
        }
        const buffer = await ctx.stub.getState(usuarioId);
        const usuario = JSON.parse(buffer.toString()) as Usuario;
        delete usuario.password;
        return usuario;
    }

    @Transaction()
    public async deleteUsuario(ctx: Context, usuarioId: string): Promise<void> {
        const exists = await this.usuarioExists(ctx, usuarioId);
        if (!exists) {
            throw new Error(`The usuario ${usuarioId} does not exist`);
        }
        await ctx.stub.deleteState(usuarioId);
    }

    @Transaction(false)
    @Returns('Usuario')
    public async loginUsuario(ctx: Context, email: string, password: string): Promise<Usuario> {
        const usuarios = await this.queryAllUsuarios(ctx);
        const usuario = usuarios.find( (user: Usuario) => user.email === email );
        if (!usuario) {
            throw new Error(`The usuario ${email} does not exist`);
        }
        const buffPassword = new Buffer(usuario.password, 'base64');
        const asciiPassword = buffPassword.toString('ascii');
        if( asciiPassword === password ) {
            delete usuario.password;
            return usuario;
        }else {
            throw new Error(`La password ingresada no es correcta`);
        }
    }

    @Transaction()
    public async updatePassword(ctx: Context, usuarioId: string, password: string): Promise<void> {
        const exists = await this.usuarioExists(ctx, usuarioId);
        if (!exists) {
            throw new Error(`The usuario ${usuarioId} does not exist`);
        }
        const bufferUsuario = await ctx.stub.getState(usuarioId);
        const usuario = JSON.parse(bufferUsuario.toString()) as Usuario;
        const buffPassword = new Buffer(password);
        const base64Password = buffPassword.toString('base64');
        usuario.password = base64Password;
        const buffer = Buffer.from(JSON.stringify(usuario));
        await ctx.stub.putState(usuarioId, buffer);
    }

    @Transaction()
    public async updateEstado(ctx: Context, usuarioId: string, estado: boolean): Promise<void> {
        const exists = await this.usuarioExists(ctx, usuarioId);
        if (!exists) {
            throw new Error(`The usuario ${usuarioId} does not exist`);
        }
        const bufferUsuario = await ctx.stub.getState(usuarioId);
        const usuario = JSON.parse(bufferUsuario.toString()) as Usuario;
        usuario.estado = estado;
        const buffer = Buffer.from(JSON.stringify(usuario));
        await ctx.stub.putState(usuarioId, buffer);
    }
}
