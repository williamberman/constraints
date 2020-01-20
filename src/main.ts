import { DataFlow } from './data-flow'
import { fromPartial } from './network/network'
import { PersistentNetwork } from './persistent-network'
import { stdLib } from './std-lib'
import { makeTemperatureNetwork as xMakeTemperatureNetwork } from './temperature'

export { adder, multiplier } from './std-lib'

// tslint:disable: no-console

let net: PersistentNetwork

export const reset = () => {
    net = new PersistentNetwork(fromPartial({
        constraintTypes: stdLib,
    }))
    console.log('Network reset')
}

reset()

export const constant = (n: number, name?: string) => {
    return net.constant(n, name)
}

export const variable = (name: string) => {
    return net.variable(name)
}

export const create = (constraintTypeId: symbol, name?: string) => {
    return net.create(constraintTypeId, name)
}

export const the = (cellIdInConstraintType: symbol, constraintId: symbol) => {
    return net.the(cellIdInConstraintType, constraintId)
}

export const setEqual = (aCellId: symbol, bCellId: symbol) => {
    // tslint:disable-next-line: no-debugger
    debugger
    return net.setEqual(aCellId, bCellId)
}

export const valueOf = (cellId: symbol) => {
    const readableId = (cellId as any).description || cellId.toString()
    const value = net.valueOf(cellId)

    console.log(`There are ${value.size} value(s) of ${readableId}`)

    value.forEach((nval, idx) => {
        console.log(`${readableId} value #${idx + 1}`)
        switch (nval.type) {
            case ('empty'): {
                console.log(`${readableId} is missing necessary pre-requisites to compute a value`)
                break
            }
            case ('bound'): {
                console.log(`${readableId} is bound to ${nval.data}`)
                break
            }
            case 'inconsistency': {
                console.log(`${readableId} is bound to multiple inconsistent values`)
                break
            }
        }
    })
}

const xwhy = (cellId: symbol, cb: (df: DataFlow, readableId: string) => void, keepCells?: symbol[]) => {
    const readableId = (cellId as any).description || cellId.toString()
    const dfs = net.why(cellId, keepCells)

    console.log(`There are ${dfs.size} data flows for ${readableId}`)

    dfs.forEach((df, idx) => {
        console.log(`${readableId} data flow #${idx + 1}`)
        cb(df, readableId)
    })
}

export const why = (cellId: symbol, keepCells?: symbol[]) => {
    xwhy(cellId, (df: DataFlow, readableId) => {
        switch (df.type) {
            case 'equal': {
                const child = (df.child.cellId as any).description
                console.log(`${readableId} is equal to ${child}`)
                break
            }
            case 'inconsistent equal': {
                const children = df.children.map(({ cellId: xCellId }) => (xCellId as any).description).join(',')
                console.log(`${readableId} is inconsistently equal to ${children}`)
                break
            }
            case 'inconsistent rule': {
                const children = df.children.map(({ cellId: xCellId }) => (xCellId as any).description).join(',')
                const readableRuleId = (df.ruleId as any).description

                console.log(`${readableId} is _inconsistently_ calculated via ${readableRuleId} with inputs from ${children}`)
                break
            }
            case 'rule': {
                const children = df.children.map(({ cellId: xCellId }) => (xCellId as any).description).join(',')
                const readableRuleId = (df.ruleId as any).description

                console.log(`${readableId} is calculated via ${readableRuleId} with inputs from ${children}`)
                break
            }
            case 'terminal': {
                console.log(`${readableId} is a terminal value`)
                break
            }
        }
    }, keepCells)
}

export const whyUltimately = (cellId: symbol, keepCells?: symbol[]) => {
    const printer = (df: DataFlow, readableId: string) => {
        switch (df.type) {
            case 'equal': {
                printer(df.child, readableId)
                break
            }
            case 'inconsistent equal': {
                df.children.forEach((child) => printer(child, readableId))
                break
            }
            case 'inconsistent rule': {
                df.children.forEach((child) => printer(child, readableId))
                break
            }
            case 'rule': {
                df.children.forEach((child) => printer(child, readableId))
                break
            }
            case 'terminal': {
                const child = (df.cellId as any).description
                console.log(`${readableId} has a terminal premise of ${child}`)
                break
            }
        }
    }

    xwhy(cellId, printer, keepCells)
}

export const what = (cellId: symbol, keepCells?: symbol[]) => {
    const readableId = (cellId as any).description || cellId.toString()
    const sdfs = net.what(cellId, keepCells)

    console.log(`There are ${sdfs.size} symbolic data flows for ${readableId}`)

    sdfs.forEach((sdf, idx) => {
        console.log(`${readableId} symbolic data flow #${idx + 1}`)

        console.log(JSON.stringify(sdf.formula, null, 4))

        sdf.variables.forEach(({ variable: xvariable, value }) => {
            console.log(`${xvariable} <- ${value}`)
        })
    })
}

export const makeTemperatureNetwork = () => xMakeTemperatureNetwork(net)
