import { fromPartial } from './network'
import { PersistentNetwork } from './persistent-network'
import { adder, stdLib } from './std-lib'

describe('Addition', () => {
    let net: PersistentNetwork

    let foo: symbol
    let bar: symbol
    let baz: symbol

    beforeEach(() => {
        net = new PersistentNetwork(fromPartial({
            constraintTypes: stdLib,
        }))

        foo = net.variable('foo')
        bar = net.variable('bar')
        baz = net.variable('baz')

        const add = net.create(adder.id)

        net.setEqual(net.the(adder.cells.a, add), foo)
        net.setEqual(net.the(adder.cells.b, add), bar)
        net.setEqual(net.the(adder.cells.c, add), baz)
    })

    test('forwards', () => {
        net.setEqual(foo, net.constant(1))
        net.setEqual(bar, net.constant(2))

        expect(net.valueOf(baz)).toEqual(3)
    })

    test('backwards', () => {
        net.setEqual(bar, net.constant(2))
        net.setEqual(baz, net.constant(3))

        expect(net.valueOf(foo)).toEqual(1)
    })
})
