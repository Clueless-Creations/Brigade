# Source registry fragments

Put lane-specific external URLs here instead of appending to `source-registry.yaml`.

Each `*.yaml` file uses the same schema as the main registry: a `sources:` list. Readers load the main file, then these files in filename order. A duplicate `id` or `url` across files is an error. `--write-discovered` still writes new rows to `source-registry.yaml`.

| Load when                                    | File                                                           |
| -------------------------------------------- | -------------------------------------------------------------- |
| Account deletion, privacy, and legal sources | [accounts-privacy-legal.yaml](accounts-privacy-legal.yaml)     |
| Onboarding and source intake                 | [source-intake-onboarding.yaml](source-intake-onboarding.yaml) |
| Store creative assets                        | [store-creative-assets.yaml](store-creative-assets.yaml)       |
| Web surface and discovery                    | [web-surface.yaml](web-surface.yaml)                           |
