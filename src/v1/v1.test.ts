import { stdLib } from './constraint'
import { fromPartial } from './network'
import { PersistentNetwork } from './persistent-network'

describe('V1', () => {
    let net: PersistentNetwork
    beforeEach(() => {
        net = new PersistentNetwork(fromPartial({
            constraintTypes: stdLib,
        }))
    })

    test('constant', () => {
        expect(net.valueOf(net.constant(2))).toEqual(2)
    })

    test('variable', () => {
        expect(net.valueOf(net.variable())).toEqual(undefined)
    })

    test('equals', () => {
        const foo = net.constant(1)
        const bar = net.variable()

        expect(net.valueOf(foo)).toEqual(1)
        expect(net.valueOf(bar)).toEqual(undefined)

        net.setEqual(foo, bar)

        expect(net.valueOf(foo)).toEqual(1)
        expect(net.valueOf(bar)).toEqual(1)
    })

    test('equals propagates to multiple', () => {

        const foo = net.constant(1)
        const bar = net.variable()
        const baz = net.variable()

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
