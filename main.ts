type Tree = string | {left:Tree, right:Tree, head:"left"|"right"};
type Token = { path:string, value:Tree };

function tokenize(input: string): Token[] {
  let literals = input.match(/\S+/g);
  if (literals === null) literals = [];
  return literals.map(x=>{
    let result = x.match(/^([\\\/]*)(\S*)$/);
    return {path:result[1], value:result[2]};
  })
}

function stringifyTokens(tokens: Token[]): string {
  return tokens.map(x => x.path + x.value).join(" ");
}
function stringifyTree(tree: Tree): string {
  if(typeof tree === "string") return tree
  return "["
    + (tree.head === "left" ? "!" : "") + stringifyTree(tree.left) + " "
    + (tree.head === "right" ? "!" : "") + stringifyTree(tree.right) + "]";
}

function serialize(tree: Tree, path: string = ""): Token[]{
  if (typeof tree === "string")
    return [{path:path, value:tree}];
  let left = serialize(tree.left, tree.head === "left" ? path + "/" : "/");
  let right = serialize(tree.right, tree.head === "right" ? path + "\\"  : "\\");
  return [...left, ...right];
}

function parse(tokens: [Token, ...Token[]]): [Token, ...Token[]] {
  if (tokens.length === 1) return tokens;

  if (tokens[0].path === "/") {
    if (!tokens[1].path.endsWith("\\")) {
      tokens = [tokens[0], ...parse(tokens.slice(1))];
      if (!tokens[1].path.endsWith("\\")) throw new Error();
    }
    return parse([{
      path: tokens[1].path.substring(0, tokens[1].path.length - 1),
      value: {left:tokens[0].value, right:tokens[1].value, head: "right"}
    }, ...tokens.slice(2)]);
  }
  if (tokens[0].path.endsWith("/")) {
      if (tokens[1].path !== "\\") {
        tokens = [tokens[0], ...parse(tokens.slice(1))];
        if (tokens[1].path !== "\\") throw new Error();
      }
      return parse([{
        path: tokens[0].path.substring(0, tokens[0].path.length - 1),
        value: {left:tokens[0].value, right:tokens[1].value, head: "left"}
      }, ...tokens.slice(2)]);
  }
  return tokens;
}

function randomTree(p: number): Tree {
  if(Math.random() < p) return Math.random().toString(32).substring(2);
  return {
    left: randomTree(p + 0.1),
    right: randomTree(p + 0.1),
    head: Math.random() < 0.5 ? "left" : "right"
  };
}

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
}

function $(id){ return document.getElementById(id) };

window.onload = () => {
  $("tokens").oninput = () => {
    try {
      $("tree").innerText = stringifyTree(parse(tokenize($("tokens").value))[0].value);
    } catch(e) {
      $("tokensError").innerText = "Error: " + e.message;
    }
  }
  $("tree").oninput = () => {
    //$("tokens").value = stringifyTokens(serialize(parseTree($("tokens").value)));
  }
}
