import { Map } from 'immutable'

import { Network } from '.'
import { Cell, Repository } from '../cell'
import { ensureGet } from '../utils'
import { runRule } from './run-rule'

export const awaken = (
    updatedCells: Map<symbol, Cell>,
    updated: Map<symbol, Repository>,
    network: Network,
): Map<symbol, Repository> => {
    if (updatedCells.size === 0) {
        return updated
    }

    const {
        constraints,
        constraintTypes,
        repositories,
        cells,
    } = network

    let furtherAwaken = Map<symbol, Cell>()
    let newUpdated = updated

    constraints.forEach((constraint) => {
        const constraintType = ensureGet(constraintTypes, constraint.constraintTypeId)

        const allRepos = repositories.merge(newUpdated)

        constraintType.rules.forEach((rule) => {
            const newRepos = runRule({
                rule,
                constraint,
                updatedCells,
                cells,
                repositories: allRepos,
            })

            newUpdated = newUpdated.merge(newRepos)

            newRepos.forEach((repo) => {
                const newCells = cells.filter(({ repositoryId }) => repositoryId === repo.id)
                furtherAwaken = furtherAwaken.merge(newCells)
            })
        })
    })

    return awaken(furtherAwaken, newUpdated, network)
}
