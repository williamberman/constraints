import { List, Map } from 'immutable'

import { Cell, makeVariableCell, Repository } from './cell'
import { SExp } from './symbolic-expression'

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
    id: symbol,
    // update and toSExp should have the same arity as input's length
    input: List<symbol>,
    update: (...args: number[]) => Record<symbol, number>,
    toSExp: (...args: SExp[]) => SExp,
}>

export const makeConstraint = (
    ct: ConstraintType,
    name?: string,
): [Constraint, Map<symbol, Cell>, Map<symbol, Repository>] => {
    let cellMapping = Map<symbol, symbol>()
    let cells = Map<symbol, Cell>()
    let repos = Map<symbol, Repository>()

    Object.keys(ct.cells).map((cellName) => {
        const cellId = ct.cells[cellName]
        const [cell, repo] = makeVariableCell(cellName)
        cells = cells.set(cell.id, cell)
        repos = repos.set(repo.id, repo)

        cellMapping = cellMapping.set(cellId, cell.id)
    })

    return [
        {
            id: Symbol(name),
            constraintTypeId: ct.id,
            cellMapping,
        },
        cells,
        repos,
    ]
}
