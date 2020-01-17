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

    test('Addition Long Form', () => {
        const foo = net.constant(1, 'foo')
        const bar = net.constant(2, 'bar')
        const baz = net.variable('baz')

        const add = net.create(adder.id, 'add')

        net.setEqual(net.the(adder.cells.a, add), foo)
        net.setEqual(net.the(adder.cells.b, add), bar)
        net.setEqual(net.the(adder.cells.c, add), baz)

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
                                ruleId: adder.rules.keySeq().get(0)!, // Bad way of identifying rule, but we'll manage
                                constraintId: add,
                                node: {
                                    cellId: net.the(adder.cells.a, add),
                                    children: List([
                                        {
                                            type: 'equal',
                                            node: {
                                                cellId: foo,
                                                children: List(),
                                            },
                                        },
                                    ]),
                                },
                            },
                            {
                                type: 'rule',
                                ruleId: adder.rules.keySeq().get(0)!, // Bad way of identifying rule, but we'll manage
                                constraintId: add,
                                node: {
                                    cellId: net.the(adder.cells.b, add),
                                    children: List([
                                        {
                                            type: 'equal',
                                            node: {
                                                cellId: bar,
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
})
