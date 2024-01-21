with (import <nixpkgs> { });
mkShell {
  buildInputs = [
    nodejs_21
    nodePackages.typescript
    nodePackages.prettier
    nodePackages.eslint
  ];
}
