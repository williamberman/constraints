import { List } from 'immutable'

import { makeConstantCell, makeVariableCell } from './cell'
import { makeConstraint } from './constraint'
import {
    collapseDataFlow,
    convertToSymbolic,
    DataFlow,
    makeDataFlow,
    NetworkValue,
    SymbolicDataFlow,
    toNetworkValue,
    useExternalCells,
} from './data-flow'
import { Network, setEqual } from './network'
import { ensureGet } from './utils'

export class PersistentNetwork {
    constructor(private network: Network) {
    }

    constant(n: number, name?: string): symbol {
        const [cell, repo] = makeConstantCell(n, name || n.toString())

        this.network = {
            ...this.network,
            cells: this.network.cells.set(cell.id, cell),
            repositories: this.network.repositories.set(repo.id, repo),
        }

        return cell.id
    }

    variable(name: string): symbol {
        const [cell, repo] = makeVariableCell(name)

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

        this.network = {
            ...this.network,
            cells: this.network.cells.merge(cells),
            repositories,
        }
    }

    valueOf(cellId: symbol): List<NetworkValue> {
        const cell = ensureGet(this.network.cells, cellId)

        return makeDataFlow(cell, this.network)
            .map((df) => toNetworkValue(df, this.network))
    }

    why(cellId: symbol, keepCells?: symbol[]): List<DataFlow> {
        const cell = ensureGet(this.network.cells, cellId)
        const dfs = makeDataFlow(cell, this.network)

        return dfs
            .map((df) => keepCells ? collapseDataFlow(df, keepCells) : df)
            .map((df) => useExternalCells(df, this.network))
    }

    what(cellId: symbol, keepCells?: symbol[]): List<SymbolicDataFlow> {
        return this.why(cellId, keepCells)
            .map((df) => convertToSymbolic(df, this.network))
    }
}
