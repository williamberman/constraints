import { DataFlow } from './data-flow'

export type SExp = RecExp | Atom
export type RecExp = SExp[]
export type Atom = number | boolean | string

export const isAtom = (exp: SExp): boolean => {
    return !Array.isArray(exp)
}

export const printSExp = (exp: SExp): string => {
    return JSON.stringify(exp, null, 4)
}

export const convertToSExp = (df: DataFlow): SExp => {
    return []
}
