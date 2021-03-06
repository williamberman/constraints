import { List } from 'immutable'

import { fromPartial } from './network'
import { PersistentNetwork } from './persistent-network'
import { stdLib } from './std-lib'
import { makeTemperatureNetwork } from './temperature'

describe('Temperature', () => {
    let net: PersistentNetwork

    let farenheit: symbol
    let centigrade: symbol

    beforeEach(() => {
        net = new PersistentNetwork(fromPartial({
            constraintTypes: stdLib,
        }))

        const syms = makeTemperatureNetwork(net)
        farenheit = syms.farenheit
        centigrade = syms.centigrade
    })

    test('centigrade->farenheit', () => {
        net.setEqual(centigrade, net.constant(-40))
        expect(net.valueOf(farenheit)).toEqual(List([{ data: -40, type: 'bound' }]))
    })

    test('farenheit->centigrade', () => {
        net.setEqual(farenheit, net.constant(50))
        expect(net.valueOf(centigrade)).toEqual(List([{ data: 10, type: 'bound' }]))
    })
})
