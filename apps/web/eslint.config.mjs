import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const rawSqlMessage =
  "Use Prisma query builder, or tagged-template $queryRaw/$executeRaw. Never use unsafe raw queries or concatenated SQL.";

export default [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          property: "$queryRawUnsafe",
          message: rawSqlMessage
        },
        {
          property: "$executeRawUnsafe",
          message: rawSqlMessage
        }
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.object.name='Prisma'][callee.property.name='raw']",
          message: rawSqlMessage
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.object.name='Prisma'][callee.property.name='sql']",
          message: rawSqlMessage
        },
        {
          selector:
            "TaggedTemplateExpression[tag.type='MemberExpression'][tag.object.name='Prisma'][tag.property.name='sql']",
          message: rawSqlMessage
        }
      ]
    }
  }
];
