# Execution State and Trace

Use `b2c business-status` and `b2c business-plan` with the registered workspace ID for planning and runtime reads. Author product meaning in
root `product.yaml` and render `PRODUCT.md`. Root `DESIGN.md` owns design meaning.

Bootstrap initializes reducer-owned `business-state.json` from the accepted
product. The reducer also owns `current-truth.json`. Change runtime state only
through authorized reducer transitions. These files are not product
documentation. `LAUNCH_TRACE.md` links accepted decisions to downstream proof.
