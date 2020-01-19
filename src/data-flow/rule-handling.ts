import { List, Map } from 'immutable'
import { all } from 'ramda'

import { Cell, Content, Repository } from '../cell'
import { Constraint, Rule } from '../constraint'
import { Network } from '../network/network'
import { ensureGet } from '../utils'
import { DataFlow, makeDataFlow } from './data-flow'

export const canRunRule = ({
    rule,
    constraint,
    network,
}: {
    rule: Rule,
    constraint: Constraint,
    network: Network,
}): boolean => {
    const { cells, repositories } = network
    const contents = getContents({ rule, constraint, cells, repositories })

    const allContentsBound = all(
        ({ type }) => type === 'constant' || type === 'inconsistency',
        contents.toArray())

    return allContentsBound
}

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
    const { cells, repositories } = network
    const contents = getContents({ rule, constraint, cells, repositories })

    return contents
        .reduce((acc, content) => {
            if (content.type === 'constant') {
                return acc.map((args) => args.push(content.supplier.cellId))
            } else if (content.type === 'inconsistency') {
                // TODO ensure that flatten here works as expected
                return content.suppliers
                    .map(({ supplier }) => acc.map((args) => args.push(supplier.cellId)))
                    .flatten(1)
                    .toList()
            } else {
                throw new Error('assert false')
            }
        }, List<List<symbol>>([List()])) // Need to start with one empty list at a minimum
        .map((childrenIds) => {
            const children: List<DataFlow> = childrenIds.flatMap(
                (childId) => makeDataFlow(ensureGet(cells, childId), network))

            return {
                cellId: cell.id,
                type: 'rule',
                ruleId: rule.id,
                constraintId: constraint.id,
                children,
            }
        })
}

const getContents = ({
    rule,
    constraint,
    cells,
    repositories,
}: {
    rule: Rule,
    constraint: Constraint,
    cells: Map<symbol, Cell>,
    repositories: Map<symbol, Repository>,
}): List<Content> => {
    return rule.input.map((cellId) => {
        const cell = ensureGet(cells, ensureGet(constraint.cellMapping, cellId))
        return ensureGet(repositories, cell.repositoryId).content
    })
}
