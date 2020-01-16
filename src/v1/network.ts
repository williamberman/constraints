import { Map } from 'immutable'

import { Cell, Repository } from './cell'
import { Constraint, ConstraintType } from './constraint'

export type Network = Readonly<{
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
