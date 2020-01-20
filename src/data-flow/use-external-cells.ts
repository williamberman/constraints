import { List } from 'immutable'

import { Network } from '../network'
import { ensureGet } from '../utils'
import { DataFlow } from './data-flow'

export const useExternalCells = (df: DataFlow, network: Network): DataFlow => {
    const cell = ensureGet(network.cells, df.cellId)
    const repo = ensureGet(network.repositories, cell.repositoryId)

    const recur = (children: List<DataFlow>) => {
        const xChildren = children.map((child) => useExternalCells(child, network))

        return {
            ...df,
            children: xChildren,
        }
    }

    switch (df.type) {
        case ('terminal'): {
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
        case ('equal'): {
            return {
                ...df,
                child: useExternalCells(df.child, network),
            }
        }
        case ('rule'): {
            return recur(df.children)
        }
        case ('inconsistent equal'): {
            return recur(df.children)
        }
        case ('inconsistent rule'): {
            return recur(df.children)
        }
    }
}
