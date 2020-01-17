import { Map } from 'immutable'

import { Cell, Repository, variable } from './cell'

export type ConstraintType = Readonly<{
    id: symbol,
    cells: Record<string, symbol>,
    rules: Map<symbol, Rule>,
}>

export type Constraint = Readonly<{
    id: symbol,
    cellMapping: Map<symbol, symbol>, // { id in constraint -> general id }
    constraintTypeId: symbol,
}>

export type Rule = Readonly<{
    // update should have the same arity as input's length
    id: symbol,
    input: symbol[],
    update: (...args: number[]) => Record<symbol, number>,
}>

export const makeConstraint = (ct: ConstraintType): [Constraint, Map<symbol, Cell>, Map<symbol, Repository>] => {
    let cellMapping = Map<symbol, symbol>()
    let cells = Map<symbol, Cell>()
    let repos = Map<symbol, Repository>()

    Object.values(ct.cells).map((cellId) => {
        const [cell, repo] = variable()
        cells = cells.set(cell.id, cell)
        repos = repos.set(repo.id, repo)

        cellMapping = cellMapping.set(cellId, cell.id)
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
