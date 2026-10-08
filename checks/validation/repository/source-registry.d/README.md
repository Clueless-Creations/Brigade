# Source registry fragments

Put lane-specific external URLs here instead of appending to `source-registry.yaml`.

Each `*.yaml` file uses the same schema as the main registry: a `sources:` list. Readers load the main file, then these files in filename order. A duplicate `id` or `url` across files is an error. `--write-discovered` still writes new rows to `source-registry.yaml`.
