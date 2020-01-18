import { Map } from 'immutable'

import { constant, hasValue, variable } from './cell'
import { makeConstraint } from './constraint'
import { collapseDataFlow, convertToSExp, DataFlow, makeDataFlow } from './data-flow'
import { awaken, Network, setEqual } from './network'
import { SExp } from './symbolic-expression'
import { ensureGet } from './utils'

export class PersistentNetwork {
    constructor(private network: Network) {
    }

    constant(n: number, name?: string): symbol {
        const [cell, repo] = constant(n, name)

        this.network = {
            ...this.network,
            cells: this.network.cells.set(cell.id, cell),
            repositories: this.network.repositories.set(repo.id, repo),
        }

        return cell.id
    }

    variable(name?: string): symbol {
        const [cell, repo] = variable(name)

        const xCell = {
            ...cell,
            external: true,
        }

        this.network = {
            ...this.network,
            cells: this.network.cells.set(xCell.id, xCell),
            repositories: this.network.repositories.set(repo.id, repo),
        }

        return cell.id
    }

    create(constraintTypeId: symbol, name?: string): symbol {
        const ct = ensureGet(this.network.constraintTypes, constraintTypeId)

        const [constraint, cells, repos] = makeConstraint(ct!, name)

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
        const newCells = this.network.cells.merge(cells)

        const updatedRepositories = awaken(cells, Map(), {
            ...this.network,
            repositories,
            cells: newCells,
        })

        this.network = {
            ...this.network,
            cells: newCells,
            repositories: repositories.merge(updatedRepositories),
        }
    }

    // undefined indicates not bound
    valueOf(cellId: symbol): number | undefined {
        const cell = ensureGet(this.network.cells, cellId)
        const repo = ensureGet(this.network.repositories, cell.repositoryId)

        return hasValue(repo.content) ?
            (repo.content as any).data :
            undefined
    }

    why(cellId: symbol, keepCells?: symbol[]): DataFlow {
        const cell = ensureGet(this.network.cells, cellId)
        const df = makeDataFlow(cell, this.network)

        return keepCells ?
            collapseDataFlow(
                df,
                keepCells,
            ) :
            df
    }

    what(cellId: symbol, keepCells?: symbol[]): SExp {
        return convertToSExp(this.why(cellId, keepCells), this.network)
    }
}
