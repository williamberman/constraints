import { stdLib } from './constraint'
import { fromPartial, PersistentNetwork } from './network'

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

        net.setEquals(foo, bar)

        expect(net.valueOf(foo)).toEqual(1)
        expect(net.valueOf(bar)).toEqual(1)
    })


    test('equals propagates to multiple', () => {

        const foo = net.constant(1)
        const bar = net.variable()
        const baz = net.variable()

        net.setEquals(bar, baz)

        expect(net.valueOf(foo)).toEqual(1)
        expect(net.valueOf(bar)).toEqual(undefined)
        expect(net.valueOf(baz)).toEqual(undefined)

        net.setEquals(foo, bar)

        expect(net.valueOf(foo)).toEqual(1)
        expect(net.valueOf(bar)).toEqual(1)
        expect(net.valueOf(baz)).toEqual(1)
    })
})
