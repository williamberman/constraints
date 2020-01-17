import { fromPartial } from './network/network'
import { PersistentNetwork } from './persistent-network'
import { adder, stdLib } from './std-lib'
import { makeTemperatureNetwork } from './temperature'

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

    describe('Addition', () => {
        let foo: symbol
        let bar: symbol
        let baz: symbol

        beforeEach(() => {
            foo = net.variable()
            bar = net.variable()
            baz = net.variable()

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

    describe('Temperature', () => {
        let farenheit: symbol
        let centigrade: symbol

        beforeEach(() => {
            const syms = makeTemperatureNetwork(net)
            farenheit = syms.farenheit
            centigrade = syms.centigrade
        })

        test('centigrade->farenheit', () => {
            net.setEqual(centigrade, net.constant(-40))
            expect(net.valueOf(farenheit)).toEqual(-40)
        })

        test('farenheit->celcius', () => {
            net.setEqual(farenheit, net.constant(50))
            expect(net.valueOf(centigrade)).toEqual(10)
        })
    })
})
