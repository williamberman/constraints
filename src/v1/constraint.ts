import { Cell, Repository, variable } from './cell'

export type ConstraintType = Readonly<{
    id: symbol,
    cellIds: symbol[],
    rules: Rule[],
}>

export type Constraint = Readonly<{
    id: symbol,
    cellMapping: Record<symbol, symbol>, // { id in constraint -> general id }
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

export const stdLib = {
    [adder.id]: adder,
}

export const create = (ct: ConstraintType): [Constraint, Cell[], Repository[]] => {
    const cellMapping: any = {}
    const cells: Cell[] = []
    const repos: Repository[] = []

    ct.cellIds.map((cellId) => {
        const [cell, repo] = variable()
        cells.push(cell)
        repos.push(repo)

        cellMapping[cell.id] = cellId
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
