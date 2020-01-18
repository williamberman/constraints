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
        expect(net.valueOf(net.constant(2))).toEqual(2)
    })

    test('variable', () => {
        expect(net.valueOf(net.variable())).toEqual(undefined)
    })
})
