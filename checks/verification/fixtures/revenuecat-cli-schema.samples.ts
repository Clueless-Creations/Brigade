/**
 * Trimmed from real `rc commands --schemas --json`, RevenueCat CLI 0.1.7, captured 2026-11-04.
 * Keeps the real shape: nested commands, and flag objects that include inherited flags.
 */
export const REVENUECAT_CLI_COMMAND_TREE = {
  "name": "rc",
  "commands": [
    {
      "name": "offerings",
      "commands": [
        {
          "name": "create",
          "flags": [
            {
              "name": "all"
            },
            {
              "name": "api-key"
            },
            {
              "name": "display-name"
            },
            {
              "name": "format"
            },
            {
              "name": "json"
            },
            {
              "name": "lookup-key"
            },
            {
              "name": "no-color"
            },
            {
              "name": "no-input"
            },
            {
              "name": "profile"
            },
            {
              "name": "project-id"
            },
            {
              "name": "quiet"
            },
            {
              "name": "yes"
            }
          ]
        }
      ]
    },
    {
      "name": "customers",
      "commands": [
        {
          "name": "simulate-purchase",
          "flags": [
            {
              "name": "all"
            },
            {
              "name": "api-key"
            },
            {
              "name": "app-id"
            },
            {
              "name": "app-user-id"
            },
            {
              "name": "format"
            },
            {
              "name": "json"
            },
            {
              "name": "no-color"
            },
            {
              "name": "no-input"
            },
            {
              "name": "product"
            },
            {
              "name": "profile"
            },
            {
              "name": "project-id"
            },
            {
              "name": "public-api-key"
            },
            {
              "name": "quiet"
            },
            {
              "name": "yes"
            }
          ]
        }
      ]
    },
    {
      "name": "apps",
      "commands": []
    },
    {
      "name": "projects",
      "commands": []
    },
    {
      "name": "entitlements",
      "commands": [
        {
          "name": "create",
          "flags": [
            {
              "name": "all"
            },
            {
              "name": "api-key"
            },
            {
              "name": "display-name"
            },
            {
              "name": "format"
            },
            {
              "name": "json"
            },
            {
              "name": "lookup-key"
            },
            {
              "name": "no-color"
            },
            {
              "name": "no-input"
            },
            {
              "name": "profile"
            },
            {
              "name": "project-id"
            },
            {
              "name": "quiet"
            },
            {
              "name": "yes"
            }
          ]
        },
        {
          "name": "attach",
          "flags": [
            {
              "name": "all"
            },
            {
              "name": "api-key"
            },
            {
              "name": "format"
            },
            {
              "name": "json"
            },
            {
              "name": "no-color"
            },
            {
              "name": "no-input"
            },
            {
              "name": "profile"
            },
            {
              "name": "project-id"
            },
            {
              "name": "quiet"
            },
            {
              "name": "yes"
            }
          ]
        }
      ]
    },
    {
      "name": "products",
      "commands": [
        {
          "name": "create",
          "flags": [
            {
              "name": "all"
            },
            {
              "name": "api-key"
            },
            {
              "name": "app-id"
            },
            {
              "name": "display-name"
            },
            {
              "name": "duration"
            },
            {
              "name": "format"
            },
            {
              "name": "json"
            },
            {
              "name": "no-color"
            },
            {
              "name": "no-input"
            },
            {
              "name": "profile"
            },
            {
              "name": "project-id"
            },
            {
              "name": "quiet"
            },
            {
              "name": "store-id"
            },
            {
              "name": "title"
            },
            {
              "name": "type"
            },
            {
              "name": "yes"
            }
          ]
        }
      ]
    },
    {
      "name": "packages",
      "commands": [
        {
          "name": "create",
          "flags": [
            {
              "name": "all"
            },
            {
              "name": "api-key"
            },
            {
              "name": "display-name"
            },
            {
              "name": "format"
            },
            {
              "name": "json"
            },
            {
              "name": "lookup-key"
            },
            {
              "name": "no-color"
            },
            {
              "name": "no-input"
            },
            {
              "name": "profile"
            },
            {
              "name": "project-id"
            },
            {
              "name": "quiet"
            },
            {
              "name": "yes"
            }
          ]
        },
        {
          "name": "attach",
          "flags": [
            {
              "name": "all"
            },
            {
              "name": "api-key"
            },
            {
              "name": "format"
            },
            {
              "name": "json"
            },
            {
              "name": "no-color"
            },
            {
              "name": "no-input"
            },
            {
              "name": "profile"
            },
            {
              "name": "project-id"
            },
            {
              "name": "quiet"
            },
            {
              "name": "yes"
            }
          ]
        }
      ]
    },
    {
      "name": "paywalls",
      "commands": [
        {
          "name": "attach",
          "flags": [
            {
              "name": "all"
            },
            {
              "name": "api-key"
            },
            {
              "name": "format"
            },
            {
              "name": "json"
            },
            {
              "name": "no-color"
            },
            {
              "name": "no-input"
            },
            {
              "name": "profile"
            },
            {
              "name": "project-id"
            },
            {
              "name": "quiet"
            },
            {
              "name": "yes"
            }
          ]
        }
      ]
    },
    {
      "name": "subscriptions",
      "commands": []
    },
    {
      "name": "metrics",
      "commands": []
    },
    {
      "name": "charts",
      "commands": []
    },
    {
      "name": "audit",
      "commands": []
    }
  ]
} as const;

export const REVENUECAT_CLI_COMMANDS_JSON = JSON.stringify({ schema_version: 1, data: REVENUECAT_CLI_COMMAND_TREE });

/** The same document with one flag removed, as a renamed flag would look. */
export function commandsJsonWithoutFlag(family: string, child: string, flag: string): string {
  const commands = REVENUECAT_CLI_COMMAND_TREE.commands.map((entry) =>
    entry.name !== family
      ? entry
      : {
          ...entry,
          commands: entry.commands.map((node) =>
            node.name !== child ? node : { ...node, flags: node.flags.filter((entry: { name: string }) => entry.name !== flag) },
          ),
        },
  );
  return JSON.stringify({ schema_version: 1, data: { name: "rc", commands } });
}
