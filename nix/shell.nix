{
  pkgs,
  inputs,
}: let
  prisma =
    (inputs.nix-prisma-utils.lib.prisma-factory {
      inherit pkgs;
      prisma-fmt-hash = "sha256-DN9OkY7nHPvlQfp5QmUzc/Ojze0FWVkGbEKWDZOdbpE=";
      query-engine-hash = "sha256-2K3+O+8kCthlsHQDnProPggIk0bFtYQ3B+nIRcU2Tqw=";
      libquery-engine-hash = "sha256-68ElsODAUuDN7dVBqwaAl9APnRT1ue2nk9On/I2GXbI=";
      schema-engine-hash = "sha256-7ji0Maxygeh8+/O5QM30DXbG8PmwbaqZSLuVDeRyy1Y=";
    }).fromBunLock
    ../bun.lock;
in
  pkgs.mkShell {
    inherit (prisma) env;
    packages = with pkgs; [
      bun
      nodejs
    ];
  }
