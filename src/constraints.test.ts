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

        expect(net.valueOf(foo)).toEqual(1)
        expect(net.valueOf(bar)).toEqual(undefined)

        net.setEqual(foo, bar)

        expect(net.valueOf(foo)).toEqual(1)
        expect(net.valueOf(bar)).toEqual(1)
    })

    test('equals propagates to multiple', () => {
        const foo = net.constant(1)
        const bar = net.variable('bar')
        const baz = net.variable('baz')

        net.setEqual(bar, baz)

        expect(net.valueOf(foo)).toEqual(1)
        expect(net.valueOf(bar)).toEqual(undefined)
        expect(net.valueOf(baz)).toEqual(undefined)

        net.setEqual(foo, bar)

        expect(net.valueOf(foo)).toEqual(1)
        expect(net.valueOf(bar)).toEqual(1)
        expect(net.valueOf(baz)).toEqual(1)
    })
})
