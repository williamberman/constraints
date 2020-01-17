import { List } from 'immutable'

import { Cell } from './cell'
import { Network } from './network/network'
import { ensureGet } from './utils'

export type DataFlow = Readonly<{
    cellId: symbol,
    children: List<DataFlowEdge>,
}>

export type DataFlowEdge = Readonly<{
    type: 'equal',
    node: DataFlow,
} | {
    type: 'rule',
    ruleId: symbol,
    constraintId: symbol,
    node: DataFlow,
}>

export const makeDataFlow = (cell: Cell, network: Network): DataFlow => {
    const repo = ensureGet(network.repositories, cell.repositoryId)
    const children: List<DataFlowEdge> = (() => {
        switch (repo.content.type) {
            case ('empty'): {
                return List()
            }
            case ('constant'): {
                if (repo.content.supplier.cellId === cell.id) {
                    return List()
                } else {
                    return List([{
                        type: 'equal',
                        node: makeDataFlow(
                            ensureGet(network.cells, repo.content.supplier.cellId),
                            network,
                        ),
                    }])
                }
            }
            case ('calculated'): {
                if (repo.content.supplier.cellId === cell.id) {
                    const constraint = ensureGet(network.constraints, repo.content.supplier.constraintId)
                    const constraintType = ensureGet(network.constraintTypes, constraint.constraintTypeId)
                    const rule = ensureGet(constraintType.rules, repo.content.supplier.ruleId)

                    return rule.input
                        .map((idInConstraint) => ensureGet(constraint.cellMapping, idInConstraint))
                        .map((cellId) => ensureGet(network.cells, cellId))
                        .map((childCell): DataFlowEdge => ({
                            type: 'rule',
                            ruleId: rule.id,
                            constraintId: constraint.id,
                            node: makeDataFlow(childCell, network),
                        }))
                } else {
                    return List<DataFlowEdge>([{
                        type: 'equal',
                        node: makeDataFlow(
                            ensureGet(network.cells, repo.content.supplier.cellId),
                            network,
                        ),
                    }])
                }
            }
        }
    })()

    return {
        cellId: cell.id,
        children,
    }
}

// tslint:disable-next-line: variable-name
export const collapseDataFlow = (df: DataFlow, _terminateAt: Cell[]): DataFlow => {
    return df
}
