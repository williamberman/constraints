import { List } from 'immutable'

import { Cell } from '../cell'
import { Constraint, Rule } from '../constraint'
import { Network } from '../network/network'
import { ensureGet } from '../utils'
import { DataFlow, makeDataFlow } from './data-flow'

export const ruleToDataFlow = ({
    cell,
    rule,
    constraint,
    network,
}: {
    cell: Cell,
    rule: Rule,
    constraint: Constraint,
    network: Network,
}): List<DataFlow> => {
    // Once a rule is being converted to a DataFlow, it's Constraint must be
    // removed from the network while converting children to DataFlows to avoid
    // circular conversion dependencies
    const networkWithoutConstraint = removeConstraint({ constraint, network })

    const dataFlows: List<DataFlow> = rule.input
        .map((idInConstraintType) => ensureGet(constraint.cellMapping, idInConstraintType))
        .map((generalId) => ensureGet(network.cells, generalId))
        .map((inputCell) => makeDataFlow(inputCell, networkWithoutConstraint))
        .reduce((acc, dfs: List<DataFlow>) => {
            return dfs
                .map((df) => acc.map((args) => args.push(df)))
                .flatten(1)
                .toList()
        }, List<List<DataFlow>>([List()])) // Need to start with one empty list at a minimum
        .map((children) => ({
            cellId: cell.id,
            type: 'rule',
            ruleId: rule.id,
            constraintId: constraint.id,
            children,
        }))

    return dataFlows
}

const removeConstraint = ({
    network,
    constraint,
}: {
    network: Network,
    constraint: Constraint,
}): Network => {
    const constraints = network.constraints.remove(constraint.id)

    return {
        ...network,
        constraints,
    }
}
