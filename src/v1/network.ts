import * as assert from 'assert'
import { Collection, Map } from 'immutable'
import { all, any } from 'ramda'

import { Cell, constant, merge, Repository, variable } from './cell'
import { Constraint, ConstraintType, create } from './constraint'

const ensureGet = <K, V>(col: Collection<K, V>, key: K): V => {
    assert(col.has(key))
    return col.get(key)!
}

type Network = Readonly<{
    repositories: Map<symbol, Repository>,
    cells: Map<symbol, Cell>,
    constraintTypes: Map<symbol, ConstraintType>,
    constraints: Map<symbol, Constraint>,
}>

export const fromPartial = ({
    repositories = Map(),
    cells = Map(),
    constraintTypes = Map(),
    constraints = Map(),
}: Partial<Network>,
): Network => {
    return {
        repositories,
        cells,
        constraintTypes,
        constraints,
    }
}

export class PersistentNetwork {
    constructor(private network: Network) {
    }

    constant(n: number): symbol {
        const [cell, repo] = constant(n)

        this.network = {
            ...this.network,
            cells: this.network.cells.set(cell.id, cell),
            repositories: this.network.repositories.set(repo.id, repo),
        }

        return cell.id
    }

    variable(): symbol {
        const [cell, repo] = variable()

        this.network = {
            ...this.network,
            cells: this.network.cells.set(cell.id, cell),
            repositories: this.network.repositories.set(repo.id, repo),
        }

        return cell.id
    }

    create(id: symbol): symbol {
        const ct = ensureGet(this.network.constraintTypes, id)

        const [constraint, cells, repos] = create(ct!)

        this.network = {
            ...this.network,
            constraints: this.network.constraints.set(constraint.id, constraint),
            cells: this.network.cells.merge(cells),
            repositories: this.network.repositories.merge(repos),
        }

        return constraint.id
    }

    the(cellIdInConstraintType: symbol, constraintId: symbol): symbol {
        const constraint = ensureGet(this.network.constraints, constraintId)
        const generalId = ensureGet(constraint.cellMapping, cellIdInConstraintType)
        const cell = ensureGet(this.network.cells, generalId)

        return cell.id
    }

    setEquals(aCellId: symbol, bCellId: symbol) {
        const aCell = ensureGet(this.network.cells, aCellId)
        const bCell = ensureGet(this.network.cells, bCellId)

        const aRepository = ensureGet(this.network.repositories, aCell.repositoryId)
        const bRepository = ensureGet(this.network.repositories, bCell.repositoryId)

        const newRepository = merge(aRepository, bRepository)

        const repositories = this.network.repositories
            .filter((repo) => repo !== aRepository && repo !== bRepository)
            .set(newRepository.id, newRepository)

        let cellsToAwaken = Map<symbol, Cell>()

        const cells = this.network.cells.map((cell) => {
            if (cell.repositoryId === aRepository.id || cell.repositoryId === bRepository.id) {
                const newCell = {
                    ...cell,
                    repositoryId: newRepository.id,
                }

                cellsToAwaken = cellsToAwaken.set(newCell.id, newCell)

                return newCell
            } else {
                return cell
            }
        })

        this.network = {
            ...this.network,
            repositories,
            cells,
        }

        const updatedRepositories = this.awaken(cellsToAwaken)

        this.network = {
            ...this.network,
            repositories: updatedRepositories,
        }
    }

    // undefined indicates not bound
    valueOf(cellId: symbol): number | undefined {
        const repo = this.getRepo(cellId)

        return repo.content.bound ?
            repo.content.data :
            undefined
    }

    private awaken(cells: Map<symbol, Cell>, updated: Map<symbol, Repository> = Map()): Map<symbol, Repository> {
        if (cells.size === 0) {
            return updated
        }

        let furtherAwaken = Map<symbol, Cell>()
        let newUpdated = updated

        this.network.constraints.forEach((constraint) => {
            const constraintType = ensureGet(this.network.constraintTypes, constraint.constraintTypeId)

            constraintType.rules.forEach((rule) => {
                const contents = rule.input.map((cellId) => {
                    const cell = this.the(cellId, constraint.id)
                    const repos = this.network.repositories.merge(newUpdated)
                    return this.getRepo(cell, repos).content
                })

                const inputsAreUpdated = any((cellId) => {
                    const cell = this.the(cellId, constraint.id)
                    return cells.has(cell)
                }, rule.input)

                const allContentsBound = all(({ bound }) => bound, contents)

                if (inputsAreUpdated && allContentsBound) {
                    const args = contents.map((content) => {
                        if (content.bound) {
                            return content.data
                        } else {
                            throw new Error('assert false')
                        }
                    })

                    const theUpdate = rule.update(...args)

                    Object.keys(theUpdate).forEach((cellId) => {
                        const xcellId = cellId as unknown as symbol
                        const cell = this.the(xcellId, constraint.id)
                        const repo = this.getRepo(cell, this.network.repositories.merge(newUpdated))

                        const theUpdateData = (theUpdate as any)[xcellId]

                        if (repo.content.bound && repo.content.data === theUpdateData) {
                            // Do nothing. Adds no information
                        } else if (repo.content.bound && repo.content.data !== theUpdateData) {
                            throw new Error('Illegal update to repo: TODO better error message')
                        } else {
                            newUpdated = newUpdated.set(repo.id, {
                                ...repo,
                                content: {
                                    bound: true,
                                    data: theUpdateData,
                                },
                            })

                            furtherAwaken = furtherAwaken.merge(
                                this.network.cells.filter(({ repositoryId }) => repositoryId === repo.id))
                        }
                    })
                }
            })
        })

        return this.awaken(furtherAwaken, newUpdated)
    }

    private getRepo(cellId: symbol, repositories?: Map<symbol, Repository>): Repository {
        repositories = repositories || this.network.repositories
        const cell = ensureGet(this.network.cells, cellId)
        const repo = ensureGet(repositories, cell.repositoryId)

        return repo
    }
}
