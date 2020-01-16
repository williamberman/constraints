import { Map } from 'immutable'

import { constant, Repository, variable } from './cell'
import { create, setEqual } from './constraint'
import { Network } from './network'
import { ensureGet } from './utils'

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

    create(constraintTypeId: symbol): symbol {
        const ct = ensureGet(this.network.constraintTypes, constraintTypeId)

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

    setEqual(aCellId: symbol, bCellId: symbol) {
        const { cells, repositories } = setEqual(aCellId, bCellId, this.network)

        this.network = {
            ...this.network,
            cells,
            repositories,
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
