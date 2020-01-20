import { PersistentNetwork } from './persistent-network'
import { adder, multiplier } from './std-lib'

export const makeTemperatureNetwork = (net: PersistentNetwork) => {
    const add = net.create(adder.id, 'add')
    const mult = net.create(multiplier.id, 'mult')
    const othermult = net.create(multiplier.id, 'othermult')

    const farenheit = net.variable('farenheit')
    const centigrade = net.variable('centigrade')

    net.setEqual(farenheit, net.the(adder.cells.c, add))
    net.setEqual(net.constant(32), net.the(adder.cells.b, add))
    net.setEqual(net.the(adder.cells.a, add), net.the(multiplier.cells.a, othermult))
    net.setEqual(net.the(multiplier.cells.b, othermult), net.constant(5))
    net.setEqual(net.the(multiplier.cells.c, othermult), net.the(multiplier.cells.c, mult))
    net.setEqual(net.the(multiplier.cells.b, mult), centigrade)
    net.setEqual(net.the(multiplier.cells.a, mult), net.constant(9))

    return {
        farenheit,
        centigrade,
    }
}
