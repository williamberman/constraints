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
            const one = net.constant(1, 'one')
            const two = net.constant(2, 'two')

            net.setEqual(foo, one)
            net.setEqual(bar, two)

            const actual = net.why(baz)

            const expected: DataFlow = {
                cellId: baz,
                children: List([
                    {
                        type: 'equal',
                        node: {
                            cellId: net.the(adder.cells.c, add),
                            children: List([
                                {
                                    type: 'rule',
                                    // Bad way of identifying rule, but we'll manage
                                    ruleId: adder.rules.keySeq().get(0)!,
                                    constraintId: add,
                                    node: {
                                        cellId: net.the(adder.cells.a, add),
                                        children: List([
                                            {
                                                type: 'equal',
                                                node: {
                                                    cellId: one,
                                                    children: List(),
                                                },
                                            },
                                        ]),
                                    },
                                },
                                {
                                    type: 'rule',
                                    // Bad way of identifying rule, but we'll manage
                                    ruleId: adder.rules.keySeq().get(0)!,
                                    constraintId: add,
                                    node: {
                                        cellId: net.the(adder.cells.b, add),
                                        children: List([
                                            {
                                                type: 'equal',
                                                node: {
                                                    cellId: two,
                                                    children: List(),
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ]),
                        },
                    },
                ]),
            }

            expect(actual).toEqual(expected)
        })

        test('Short Form', () => {
            pending()
        })
    })
})
