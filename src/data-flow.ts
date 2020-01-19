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
} | {
    cellId: symbol,
    type: 'inconsistent equal',
    children: List<DataFlow>,
} | {
    cellId: symbol,
    type: 'inconsistent rule',
    ruleId: symbol,
    constraintId: symbol,
    children: List<DataFlow>,
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
            case ('inconsistency'): {
                const children = repo.content.suppliers
                    .filter(({ supplier: { cellId: xCellId } }) => xCellId !== cell.id)
                    .map(
                        ({ data, supplier }) => {
                            // In order to avoid the child dataflow from depending on
                            // the dataflow we are currently constructing, fake the
                            // repository being a constant
                            const repositories = network.repositories.set(repo.id, {
                                id: repo.id,
                                content: {
                                    type: 'constant',
                                    data,
                                    supplier,
                                },
                            })

                            return makeDataFlow(
                                ensureGet(network.cells, supplier.cellId),
                                {
                                    ...network,
                                    repositories,
                                })
                        })

                return {
                    cellId: cell.id,
                    type: 'inconsistent equal' as 'inconsistent equal',
                    children,
                }
            }
            // case ('calculated'): {
            //     if (repo.content.supplier.cellId === cell.id) {
            //         const constraint = ensureGet(network.constraints, repo.content.supplier.constraintId)
            //         const constraintType = ensureGet(network.constraintTypes, constraint.constraintTypeId)
            //         const rule = ensureGet(constraintType.rules, repo.content.supplier.ruleId)
            //         const children = rule.input
            //             .map((idInConstraint) => ensureGet(constraint.cellMapping, idInConstraint))
            //             .map((xCellId) => ensureGet(network.cells, xCellId))
            //             .map((childCell) => makeDataFlow(childCell, network))

            //         return {
            //             cellId: cell.id,
            //             type: 'rule' as 'rule',
            //             ruleId: rule.id,
            //             constraintId: constraint.id,
            //             children,
            //         }
            //     } else {
            //         return {
            //             cellId: cell.id,
            //             type: 'equal' as 'equal',
            //             child: makeDataFlow(
            //                 ensureGet(network.cells, repo.content.supplier.cellId),
            //                 network,
            //             ),
            //         }
            //     }
            // }
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
        case ('inconsistent equal'): {
            // TODO
            throw new Error('assert false')
        }
        case ('inconsistent rule'): {
            // TODO
            throw new Error('assert false')
        }
    }
}

export const convertToSExp = (df: DataFlow, network: Network): SExp => {
    const cell = ensureGet(network.cells, df.cellId)
    const readableId = (cell.id as any).description

    switch (df.type) {
        case ('equal'): {
            return ['=', readableId, convertToSExp(df.child, network)]
        }
        case ('rule'): {
            const repo = ensureGet(network.repositories, cell.repositoryId)
            switch (repo.content.type) {
                case ('empty'): {
                    return ['=', readableId, '<Cannot Compute>']
                }
                case ('constant'): {
                    return readableId
                }
                case ('inconsistency'): {
                    // TODO
                    throw new Error('assert false')
                }
                // case ('calculated'): {
                //     const constraint = ensureGet(network.constraints, repo.content.supplier.constraintId)
                //     const constraintType = ensureGet(network.constraintTypes, constraint.constraintTypeId)
                //     const rule = ensureGet(constraintType.rules, repo.content.supplier.ruleId)

                //     // Ordering here is implicit. Not sure if it will stay consistent
                //     const children = df.children.map((child) => convertToSExp(child, network))
                //     const results = rule.toSExp(...children)

                //     return ['=', readableId, results]
                // }
            }
        }
        case ('terminal'): {
            return readableId
        }
        case ('inconsistent equal'): {
            // TODO
            throw new Error('assert false')
        }
        case ('inconsistent rule'): {
            // TODO
            throw new Error('assert false')
        }
    }
}
