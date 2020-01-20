import { List } from 'immutable'

import { Cell, Repository } from '../cell'
import { Network } from '../network/network'
import { ensureGet } from '../utils'
import { canRunRule, ruleToDataFlow } from './rule-handling'

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
    const ruleDataFlows = makeRuleDataFlows(cell, network)
    const nonRuleDataFlows = makeNonRuleDataFlows({ cell, network, ruleDataFlows })

    return ruleDataFlows.concat(nonRuleDataFlows)
}

const makeRuleDataFlows = (cell: Cell, network: Network): List<DataFlow> => {
    return network.cells
        .filter(({ repositoryId }) => repositoryId === cell.repositoryId)
        .map((repoCell) => {
            return network.constraints
                .filter((constraint) => constraint.cellMapping.find((id) => id === repoCell.id))
                .map((constraint) => {
                    const constraintType = ensureGet(network.constraintTypes, constraint.constraintTypeId)

                    return constraintType.rules
                        .filter((rule) => canRunRule({ rule, constraint, network }))
                        .map((rule) => ruleToDataFlow({ cell: repoCell, rule, constraint, network }))
                        .map((df) => repoCell.id === cell.id ?
                            { cellId: cell.id, type: 'equal', child: df } :
                            df)
                })
                .toList()
        })
        .flatten()
        .toList()
}

const makeNonRuleDataFlows = ({
    cell,
    network,
    ruleDataFlows,
}: {
    cell: Cell,
    network: Network,
    ruleDataFlows: List<DataFlow>,
}) => {
    const repository = ensureGet(network.repositories, cell.repositoryId)

    switch (repository.content.type) {
        case ('empty'): {
            // The repository is only truly empty if no values could be calculated
            // from any rule
            return ruleDataFlows.isEmpty() ?
                List<DataFlow>([{ cellId: cell.id, type: 'terminal' as 'terminal' }]) :
                List()
        }
        case ('constant'): {
            if (repository.content.supplier.cellId === cell.id) {
                return List<DataFlow>([{
                    cellId: cell.id,
                    type: 'terminal' as 'terminal',
                }])
            } else {
                return makeDataFlow(
                    ensureGet(network.cells, repository.content.supplier.cellId),
                    network,
                ).map((df) => {
                    return {
                        cellId: cell.id,
                        type: 'equal' as 'equal',
                        child: df,
                    }
                })
            }
        }
        case ('inconsistency'): {
            const children: List<DataFlow> = repository.content.suppliers
                .filter(({ supplier: { cellId: xCellId } }) => xCellId !== cell.id)
                .flatMap(({ data, supplier }) => makeDataFlow(
                    ensureGet(network.cells, supplier.cellId),
                    // In order to avoid the child DataFlow from depending on
                    // the dataflow we are currently constructing, make the
                    // repository a constant
                    makeRepoConstant({ network, repository, data, supplier })))

            return List<DataFlow>([{
                cellId: cell.id,
                type: 'inconsistent equal' as 'inconsistent equal',
                children,
            }])
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
}

const makeRepoConstant = ({
    repository,
    network,
    data,
    supplier,
}: {
    repository: Repository,
    network: Network,
    data: number,
    supplier: {
        cellId: symbol,
    },
}) => {
    const repositories = network.repositories.set(repository.id, {
        id: repository.id,
        content: {
            type: 'constant',
            data,
            supplier,
        },
    })

    return {
        ...network,
        repositories,
    }
}
