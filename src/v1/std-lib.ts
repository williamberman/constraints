import { Map } from 'immutable'

import { ConstraintType } from './constraint'

// a + b = c
export const adder: ConstraintType = (() => {
    const a = Symbol('a')
    const b = Symbol('b')
    const c = Symbol('c')

    return {
        id: Symbol(),
        cells: { a, b, c },
        rules: [
            {
                // a + b = c
                input: [a, b],
                update: (xa: number, xb: number) => ({ [c]: xa + xb }),
            },
            {
                // c - a = b
                input: [a, c],
                update: (xa: number, xc: number) => ({ [b]: xc - xa }),
            },
            {
                // c - b = a
                input: [c, b],
                update: (xc: number, xb: number) => ({ [a]: xc - xb }),
            },
        ],
    }
})()

// a * b = c
export const multiplier: ConstraintType = (() => {
    const a = Symbol('a')
    const b = Symbol('b')
    const c = Symbol('c')

    return {
        id: Symbol(),
        cells: { a, b, c },
        rules: [
            {
                // 0 * b = 0
                input: [a],
                update: (xa: number) => xa === 0 ? { [c]: 0 } : {},
            },
            {
                // a * 0 = 0
                input: [b],
                update: (xb: number) => xb === 0 ? { [c]: 0 } : {},
            },
            {
                // a * b = c
                input: [a, b],
                update: (xa: number, xb: number) => ({ [c]: xa * xb }),
            },
            {
                // c / a = b
                input: [a, c],
                update: (xa: number, xc: number) =>
                    (xa !== 0 && xc % xa === 0) ?
                        { [b]: xc / xa } :
                        { },
            },
            {
                // c / b = a
                input: [b, c],
                update: (xb: number, xc: number) =>
                    (xb !== 0 && xc % xb === 0) ?
                        { [a]: xc / xb } :
                        { },
            },
        ],
    }
})()

export const stdLib = Map<symbol, ConstraintType>([
    [adder.id, adder],
    [multiplier.id, multiplier],
])
