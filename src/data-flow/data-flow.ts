import { List } from 'immutable'

import { Cell } from '../cell'
import { Network } from '../network/network'
import { ensureGet } from '../utils'

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

export const makeDataFlow = (cell: Cell, network: Network): List<DataFlow> => {
    const repo = ensureGet(network.repositories, cell.repositoryId)

    const ruleDataFlows: List<DataFlow> = network.constraints
        .filter((constraint) => constraint.cellMapping.find((id) => id === cell.id))
        .map((constraint) => {
            // TODO
            throw new Error('assert false')
        })
        .toList()

    const nonRuleDataFlow: DataFlow = (() => {
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

    return ruleDataFlows.push(nonRuleDataFlow)
}
