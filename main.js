"use strict";
function tokenize(input) {
    let literals = input.match(/\S+/g);
    if (literals === null)
        literals = [];
    return literals.map(x => {
        let result = x.match(/^([\\\/]*)(\S*)$/);
        return { path: result[1], value: result[2] };
    });
}
function stringify(tokens) {
    return tokens.map(x => x.path + x.value).join(" ");
}
function serialize(tree, path = "") {
    if (typeof tree === "string")
        return [{ path: path, value: tree }];
    let left = serialize(tree.left, tree.head === "left" ? path + "/" : "/");
    let right = serialize(tree.right, tree.head === "right" ? path + "\\" : "\\");
    return [...left, ...right];
}
function parse(tokens) {
    if (tokens.length === 1)
        return tokens;
    if (tokens[0].path === "/") {
        if (!tokens[1].path.endsWith("\\")) {
            tokens = [tokens[0], ...parse(tokens.slice(1))];
            if (!tokens[1].path.endsWith("\\"))
                throw new Error();
        }
        return parse([{
                path: tokens[1].path.substring(0, tokens[1].path.length - 1),
                value: { left: tokens[0].value, right: tokens[1].value, head: "right" }
            }, ...tokens.slice(2)]);
    }
    if (tokens[0].path.endsWith("/")) {
        if (tokens[1].path !== "\\") {
            tokens = [tokens[0], ...parse(tokens.slice(1))];
            if (tokens[1].path !== "\\")
                throw new Error();
        }
        return parse([{
                path: tokens[0].path.substring(0, tokens[0].path.length - 1),
                value: { left: tokens[0].value, right: tokens[1].value, head: "left" }
            }, ...tokens.slice(2)]);
    }
    return tokens;
}
function randomTree(p) {
    if (Math.random() < p)
        return Math.random().toString(32).substring(2);
    return {
        left: randomTree(p + 0.1),
        right: randomTree(p + 0.1),
        head: Math.random() < 0.5 ? "left" : "right"
    };
}
function test() {
    for (var i = 0; i < 10; i++) {
        let tree = randomTree(0.1);
        let tokens = serialize(tree);
        let tree2 = parse(tokens)[0].value;
        let tokens2 = serialize(tree2);
        console.log("tree: " + JSON.stringify(tree));
        console.log("tree: " + JSON.stringify(tree2));
        console.log("tokens: " + stringify(tokens));
        console.log("tokens: " + stringify(tokens2));
        delete tree.head;
        delete tree2.head;
        if (JSON.stringify(tree) != JSON.stringify(tree2) || stringify(tokens) != stringify(tokens2))
            console.log("boom");
        console.log("=====");
    }
}
