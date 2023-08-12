with (import <nixpkgs> { });
mkShell {
  buildInputs = [
    nodejs-18_x
    nodePackages.typescript
    nodePackages.prettier
    nodePackages.eslint
  ];
}
