import { Enum, constructors } from "./utils/adt";

export type Expr = Enum<{
  Call: { name: string, args: Expr[] }
  Var: { name: string, defaultValue: Expr }
  Identifier: string
  LiteralString: string
}>;

export const Expr = constructors<Expr>();

