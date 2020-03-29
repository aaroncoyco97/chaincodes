/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Troza {

    @Property()
    public id: string;
    public volumen: string;
    public arbolId: string;
}
