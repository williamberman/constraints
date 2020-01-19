import { List, Map } from 'immutable'
import { all, any } from 'ramda'

import { Cell, Content, Repository } from '../cell'
import { Constraint, Rule } from '../constraint'
import { ensureGet } from '../utils'

// TODO. Manually moving this functionality over to the DataFlow module. Can likely
// remove these after that's done

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
    if (canRunRule({ rule, constraint, repositories, cells, updatedCells })) {
        const contents = getContents({ rule, constraint, cells, repositories })

        const args = contents.map((content) => {
            if (content.type === 'constant') {
                return (content as any).data
            } else {
                throw new Error('assert false')
            }
        })

        const update = rule.update(...args)

        return applyRuleUpdate({ update, cells, repositories, constraint })
    } else {
        return Map()
    }
}

export const canRunRule = ({
    rule,
    constraint,
    repositories,
    cells,
    updatedCells,
}: {
    rule: Rule,
    constraint: Constraint,
    repositories: Map<symbol, Repository>,
    cells: Map<symbol, Cell>,
    updatedCells: Map<symbol, Cell>,
}): boolean => {
    const contents = getContents({ rule, constraint, cells, repositories })

    const inputsAreUpdated = any((cellId) => {
        const cell = ensureGet(cells, ensureGet(constraint.cellMapping, cellId))
        return updatedCells.has(cell.id)
    }, rule.input.toArray())

    const allContentsBound = all(({ type }) => type === 'constant', contents.toArray())

    return inputsAreUpdated && allContentsBound
}

export const applyRuleUpdate = ({
    update,
    cells,
    repositories,
    constraint,
}: {
    update: Record<symbol, number>,
    constraint: Constraint,
    cells: Map<symbol, Cell>,
    repositories: Map<symbol, Repository>,
}): Map<symbol, Repository> => {
    return Object.getOwnPropertySymbols(update).reduce((acc, cellId) => {
        const cell = ensureGet(cells, ensureGet(constraint.cellMapping, cellId))
        const repo = ensureGet(repositories, cell.repositoryId)

        const theUpdateData = (update as any)[cellId]

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

const getContents = ({
    rule,
    constraint,
    cells,
    repositories,
}: {
    rule: Rule,
    constraint: Constraint,
    cells: Map<symbol, Cell>,
    repositories: Map<symbol, Repository>,
}): List<Content> => {
    return rule.input.map((cellId) => {
        const cell = ensureGet(cells, ensureGet(constraint.cellMapping, cellId))
        return ensureGet(repositories, cell.repositoryId).content
    })
}
