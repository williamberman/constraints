import { List } from 'immutable'

import { Repository } from '../cell'
import { Network } from '../network/network'
import { SExp } from '../symbolic-expression'
import { ensureGet } from '../utils'
import { DataFlow } from './data-flow'
import { toNetworkValue } from './value'

export type SymbolicDataFlow = Readonly<{
    formula: SExp,
    variables: List<VariableValue>,
}>

export type VariableValue = Readonly<{
    variable: string,
    value: SExp,
}>

export const convertToSymbolic = (df: DataFlow, network: Network): SymbolicDataFlow => {
    const cell = ensureGet(network.cells, df.cellId)
    const repo = ensureGet(network.repositories, cell.repositoryId)
    const readableId = (cell.id as any).description

    switch (df.type) {
        case ('equal'): {
            const { formula, variables } = convertToSymbolic(df.child, network)
            return {
                formula: ['=', readableId, formula],
                variables,
            }
        }
        case ('rule'): {
            const { formula, variables } = childrenToSymbolicDataFlow({
                network,
                readableId,
                constraintId: df.constraintId,
                ruleId: df.ruleId,
                children: df.children,
            })

            const value = (() => {
                const nval = toNetworkValue(df, network)
                if (nval.type === 'bound') {
                    return nval.data
                } else {
                    throw new Error('assert false')
                }
            })()

            return {
                formula,
                variables: variables.push({
                    variable: readableId,
                    value,
                }),
            }
        }
        case ('terminal'): {
            return {
                formula: readableId,
                variables: List([repoToVariableValue({ repo, readableId })]),
            }
        }
        case ('inconsistent equal'): {
            const { formulas, variables } = mergeSymbolicDataFlows(
                df.children.map((child) => convertToSymbolic(child, network)))

            return {
                formula: ['inconsistent equal', readableId, formulas.toArray()],
                variables: variables.push({
                    variable: readableId,
                    value: '<Inconsistent>',
                }),
            }
        }
        case ('inconsistent rule'): {
            const { formula, variables } = childrenToSymbolicDataFlow({
                network,
                readableId,
                constraintId: df.constraintId,
                ruleId: df.ruleId,
                children: df.children,
            })

            return {
                formula,
                variables: variables.push({
                    variable: readableId,
                    value: 'Inconsistent computation',
                }),
            }
        }
    }
}

const childrenToSymbolicDataFlow = ({
    network,
    constraintId,
    ruleId,
    children,
    readableId,
}: {
    network: Network,
    constraintId: symbol,
    ruleId: symbol,
    children: List<DataFlow>,
    readableId: string,
}): SymbolicDataFlow => {
    const constraint = ensureGet(network.constraints, constraintId)
    const constraintType = ensureGet(network.constraintTypes, constraint.constraintTypeId)
    const rule = ensureGet(constraintType.rules, ruleId)
    const { formulas, variables } = mergeSymbolicDataFlows(
        children.map((child) => convertToSymbolic(child, network)))

    // Ordering of arguments passed to rule.toSExp is implicit.
    // Not sure if it will stay consistent
    const formula = ['=', readableId, rule.toSExp(...formulas)]

    return {
        formula,
        variables,
    }
}

const mergeSymbolicDataFlows = (
    sdfs: List<SymbolicDataFlow>,
): {
    formulas: List<SExp>,
    variables: List<VariableValue>,
} => {
    return sdfs
        .reduce(({ formulas, variables: accVariables }, { formula, variables }) => ({
            formulas: formulas.push(formula),
            variables: accVariables.concat(variables),
        }), { formulas: List<SExp>(), variables: List<VariableValue>() })
}

const repoToVariableValue = ({
    readableId,
    repo,
}: {
    readableId: string
    repo: Repository,
}): VariableValue => {
    switch (repo.content.type) {
        case ('empty'): {
            return {
                variable: readableId,
                value: '<Can\'t Compute>',
            }
        }
        case ('constant'): {
            return {
                variable: readableId,
                value: repo.content.data,
            }
        }
        case ('inconsistency'): {
            return {
                variable: readableId,
                value: '<Inconsistent>',
            }
        }
    }
}
