const {
    reset,
    constant,
    variable,
    create,
    the,
    setEqual,
    valueOf,
    why,
    whyUltimately,
    what,
    adder,
    multiplier
} = require('./dist/main.js')

const adderExample = () => {
    reset()

    let foo = variable('foo')
    let bar = variable('bar')
    let baz = variable('baz')

    let add = create(adder.id)

    setEqual(the(adder.cells.a, add), foo)
    setEqual(the(adder.cells.b, add), bar)
    setEqual(the(adder.cells.c, add), baz)

    valueOf(baz)

    setEqual(foo, constant(1))
    setEqual(bar, constant(2))

    valueOf(baz)

    what(baz, [foo, bar, baz])
}

const reverseAdderExample = () => {
    reset()

    let foo = variable('foo')
    let bar = variable('bar')
    let baz = variable('baz')

    let add = create(adder.id)

    setEqual(the(adder.cells.a, add), foo)
    setEqual(the(adder.cells.b, add), bar)
    setEqual(the(adder.cells.c, add), baz)

    valueOf(bar)

    setEqual(foo, constant(1))
    setEqual(baz, constant(3))

    valueOf(bar)

    what(bar, [foo, bar, baz])
}
