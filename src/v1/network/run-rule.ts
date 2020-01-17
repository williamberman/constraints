import { Map } from 'immutable'
import { all, any } from 'ramda'

import { Cell, hasValue, Repository } from '../cell'
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
    }, rule.input)

    const allContentsBound = all(hasValue, contents)

    const theUpdate = (() => {
        if (inputsAreUpdated && allContentsBound) {
            const args = contents.map((content) => {
                if (hasValue(content)) {
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

        if (hasValue(repo.content) && (repo.content as any).data === theUpdateData) {
            // Do nothing. Adds no information
            return acc
        } else if (hasValue(repo.content) && (repo.content as any).data !== theUpdateData) {
            throw new Error('Illegal update to repo: TODO better error message')
        } else {
            return acc.set(repo.id, {
                ...repo,
                content: {
                    type: 'calculated',
                    data: theUpdateData,
                    supplier: {
                        cellId: cell.id,
                        constraintId: constraint.id,
                        ruleId: rule.id,
                    },
                },
            })
        }
    }, Map<symbol, Repository>())
}
