import { stdLib } from './constraint'
import { fromPartial, PersistentNetwork } from './network'

describe('V1', () => {
    test('standard behavior', () => {
        const net = new PersistentNetwork(fromPartial({
            constraintTypes: [stdLib.adder],
        }))

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