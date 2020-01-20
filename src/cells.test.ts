import { List } from 'immutable'

import { fromPartial } from './network'
import { PersistentNetwork } from './persistent-network'
import { stdLib } from './std-lib'

describe('Cells', () => {
    let net: PersistentNetwork

    beforeEach(() => {
        net = new PersistentNetwork(fromPartial({
            constraintTypes: stdLib,
        }))
    })

    test('constant', () => {
        expect(net.valueOf(net.constant(2))).toEqual(List([{ data: 2, type: 'bound' }]))
    })

    test('variable', () => {
        expect(net.valueOf(net.variable('any name'))).toEqual(List([{ type: 'empty' }]))
    })
})
