# Known Limitations

- The app does not bundle Command Code.
- The app does not know Command Code internal state beyond terminal output and documented CLI outputs.
- `node-pty` may need native rebuilds for Electron.
- Windows may resolve `cmd` to the Windows shell instead of Command Code.
- Exit behavior depends on upstream CLI behavior and PTY signal handling.
- Headless runs are standalone sessions, not continuations of the visible terminal session.
- The style is an approximation based on public visuals and user-supplied references, not official brand assets.
