import { List, Map } from 'immutable'

import { ConstraintType } from './constraint'

// a + b = c
export const adder: ConstraintType = (() => {
    const a = Symbol('a')
    const b = Symbol('b')
    const c = Symbol('c')

    const id1 = Symbol('a + b = c')
    const id2 = Symbol('c - a = b')
    const id3 = Symbol('c - b = a')

    return {
        id: Symbol('adder'),
        cells: { a, b, c },
        rules: Map([
            [id1, {
                id: id1,
                input: List([a, b]),
                update: (xa: number, xb: number) => ({ [c]: xa + xb }),
            }],
            [id2, {
                id: id2,
                input: List([a, c]),
                update: (xa: number, xc: number) => ({ [b]: xc - xa }),
            }],
            [id3, {
                id: id3,
                input: List([c, b]),
                update: (xc: number, xb: number) => ({ [a]: xc - xb }),
            }],
        ]),
    }
})()

// a * b = c
export const multiplier: ConstraintType = (() => {
    const a = Symbol('a')
    const b = Symbol('b')
    const c = Symbol('c')

    const id1 = Symbol('(a is 0) * b = 0')
    const id2 = Symbol('a * (b is 0) = 0')
    const id3 = Symbol('a * b = c')
    const id4 = Symbol('c / a = b')
    const id5 = Symbol('c / b = a')

    return {
        id: Symbol('multiplier'),
        cells: { a, b, c },
        rules: Map([
            [id1, {
                id: id1,
                input: List([a]),
                update: (xa: number) => xa === 0 ? { [c]: 0 } : {},
            }],
            [id2, {
                id: id2,
                input: List([b]),
                update: (xb: number) => xb === 0 ? { [c]: 0 } : {},
            }],
            [id3, {
                id: id3,
                input: List([a, b]),
                update: (xa: number, xb: number) => ({ [c]: xa * xb }),
            }],
            [id4, {
                id: id4,
                input: List([a, c]),
                update: (xa: number, xc: number) =>
                    (xa !== 0 && xc % xa === 0) ?
                        { [b]: xc / xa } :
                        { },
            }],
            [id5, {
                id: id5,
                input: List([b, c]),
                update: (xb: number, xc: number) =>
                    (xb !== 0 && xc % xb === 0) ?
                        { [a]: xc / xb } :
                        { },
            }],
        ]),
    }
})()

export const stdLib = Map<symbol, ConstraintType>([
    [adder.id, adder],
    [multiplier.id, multiplier],
])
