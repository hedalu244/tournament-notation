type Tree = {treeType: "word", literal: string} | {treeType: "node", left: Tree, right: Tree, head?: "left"|"right"};
type SlashToken = { path: string, value: Tree };
type BracketToken = "[" | "]" | "!" | {treeType: "word", literal: string };

function tokenizeSlash(input: string): SlashToken[] {
  let literals = input.match(/[\\\/]*([^\[\]\!\\\/\s]+)/g);
  if (literals === null) literals = [];
  return literals.map(x=>{
    let result;
    if(result = x.match(/^([\\\/]*)([^\[\]\!\\\/\s]+)$/))
      return { path: result[1], value: { treeType:"word", literal:result[2] } };
    throw new Error("illegal token");
  })
}
function tokenizeBracket(input: string): BracketToken[] {
  let literals = input.match(/[\\\/]*([^\[\]\!\\\/\s]+)|\[|\]|\!/g);
  if (literals === null) literals = [];
  return literals.map(x=>{
    let result;
    if(x === "[" || x === "]" || x === "!")
      return x;
    else if(result = x.match(/^(\[|[^\[\]\!\\\/\s]+)$/))
      return { treeType:"word", literal: result[1] };
    throw new Error("illegal token");
  })
}
/*
function stringifyTokens(tokens: Token[]): string {
  return tokens.map(x => x.path + x.value).join(" ");
}*/
function stringifyIntoSlash(trees: Tree[]): string {
  return trees.map(x => serialize(x, "")).join("\n");
  
  function serialize(tree: Tree, path: string): string{
    if (tree.treeType === "word")
      return path + tree.literal;
    let left = serialize(tree.left, tree.head === "left" ? path + "/" : "/");
    let right = serialize(tree.right, tree.head === "right" ? path + "\\" : "\\");
    return left + " " + right;
  }
}
function stringifyIntoBracket(trees: Tree[]): string {
  return trees.map(x => serialize(x)).join("\n");

  function serialize(tree: Tree): string {
    if(tree.treeType === "word")
      return tree.literal;
    return "["
      + (tree.head === "left" ? "!" : "") + serialize(tree.left) + " "
      + (tree.head === "right" ? "!" : "") + serialize(tree.right)
      + "]";
  }
}

function parseBracket(tokens: BracketToken[]): (Tree | "!")[] {
  if (tokens[0] === undefined) return []; 
  if (tokens[1] === undefined) {
    if(tokens[0] === "[" || tokens[0] === "]")
      throw new Error("Brackets don't make pair");
    return [tokens[0]];
  }
  if (tokens[0] === "!") return [tokens[0], ...parseBracket(tokens.slice(1))];
  if (tokens[0] === "]") throw new Error("Brackets don't make pair");
  if (tokens[0] === "[") {
    for(let i = 1, depth = 1; ; i++){
      if (tokens.length <= i) throw new Error("Brackets don't make pair");
      if (tokens[i] === "[") depth++;
      if (tokens[i] === "]") depth--;
      if (depth === 0) {
        let children = parseBracket(tokens.slice(1, i));
        if (children.length == 2 && children[0] !== "!" && children[1] !== "!") {
          return [{
            treeType: "node",
            left:children[0],
            right:children[1],
            head: "left"
          }, ...parseBracket(tokens.slice(i + 1))];
        }
        if (children.length == 3 && children[0] === "!" && children[1] !== "!" && children[2] !== "!") {
          return [{
            treeType: "node",
            left:children[1],
            right:children[2],
            head: "left"
          }, ...parseBracket(tokens.slice(i + 1))];
        }
        if (children.length == 3 && children[0] !== "!" && children[1] === "!" && children[2] !== "!") {
          return [{
            treeType: "node",
            left:children[0],
            right:children[2],
            head: "right"
          }, ...parseBracket(tokens.slice(i + 1))];
        }
        throw new Error("Brackets can contain just two values");
      }
    }
  }
  return [tokens[0], ...parseBracket(tokens.slice(1))];
}
function parseSlash(tokens: SlashToken[]): SlashToken[] {
  if (tokens[0] === undefined) return []; 
  if (tokens[1] === undefined) return tokens;

  if (tokens[0].path === "/") {
    if (!tokens[1].path.endsWith("\\")) {
      tokens = [tokens[0], ...parseSlash(tokens.slice(1))];
      if (!tokens[1].path.endsWith("\\")) throw new Error("parse error");
    }
    return parseSlash([{
      path: tokens[1].path.substring(0, tokens[1].path.length - 1),
      value: {
        treeType: "node",
        left:tokens[0].value,
        right:tokens[1].value,
        head: "right"
      }
    }, ...tokens.slice(2)]);
  }
  if (tokens[0].path.endsWith("/")) {
      if (tokens[1].path !== "\\") {
        tokens = [tokens[0], ...parseSlash(tokens.slice(1))];
        if (tokens[1].path !== "\\") throw new Error("parse error");
      }
      return parseSlash([{
        path: tokens[0].path.substring(0, tokens[0].path.length - 1),
        value: {
          treeType: "node",
          left:tokens[0].value,
          right:tokens[1].value,
          head: "left"
        }
      }, ...tokens.slice(2)]);
  }
  return [tokens[0], ...parseSlash(tokens.slice(1))];
}

function randomTree(p: number): Tree {
  if(Math.random() < p)
   return {
     treeType:"word",
     literal:Math.random().toString(32).substring(2)
    };
  return {
    treeType: "node",
    left: randomTree(p + 0.1),
    right: randomTree(p + 0.1),
    head: Math.random() < 0.5 ? "left" : "right"
  };
}

function test() {
  for(var i = 0; i < 10; i++) {
    let tree = randomTree(0.1);
    delete tree.head;
    let tree2 = parseSlash(tokenizeSlash(stringifyIntoSlash([tree])))[0].value;
    let tree3 = parseBracket(tokenizeBracket(stringifyIntoBracket([tree])))[0];

    delete tree2.head;
    delete tree3.head;

    console.log(JSON.stringify(tree));
    console.log(JSON.stringify(tree2));
    console.log(JSON.stringify(tree3));
    if(JSON.stringify(tree) !== JSON.stringify(tree2) || JSON.stringify(tree) !== JSON.stringify(tree3)) console.log("boom");
    console.log("=====")
  }
}

function $(id: string){ return document.getElementById(id) };

window.onload = () => {
  $("bracket").oninput = () => { 
    $("bracket_error").innerText = "";
    $("slash_error").innerText = "";
    try {
      let trees: Tree[] = parseBracket(tokenizeBracket($("bracket").value)).map(x=>{
        if(x === "!")
          throw new Error("unexpected !");
        else return x;
      })
      $("slash").value = stringifyIntoSlash(trees);
    }
    catch (e) {
      $("bracket_error").innerText = "Error: " + e.message;
      $("slash").value = "";
    }
  };
  $("slash").oninput = () => { 
    $("bracket_error").innerText = "";
    $("slash_error").innerText = "";
    try {
      let trees: Tree[] = parseSlash(tokenizeSlash($("slash").value)).map(x=>{
        if(x.path !== "")
          throw new Error("parse error");  
        delete x.value.head;
        return x.value;
      })
      $("bracket").value = stringifyIntoBracket(trees);
    }
    catch (e) {
      $("slash_error").innerText = "Error: " + e.message;
      $("bracket").value = "";
    }
  };
}
