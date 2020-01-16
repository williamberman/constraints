import { Map } from 'immutable'

import { Cell, constant, mergeRepositories, Repository, variable } from './cell'
import { awaken, Constraint, ConstraintType, create } from './constraint'
import { ensureGet } from './utils'

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

        const newRepository = mergeRepositories(aRepository, bRepository)

        const repositories = this.network.repositories
            .filter((repo) => repo !== aRepository && repo !== bRepository)
            .set(newRepository.id, newRepository)

        const cellsToAwaken = this.network.cells
            .filter((cell) =>
                cell.repositoryId === aRepository.id ||
                cell.repositoryId === bRepository.id)
            .map((cell) => ({
                ...cell,
                repositoryId: newRepository.id,
            }))

        const cells = this.network.cells.merge(cellsToAwaken)

        const xRepositories = awaken(cellsToAwaken, Map(), {
            ...this.network,
            cells,
            repositories,
        })

        this.network = {
            ...this.network,
            cells,
            repositories: xRepositories,
        }
    }

    // undefined indicates not bound
    valueOf(cellId: symbol): number | undefined {
        const repo = this.getRepo(cellId)

        return repo.content.bound ?
            repo.content.data :
            undefined
    }

    private getRepo(cellId: symbol, repositories?: Map<symbol, Repository>): Repository {
        repositories = repositories || this.network.repositories
        const cell = ensureGet(this.network.cells, cellId)
        const repo = ensureGet(repositories, cell.repositoryId)

        return repo
    }
}
