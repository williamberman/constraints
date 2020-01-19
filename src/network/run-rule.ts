import { Map } from 'immutable'
import { all, any } from 'ramda'

import { Cell, Repository } from '../cell'
import { Constraint, Rule } from '../constraint'
import { ensureGet } from '../utils'

export const runRule = ({
    rule,
    constraint,
    cells,
    repositories,
    updatedCells,
}: {
    rule: Rule,
    constraint: Constraint,
    cells: Map<symbol, Cell>,
    repositories: Map<symbol, Repository>,
    updatedCells: Map<symbol, Cell>,
}): Map<symbol, Repository> => {
    const contents = rule.input.map((cellId) => {
        const cell = ensureGet(cells, ensureGet(constraint.cellMapping, cellId))
        return ensureGet(repositories, cell.repositoryId).content
    })

    const inputsAreUpdated = any((cellId) => {
        const cell = ensureGet(cells, ensureGet(constraint.cellMapping, cellId))
        return updatedCells.has(cell.id)
    }, rule.input.toArray())

    const allContentsBound = all(({ type }) => type === 'constant', contents.toArray())

    const theUpdate = (() => {
        if (inputsAreUpdated && allContentsBound) {
            const args = contents.map((content) => {
                if (content.type === 'constant') {
                    return (content as any).data
                } else {
                    throw new Error('assert false')
                }
            })

            return rule.update(...args)
        } else {
            return {}
        }
    })()

    return Object.getOwnPropertySymbols(theUpdate).reduce((acc, cellId) => {
        const cell = ensureGet(cells, ensureGet(constraint.cellMapping, cellId))
        const repo = ensureGet(repositories, cell.repositoryId)

        const theUpdateData = (theUpdate as any)[cellId]

        if (repo.content.type === 'constant' && repo.content.data === theUpdateData) {
            // Do nothing. Adds no information
            return acc
        } else if (repo.content.type === 'constant' && repo.content.data !== theUpdateData) {
            // TODO this is no longer illegal. Handle this gracefully
            throw new Error('Illegal update to repo: TODO better error message')
        } else {
            return acc.set(repo.id, {
                ...repo,
                content: {
                    type: 'empty',
                },
                // TODO we no longr store calculated value in the repo
                // content: {
                //     type: 'calculated',
                //     data: theUpdateData,
                //     supplier: {
                //         cellId: cell.id,
                //         constraintId: constraint.id,
                //         ruleId: rule.id,
                //     },
                // },
            })
        }
    }, Map<symbol, Repository>())
}
