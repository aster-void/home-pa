{ pkgs, inputs, ... }:

let
  prisma = inputs.nix-prisma-utils.lib.prisma-factory {
    inherit pkgs;
    hash = "sha256-6JzcEN8jvnBhmIMbl3jzjQiU2BEjviZAg+5NChcXIIo=";
    bunLock = ./bun.lock;
  };
in
{
  packages = with pkgs; [
    bun
    mongodb
  ];

  languages.javascript = {
    enable = true;
    bun.enable = true;
  };

  env = prisma.env;

  enterShell = ''
    echo "home-pa dev environment"
  '';

  scripts = {
    dev.exec = "bun run dev";
    build.exec = "bun run build";
    test.exec = "bun run test";
  };
}
