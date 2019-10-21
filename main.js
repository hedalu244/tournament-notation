"use strict";
function tokenize(input) {
    let literals = input.match(/[\\\/]*(\[|[^\[\]\!\\\/\s]+)|\]|\!/g);
    if (literals === null)
        literals = [];
    return literals.map(x => {
        let result;
        ;
        if (x === "]" || x === "!")
            return { path: "", value: x };
        else if (result = x.match(/^([\\\/]*)(\[|[^\[\]\!\\\/\s]+)$/))
            return { path: result[1], value: result[2] };
        throw new Error();
    });
}
function stringifyTokens(tokens) {
    return tokens.map(x => x.path + x.value).join(" ");
}
function stringifySlash(tokens) {
    return tokens.map(x => serialize(x.value)).join("\n");
    function serialize(tree, path = "") {
        if (typeof tree === "string")
            return path + tree;
        let left = serialize(tree.left, tree.head === "left" ? path + "/" : "/");
        let right = serialize(tree.right, tree.head === "right" ? path + "\\" : "\\");
        return left + " " + right;
    }
}
function stringifyBracket(tokens) {
    return tokens.map(x => stringifyTree(x.value)).join("\n");
    function stringifyTree(tree) {
        if (typeof tree === "string")
            return tree;
        return "["
            + (tree.head === "left" ? "!" : "") + stringifyTree(tree.left) + " "
            + (tree.head === "right" ? "!" : "") + stringifyTree(tree.right) + "]";
    }
}
function isWord(token) { return token.value !== "!" && token.value !== "[" && token.value !== "]"; }
function parse(tokens) {
    if (tokens.length === 1)
        return tokens;
    if (tokens[0].value === "!")
        return [tokens[0], ...parse(tokens.slice(1))];
    if (tokens[0].value === "]")
        throw new Error();
    if (tokens[0].value === "[") {
        for (let i = 1, depth = 1;; i++) {
            if (tokens.length <= i)
                throw new Error();
            if (tokens[i].value === "[")
                depth++;
            if (tokens[i].value === "]")
                depth--;
            if (depth === 0) {
                let children = parse(tokens.slice(1, i));
                if (children.length == 2 && children[0].value !== "!" && children[1].value !== "!") {
                    return parse([{
                            path: tokens[0].path,
                            value: { left: children[0].value, right: children[1].value, head: "left" }
                        }, ...tokens.slice(i + 1)]);
                }
                if (children.length == 3 && children[0].value === "!" && children[1].value !== "!" && children[2].value !== "!") {
                    return parse([{
                            path: tokens[0].path,
                            value: { left: children[1].value, right: children[2].value, head: "left" }
                        }, ...tokens.slice(i + 1)]);
                }
                if (children.length == 3 && children[0].value !== "!" && children[1].value === "!" && children[2].value !== "!") {
                    return parse([{
                            path: tokens[0].path,
                            value: { left: children[0].value, right: children[2].value, head: "right" }
                        }, ...tokens.slice(i + 1)]);
                }
                throw new Error();
            }
        }
    }
    if (tokens[0].path === "/") {
        if (!isWord(tokens[1]) || !tokens[1].path.endsWith("\\")) {
            tokens = [tokens[0], ...parse(tokens.slice(1))];
            if (!isWord(tokens[1]) || !tokens[1].path.endsWith("\\"))
                throw new Error();
        }
        return parse([{
                path: tokens[1].path.substring(0, tokens[1].path.length - 1),
                value: { left: tokens[0].value, right: tokens[1].value, head: "right" }
            }, ...tokens.slice(2)]);
    }
    if (tokens[0].path.endsWith("/")) {
        if (!isWord(tokens[1]) || tokens[1].path !== "\\") {
            tokens = [tokens[0], ...parse(tokens.slice(1))];
            if (!isWord(tokens[1]) || tokens[1].path !== "\\")
                throw new Error();
        }
        return parse([{
                path: tokens[0].path.substring(0, tokens[0].path.length - 1),
                value: { left: tokens[0].value, right: tokens[1].value, head: "left" }
            }, ...tokens.slice(2)]);
    }
    return [tokens[0], ...parse(tokens.slice(1))];
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
/*
function test() {
  for(var i = 0; i < 10; i++) {
    let tree = randomTree(0.1);
    let tokens = serialize(tree);
    let tree2 = parse(tokens)[0].value;
    let tokens2 = serialize(tree2);
    console.log("tree: " + stringifyTree(tree));
    console.log("tree: " + stringifyTree(tree2));
    console.log("tokens: " + stringifyTokens(tokens));
    console.log("tokens: " + stringifyTokens(tokens2));
    delete tree.head;
    delete tree2.head;
    if(stringifyTree(tree) != stringifyTree(tree2) || stringifyTokens(tokens) != stringifyTokens(tokens2)) console.log("boom");
    console.log("=====")
  }
}*/
function $(id) { return document.getElementById(id); }
;
function update() {
    $("error").innerText = "";
    try {
        let tokens = tokenize($("input").value);
        let trees = parse(tokens);
        //$("tree").innerText = stringifyTree()[0].value;
        $("tokens").innerText = stringifyTokens(tokens);
        $("slash").innerText = stringifySlash(trees);
        $("bracket").innerText = stringifyBracket(trees);
    }
    catch (e) {
        $("error").innerText = "Error: " + e.message;
        $("tokens").innerText = "";
        $("slash").innerText = "";
        $("bracket").innerText = "";
    }
}
window.onload = () => {
    $("input").oninput = update;
    update();
};
