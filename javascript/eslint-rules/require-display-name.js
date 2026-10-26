const WRAPPERS = new Set(["memo", "forwardRef"]);

const isComponentName = (name) => /^[A-Z]/.test(name);

const isFunction = (node) =>
  node?.type === "ArrowFunctionExpression" ||
  node?.type === "FunctionExpression" ||
  node?.type === "FunctionDeclaration";

const isWrapperCall = (node) => {
  if (node?.type !== "CallExpression") {
    return false;
  }
  const { callee } = node;
  if (callee.type === "Identifier") {
    return WRAPPERS.has(callee.name);
  }
  return (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier" &&
    WRAPPERS.has(callee.property.name)
  );
};

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Require an explicit displayName on every top-level React component",
    },
    messages: {
      missing: 'Component "{{name}}" is missing displayName.',
    },
    schema: [],
  },

  create(context) {
    const { sourceCode } = context;
    const functionsWithJsx = new Set();
    const candidates = [];
    const named = new Set();

    const markJsx = (node) => {
      const fn = sourceCode.getAncestors(node).findLast(isFunction);
      if (fn) {
        functionsWithJsx.add(fn);
      }
    };

    const topLevelStatement = (node) =>
      sourceCode.getAncestors(node).find((a) => a.parent?.type === "Program") ??
      (node.parent?.type === "Program" ? node : null);

    const addCandidate = (name, node, value) => {
      const statement = topLevelStatement(node);
      if (statement && isComponentName(name)) {
        candidates.push({ name, node, value, statement });
      }
    };

    return {
      JSXElement: markJsx,
      JSXFragment: markJsx,

      VariableDeclarator(node) {
        if (node.id.type === "Identifier") {
          addCandidate(node.id.name, node, node.init);
        }
      },

      FunctionDeclaration(node) {
        if (node.id) {
          addCandidate(node.id.name, node, node);
        }
      },

      "AssignmentExpression > MemberExpression.left"(node) {
        if (
          node.object.type === "Identifier" &&
          node.property.type === "Identifier" &&
          node.property.name === "displayName"
        ) {
          named.add(node.object.name);
        }
      },

      "Program:exit"() {
        for (const { name, node, value, statement } of candidates) {
          const isComponent =
            isWrapperCall(value) || (isFunction(value) && functionsWithJsx.has(value));
          if (!isComponent || named.has(name)) {
            continue;
          }
          context.report({
            node: node.id ?? node,
            messageId: "missing",
            data: { name },
            fix: (fixer) =>
              fixer.insertTextAfter(statement, `\n${name}.displayName = "${name}";`),
          });
        }
      },
    };
  },
};
