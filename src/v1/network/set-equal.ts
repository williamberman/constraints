import { Map } from 'immutable'

import { Cell, mergeRepositories, Repository } from '../cell'
import { ensureGet } from '../utils'
import { isAncestorOf } from './is-ancestor-of'
import { Network } from './network'

export const setEqual = (
    aCellId: symbol,
    bCellId: symbol,
    network: Network,
): {
    cells: Map<symbol, Cell>,
    repositories: Map<symbol, Repository>,
} => {
    const aCell = ensureGet(network.cells, aCellId)
    const bCell = ensureGet(network.cells, bCellId)

    const aRepository = ensureGet(network.repositories, aCell.repositoryId)
    const bRepository = ensureGet(network.repositories, bCell.repositoryId)

    const ancestorRepository = (() => {
        if (isAncestorOf({isAncestor: aCell, of: bCell, network})) {
            return aRepository
        } else if (isAncestorOf({ isAncestor: bCell, of: aCell, network })) {
            return bRepository
        } else {
            return undefined
        }
    })()

    const newRepository = mergeRepositories(aRepository, bRepository, ancestorRepository)

    const repositories = network.repositories
        .filter((repo) => repo !== aRepository && repo !== bRepository)
        .set(newRepository.id, newRepository)

    const cells = network.cells
        .filter((cell) =>
            cell.repositoryId === aRepository.id ||
            cell.repositoryId === bRepository.id)
        .map((cell) => ({
            ...cell,
            repositoryId: newRepository.id,
        }))

    return {
        repositories,
        cells,
    }
}
