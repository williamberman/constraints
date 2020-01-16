import { Map } from 'immutable'
import { all, any } from 'ramda'

import { Cell, mergeRepositories, Repository, variable } from './cell'
import { Network } from './network'
import { ensureGet } from './utils'

export type ConstraintType = Readonly<{
    id: symbol,
    cellIds: symbol[],
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

export const adder: ConstraintType = (() => {
    const a = Symbol('a')
    const b = Symbol('b')
    const c = Symbol('c')

    return {
        id: Symbol(),
        cellIds: [a, b, c],
        rules: [
            {
                // a + b = c
                input: [a, b],
                update: (xa: number, xb: number) => ({ [c]: xa + xb }),
            },
            {
                // a - c = b
                input: [a, c],
                update: (xa: number, xc: number) => ({ [b]: xa - xc }),
            },
            {
                // c - b = a
                input: [c, b],
                update: (xc: number, xb: number) => ({ [a]: xc - xb }),
            },
        ],
    }
})()

export const stdLib = Map<symbol, ConstraintType>([
    [adder.id, adder],
])

export const create = (ct: ConstraintType): [Constraint, Map<symbol, Cell>, Map<symbol, Repository>] => {
    let cellMapping = Map<symbol, symbol>()
    let cells = Map<symbol, Cell>()
    let repos = Map<symbol, Repository>()

    ct.cellIds.map((cellId) => {
        const [cell, repo] = variable()
        cells = cells.set(cell.id, cell)
        repos = repos.set(repo.id, repo)

        cellMapping = cellMapping.set(cell.id, cellId)
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

    return Object.keys(theUpdate).reduce((acc, cellId) => {
        const xcellId = cellId as unknown as symbol
        const cell = ensureGet(cells, ensureGet(constraint.cellMapping, xcellId))
        const repo = ensureGet(repositories, cell.repositoryId)

        const theUpdateData = (theUpdate as any)[xcellId]

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
    repositories: Map<symbol, Repository>
} => {
    const aCell = ensureGet(network.cells, aCellId)
    const bCell = ensureGet(network.cells, bCellId)

    const aRepository = ensureGet(network.repositories, aCell.repositoryId)
    const bRepository = ensureGet(network.repositories, bCell.repositoryId)

    const newRepository = mergeRepositories(aRepository, bRepository)

    const repositories = network.repositories
        .filter((repo) => repo !== aRepository && repo !== bRepository)
        .set(newRepository.id, newRepository)

    const cellsToAwaken = network.cells
        .filter((cell) =>
            cell.repositoryId === aRepository.id ||
            cell.repositoryId === bRepository.id)
        .map((cell) => ({
            ...cell,
            repositoryId: newRepository.id,
        }))

    const cells = network.cells.merge(cellsToAwaken)

    const xRepositories = awaken(cellsToAwaken, Map(), {
        ...network,
        cells,
        repositories,
    })

    return {
        cells,
        repositories: xRepositories
    }
}
