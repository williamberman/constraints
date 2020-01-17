import { List } from 'immutable'

import { DataFlow } from './data-flow'
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

    describe('Addition', () => {
        let foo: symbol
        let bar: symbol
        let baz: symbol

        let add: symbol

        // Bad way of identifying rule, but we'll manage
        const adderId = adder.rules.keySeq().get(0)!

        beforeEach(() => {
            foo = net.variable('foo')
            bar = net.variable('bar')
            baz = net.variable('baz')

            add = net.create(adder.id, 'add')

            net.setEqual(net.the(adder.cells.a, add), foo)
            net.setEqual(net.the(adder.cells.b, add), bar)
            net.setEqual(net.the(adder.cells.c, add), baz)
        })

        test('Long Form', () => {
            net.setEqual(foo, net.constant(1))
            net.setEqual(bar, net.constant(2))

            const actual = net.why(baz)

            const expected: DataFlow = {
                cellId: baz,
                type: 'equal',
                child: {
                    type: 'rule',
                    ruleId: adderId,
                    constraintId: add,
                    cellId: net.the(adder.cells.c, add),
                    children: List([
                        {
                            type: 'equal',
                            cellId: net.the(adder.cells.a, add),
                            child: {
                                type: 'terminal',
                                cellId: foo,
                            },
                        },
                        {
                            type: 'equal',
                            cellId: net.the(adder.cells.b, add),
                            child: {
                                type: 'terminal',
                                cellId: bar,
                            },
                        },
                    ]),
                },
            }

            expect(actual).toEqual(expected)
        })

        test('Short Form', () => {
            net.setEqual(foo, net.constant(1))
            net.setEqual(bar, net.constant(2))

            const actual = net.why(baz, [foo, bar, baz])

            const expected: DataFlow = {
                cellId: baz,
                type: 'rule',
                ruleId: adderId,
                constraintId: add,
                children: List([
                    {
                        type: 'terminal',
                        cellId: foo,
                    },
                    {
                        type: 'terminal',
                        cellId: bar,
                    },
                ]),
            }

            expect(actual).toEqual(expected)
        })

        test('Symbolic Form', () => {
            net.setEqual(foo, net.constant(1))
            net.setEqual(bar, net.constant(2))

            const actual = net.what(baz, [foo, bar, baz])

            const expected = ['=', 'baz', ['+', 'foo', 'bar']]

            expect(actual).toEqual(expected)
        })
    })
})
