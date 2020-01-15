import * as assert from 'assert'

import { Cell, constant, merge, Repository, variable } from './cell'
import { Constraint, ConstraintType, create } from './constraint'

type Network = Readonly<{
    repositories: Repository[],
    cells: Cell[],
    constraintTypes: ConstraintType[],
    constraints: Constraint[],
}>

export class PersistentNetwork {
    constructor(private network: Network) { }

    constant(n: number): symbol {
        const [cell, repo] = constant(n)

        this.network = {
            ...this.network,
            cells: this.network.cells.concat([cell]),
            repositories: this.network.repositories.concat([repo]),
        }

        return cell.id
    }

    variable(): symbol {
        const [cell, repo] = variable()

        this.network = {
            ...this.network,
            cells: this.network.cells.concat([cell]),
            repositories: this.network.repositories.concat([repo]),
        }

        return cell.id
    }

    create(id: symbol): symbol {
        const ct = this.network.constraintTypes.find(({ id: xId }) => xId === id)

        assert(ct)

        const [constraint, cells, repos] = create(ct!)

        this.network = {
            ...this.network,
            constraints: this.network.constraints.concat([constraint]),
            cells: this.network.cells.concat(cells),
            repositories: this.network.repositories.concat(repos),
        }

        return constraint.id
    }

    the(constraintId: symbol, cellIdInConstraint: symbol): symbol {
        const ct = this.network.constraintTypes.find(({ id }) => id === constraintId)!

        assert(ct)

        const generalId = (ct.cellIds as any)[cellIdInConstraint]

        assert(generalId)

        const cell = this.network.cells.find(({ id }) => id === generalId)!

        assert(cell)

        return cell.id
    }

    setEquals(aCellId: symbol, bCellId: symbol) {
        const aCell = this.network.cells.find(({ id }) => id === aCellId)!

        assert(aCell)

        const bCell = this.network.cells.find(({ id }) => id === bCellId)!

        assert(bCell)

        const aRepository = this.network.repositories.find(({ id }) => id === aCell.repositoryId)!

        assert(aRepository)

        const bRepository = this.network.repositories.find(({ id }) => id === bCell.repositoryId)!

        assert(bRepository)

        const newRepository = merge(aRepository, bRepository)

        const repositories = this.network.repositories
            .filter((repo) => repo !== aRepository && repo !== bRepository)
            .concat([newRepository])

        const cellsToAwaken: Cell[] = []

        const cells = this.network.cells.map((cell) => {
            if (cell.repositoryId === aRepository.id || cell.repositoryId === bRepository.id) {
                const newCell = {
                    ...cell,
                    repositoryId: newRepository.id,
                }

                cellsToAwaken.push(newCell)

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

    // tslint:disable-next-line: variable-name
    private awaken(_cells: Cell[]): Repository[] {
        return []
    }
}
