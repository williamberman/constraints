import { List } from 'immutable'

import { DataFlow } from './data-flow'

export const collapseDataFlow = (df: DataFlow, keepCells: symbol[]): DataFlow => {
    const recur = (children: List<DataFlow>) => {
        const xChildren = children.map((child) => collapseDataFlow(child, keepCells))

        return {
            ...df,
            children: xChildren,
        }
    }

    switch (df.type) {
        case ('terminal'): {
            return df
        }
        case ('equal'): {
            const child = collapseDataFlow(df.child, keepCells)

            if (keepCells.includes(df.cellId)) {
                return {
                    ...child,
                    cellId: df.cellId,
                }
            } else if (keepCells.includes(child.cellId)) {
                return child
            } else {
                // Here we should likely use a heuristic to choose which
                // cell to keep. However, for now we just choose the one closest
                // to the root
                return {
                    ...child,
                    cellId: df.cellId,
                }
            }
        }
        case ('rule'): {
            return recur(df.children)
        }
        case ('inconsistent equal'): {
            return recur(df.children)
        }
        case ('inconsistent rule'): {
            return recur(df.children)
        }
    }
}
