A small constraint based programming system embedded in JavaScript modeled off of https://dspace.mit.edu/handle/1721.1/6933

## Installation
After cloning, install dependencies with `npm install`.

## REPL
To get started with an experimental REPL, run `npm start`.

If `npm start` doesn't work, run `npm run-script build && node -i -e "$(< repl.js)"`

Call `reset()` at  any time to get a fresh network.

Look in `repl.js` for some example code demonstrating behavior.

## Notes
The printed results from the repl are not very user friendly. They're useful for debugging purposes, but obscure if you don't have a good understanding of the inner workings. I plan to revisit the user friendliness of the repl some day.
