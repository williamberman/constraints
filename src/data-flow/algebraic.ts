import { Network } from '../network/network'
import { SExp } from '../symbolic-expression'
import { ensureGet } from '../utils'
import { DataFlow } from './data-flow'

export type AlgebraicDataFlow = SExp

export const convertToAlgebraic = (df: DataFlow, network: Network): AlgebraicDataFlow => {
    const cell = ensureGet(network.cells, df.cellId)
    const repo = ensureGet(network.repositories, cell.repositoryId)
    const readableId = (cell.id as any).description

    switch (df.type) {
        case ('equal'): {
            return ['=', readableId, convertToAlgebraic(df.child, network)]
        }
        case ('rule'): {
            switch (repo.content.type) {
                case ('empty'): {
                    return ['=', readableId, '<Cannot Compute>']
                }
                case ('constant'): {
                    return readableId
                }
                case ('inconsistency'): {
                    // TODO
                    throw new Error('assert false')
                }
                // case ('calculated'): {
                //     const constraint = ensureGet(network.constraints, repo.content.supplier.constraintId)
                //     const constraintType = ensureGet(network.constraintTypes, constraint.constraintTypeId)
                //     const rule = ensureGet(constraintType.rules, repo.content.supplier.ruleId)

                //     // Ordering here is implicit. Not sure if it will stay consistent
                //     const children = df.children.map((child) => convertToSExp(child, network))
                //     const results = rule.toSExp(...children)

                //     return ['=', readableId, results]
                // }
            }
        }
        case ('terminal'): {
            return readableId
        }
        case ('inconsistent equal'): {
            const children = df.children.map((child) => convertToAlgebraic(child, network))
            return ['inconsistent equal', readableId, children.toArray()]
        }
        case ('inconsistent rule'): {
            // TODO
            throw new Error('assert false')
        }
    }
}
