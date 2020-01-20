import * as assert from 'assert'
import { List } from 'immutable'

import { Cell } from '../cell'
import { Constraint, Rule } from '../constraint'
import { Network } from '../network'
import { ensureGet } from '../utils'
import { DataFlow } from './data-flow'

export type NetworkValue = Readonly<{
    type: 'empty',
} | {
    type: 'bound',
    data: number,
} | {
    type: 'inconsistency',
    // TODO what to put here?
}>

export const toNetworkValue = (df: DataFlow, network: Network): NetworkValue => {
    const cell = ensureGet(network.cells, df.cellId)
    const repo = ensureGet(network.repositories, cell.repositoryId)

    switch (df.type) {
        case ('equal'): {
            return toNetworkValue(df.child, network)
        }
        case ('rule'): {
            const constraint = ensureGet(network.constraints, df.constraintId)
            const constraintType = ensureGet(network.constraintTypes, constraint.constraintTypeId)
            const rule = ensureGet(constraintType.rules, df.ruleId)

            return computeValueFromRule({
                rule,
                cell,
                network,
                constraint,
                children: df.children,
            })
        }
        case ('terminal'): {
            switch (repo.content.type) {
                case ('empty'): {
                    return { type: 'empty' }
                }
                case ('constant'): {
                    return { type: 'bound', data: repo.content.data }
                }
                case ('inconsistency'): {
                    return { type: 'inconsistency' }
                }
            }
        }
        case ('inconsistent equal'): {
            return { type: 'inconsistency' }
        }
        case ('inconsistent rule'): {
            return { type: 'inconsistency' }
        }
    }
}

type RuleArguments = Readonly<{
    type: 'valid',
    data: List<any>,
} | {
    type: 'invalid',
    data: NetworkValue,
}>

const computeValueFromRule = ({
    cell,
    constraint,
    rule,
    children,
    network,
}: {
    cell: Cell,
    constraint: Constraint,
    rule: Rule,
    children: List<DataFlow>,
    network: Network,
}): NetworkValue => {
    const args = children
        .map((child) => toNetworkValue(child, network))
        .reduce((acc: RuleArguments, cur) => {
            if (acc.type === 'valid') {
                switch (cur.type) {
                    case ('bound'): {
                        return {
                            type: 'valid' as 'valid',
                            data: acc.data.push(cur.data),
                        }
                    }
                    case ('empty'): {
                        return { type: 'invalid' as 'invalid', data: cur }
                    }
                    case ('inconsistency'): {
                        return { type: 'invalid' as 'invalid', data: cur }
                    }
                }
            } else {
                return acc
            }
        }, {
            type: 'valid' as 'valid',
            data: List(),
        })

    if (args.type === 'valid') {
        const update = rule.update(...args.data.toArray())

        const flippedCellMapping = constraint.cellMapping.flip()

        // Any cell which is in the same repository could have been updated by
        // the rule
        const outputCell = network.cells
            .filter(({ repositoryId }) => repositoryId === cell.repositoryId)
            .find((xCell) => flippedCellMapping.has(xCell.id) &&
                flippedCellMapping.get(xCell.id)! in update)

        if (outputCell) {
            const updateKey = ensureGet(constraint.cellMapping.flip(), outputCell!.id)
            assert(updateKey in update)
            return { type: 'bound', data: (update as any)[updateKey] }
        } else {
            return { type: 'empty' }
        }
    } else {
        return args.data
    }
}
