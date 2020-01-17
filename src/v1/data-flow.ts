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
                        .map((xCellId) => ensureGet(network.cells, xCellId))
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

    // Favor using external cells from the same repository when
    // at a leaf node in graph
    const externalCell = network.cells.find(
        ({ repositoryId, external }) => repositoryId === repo.id && external)

    const cellId = children.isEmpty() && externalCell ?
        externalCell.id :
        cell.id

    return {
        cellId,
        children,
    }
}

export const collapseDataFlow = (df: DataFlow, keep: Cell[]): DataFlow => {
    const { edges, equivalences } = extractEquivalences(df.children)

    const availableCellIds = equivalences.map(({ cellId }) => cellId).push(df.cellId)

    const collapsedCellId = availableCellIds
        .find((cellId) => keep.find(({ id }) => cellId === id) ? true : false)
        ||
        // This should probably be chosen via a smart heuristic
        // However, for now we just pick the highest node
        df.cellId

    const collapsedEdges = edges.map((edge) => {
        return {
            ...edge,
            node: collapseDataFlow(edge.node, keep),
        }
    })

    return {
        cellId: collapsedCellId,
        children: collapsedEdges,
    }
}

const extractEquivalences = (
    edges: List<DataFlowEdge>,
): {
    edges: List<DataFlowEdge>,
    equivalences: List<DataFlow>,
} => {
    // The edges which denote equivalence need to be removed and recurred on
    const equivalences = edges
        .filter(({ type }) => type === 'equal')
        .map(({ node }) => node)

    const newEdges = edges
        .filter(({ type }) => type !== 'equal')

    const {
        edges: childrenEdges,
        equivalences: childrenEquivalences,
    } = equivalences
        .map(({ children }) => extractEquivalences(children))
        .reduce((acc, cur) => {
            return {
                edges: acc.edges.concat(cur.edges),
                equivalences: acc.equivalences.concat(cur.equivalences),
            }

        }, {
            edges: List<DataFlowEdge>(),
            equivalences: List<DataFlow>(),
        })

    return {
        equivalences: equivalences.concat(childrenEquivalences),
        edges: newEdges.concat(childrenEdges),
    }

}
