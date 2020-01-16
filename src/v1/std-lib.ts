import { Map } from 'immutable'

import { ConstraintType } from './constraint'

export const adder: ConstraintType = (() => {
    const a = Symbol('a')
    const b = Symbol('b')
    const c = Symbol('c')

    return {
        id: Symbol(),
        cellIds: [a, b, c],
        rules: [
            {
                // a + b = c
                input: [a, b],
                update: (xa: number, xb: number) => ({ [c]: xa + xb }),
            },
            {
                // a - c = b
                input: [a, c],
                update: (xa: number, xc: number) => ({ [b]: xa - xc }),
            },
            {
                // c - b = a
                input: [c, b],
                update: (xc: number, xb: number) => ({ [a]: xc - xb }),
            },
        ],
    }
})()

export const stdLib = Map<symbol, ConstraintType>([
    [adder.id, adder],
])