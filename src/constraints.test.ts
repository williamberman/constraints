import { List } from 'immutable'

import { fromPartial } from './network'
import { PersistentNetwork } from './persistent-network'
import { stdLib } from './std-lib'

describe('Constraints', () => {
    let net: PersistentNetwork
    beforeEach(() => {
        net = new PersistentNetwork(fromPartial({
            constraintTypes: stdLib,
        }))
    })

    test('equals', () => {
        const foo = net.constant(1)
        const bar = net.variable('bar')

        expect(net.valueOf(foo)).toEqual(List([{ data: 1, type: 'bound' }]))
        expect(net.valueOf(bar)).toEqual(List([{ type: 'empty' }]))

        net.setEqual(foo, bar)

        expect(net.valueOf(foo)).toEqual(List([{ data: 1, type: 'bound' }]))
        expect(net.valueOf(bar)).toEqual(List([{ data: 1, type: 'bound' }]))
    })

    test('equals propagates to multiple', () => {
        const foo = net.constant(1)
        const bar = net.variable('bar')
        const baz = net.variable('baz')

        net.setEqual(bar, baz)

        expect(net.valueOf(foo)).toEqual(List([{ data: 1, type: 'bound' }]))
        expect(net.valueOf(bar)).toEqual(List([{ type: 'empty' }]))
        expect(net.valueOf(baz)).toEqual(List([{ type: 'empty' }]))

        net.setEqual(foo, bar)

        expect(net.valueOf(foo)).toEqual(List([{ data: 1, type: 'bound' }]))
        expect(net.valueOf(bar)).toEqual(List([{ data: 1, type: 'bound' }]))
        expect(net.valueOf(baz)).toEqual(List([{ data: 1, type: 'bound' }]))
    })
})
