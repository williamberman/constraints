import { fromPartial } from './network'
import { PersistentNetwork } from './persistent-network'
import { adder, stdLib } from './std-lib'

describe('Provenance', () => {
    let net: PersistentNetwork
    beforeEach(() => {
        net = new PersistentNetwork(fromPartial({
            constraintTypes: stdLib,
        }))
    })

    test('Addition', () => {
        const foo = net.constant(1)
        const bar = net.constant(2)
        const baz = net.variable()

        const add = net.create(adder.id)

        net.setEqual(net.the(adder.cells.a, add), foo)
        net.setEqual(net.the(adder.cells.b, add), bar)
        net.setEqual(net.the(adder.cells.c, add), baz)

        pending()
        // net.why(baz)
    })
})
