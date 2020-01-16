import { Map } from 'immutable'
import { all, any } from 'ramda'

import { Cell, mergeRepositories, Repository, variable } from './cell'
import { Network } from './network'
import { ensureGet } from './utils'

export type ConstraintType = Readonly<{
    id: symbol,
    cells: Record<string, symbol>,
    rules: Rule[],
}>

export type Constraint = Readonly<{
    id: symbol,
    cellMapping: Map<symbol, symbol>, // { id in constraint -> general id }
    constraintTypeId: symbol,
}>

export type Rule = Readonly<{
    // update should have the same arity as input's length
    input: symbol[],
    update: (...args: number[]) => Record<symbol, number>,
}>

export const create = (ct: ConstraintType): [Constraint, Map<symbol, Cell>, Map<symbol, Repository>] => {
    let cellMapping = Map<symbol, symbol>()
    let cells = Map<symbol, Cell>()
    let repos = Map<symbol, Repository>()

    Object.values(ct.cells).map((cellId) => {
        const [cell, repo] = variable()
        cells = cells.set(cell.id, cell)
        repos = repos.set(repo.id, repo)

        cellMapping = cellMapping.set(cellId, cell.id)
    })

    return [
        {
            id: Symbol(),
            constraintTypeId: ct.id,
            cellMapping,
        },
        cells,
        repos,
    ]
}

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

const runRule = ({
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

    const allContentsBound = all(({ bound }) => bound, contents)

    const theUpdate = (() => {
        if (inputsAreUpdated && allContentsBound) {
            const args = contents.map((content) => {
                if (content.bound) {
                    return content.data
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

        if (repo.content.bound && repo.content.data === theUpdateData) {
            // Do nothing. Adds no information
            return acc
        } else if (repo.content.bound && repo.content.data !== theUpdateData) {
            throw new Error('Illegal update to repo: TODO better error message')
        } else {
            return acc.set(repo.id, {
                ...repo,
                content: {
                    bound: true,
                    data: theUpdateData,
                },
            })
        }
    }, Map<symbol, Repository>())
}

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

    const newRepository = mergeRepositories(aRepository, bRepository)

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
