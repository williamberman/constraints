import { Map } from 'immutable'

import { Cell, Repository, variable } from './cell'

export type ConstraintType = Readonly<{
    id: symbol,
    cellIds: symbol[],
    rules: Rule[],
}>

export type Constraint = Readonly<{
    id: symbol,
    cellMapping: Map<symbol, symbol>, // { id in constraint -> general id }
    constraintTypeId: symbol,
}>

type Rule = Readonly<{
    input: symbol[],
    update: (...args: number[]) => Record<symbol, number>,
}>

export const adder: ConstraintType = (() => {
    // a + b = c
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

export const create = (ct: ConstraintType): [Constraint, Map<symbol, Cell>, Map<symbol, Repository>] => {
    let cellMapping = Map<symbol, symbol>()
    let cells = Map<symbol, Cell>()
    let repos = Map<symbol, Repository>()

    ct.cellIds.map((cellId) => {
        const [cell, repo] = variable()
        cells = cells.set(cell.id, cell)
        repos = repos.set(repo.id, repo)

        cellMapping = cellMapping.set(cell.id, cellId)
    })

    return [
        {
            id: Symbol(),
            constraintTypeId: ct.id,
            cellMapping,
        },
        cells,
        repos,
    ]
}
