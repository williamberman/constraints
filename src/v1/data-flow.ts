import { List } from 'immutable'

import { Cell } from './cell'
import { Network } from './network/network'
import { SExp } from './symbolic-expression'
import { ensureGet } from './utils'

export type DataFlow = Readonly<{
    cellId: symbol,
    type: 'equal'
    child: DataFlow,
} | {
    cellId: symbol,
    type: 'rule'
    ruleId: symbol,
    constraintId: symbol,
    children: List<DataFlow>,
} | {
    cellId: symbol,
    type: 'terminal',
}>

export const makeDataFlow = (cell: Cell, network: Network): DataFlow => {
    const repo = ensureGet(network.repositories, cell.repositoryId)

    const df: DataFlow = (() => {
        switch (repo.content.type) {
            case ('empty'): {
                return {
                    cellId: cell.id,
                    type: 'terminal' as 'terminal',
                }
            }
            case ('constant'): {
                if (repo.content.supplier.cellId === cell.id) {
                    return {
                        cellId: cell.id,
                        type: 'terminal' as 'terminal',
                    }
                } else {
                    return {
                        cellId: cell.id,
                        type: 'equal' as 'equal',
                        child: makeDataFlow(
                            ensureGet(network.cells, repo.content.supplier.cellId),
                            network,
                        ),
                    }
                }
            }
            case ('calculated'): {
                if (repo.content.supplier.cellId === cell.id) {
                    const constraint = ensureGet(network.constraints, repo.content.supplier.constraintId)
                    const constraintType = ensureGet(network.constraintTypes, constraint.constraintTypeId)
                    const rule = ensureGet(constraintType.rules, repo.content.supplier.ruleId)
                    const children = rule.input
                        .map((idInConstraint) => ensureGet(constraint.cellMapping, idInConstraint))
                        .map((xCellId) => ensureGet(network.cells, xCellId))
                        .map((childCell) => makeDataFlow(childCell, network))

                    return {
                        cellId: cell.id,
                        type: 'rule' as 'rule',
                        ruleId: rule.id,
                        constraintId: constraint.id,
                        children,
                    }
                } else {
                    return {
                        cellId: cell.id,
                        type: 'equal' as 'equal',
                        child: makeDataFlow(
                            ensureGet(network.cells, repo.content.supplier.cellId),
                            network,
                        ),
                    }
                }
            }
        }
    })()

    // Favor using external cells from the same repository when
    // at a leaf node in graph
    const externalCell = network.cells.find(
        ({ repositoryId, external }) => repositoryId === repo.id && external)

    const cellId = df.type === 'terminal' && externalCell ?
        externalCell.id :
        cell.id

    return {
        ...df,
        cellId,
    }
}

export const collapseDataFlow = (df: DataFlow, keepCells: symbol[]): DataFlow => {
    switch (df.type) {
        case ('terminal'): {
            return df
        }
        case ('rule'): {
            const children = df.children.map((child) => collapseDataFlow(child, keepCells))

            return {
                ...df,
                children,
            }
        }
        case ('equal'): {
            const child = collapseDataFlow(df.child, keepCells)

            if (keepCells.includes(df.cellId)) {
                return {
                    ...child,
                    cellId: df.cellId,
                }
            } else if (keepCells.includes(child.cellId)) {
                return child
            } else {
                // Here we should likely use a heuristic to choose which
                // cell to keep. However, for now we just choose the one closest
                // to the root
                return {
                    ...child,
                    cellId: df.cellId,
                }
            }
        }
    }
}

// TODO: This shows how the DataFlow is slightly incorrectly represented.
// For a given DataFlow, we should know _exactly_ how it is calculated on
// the given DataFlow and not on the child.
//
// I.e. If the DataFlow was calculated via an equal, then the DataFlow
// was not _also_ calculated via a rule. It is _possible_ that the cell
// could be calculated by either, but each would be represented by its
// own independent DataFlow.
// tslint:disable-next-line: variable-name
export const convertToSExp = (_df: DataFlow, _network: Network): SExp => {
    return []
}
