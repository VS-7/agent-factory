{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh\"",
            "timeout": 15,
            "statusMessage": "Carregando __ORCH_NAME__ + memórias do projeto…"
          }
        ]
      }
    ]
  }
}
